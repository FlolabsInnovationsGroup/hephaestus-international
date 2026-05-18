import { test, expect, type Page } from '@playwright/test';
import { getCredentials, gotoApp, loginAsHr } from './lib/auth';

// ---------------------------------------------------------------------------
// Expected passing conditions for all 14 stages
// ---------------------------------------------------------------------------
const EXPECTED_CONDITIONS: Array<{ id: string; passingCondition: 'none' | 'hr' | 'ai'; locked?: boolean }> = [
  { id: 'application_submitted', passingCondition: 'none' },
  { id: 'new', passingCondition: 'none' },
  { id: 'contacted', passingCondition: 'ai' },
  { id: 'interested_review', passingCondition: 'hr' },
  { id: 'before_meeting', passingCondition: 'ai' },
  { id: 'meeting_recordings_submitted', passingCondition: 'hr' },
  { id: 'saturday_meeting', passingCondition: 'hr' },
  { id: 'attended', passingCondition: 'ai' },
  { id: 'masterclass_submitted', passingCondition: 'hr' },
  { id: 'second_meeting', passingCondition: 'hr', locked: true },
  { id: 'agreement_sent', passingCondition: 'hr', locked: true },
  { id: 'agreement_signed', passingCondition: 'hr', locked: true },
  { id: 'chronos_synced', passingCondition: 'hr', locked: true },
  { id: 'joined', passingCondition: 'hr', locked: true },
];

const LOCKED_STAGE_IDS = EXPECTED_CONDITIONS.filter((s) => s.locked).map((s) => s.id);
const AI_STAGE_IDS = EXPECTED_CONDITIONS.filter((s) => s.passingCondition === 'ai').map((s) => s.id);

// ---------------------------------------------------------------------------
// API tests — GET /api/admin/stages/definitions
// ---------------------------------------------------------------------------
test.describe('GET /api/admin/stages/definitions', () => {
  test.setTimeout(120_000);

  test('returns ok:true with stages array when called as HR', async ({ page }) => {
    await loginAsHr(page);

    const res = await page.request.get('/api/admin/stages/definitions');
    expect(res.status()).toBe(200);

    const body = await res.json() as { ok: boolean; stages: Array<{ id: string; passingCondition: string }> };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.stages)).toBe(true);
    expect(body.stages.length).toBeGreaterThanOrEqual(14);
  });

  test('returns 403 when called without a session', async ({ page }) => {
    // Clear cookies so the request is unauthenticated
    await page.context().clearCookies();
    const res = await page.request.get('/api/admin/stages/definitions');
    expect(res.status()).toBe(403);
  });

  test('all 14 stages are present in the response', async ({ page }) => {
    await loginAsHr(page);

    const res = await page.request.get('/api/admin/stages/definitions');
    const body = await res.json() as { ok: boolean; stages: Array<{ id: string; passingCondition: string }> };

    const returnedIds = new Set(body.stages.map((s) => s.id));
    for (const { id } of EXPECTED_CONDITIONS) {
      expect(returnedIds.has(id), `Stage "${id}" missing from API response`).toBe(true);
    }
  });

  for (const { id, passingCondition } of EXPECTED_CONDITIONS) {
    test(`stage "${id}" has passingCondition="${passingCondition}"`, async ({ page }) => {
      await loginAsHr(page);

      const res = await page.request.get('/api/admin/stages/definitions');
      const body = await res.json() as { ok: boolean; stages: Array<{ id: string; passingCondition: string }> };

      const stage = body.stages.find((s) => s.id === id);
      expect(stage, `Stage "${id}" not found`).toBeDefined();
      expect(stage!.passingCondition).toBe(passingCondition);
    });
  }

  test('all locked stages have passingCondition="hr"', async ({ page }) => {
    await loginAsHr(page);

    const res = await page.request.get('/api/admin/stages/definitions');
    const body = await res.json() as { ok: boolean; stages: Array<{ id: string; passingCondition: string }> };

    for (const lockedId of LOCKED_STAGE_IDS) {
      const stage = body.stages.find((s) => s.id === lockedId);
      expect(stage, `Locked stage "${lockedId}" not found`).toBeDefined();
      expect(stage!.passingCondition, `Locked stage "${lockedId}" should be "hr"`).toBe('hr');
    }
  });

  test('all AI stages have passingCondition="ai"', async ({ page }) => {
    await loginAsHr(page);

    const res = await page.request.get('/api/admin/stages/definitions');
    const body = await res.json() as { ok: boolean; stages: Array<{ id: string; passingCondition: string }> };

    for (const aiId of AI_STAGE_IDS) {
      const stage = body.stages.find((s) => s.id === aiId);
      expect(stage, `AI stage "${aiId}" not found`).toBeDefined();
      expect(stage!.passingCondition, `AI stage "${aiId}" should be "ai"`).toBe('ai');
    }
  });
});

