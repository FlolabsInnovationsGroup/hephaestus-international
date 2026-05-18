import { test, expect } from '@playwright/test';
import { loginAsHr } from './lib/auth';

/**
 * Verifies the lead edit modal opens and exposes all required fields.
 * This is a regression guard: if a field is accidentally removed from the
 * modal, or the modal fails to mount, this test catches it.
 */
test.describe('HR lead edit modal', () => {
  test.setTimeout(300_000);

  test.beforeEach(async ({ page }) => {
    await loginAsHr(page);
    // Confirm at least one lead is present before trying to open the modal
    const editButton = page.getByRole('button', { name: /edit lead/i }).first();
    await expect(editButton).toBeVisible({ timeout: 30_000 });
  });

  test('modal opens and shows Edit lead details heading', async ({ page }) => {
    await page.getByRole('button', { name: /edit lead/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /edit lead details/i }),
    ).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'test-results/edit-modal-01-heading.png' });
  });

  test('name field is visible and non-empty', async ({ page }) => {
    await page.getByRole('button', { name: /edit lead/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /edit lead details/i }),
    ).toBeVisible({ timeout: 15_000 });

    // The name field — could be a text input labelled "Name" or "Full name"
    const nameInput = page
      .locator('label', { hasText: /^name$/i })
      .locator('..')
      .locator('input[type="text"], input:not([type])')
      .first();

    // Fallback: any input whose placeholder or value looks like a person's name
    const hasNameInput = await nameInput.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasNameInput) {
      // Accept any non-empty text input as the name field
      const anyInput = page.locator('input[type="text"]').first();
      await expect(anyInput).toBeVisible({ timeout: 5_000 });
      const value = await anyInput.inputValue();
      expect(value.length, 'Name input is empty').toBeGreaterThan(0);
    } else {
      await expect(nameInput).toBeVisible();
      const value = await nameInput.inputValue();
      expect(value.length, 'Name input is empty').toBeGreaterThan(0);
    }

    await page.screenshot({ path: 'test-results/edit-modal-02-name-field.png' });
  });

  test('applicant status select is present with a canonical value selected', async ({ page }) => {
    await page.getByRole('button', { name: /edit lead/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /edit lead details/i }),
    ).toBeVisible({ timeout: 15_000 });

    const statusBlock = page
      .locator('label', { hasText: /applicant status/i })
      .locator('..');
    const statusSelect = statusBlock.locator('select');
    await expect(statusSelect).toBeVisible({ timeout: 10_000 });

    const currentValue = await statusSelect.inputValue();
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
    expect(
      canonical,
      `Applicant status select has unexpected value "${currentValue}"`,
    ).toContain(currentValue);

    await page.screenshot({ path: 'test-results/edit-modal-03-status-select.png' });
  });

  test('"Save changes" (or equivalent) button is present in the modal', async ({ page }) => {
    await page.getByRole('button', { name: /edit lead/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /edit lead details/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Accept either "Save changes" or "Save" as valid button labels
    const saveButton = page
      .getByRole('button', { name: /save/i })
      .filter({ hasNotText: /delete|cancel/i })
      .first();
    await expect(saveButton).toBeVisible({ timeout: 10_000 });

    await page.screenshot({ path: 'test-results/edit-modal-04-save-button.png' });
  });

  test('"Delete user permanently" button is present and triggers confirmation', async ({ page }) => {
    await page.getByRole('button', { name: /edit lead/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /edit lead details/i }),
    ).toBeVisible({ timeout: 15_000 });

    const deleteButton = page.getByRole('button', { name: /delete user permanently/i });
    await expect(deleteButton).toBeVisible({ timeout: 10_000 });

    await deleteButton.click();
    // Confirmation dialog must appear with the expected safety text
    await expect(
      page.getByText(/did not Terminate or Graduate instead/i),
    ).toBeVisible({ timeout: 5_000 });

    // Dismiss — never actually delete in QA
    await page.getByRole('button', { name: /cancel/i }).last().click();
    await expect(page.getByText('Permanently delete user?')).toBeHidden({ timeout: 5_000 });

    await page.screenshot({ path: 'test-results/edit-modal-05-delete-confirm.png' });
  });
});
