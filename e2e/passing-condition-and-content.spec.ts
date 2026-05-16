import { test, expect, type Page } from '@playwright/test';
import { getCredentials, gotoApp, loginWithCredentials } from './lib/auth';

const { email: HR_EMAIL, password: HR_PASSWORD } = getCredentials('Human Resources');
const { email: APPLICANT_EMAIL, password: APPLICANT_PASSWORD } = getCredentials('member');

async function loginAs(page: Page, email: string, password: string) {
  await loginWithCredentials(page, email, password, /\/me/);
}

test.describe('Passing condition card', () => {
  test.setTimeout(300_000);
  test.beforeEach(async ({ page }) => {
    await loginAs(page, HR_EMAIL, HR_PASSWORD);
    await gotoApp(page, '/me/hr/stages');
    await page.waitForSelector('text=Stages', { timeout: 30_000 });
  });

  test('passing condition card is present on the first stage', async ({ page }) => {
    await expect(page.getByText('Passing condition')).toBeVisible();
    await expect(page.getByText('No action required')).toBeVisible();
    await expect(page.getByText('AI evaluation')).toBeVisible();
    await expect(page.getByText('HR approval')).toBeVisible();
    await page.screenshot({ path: 'test-results/01-passing-condition-card.png', fullPage: false });
  });

  test('AI prompt textarea appears only when AI evaluation is selected', async ({ page }) => {
    await page.locator('button[data-value="ai"]').click();
    await expect(page.getByText('AI evaluation prompt')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Pay special attention"]')).toBeVisible();

    await page.locator('button[data-value="none"]').click();
    await expect(page.getByText('AI evaluation prompt')).not.toBeVisible();
    await page.screenshot({ path: 'test-results/02-no-ai-prompt-on-none.png', fullPage: false });
  });

  test('locked stages show HR approval badge and disable other options', async ({ page }) => {
    await page.getByRole('button', { name: /Oliver 1-on-1|second_meeting/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Locked — HR approval required')).toBeVisible();

    const noneBtn = page.locator('button', { hasText: 'No action required' });
    const aiBtn = page.locator('button', { hasText: 'AI evaluation' });
    await expect(noneBtn).toBeDisabled();
    await expect(aiBtn).toBeDisabled();

    await expect(page.getByRole('button', { name: 'Save condition' })).not.toBeVisible();
    await page.screenshot({ path: 'test-results/03-locked-hr-stage.png', fullPage: false });
  });

  test('save passing condition persists after reload', async ({ page }) => {
    await page.getByRole('button', { name: /Websites and presentations|contacted/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Passing condition' })).toBeVisible({ timeout: 5_000 });

    await page.locator('button[data-value="none"]').click();
    const [saveResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/admin/stages/definitions') && r.request().method() === 'PATCH'),
      page.getByRole('button', { name: 'Save condition' }).click(),
    ]);
    expect(saveResponse.status()).toBe(200);

    await expect(page.getByText('Saved')).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: 'test-results/04-condition-saved.png', fullPage: false });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Stages', { timeout: 30_000 });
    await page.getByRole('button', { name: /Websites and presentations|contacted/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Passing condition' })).toBeVisible({ timeout: 5_000 });

    await expect(page.locator('button[data-value="none"]')).toHaveAttribute('data-selected', 'true', { timeout: 5_000 });
    await page.screenshot({ path: 'test-results/05-condition-persisted.png', fullPage: false });

    await page.locator('button[data-value="ai"]').click();
    const [restoreResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/admin/stages/definitions') && r.request().method() === 'PATCH'),
      page.getByRole('button', { name: 'Save condition' }).click(),
    ]);
    expect(restoreResponse.status()).toBe(200);
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Stage content resources', () => {
  test.setTimeout(300_000);
  test.beforeEach(async ({ page }) => {
    await loginAs(page, HR_EMAIL, HR_PASSWORD);
    await gotoApp(page, '/me/hr/stages');
    await page.waitForSelector('text=Stages', { timeout: 30_000 });
  });

  test('contacted stage has resources', async ({ page }) => {
    await page.getByRole('button', { name: /Websites and presentations|contacted/i }).first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/06-contacted-resources.png', fullPage: true });

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
  test.setTimeout(300_000);
  test('applicant sees content cards on their current stage', async ({ page }) => {
    await loginAs(page, APPLICANT_EMAIL, APPLICANT_PASSWORD);

    await gotoApp(page, '/me/application');
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: 'test-results/09-applicant-dashboard.png', fullPage: true });

    const hasContent = await page.getByText('Stage content').isVisible().catch(() => false);
    const hasNoMaterials = await page.getByText('No materials have been assigned').isVisible().catch(() => false);
    const hasOnReview = await page.getByText('previous submission is with our team').isVisible().catch(() => false);

    expect(hasContent || hasNoMaterials || hasOnReview).toBe(true);
  });
});
