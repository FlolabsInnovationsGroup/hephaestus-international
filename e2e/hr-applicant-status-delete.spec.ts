import { expect, test } from '@playwright/test';
import { loginAsHr } from './lib/auth';

test.describe('HR dashboard — applicant status in edit modal and delete flow', () => {
  test('Edit modal exposes applicant status select and permanent delete confirmation', async ({ page }) => {
    test.setTimeout(300_000);

    await loginAsHr(page);

    await page.getByRole('button', { name: 'Edit lead' }).click({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Edit lead details' })).toBeVisible();

    const statusBlock = page.locator('label', { hasText: 'Applicant status' }).locator('..');
    const statusSelect = statusBlock.locator('select');
    await expect(statusSelect).toBeVisible();
    const optionTexts = await statusSelect.locator('option').allTextContents();
    expect(optionTexts.map((o) => o.trim())).toEqual(
      expect.arrayContaining(['Graduated', 'Terminated', 'Joined']),
    );

    await page.getByRole('button', { name: 'Delete user permanently' }).click();
    await expect(page.getByText(/did not Terminate or Graduate instead/i)).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).last().click();
    await expect(page.getByText('Permanently delete user?')).toBeHidden();
  });
});
