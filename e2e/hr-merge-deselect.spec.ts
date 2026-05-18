import { expect, test } from '@playwright/test';
import { getCredentials, loginAsHr } from './lib/auth';

test.describe('HR merge modal — deselect alias option', () => {
  test('unchecking one email keeps the Emails section visible with both options', async ({ page }) => {
    const hr = getCredentials('Human Resources');
    test.skip(!hr.email || !hr.password, 'HR credentials missing in test_assets/test_users.json');

    await loginAsHr(page);
    await page.goto('/me/hr?duplicateReview=confirmed_duplicate', { waitUntil: 'domcontentloaded' });

    const selectProfile = page.getByRole('checkbox', { name: 'Select profile' });
    const count = await selectProfile.count();
    test.skip(count < 2, 'Need at least two leads in HR list to test merge');

    await selectProfile.nth(0).check();
    await selectProfile.nth(1).check();
    await page.getByRole('button', { name: 'Merge selected' }).click();

    await expect(page.getByRole('heading', { name: 'Merge profiles' })).toBeVisible({ timeout: 15_000 });

    const emailsHeading = page.getByText('Emails (final profile can log in with any kept email)');
    const emailCheckboxes = emailsHeading.locator('xpath=ancestor::motion.div[1]').locator('input[type="checkbox"]');
    const emailCount = await emailCheckboxes.count();
    test.skip(emailCount < 2, 'Need two email options to test deselect');

    await expect(emailsHeading).toBeVisible();
    await emailCheckboxes.nth(0).click();
    await expect(emailsHeading).toBeVisible();
    await expect(emailCheckboxes).toHaveCount(emailCount);
    await expect(emailCheckboxes.nth(0)).not.toBeChecked();
    await expect(emailCheckboxes.nth(1)).toBeChecked();
  });
});
