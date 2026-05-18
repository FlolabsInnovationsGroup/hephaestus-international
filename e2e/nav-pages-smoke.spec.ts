import { test, expect } from '@playwright/test';
import { gotoApp, loginAsHr, loginAsMember } from './lib/auth';

/**
 * Smoke test: every main page loads without crashing.
 * Catches silent regressions where a page white-screens or throws a runtime error.
 */
test.describe('Nav pages smoke — HR', () => {
  test.setTimeout(300_000);

  const HR_ROUTES: Array<{ path: string; label: string }> = [
    { path: '/me/hr', label: 'HR dashboard' },
    { path: '/me/hr/stages', label: 'Stages page' },
    { path: '/me/hr/settings', label: 'Settings page' },
  ];

  for (const route of HR_ROUTES) {
    test(`${route.label} loads without error (${route.path})`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      await loginAsHr(page);
      await gotoApp(page, route.path);

      // Give the page time to settle and surface any runtime error boundaries
      await page.waitForTimeout(2_000);

      // No React/Next error boundaries should be visible
      await expect(
        page.getByText(/Something went wrong/i),
        `${route.path} shows "Something went wrong"`,
      ).not.toBeVisible();

      await expect(
        page.getByText(/Application error/i),
        `${route.path} shows "Application error"`,
      ).not.toBeVisible();

      // Page must contain at least one heading-level element
      const headingCount = await page.locator('h1, h2, h3').count();
      expect(headingCount, `${route.path} has no headings — likely blank page`).toBeGreaterThan(0);

      // No uncaught JS exceptions
      expect(pageErrors, `${route.path} threw page errors: ${pageErrors.join('; ')}`).toHaveLength(0);

      await page.screenshot({ path: `test-results/smoke-hr-${route.path.replace(/\//g, '-')}.png` });
    });
  }
});

test.describe('Nav pages smoke — applicant', () => {
  test.setTimeout(300_000);

  test('/me/application loads without error', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsMember(page);
    await gotoApp(page, '/me/application');

    await page.waitForTimeout(2_000);

    // No crash states
    await expect(
      page.getByText(/Something went wrong/i),
    ).not.toBeVisible();

    await expect(
      page.getByText(/Application error/i),
    ).not.toBeVisible();

    // Page must show some content (stage cards, no-materials, or on-review message)
    const hasStageContent = await page.getByText('Stage content').isVisible().catch(() => false);
    const hasNoMaterials = await page.getByText('No materials').isVisible().catch(() => false);
    const hasOnReview = await page.getByText(/previous submission is with our team/i).isVisible().catch(() => false);
    const hasAnyHeading = (await page.locator('h1, h2, h3').count()) > 0;

    expect(
      hasStageContent || hasNoMaterials || hasOnReview || hasAnyHeading,
      '/me/application is blank — no recognisable content found',
    ).toBe(true);

    // No uncaught JS exceptions
    expect(pageErrors, `/me/application threw page errors: ${pageErrors.join('; ')}`).toHaveLength(0);

    await page.screenshot({ path: 'test-results/smoke-applicant-application.png', fullPage: true });
  });
});
