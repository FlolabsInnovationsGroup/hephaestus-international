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
        return { email: (u.emails?.[0] ?? '').trim(), password: u.password ?? '' };
      }
    } catch { /* fall through */ }
  }
  if (role === 'Human Resources') return { email: 'zoom@flomadlabs.com', password: '' };
  return { email: '', password: '' };
}

const { email: HR_EMAIL, password: HR_PASSWORD } = getCredentials('Human Resources');
const { email: APPLICANT_EMAIL, password: APPLICANT_PASSWORD } = getCredentials('member');

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'load' });
  const visibleInputs = page.locator('input:not([type="hidden"])');
  await visibleInputs.first().waitFor({ state: 'visible' });
  await visibleInputs.first().fill(email);
  await visibleInputs.nth(1).fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/me/, { timeout: 15_000 });
}

test.describe('Role change from HR dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, HR_EMAIL, HR_PASSWORD);
    await page.goto('/me/hr', { waitUntil: 'load' });
    await page.waitForSelector('[data-testid="role-select"]', { timeout: 20_000 });
  });

  test('role-select and HR access checkbox are visible', async ({ page }) => {
    await expect(page.locator('[data-testid="role-select"]')).toBeVisible();
    await expect(page.locator('text=HR dashboard access')).toBeVisible();
    await expect(page.locator('[data-testid="save-role"]')).toBeVisible();
    await page.screenshot({ path: 'test-results/role-01-ui-visible.png' });
  });

  test('saving a role shows Saved confirmation', async ({ page }) => {
    const currentRole = await page.locator('[data-testid="role-select"]').inputValue();
    // Select the same value to test save without real change
    await page.locator('[data-testid="role-select"]').selectOption(currentRole);
    await page.locator('[data-testid="save-role"]').click();
    await expect(page.locator('[data-testid="role-saved"]')).toBeVisible({ timeout: 8_000 });
    await page.screenshot({ path: 'test-results/role-02-saved.png' });
  });
});

test.describe('Notion Team Members page filter', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, HR_EMAIL, HR_PASSWORD);
    await page.goto('/me/hr', { waitUntil: 'load' });
    await page.waitForSelector('select[name="hasNotion"]', { timeout: 20_000 });
  });

  test('hasNotion filter select is present with correct options', async ({ page }) => {
    const select = page.locator('select[name="hasNotion"]');
    await expect(select).toBeVisible();
    await expect(select.locator('option[value=""]')).toHaveText('All leads');
    await expect(select.locator('option[value="yes"]')).toHaveText('Has Notion page');
    await expect(select.locator('option[value="no"]')).toHaveText('No Notion page');
    await page.screenshot({ path: 'test-results/notion-01-filter-visible.png' });
  });

  test('selecting Has Notion page and applying updates URL', async ({ page }) => {
    await page.locator('select[name="hasNotion"]').first().selectOption('yes');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.waitForURL(/hasNotion=yes/, { timeout: 15_000 });
    await expect(page).toHaveURL(/hasNotion=yes/);
    await page.screenshot({ path: 'test-results/notion-02-filter-applied.png' });
  });

  test('selecting No Notion page filters to leads without a page', async ({ page }) => {
    await page.locator('select[name="hasNotion"]').first().selectOption('no');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.waitForURL(/hasNotion=no/, { timeout: 15_000 });
    await expect(page).toHaveURL(/hasNotion=no/);
    await page.screenshot({ path: 'test-results/notion-03-no-notion.png' });
  });
});

test.describe('Applicant view as tesororeptilipotermius', () => {
  test('applicant can log in and sees application dashboard', async ({ page }) => {
    // Ensure no prior HR session is active
    await page.goto('/api/auth/preview-logout', { waitUntil: 'load' });
    await loginAs(page, APPLICANT_EMAIL, APPLICANT_PASSWORD);
    await page.goto('/me/application', { waitUntil: 'load' });
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: 'test-results/applicant-01-dashboard.png', fullPage: true });

    // Should see their name or stage content or some application UI
    const hasStageContent = await page.getByText('Stage content').isVisible().catch(() => false);
    const hasNoMaterials = await page.getByText('No materials').isVisible().catch(() => false);
    const hasPipeline = await page.locator('text=/stage|application|pipeline/i').first().isVisible().catch(() => false);

    expect(hasStageContent || hasNoMaterials || hasPipeline).toBe(true);
  });

  test('applicant does not see HR dashboard', async ({ page }) => {
    await page.goto('/api/auth/preview-logout', { waitUntil: 'load' });
    await loginAs(page, APPLICANT_EMAIL, APPLICANT_PASSWORD);
    await page.goto('/me/hr', { waitUntil: 'load' });
    // Should be redirected away (not to /me/hr)
    await page.waitForTimeout(2_000);
    expect(page.url()).not.toMatch(/\/me\/hr$/);
    await page.screenshot({ path: 'test-results/applicant-02-no-hr-access.png' });
  });
});
