import { expect, test } from '@playwright/test';
import { loginAsHr } from './lib/auth';

test.describe('HR dashboard — status filter matches status selector', () => {
  test('Status filter options match HR stage controls status selector options for the displayed lead', async ({ page }) => {
    test.setTimeout(300_000);

    await loginAsHr(page);

    const filterStatusSelect = page.locator('select[name="status"]');
    await expect(filterStatusSelect).toBeVisible();

    const filterOptions = await filterStatusSelect.locator('option').allTextContents();
    // Remove the "All statuses" placeholder option
    const filterStatusOptions = filterOptions
      .map((o) => o.trim())
      .filter((o) => o && o !== 'All statuses');

    // Get status selector options from the HR stage controls on the right panel
    // The stage controls has two selects: Stage and Status. We target the Status one.
    // It's inside the "HR actions" section — find the second select in the stage controls.
    const hrActionsSection = page.locator('div.rounded-2xl').filter({ has: page.getByRole('heading', { name: /HR actions/i }) });
    await expect(hrActionsSection).toBeVisible({ timeout: 15_000 });

    const stageControlsSelects = hrActionsSection.locator('select');
    // The second select is the status selector
    const stageStatusSelect = stageControlsSelects.nth(1);
    await expect(stageStatusSelect).toBeVisible({ timeout: 10_000 });

    const stageOptions = await stageStatusSelect.locator('option').allTextContents();
    const stageStatusOptions = stageOptions.map((o) => o.trim()).filter(Boolean);

    // Both selectors should offer the same set of status options
    expect(filterStatusOptions.sort()).toEqual(stageStatusOptions.sort());

    // Verify all canonical statuses are present (7-status system; 'active' was removed)
    const canonical = ['applying', 'waiting', 'signed', 'joined', 'approved', 'rejected', 'terminated'];
    for (const s of canonical) {
      expect(filterStatusOptions).toContain(s);
    }

    // Additionally verify the stage controls shows the same value as what the filter would filter by
    const currentStageStatus = await stageStatusSelect.inputValue();
    expect(filterStatusOptions).toContain(currentStageStatus);
  });
});
