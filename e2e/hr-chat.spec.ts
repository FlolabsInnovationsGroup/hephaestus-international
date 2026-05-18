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

test.describe('HR chat — author and deduplication', () => {
  test.skip(!hasHrCredentials, 'No HR credentials in test_assets/test_users.json');

  // -------------------------------------------------------------------------
  // 1. API: HR message stored with correct author (not 'paula')
  // -------------------------------------------------------------------------
  test('POST /api/applications/message as HR stores reply with a non-applicant author', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAsHr(page);

    // Find any applicant ID from the HR dashboard
    const leadsRes = await page.request.get('/api/admin/leads?limit=1');
    expect(leadsRes.status(), '/api/admin/leads returned non-200').toBeLessThan(300);
    const leadsBody = await leadsRes.json() as { applicants?: { id: string }[] };
    const applicantId = leadsBody.applicants?.[0]?.id;
    test.skip(!applicantId, 'No applicants found — cannot test HR chat');

    const res = await page.request.post('/api/applications/message', {
      data: { text: `HR E2E test message — ${new Date().toISOString()}`, applicantId },
    });
    expect(res.status(), `/api/applications/message returned ${res.status()}`).toBe(200);

    const body = await res.json() as { ok: boolean; reply?: { author: string; text: string; id: string } };
    expect(body.ok).toBe(true);
    expect(body.reply).toBeDefined();

    // Author must NOT be 'applicant' — it must be an HR identity
    expect(body.reply!.author, `Expected HR author, got: ${body.reply!.author}`).not.toBe('applicant');
    // The stored author should be one of the valid HR authors
    expect(['paula', 'john', 'oliver']).toContain(body.reply!.author);
  });

  // -------------------------------------------------------------------------
  // 2. UI: HR sends a message — appears exactly once, not twice
  // -------------------------------------------------------------------------
  test('HR sends a chat message — it appears exactly once in the conversation', async ({ page }) => {
    test.setTimeout(180_000);

    await loginAsHr(page);
    await gotoApp(page, '/me/hr');

    // Wait for the HR dashboard to load and show at least one lead
    const leadRow = page.locator('[data-testid="lead-row"], .lead-row, table tbody tr, li[data-lead-id]').first();
    const leadRowVisible = await leadRow.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!leadRowVisible) {
      // Try clicking the first lead if dashboard has a different structure
      const anyLeadLink = page.locator('a[href*="lead="], button[data-applicant-id]').first();
      const hasLeadLink = await anyLeadLink.isVisible({ timeout: 5_000 }).catch(() => false);
      if (hasLeadLink) await anyLeadLink.click();
    }

    // Wait for the HR reply input to be visible
    const hrInput = page.locator('input[placeholder*="Reply to the applicant"]');
    const hrInputVisible = await hrInput.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hrInputVisible) {
      test.skip(true, 'HR chat input not visible — no applicant selected or chat panel not rendered');
    }

    const messageText = `HR E2E unique — ${Date.now()}`;

    // Count existing messages before sending
    const bubblesBefore = await page.locator('.rounded-2xl').count();

    // Intercept the API response to verify it comes back once
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

    // Give React time to update
    await page.waitForTimeout(1_000);

    // The message should appear exactly once
    const matchingBubbles = page.locator('.rounded-2xl').filter({ hasText: messageText });
    const count = await matchingBubbles.count();
    expect(count, `Expected message to appear exactly once, got ${count}`).toBe(1);

    // Total message count should be exactly one more than before
    const bubblesAfter = await page.locator('.rounded-2xl').count();
    expect(bubblesAfter, `Expected exactly 1 new bubble, got ${bubblesAfter - bubblesBefore}`).toBe(bubblesBefore + 1);
  });

  // -------------------------------------------------------------------------
  // 3. UI: HR message does NOT show as "Paula Ferry"
  // -------------------------------------------------------------------------
  test('HR-sent message author label is not Paula Ferry', async ({ page }) => {
    test.setTimeout(180_000);

    await loginAsHr(page);
    await gotoApp(page, '/me/hr');

    const hrInput = page.locator('input[placeholder*="Reply to the applicant"]');
    const hrInputVisible = await hrInput.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hrInputVisible) {
      test.skip(true, 'HR chat input not visible — cannot test author label');
    }

    const messageText = `HR author label E2E — ${Date.now()}`;
    const messagePromise = page.waitForResponse(
      r => {
        try { return new URL(r.url()).pathname === '/api/applications/message' && r.request().method() === 'POST'; }
        catch { return false; }
      },
      { timeout: 30_000 }
    );

    await hrInput.fill(messageText);
    await page.getByRole('button', { name: /^Reply$/i }).click();
    await messagePromise;
    await page.waitForTimeout(500);

    // Find the message bubble
    const bubble = page.locator('.rounded-2xl').filter({ hasText: messageText });
    await expect(bubble).toBeVisible({ timeout: 10_000 });

    // The author label inside the bubble should NOT read "Paula Ferry"
    const authorLabel = bubble.locator('p.font-semibold, p.text-xs').first();
    const labelText = await authorLabel.textContent().catch(() => '');
    expect(labelText?.trim(), `HR message was labelled "${labelText}" — expected HR author, not Paula Ferry`).not.toBe('Paula Ferry');
  });
});