// ---------------------------------------------------------------------------
// UI tests — locked stages (/me/hr/stages)
// ---------------------------------------------------------------------------
test.describe('Locked stages UI', () => {
  test.setTimeout(300_000);

  test.beforeEach(async ({ page }) => {
    await loginAsHr(page);
    await gotoApp(page, '/me/hr/stages');
    await page.waitForSelector('text=Stages', { timeout: 30_000 });
  });

  test('second_meeting (Oliver 1-on-1) shows Locked badge and disabled buttons', async ({ page }) => {
    await page.getByRole('button', { name: /Oliver 1-on-1|second_meeting/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Locked — HR approval required')).toBeVisible({ timeout: 10_000 });

    const noneBtn = page.locator('button', { hasText: 'No action required' });
    const aiBtn = page.locator('button', { hasText: 'AI evaluation' });
    await expect(noneBtn).toBeDisabled();
    await expect(aiBtn).toBeDisabled();

    await expect(page.getByRole('button', { name: 'Save condition' })).not.toBeVisible();

    await page.screenshot({ path: 'test-results/spc-01-second-meeting-locked.png', fullPage: false });
  });

  test('agreement_sent shows Locked badge', async ({ page }) => {
    await page.getByRole('button', { name: /Agreement sent|agreement_sent/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Locked — HR approval required')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Save condition' })).not.toBeVisible();

    await page.screenshot({ path: 'test-results/spc-02-agreement-sent-locked.png', fullPage: false });
  });

  test('agreement_signed shows Locked badge', async ({ page }) => {
    await page.getByRole('button', { name: /Agreement signed|agreement_signed/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Locked — HR approval required')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Save condition' })).not.toBeVisible();
  });

  test('chronos_synced shows Locked badge', async ({ page }) => {
    await page.getByRole('button', { name: /Chronos synced|chronos_synced/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Locked — HR approval required')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Save condition' })).not.toBeVisible();
  });

  test('joined shows Locked badge', async ({ page }) => {
    await page.getByRole('button', { name: /^Joined$|joined/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText('Locked — HR approval required')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Save condition' })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// UI tests — AI stages (/me/hr/stages)
// ---------------------------------------------------------------------------
test.describe('AI stages UI', () => {
  test.setTimeout(300_000);

  test.beforeEach(async ({ page }) => {
    await loginAsHr(page);
    await gotoApp(page, '/me/hr/stages');
    await page.waitForSelector('text=Stages', { timeout: 30_000 });
  });

  test('contacted stage shows AI evaluation as active and exposes prompt textarea', async ({ page }) => {
    await page.getByRole('button', { name: /Websites and presentations|contacted/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Passing condition' })).toBeVisible({ timeout: 10_000 });

    // The AI option should be currently selected
    await expect(page.locator('button[data-value="ai"]')).toHaveAttribute('data-selected', 'true', { timeout: 5_000 });

    // AI prompt textarea should be visible
    await expect(page.getByText('AI evaluation prompt')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Pay special attention"]')).toBeVisible();

    await page.screenshot({ path: 'test-results/spc-03-contacted-ai-selected.png', fullPage: false });
  });

  test('before_meeting stage shows AI evaluation as active', async ({ page }) => {
    await page.getByRole('button', { name: /Meeting recordings|before_meeting/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Passing condition' })).toBeVisible({ timeout: 10_000 });

    await expect(page.locator('button[data-value="ai"]')).toHaveAttribute('data-selected', 'true', { timeout: 5_000 });
    await expect(page.locator('textarea[placeholder*="Pay special attention"]')).toBeVisible();
  });

  test('attended stage shows AI evaluation as active', async ({ page }) => {
    await page.getByRole('button', { name: /Masterclass assigned|attended/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Passing condition' })).toBeVisible({ timeout: 10_000 });

    await expect(page.locator('button[data-value="ai"]')).toHaveAttribute('data-selected', 'true', { timeout: 5_000 });
    await expect(page.locator('textarea[placeholder*="Pay special attention"]')).toBeVisible();
  });

  test('AI prompt textarea for contacted stage is editable', async ({ page }) => {
    await page.getByRole('button', { name: /Websites and presentations|contacted/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Passing condition' })).toBeVisible({ timeout: 10_000 });

    const textarea = page.locator('textarea[placeholder*="Pay special attention"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEditable();

    // Verify we can type into it
    const original = await textarea.inputValue();
    await textarea.fill('Test prompt edit — ' + original.slice(0, 40));
    const changed = await textarea.inputValue();
    expect(changed).toContain('Test prompt edit');

    // Restore original value without saving
    await textarea.fill(original);
  });
});

// ---------------------------------------------------------------------------
// Regression test: save and reload for contacted stage
// ---------------------------------------------------------------------------
test.describe('Passing condition save-and-reload regression', () => {
  test.setTimeout(300_000);

  test('contacted stage: edited prompt persists after page reload', async ({ page }) => {
    await loginAsHr(page);
    await gotoApp(page, '/me/hr/stages');
    await page.waitForSelector('text=Stages', { timeout: 30_000 });

    await page.getByRole('button', { name: /Websites and presentations|contacted/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Passing condition' })).toBeVisible({ timeout: 10_000 });

    const textarea = page.locator('textarea[placeholder*="Pay special attention"]');
    await expect(textarea).toBeVisible();

    // Record original prompt so we can restore it
    const originalPrompt = await textarea.inputValue();

    // Apply a test marker
    const testMarker = `[e2e-test-marker-${Date.now()}]`;
    await textarea.fill(testMarker);

    // Save
    const [saveResponse] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/admin/stages/definitions') && r.request().method() === 'PATCH',
      ),
      page.getByRole('button', { name: 'Save condition' }).click(),
    ]);
    expect(saveResponse.status()).toBe(200);
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 10_000 });

    await page.screenshot({ path: 'test-results/spc-04-condition-saved.png', fullPage: false });

    // Reload and verify persistence
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Stages', { timeout: 30_000 });
    await page.getByRole('button', { name: /Websites and presentations|contacted/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Passing condition' })).toBeVisible({ timeout: 10_000 });

    const reloadedValue = await page.locator('textarea[placeholder*="Pay special attention"]').inputValue();
    expect(reloadedValue).toBe(testMarker);

    await page.screenshot({ path: 'test-results/spc-05-condition-persisted.png', fullPage: false });

    // Restore original prompt
    const textareaRestored = page.locator('textarea[placeholder*="Pay special attention"]');
    await textareaRestored.fill(originalPrompt);
    const [restoreResponse] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/admin/stages/definitions') && r.request().method() === 'PATCH',
      ),
      page.getByRole('button', { name: 'Save condition' }).click(),
    ]);
    expect(restoreResponse.status()).toBe(200);
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 10_000 });
  });
});
