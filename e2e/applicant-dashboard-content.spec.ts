import { test, expect } from '@playwright/test';
import { getCredentials, loginAsMember, gotoApp } from './lib/auth';

/**
 * Verifies that the applicant dashboard renders correctly.
 * The member test user must exist in test_assets/test_users.json (role: "member").
 */
test.describe('Applicant dashboard content', () => {
  test.setTimeout(300_000);

  test.beforeAll(() => {
    const { email } = getCredentials('member');
    if (!email) {
      // Skip all tests in this describe block when member credentials are absent
      // (test.skip() inside beforeAll skips the entire suite)
      test.skip(true, 'No member user found in test_assets/test_users.json (role: "member")');
    }
  });

  test('/me/application renders without error', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsMember(page);
    await gotoApp(page, '/me/application');
    await page.waitForTimeout(1_500);

    // Must NOT show a server error or React error boundary
    await expect(
      page.getByText(/Something went wrong/i),
    ).not.toBeVisible();

    await expect(
      page.getByText(/500/),
    ).not.toBeVisible();

    // Page must show one of the three expected applicant states
    const hasStageContent = await page.getByText('Stage content').isVisible().catch(() => false);
    const hasNoMaterials = await page
      .getByText(/No materials have been assigned/i)
      .isVisible()
      .catch(() => false);
    const hasOnReview = await page
      .getByText(/previous submission is with our team/i)
      .isVisible()
      .catch(() => false);

    expect(
      hasStageContent || hasNoMaterials || hasOnReview,
      'Applicant dashboard shows neither stage content, "No materials", nor "on review" message',
    ).toBe(true);

    // No uncaught JS exceptions
    expect(
      pageErrors,
      `/me/application threw page errors: ${pageErrors.join('; ')}`,
    ).toHaveLength(0);

    await page.screenshot({ path: 'test-results/applicant-content-01-dashboard.png', fullPage: true });
  });

  test('applicant cannot reach the HR dashboard', async ({ page }) => {
    await loginAsMember(page);
    await gotoApp(page, '/me/hr');

    // Must redirect away from /me/hr — role guard should kick in
    await page.waitForURL((url) => !url.pathname.startsWith('/me/hr'), { timeout: 30_000 });
    expect(page.url()).not.toMatch(/\/me\/hr/);
    await page.screenshot({ path: 'test-results/applicant-content-02-no-hr-access.png' });
  });

  test('applicant page has at least one meaningful heading', async ({ page }) => {
    await loginAsMember(page);
    await gotoApp(page, '/me/application');
    await page.waitForTimeout(1_500);

    const headingCount = await page.locator('h1, h2, h3').count();
    expect(headingCount, '/me/application has no headings — likely blank page').toBeGreaterThan(0);
  });
});
