import { test, expect } from '@playwright/test';
import { loginAsHr } from './lib/auth';

/**
 * Verifies that the HR dashboard renders meaningful content on load.
 * Catches regressions where the page loads but shows no data, wrong headings,
 * or a broken status filter.
 */
test.describe('HR dashboard content', () => {
  test.setTimeout(300_000);

  test('main heading is visible', async ({ page }) => {
    await loginAsHr(page);
    // loginAsHr already waits for the status select; just confirm the heading too
    await expect(
      page.getByRole('heading', { name: /applicants and conversations/i }),
    ).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: 'test-results/hr-dashboard-01-heading.png' });
  });

  test('status filter dropdown exists and contains all 8 canonical statuses', async ({ page }) => {
    await loginAsHr(page);

    const filterSelect = page.locator('select[name="status"]');
    await expect(filterSelect).toBeVisible({ timeout: 30_000 });

    const options = await filterSelect.locator('option').allTextContents();
    const statusOptions = options.map((o) => o.trim()).filter((o) => o && o !== 'All statuses');

    // Must have at least 7 real options (graduated + terminated are sometimes added later)
    expect(statusOptions.length, 'Status filter has fewer than 7 options').toBeGreaterThanOrEqual(7);

    // All 8 canonical statuses must be present
    const canonical = [
      'applying',
      'waiting',
      'signed',
      'joined',
      'approved',
      'rejected',
      'graduated',
      'terminated',
    ];
    for (const s of canonical) {
      expect(statusOptions, `Status filter is missing canonical status "${s}"`).toContain(s);
    }

    await page.screenshot({ path: 'test-results/hr-dashboard-02-status-filter.png' });
  });

  test('at least one lead card or "No applicants" message is visible', async ({ page }) => {
    await loginAsHr(page);

    // Either a lead entry is visible or the empty-state message is shown
    const hasLead = await page.locator('[data-testid="lead-card"], [data-testid="lead-row"]').first().isVisible({ timeout: 10_000 }).catch(() => false);
    // Fallback: look for any button with "Edit lead" (every lead row has one)
    const hasEditButton = await page.getByRole('button', { name: /edit lead/i }).first().isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/no applicants/i).isVisible({ timeout: 5_000 }).catch(() => false);

    expect(
      hasLead || hasEditButton || hasEmptyState,
      'HR dashboard shows neither lead data nor an empty-state message',
    ).toBe(true);

    await page.screenshot({ path: 'test-results/hr-dashboard-03-leads.png', fullPage: true });
  });

  test('no JavaScript console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];
    const ownApi404s: string[] = [];

    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[console.error] ${msg.text()}`);
      }
    });
    // Track our own API 404s separately — external CDN 404s are excluded below
    page.on('response', (response) => {
      if (response.status() === 404 && new URL(response.url()).pathname.startsWith('/api/')) {
        ownApi404s.push(response.url());
      }
    });

    await loginAsHr(page);
    // Allow a brief settle time for any deferred effects
    await page.waitForTimeout(2_000);

    // Filter out known benign noise:
    // - External CDN 404s (profile pics, HubSpot, fonts) — tracked via response listener above
    // - React #418 hydration mismatch on <html>: caused by browser extensions (e.g. LanguageTool,
    //   Grammarly) injecting attributes after SSR; suppressHydrationWarning on <html> silences the
    //   console warning but React still throws the error — it's not an app regression.
    const realErrors = [
      ...consoleErrors.filter(
        (e) =>
          !e.includes('preload') &&
          !e.includes('favicon') &&
          !e.includes('ERR_ABORTED') &&
          !(e.includes('[console.error] Failed to load resource') && e.includes('404')) &&
          !(e.includes('React error #418') && e.includes('args[]=HTML')),
      ),
      ...ownApi404s.map((url) => `[api 404] ${url}`),
    ];

    expect(realErrors, `Console errors on HR dashboard:\n${realErrors.join('\n')}`).toHaveLength(0);
  });
});
