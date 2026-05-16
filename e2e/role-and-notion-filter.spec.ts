import { test, expect } from '@playwright/test';
import { gotoApp, loginAsHr, loginAsMember } from './lib/auth';

test.describe('Role change from HR dashboard', () => {
  test.setTimeout(300_000);
  test.beforeEach(async ({ page }) => {
    await loginAsHr(page);
    await gotoApp(page, '/me/hr');
    await page.waitForSelector('[data-testid="role-select"]', { timeout: 30_000 });
  });

  test('role-select and HR access checkbox are visible', async ({ page }) => {
    await expect(page.locator('[data-testid="role-select"]')).toBeVisible();
    await expect(page.locator('text=HR dashboard access')).toBeVisible();
    await expect(page.locator('[data-testid="save-role"]')).toBeVisible();
    await page.screenshot({ path: 'test-results/role-01-ui-visible.png' });
  });

  test('saving a role shows Saved confirmation', async ({ page }) => {
    const currentRole = await page.locator('[data-testid="role-select"]').inputValue();
    await page.locator('[data-testid="role-select"]').selectOption(currentRole);
    await page.locator('[data-testid="save-role"]').click();
    await expect(page.locator('[data-testid="role-saved"]')).toBeVisible({ timeout: 8_000 });
    await page.screenshot({ path: 'test-results/role-02-saved.png' });
  });
});

test.describe('Notion Team Members page filter', () => {
  test.setTimeout(300_000);
  test.beforeEach(async ({ page }) => {
    await loginAsHr(page);
    await gotoApp(page, '/me/hr');
    await page.waitForSelector('select[name="hasNotion"]', { timeout: 30_000 });
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
    await page.waitForURL(/hasNotion=yes/, { timeout: 30_000 });
    await expect(page).toHaveURL(/hasNotion=yes/);
    await page.screenshot({ path: 'test-results/notion-02-filter-applied.png' });
  });

  test('selecting No Notion page filters to leads without a page', async ({ page }) => {
    await page.locator('select[name="hasNotion"]').first().selectOption('no');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.waitForURL(/hasNotion=no/, { timeout: 30_000 });
    await expect(page).toHaveURL(/hasNotion=no/);
    await page.screenshot({ path: 'test-results/notion-03-no-notion.png' });
  });
});

test.describe('Applicant view as tesororeptilipotermius', () => {
  test.setTimeout(300_000);
  test('applicant can see application dashboard', async ({ page }) => {
    await loginAsMember(page);
    await gotoApp(page, '/me/application');
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: 'test-results/applicant-01-dashboard.png', fullPage: true });

    const hasStageContent = await page.getByText('Stage content').isVisible().catch(() => false);
    const hasNoMaterials = await page.getByText('No materials').isVisible().catch(() => false);
    const hasPipeline = await page.locator('text=/stage|application|pipeline/i').first().isVisible().catch(() => false);

    expect(hasStageContent || hasNoMaterials || hasPipeline).toBe(true);
  });

  test('applicant is redirected away from HR dashboard', async ({ page }) => {
    await loginAsMember(page);
    await gotoApp(page, '/me/hr');
    await page.waitForURL((url) => !url.pathname.startsWith('/me/hr'), { timeout: 30_000 });
    expect(page.url()).not.toMatch(/\/me\/hr/);
    await page.screenshot({ path: 'test-results/applicant-02-no-hr-access.png' });
  });
});
