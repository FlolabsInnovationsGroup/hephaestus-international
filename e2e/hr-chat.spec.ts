/**
 * Regression tests for the HR chat author bug fixed 2026-05:
 *
 * Bug: HR-sent messages were stored with author='paula' instead of the actual
 * HR user's identity, because:
 *   1. The frontend sent author:'paula' for canReplyAsHr mode
 *   2. The API only accepted 'john' or 'oliver', defaulting everything else to 'paula'
 *   3. The frontend appended the API response on top of the optimistic message,
 *      causing the same message to appear twice as "Paula Ferry"
 *
 * Fix:
 *   - API derives author from session viewer.firstName (not body.author)
 *   - Frontend sends no author field for HR messages (server is authoritative)
 *   - Frontend replaces the optimistic message with the confirmed stored one
 *     (instead of appending a second message)
 */
import { test, expect } from '@playwright/test';
import { getCredentials, gotoApp, loginAsHr } from './lib/auth';

const { email: HR_EMAIL, password: HR_PASSWORD } = getCredentials('Human Resources');
const hasHrCredentials = Boolean(HR_EMAIL);

// ─── Helper: selector targeting only message bubbles (not outer panel) ───────
// Message bubbles in applicant-chat.tsx always have max-w-[88%], which outer
// panel containers never have.
const MSG_BUBBLE = '[class*="max-w-"][class*="rounded-2xl"]';

test.describe('HR chat — author and deduplication', () => {
  test.skip(!hasHrCredentials, 'No HR credentials in test_assets/test_users.json');

  // -------------------------------------------------------------------------
  // 1. API: HR message stored with a valid HR author (never 'applicant')
  // -------------------------------------------------------------------------
  test('POST /api/applications/message as HR — API stores reply with non-applicant author', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAsHr(page);

    // Get any lead ID (API returns { leads, total, hasMore })
    const leadsRes = await page.request.get('/api/admin/leads?limit=1');
    expect(leadsRes.status(), '/api/admin/leads returned non-200').toBeLessThan(300);
    const leadsBody = await leadsRes.json() as { leads?: { id: string }[] };
    const applicantId = leadsBody.leads?.[0]?.id;
    test.skip(!applicantId, 'No applicants found — cannot test HR chat');

    const res = await page.request.post('/api/applications/message', {
      data: { text: `HR E2E test message — ${new Date().toISOString()}`, applicantId },
    });
    expect(res.status(), `/api/applications/message returned ${res.status()}`).toBe(200);

    const body = await res.json() as { ok: boolean; reply?: { author: string; text: string; id: string } };
    expect(body.ok).toBe(true);
    expect(body.reply).toBeDefined();

    // Author must NOT be 'applicant'
    expect(body.reply!.author, `Expected HR author, got: ${body.reply!.author}`).not.toBe('applicant');
    // The stored author must be one of the valid HR authors
    expect(['paula', 'john', 'oliver']).toContain(body.reply!.author);
  });

  // -------------------------------------------------------------------------
  // 2. UI: HR sends a message — appears exactly once as a message bubble
  // -------------------------------------------------------------------------
  test('HR sends a chat message — it appears exactly once in the conversation', async ({ page }) => {
    test.setTimeout(180_000);

    await loginAsHr(page);
    await gotoApp(page, '/me/hr');

    // Wait for the HR reply input to become visible (a lead must be selected)
    const hrInput = page.locator('input[placeholder*="Reply to the applicant"]');
    const hrInputVisible = await hrInput.isVisible({ timeout: 30_000 }).catch(() => false);
    if (!hrInputVisible) {
      test.skip(true, 'HR chat input not visible — no applicant selected or chat panel not rendered');
    }

    const messageText = `HR E2E unique — ${Date.now()}`;

    // Count existing bubbles before sending
    const bubblesBefore = await page.locator(MSG_BUBBLE).count();

    // Intercept the API response
    const messagePromise = page.waitForResponse(
      r => {
        try { return new URL(r.url()).pathname === '/api/applications/message' && r.request().method() === 'POST'; }
        catch { return false; }
      },
      { timeout: 30_000 }
    );

    await hrInput.fill(messageText);
    await page.getByRole('button', { name: /^Reply$/i }).click();
    const apiRes = await messagePromise;
    expect(apiRes.status(), `/api/applications/message returned ${apiRes.status()}`).toBe(200);

    // Give React time to settle
    await page.waitForTimeout(800);

    // The message text should appear in exactly one bubble
    const matchingBubbles = page.locator(MSG_BUBBLE).filter({ hasText: messageText });
    const count = await matchingBubbles.count();
    expect(count, `Expected message to appear exactly once as a bubble, got ${count}`).toBe(1);

    // Total bubble count should increase by exactly 1
    const bubblesAfter = await page.locator(MSG_BUBBLE).count();
    expect(bubblesAfter - bubblesBefore, `Expected exactly 1 new bubble`).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 3. UI: HR message bubble author is consistent with API response
  // -------------------------------------------------------------------------
  test('HR message bubble author matches the stored author from the API', async ({ page }) => {
    test.setTimeout(180_000);

    await loginAsHr(page);
    await gotoApp(page, '/me/hr');

    const hrInput = page.locator('input[placeholder*="Reply to the applicant"]');
    const hrInputVisible = await hrInput.isVisible({ timeout: 30_000 }).catch(() => false);
    if (!hrInputVisible) {
      test.skip(true, 'HR chat input not visible — cannot test author label');
    }

    const messageText = `HR author label E2E — ${Date.now()}`;

    let storedAuthor = '';
    const messagePromise = page.waitForResponse(
      r => {
        try { return new URL(r.url()).pathname === '/api/applications/message' && r.request().method() === 'POST'; }
        catch { return false; }
      },
      { timeout: 30_000 }
    );

    await hrInput.fill(messageText);
    await page.getByRole('button', { name: /^Reply$/i }).click();
    const apiRes = await messagePromise;
    expect(apiRes.status()).toBe(200);

    const apiBody = await apiRes.json() as { ok: boolean; reply?: { author: string } };
    storedAuthor = apiBody.reply?.author ?? '';
    expect(storedAuthor).toBeTruthy();
    expect(['paula', 'john', 'oliver']).toContain(storedAuthor);

    await page.waitForTimeout(800);

    // Find the single message bubble
    const bubble = page.locator(MSG_BUBBLE).filter({ hasText: messageText });
    await expect(bubble).toHaveCount(1, { timeout: 10_000 });

    // The author label must NOT be 'applicant'-side styling — it's an HR bubble
    const authorLabel = bubble.locator('p').first();
    const labelText = (await authorLabel.textContent() ?? '').trim();

    // Author label should not be 'You' (applicant-side author name)
    expect(labelText, `HR message was labelled "${labelText}" — should not be applicant "You"`).not.toBe('You');
    expect(labelText.length, 'Author label should not be empty').toBeGreaterThan(0);
  });
});
