/**
 * E2E tests for WhatsApp-style message timestamps in the applicant chat.
 *
 * Each bubble shows HH:MM at the bottom-right.
 * Between messages from different calendar days a centered chip is shown
 * ("Today", "Yesterday", weekday name, or "12 May" / "12 May 2025").
 */
import { test, expect } from '@playwright/test';
import { gotoApp, loginAsMember, loginWithCredentials } from './lib/auth';

const APPLICANT_EMAIL = 'tesororeptilipotermius@gmail.com';
const APPLICANT_PASSWORD = 'oliverbenjamin';

// Matches HH:MM — hours 00-23, minutes 00-59
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

test.describe('Chat timestamps', () => {
  test.setTimeout(180_000);

  // ─── Applicant view ────────────────────────────────────────────────────────

  test('existing messages show HH:MM timestamps in applicant view', async ({ page }) => {
    await loginWithCredentials(page, APPLICANT_EMAIL, APPLICANT_PASSWORD, /\/me/);
    await gotoApp(page, '/me/application');

    // Wait for at least one message bubble
    const firstBubble = page.locator('[class*="max-w-"][class*="rounded-2xl"]').first();
    await expect(firstBubble).toBeVisible({ timeout: 30_000 });

    // Every bubble with a time element should display a valid HH:MM string
    const timeParagraphs = page.locator('[class*="max-w-"][class*="rounded-2xl"] p:last-child');
    const count = await timeParagraphs.count();
    expect(count).toBeGreaterThan(0);

    // Check the first time paragraph matches HH:MM
    const firstTime = (await timeParagraphs.first().textContent() ?? '').trim();
    // It may be the message text (if no createdAt) or a time — only assert if it looks like a time
    const timeParagraphsWithTime = timeParagraphs.filter({ hasText: /^\d{2}:\d{2}$/ });
    const timeCount = await timeParagraphsWithTime.count();
    // At least one bubble should have a timestamp
    expect(timeCount, 'Expected at least one HH:MM timestamp in the chat').toBeGreaterThan(0);

    // Validate the format of each visible timestamp
    for (let i = 0; i < Math.min(timeCount, 5); i++) {
      const t = (await timeParagraphsWithTime.nth(i).textContent() ?? '').trim();
      expect(t, `Timestamp "${t}" is not HH:MM format`).toMatch(TIME_RE);
    }
  });

  test('date separator "Today" is visible for messages sent today', async ({ page }) => {
    await loginWithCredentials(page, APPLICANT_EMAIL, APPLICANT_PASSWORD, /\/me/);
    await gotoApp(page, '/me/application');

    // Send a message to ensure there is at least one "today" message
    const chatInput = page.locator('input[placeholder*="Ask Paula"]');
    await expect(chatInput).toBeVisible({ timeout: 30_000 });

    const replyPromise = page.waitForResponse(
      r => { try { return new URL(r.url()).pathname === '/api/applications/message'; } catch { return false; } },
      { timeout: 30_000 }
    );
    await chatInput.fill('E2E timestamp check');
    await page.getByRole('button', { name: /^Send$/i }).click();
    await replyPromise;
    await page.waitForTimeout(500);

    // "Today" separator must be present
    const todaySep = page.locator('span').filter({ hasText: /^Today$/ });
    await expect(todaySep).toBeVisible({ timeout: 10_000 });
  });

  test('new message sent via UI shows a timestamp immediately (optimistic)', async ({ page }) => {
    await loginWithCredentials(page, APPLICANT_EMAIL, APPLICANT_PASSWORD, /\/me/);
    await gotoApp(page, '/me/application');

    const chatInput = page.locator('input[placeholder*="Ask Paula"]');
    await expect(chatInput).toBeVisible({ timeout: 30_000 });

    const countBefore = await page.locator('[class*="max-w-"][class*="rounded-2xl"]').count();

    // Start the API intercept before clicking Send
    const replyPromise = page.waitForResponse(
      r => { try { return new URL(r.url()).pathname === '/api/applications/message'; } catch { return false; } },
      { timeout: 30_000 }
    );
    await chatInput.fill('Optimistic timestamp E2E');
    await page.getByRole('button', { name: /^Send$/i }).click();

    // The optimistic bubble should appear before the API resolves
    await page.waitForFunction(
      ({ sel, before }: { sel: string; before: number }) =>
        document.querySelectorAll(sel).length > before,
      { sel: '[class*="max-w-"][class*="rounded-2xl"]', before: countBefore },
      { timeout: 10_000 }
    );

    // The new bubble should already have a time shown
    const newBubble = page.locator('[class*="max-w-"][class*="rounded-2xl"]').last();
    const timeEl = newBubble.locator('p:last-child');
    const timeText = (await timeEl.textContent() ?? '').trim();
    expect(timeText, `Optimistic bubble time "${timeText}" is not HH:MM`).toMatch(TIME_RE);

    await replyPromise;
  });

  // ─── HR view ───────────────────────────────────────────────────────────────

  test('existing messages in HR conversation panel show HH:MM timestamps', async ({ page }) => {
    const { email, password } = { email: 'zoom@flomadlabs.com', password: 'gq2A1xZ^CdMM#uUpJnfc' };
    await loginWithCredentials(page, email, password, /\/me\/hr/);
    await page.locator('select[name="status"]').waitFor({ state: 'visible', timeout: 120_000 });

    // Wait for at least one message bubble to appear
    const bubbles = page.locator('[class*="max-w-"][class*="rounded-2xl"]');
    await expect(bubbles.first()).toBeVisible({ timeout: 30_000 });

    const timeParagraphs = bubbles.locator('p:last-child').filter({ hasText: /^\d{2}:\d{2}$/ });
    const count = await timeParagraphs.count();
    expect(count, 'Expected at least one HH:MM timestamp in the HR chat').toBeGreaterThan(0);

    const t = (await timeParagraphs.first().textContent() ?? '').trim();
    expect(t).toMatch(TIME_RE);
  });
});
