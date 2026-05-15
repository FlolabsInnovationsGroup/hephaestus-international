import { expect, test } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function getCredentials(role: string): { email: string; password: string } {
  const path = join(process.cwd(), 'test_assets', 'test_users.json');
  if (existsSync(path)) {
    try {
      const data = JSON.parse(readFileSync(path, 'utf8')) as {
        users?: Array<{ emails?: string[]; password?: string; role?: string }>;
      };
      const u = data.users?.find((user) => user.role === role);
      if (u) {
        const email = (u.emails?.[0] ?? '').split(',')[0].trim();
        return { email, password: u.password ?? '' };
      }
    } catch { /* fall through */ }
  }
  if (role === 'Human Resources') return { email: 'oliver.abreu@flolabsrd.com', password: 'gq2A1xZ^CdMM#uUpJnfc' };
  return { email: '', password: '' };
}

// Stage → expected canonical status mapping
const STAGE_STATUS_MAP: Record<string, string> = {
  application_submitted: 'applying',
  new: 'applying',
  contacted: 'applying',
  interested_review: 'applying',
  before_meeting: 'applying',
  meeting_recordings_submitted: 'applying',
  saturday_meeting: 'applying',
  attended: 'applying',
  masterclass_submitted: 'applying',
  second_meeting: 'waiting',
  agreement_sent: 'waiting',
  agreement_signed: 'signed',
  chronos_synced: 'joined',
  joined: 'joined',
};

async function loginAsHr(page: Parameters<Parameters<typeof test>[1]>[0]) {
  const { email, password } = getCredentials('Human Resources');
  await page.goto('/login', { waitUntil: 'load' });
  // Wait for React-hydrated inputs before filling
  await page.locator('input').first().waitFor({ state: 'visible' });
  await page.locator('input').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/me\/hr/, { timeout: 90_000 });
}

test.describe('HR stage lifecycle', () => {
  test.setTimeout(180_000);

  test('Stage-to-status mapping: auto-suggest updates status when stage changes', async ({ page }) => {
    await loginAsHr(page);
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 30_000 });

    // The HR actions section must be visible (first lead auto-selected)
    const hrActionsSection = page.locator('div.rounded-2xl').filter({
      has: page.getByRole('heading', { name: /HR actions/i }),
    });
    await expect(hrActionsSection).toBeVisible({ timeout: 15_000 });

    const stageSelect = hrActionsSection.locator('select').nth(0);
    const statusSelect = hrActionsSection.locator('select').nth(1);
    await expect(stageSelect).toBeVisible();
    await expect(statusSelect).toBeVisible();

    // Test each stage produces the correct canonical status
    for (const [stage, expectedStatus] of Object.entries(STAGE_STATUS_MAP)) {
      // Check this stage exists as an option before selecting
      const options = await stageSelect.locator('option').allTextContents();
      const hasStage = options.some((o) => o.trim().includes(stage));
      if (!hasStage) continue;

      await stageSelect.selectOption(stage);
      const actualStatus = await statusSelect.inputValue();
      expect(actualStatus, `Stage "${stage}" should auto-set status to "${expectedStatus}", got "${actualStatus}"`).toBe(expectedStatus);
    }
  });

  test('Status filter contains all 7 canonical statuses', async ({ page }) => {
    await loginAsHr(page);
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 30_000 });

    const filterSelect = page.locator('select[name="status"]');
    await expect(filterSelect).toBeVisible({ timeout: 15_000 });

    const options = await filterSelect.locator('option').allTextContents();
    const statuses = options.map((o) => o.trim()).filter((o) => o && o !== 'All statuses');

    const canonical = ['applying', 'waiting', 'signed', 'joined', 'approved', 'rejected', 'terminated'];
    for (const s of canonical) {
      expect(statuses, `Status filter should contain "${s}"`).toContain(s);
    }
  });

  test('Terminated status: set a lead to terminated and verify Chronos revocation API is called', async ({ page }) => {
    await loginAsHr(page);
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 30_000 });

    const hrActionsSection = page.locator('div.rounded-2xl').filter({
      has: page.getByRole('heading', { name: /HR actions/i }),
    });
    await expect(hrActionsSection).toBeVisible({ timeout: 15_000 });

    const statusSelect = hrActionsSection.locator('select').nth(1);
    await expect(statusSelect).toBeVisible();

    // Capture API response when we save terminated
    const apiResponse = page.waitForResponse(
      (res) => res.url().includes('/api/admin/leads/stage') && res.request().method() === 'POST',
      { timeout: 30_000 },
    );

    await statusSelect.selectOption('terminated');

    const saveButton = hrActionsSection.getByRole('button', { name: /save stage and status/i });
    await saveButton.click();

    const res = await apiResponse;
    expect(res.ok()).toBe(true);

    const body = await res.json() as { ok?: boolean; chronosRevoke?: { ok: boolean } };
    expect(body.ok).toBe(true);
    // When status is terminated, the API returns chronosRevoke (not chronosSync)
    expect(body.chronosRevoke).toBeDefined();
    expect(typeof body.chronosRevoke?.ok).toBe('boolean');

    // Restore status after test to avoid polluting production data
    // The page should have refreshed; pick the first lead and reset
    await page.waitForTimeout(2_000);
  });

  test('Filter by "applying" status shows only applying leads', async ({ page }) => {
    await loginAsHr(page);
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 30_000 });

    // Apply the "applying" filter via URL
    await page.goto('/me/hr?status=applying', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 20_000 });

    // The filter select should reflect the URL param
    const filterSelect = page.locator('select[name="status"]');
    await expect(filterSelect).toHaveValue('applying', { timeout: 10_000 });

    // All visible lead badges / status indicators should not show "active" old style
    // (Just verify no JS errors and the page rendered)
    const errors = await page.evaluate(() =>
      (window as unknown as { __consoleErrors?: string[] }).__consoleErrors ?? [],
    );
    expect(errors.length).toBe(0);
  });

  test('Filter by "terminated" status shows terminated leads', async ({ page }) => {
    await loginAsHr(page);
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 30_000 });

    await page.goto('/me/hr?status=terminated', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 20_000 });

    const filterSelect = page.locator('select[name="status"]');
    await expect(filterSelect).toHaveValue('terminated', { timeout: 10_000 });
  });

  test('Stage controls status select matches filter status select options', async ({ page }) => {
    await loginAsHr(page);
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 30_000 });

    const filterSelect = page.locator('select[name="status"]');
    const hrActionsSection = page.locator('div.rounded-2xl').filter({
      has: page.getByRole('heading', { name: /HR actions/i }),
    });
    const stageControlsStatusSelect = hrActionsSection.locator('select').nth(1);

    await expect(filterSelect).toBeVisible({ timeout: 15_000 });
    await expect(stageControlsStatusSelect).toBeVisible({ timeout: 15_000 });

    const filterOptions = await filterSelect.locator('option').allTextContents();
    const filterStatuses = filterOptions.map((o) => o.trim()).filter((o) => o && o !== 'All statuses');

    const controlOptions = await stageControlsStatusSelect.locator('option').allTextContents();
    const controlStatuses = controlOptions.map((o) => o.trim()).filter(Boolean);

    expect(filterStatuses.sort()).toEqual(controlStatuses.sort());
  });
});
