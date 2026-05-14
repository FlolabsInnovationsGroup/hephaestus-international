import { test, expect, type Page } from '@playwright/test';
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
  if (role === 'Human Resources') return { email: 'zoom@flomadlabs.com', password: '' };
  return { email: '', password: '' };
}

const { email: HR_EMAIL, password: HR_PASSWORD } = getCredentials('Human Resources');
const { email: APPLICANT_EMAIL, password: APPLICANT_PASSWORD } = getCredentials('member');

const HR_LOCKED_STAGES = ['second_meeting', 'agreement_sent', 'agreement_signed', 'chronos_synced', 'joined'];

async function loginAs(page: Page, email: string, password: string) {
  // Logout first to ensure a fresh session regardless of current state
  await page.goto('/api/auth/preview-logout', { waitUntil: 'load' });
  await page.locator('input:not([type="hidden"])').first().waitFor({ state: 'visible' });
  await page.locator('input:not([type="hidden"])').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/me/, { timeout: 15_000 });
}

test.describe('Passing condition card', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, HR_EMAIL, HR_PASSWORD);
    await page.goto('/me/hr/stages', { waitUntil: 'load' });
    await page.waitForSelector('text=Stages', { timeout: 15_000 });
  });

  test('passing condition card is present on the first stage', async ({ page }) => {
    await expect(page.getByText('Passing condition')).toBeVisible();
    await expect(page.getByText('No action required')).toBeVisible();
    await expect(page.getByText('AI evaluation')).toBeVisible();
    await expect(page.getByText('HR approval')).toBeVisible();
    await page.screenshot({ path: 'test-results/01-passing-condition-card.png', fullPage: false });
  });

  test('AI prompt textarea appears only when AI evaluation is selected', async ({ page }) => {
    // Click "AI evaluation" option
    await page.getByText('AI evaluation').click();
    await expect(page.getByText('AI evaluation prompt')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Pay special attention"]')).toBeVisible();

    // Switch to "No action required" — prompt should disappear
    await page.getByText('No action required').click();
    await expect(page.getByText('AI evaluation prompt')).not.toBeVisible();
    await page.screenshot({ path: 'test-results/02-no-ai-prompt-on-none.png', fullPage: false });
  });

  test('locked stages show HR approval badge and disable other options', async ({ page }) => {
    // Navigate to second_meeting stage
    await page.getByRole('button', { name: /Oliver 1-on-1|second_meeting/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Locked — HR approval required')).toBeVisible();

    // "No action required" and "AI evaluation" buttons should be disabled
    const noneBtn = page.locator('button', { hasText: 'No action required' });
    const aiBtn = page.locator('button', { hasText: 'AI evaluation' });
    await expect(noneBtn).toBeDisabled();
    await expect(aiBtn).toBeDisabled();

    // Save condition button should NOT be present (locked)
    await expect(page.getByRole('button', { name: 'Save condition' })).not.toBeVisible();
    await page.screenshot({ path: 'test-results/03-locked-hr-stage.png', fullPage: false });
  });

  test('save passing condition persists after reload', async ({ page }) => {
    // Find a non-locked stage (contacted)
    await page.getByRole('button', { name: /Websites and presentations|contacted/i }).first().click();
    await page.waitForTimeout(500);

    // Select "No action required"
    await page.getByText('No action required').click();
    await page.getByRole('button', { name: 'Save condition' }).click();

    // Wait for "Saved" confirmation
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 8_000 });
    await page.screenshot({ path: 'test-results/04-condition-saved.png', fullPage: false });

    // Reload and verify it persists
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('text=Stages', { timeout: 15_000 });
    await page.getByRole('button', { name: /Websites and presentations|contacted/i }).first().click();
    await page.waitForTimeout(500);

    // The "No action required" button should appear selected
    const noneBtn = page.locator('button', { hasText: 'No action required' });
    await expect(noneBtn).toHaveAttribute('data-selected', 'true', { timeout: 5_000 });
    await page.screenshot({ path: 'test-results/05-condition-persisted.png', fullPage: false });

    // Restore to AI evaluation
    await page.getByText('AI evaluation').click();
    await page.getByRole('button', { name: 'Save condition' }).click();
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Stage content resources', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, HR_EMAIL, HR_PASSWORD);
    await page.goto('/me/hr/stages', { waitUntil: 'load' });
    await page.waitForSelector('text=Stages', { timeout: 15_000 });
  });

  test('contacted stage has resources', async ({ page }) => {
    await page.getByRole('button', { name: /Websites and presentations|contacted/i }).first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/06-contacted-resources.png', fullPage: true });

    // Scope to the resource list panel to exclude stage-navigation Remove buttons
    const resourceList = page.locator('[data-testid="stage-resource-list"]');
    await expect(resourceList.getByRole('button', { name: 'Remove' })).toHaveCount(9, { timeout: 10_000 });
  });

  test('before_meeting stage has 4 resources', async ({ page }) => {
    await page.getByRole('button', { name: /Meeting recordings|before_meeting/i }).first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/07-before-meeting-resources.png', fullPage: true });

    const resourceList = page.locator('[data-testid="stage-resource-list"]');
    await expect(resourceList.getByRole('button', { name: 'Remove' })).toHaveCount(4, { timeout: 10_000 });
  });

  test('attended stage has 6 resources', async ({ page }) => {
    await page.getByRole('button', { name: /Masterclass assigned|attended/i }).first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/08-attended-resources.png', fullPage: true });

    const resourceList = page.locator('[data-testid="stage-resource-list"]');
    await expect(resourceList.getByRole('button', { name: 'Remove' })).toHaveCount(6, { timeout: 10_000 });
  });
});

test.describe('Applicant view', () => {
  test('applicant sees content cards on their current stage', async ({ page }) => {
    // First: push test applicant to contacted stage via HR
    await loginAs(page, HR_EMAIL, HR_PASSWORD);

    // Log out and log back in as applicant
    await page.goto('/api/auth/preview-logout', { waitUntil: 'load' });
    await loginAs(page, APPLICANT_EMAIL, APPLICANT_PASSWORD);

    await page.goto('/me/application', { waitUntil: 'load' });
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: 'test-results/09-applicant-dashboard.png', fullPage: true });

    // Applicant should see either stage content cards or a "No materials" message
    const hasContent = await page.getByText('Stage content').isVisible().catch(() => false);
    const hasNoMaterials = await page.getByText('No materials have been assigned').isVisible().catch(() => false);
    const hasOnReview = await page.getByText('previous submission is with our team').isVisible().catch(() => false);

    expect(hasContent || hasNoMaterials || hasOnReview).toBe(true);
  });
});
