import { expect, test } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function getTestCredentials(): { email: string; password: string } {
  const path = join(process.cwd(), 'test_assets', 'test_users.json');
  if (!existsSync(path)) return { email: 'oliver.abreu@flolabsrd.com', password: 'gq2A1xZ^CdMM#uUpJnfc' };
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as {
      users?: Array<{ emails?: string[]; password?: string; role?: string }>;
    };
    const hrUser = data.users?.find((u) => u.role === 'Human Resources');
    if (hrUser) {
      const rawEmails = hrUser.emails?.[0] ?? '';
      const email = rawEmails.split(',')[0].trim();
      return { email, password: hrUser.password ?? '' };
    }
  } catch {
    // fall through
  }
  return { email: 'oliver.abreu@flolabsrd.com', password: 'gq2A1xZ^CdMM#uUpJnfc' };
}

test.describe('HR dashboard — status filter matches status selector', () => {
  test('Status filter options match HR stage controls status selector options for the displayed lead', async ({ page }) => {
    test.setTimeout(120_000);

    const { email, password } = getTestCredentials();

    // Login — wait for React hydration before filling controlled inputs
    await page.goto('/login', { waitUntil: 'load' });
    await page.locator('input').first().waitFor({ state: 'visible' });
    await page.locator('input').first().fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/me\/hr/, { timeout: 60_000 });

    // Wait for HR dashboard content
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 30_000 });

    // Get status filter options (the select in the filter form with name="status")
    const filterStatusSelect = page.locator('select[name="status"]');
    await expect(filterStatusSelect).toBeVisible({ timeout: 15_000 });

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

    // Verify all canonical statuses are present
    const canonical = ['applying', 'waiting', 'signed', 'joined', 'active', 'approved', 'rejected', 'terminated'];
    for (const s of canonical) {
      expect(filterStatusOptions).toContain(s);
    }

    // Additionally verify the stage controls shows the same value as what the filter would filter by
    const currentStageStatus = await stageStatusSelect.inputValue();
    expect(filterStatusOptions).toContain(currentStageStatus);
  });
});
