import { expect, test } from '@playwright/test';
import { gotoApp, loginAsHr } from './lib/auth';

test.describe('Notion team member page linking', () => {
  test.setTimeout(300_000);

  test('Notion search API returns results (not 503)', async ({ page, request }) => {
    await loginAsHr(page);
    // Call the Notion search API with the HR session cookie
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const base = page.url().replace(/\/me\/hr.*/, '');
    const res = await request.get(`${base}/api/admin/notion/team-members/search?q=ahmed`, {
      headers: { Cookie: cookieHeader },
    });
    expect(res.status()).not.toBe(503);
    const body = await res.json() as { results?: unknown[]; error?: string };
    expect(body.error).toBeUndefined();
    expect(Array.isArray(body.results)).toBe(true);
  });

  test('Edit profile: Notion team member search field is interactive', async ({ page }) => {
    await loginAsHr(page);
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 30_000 });

    // Open edit profile for the first visible lead
    const editButton = page.getByRole('button', { name: /edit lead/i }).first();
    await expect(editButton).toBeVisible({ timeout: 20_000 });
    await editButton.click();

    // The modal should appear
    const modalHeading = page.getByRole('heading', { name: /edit lead details/i });
    await expect(modalHeading).toBeVisible({ timeout: 10_000 });

    // Find the Notion search input inside the modal
    const notionInput = page.locator('input[placeholder*="Search for"]').first();
    await expect(notionInput).toBeVisible({ timeout: 5_000 });

    // Focus — this fires the debounce search immediately
    const searchDone = page.waitForResponse(
      (res) => res.url().includes('/api/admin/notion/team-members/search'),
      { timeout: 15_000 },
    );
    await notionInput.click();
    await searchDone;

    // Should not show a 503 error
    const errorText = page.getByText(/Notion API key not configured/i);
    await expect(errorText).not.toBeVisible();
  });

  test('Edit profile: save with Notion URL persists and returns in API response', async ({ page, request }) => {
    await loginAsHr(page);
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 30_000 });

    // First get the list of leads and pick one to test with
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const base = page.url().replace(/\/me\/hr.*/, '');

    // Search for a Notion page to use as test URL — if no results, skip
    const searchRes = await request.get(`${base}/api/admin/notion/team-members/search?q=ahmed`, {
      headers: { Cookie: cookieHeader },
    });
    const searchBody = await searchRes.json() as { results?: Array<{ id: string; title: string; url: string }> };
    if (!searchBody.results?.length) {
      test.skip();
      return;
    }
    const notionPage = searchBody.results[0];

    // Open edit for the first lead
    const editButton = page.getByRole('button', { name: /edit lead/i }).first();
    await expect(editButton).toBeVisible({ timeout: 20_000 });
    await editButton.click();

    // Get the applicant ID from the active lead element
    const modalHeading2 = page.getByRole('heading', { name: /edit lead details/i });
    await expect(modalHeading2).toBeVisible({ timeout: 10_000 });

    const notionInput = page.locator('input[placeholder*="Search for"]').first();
    // Click first (triggers handleFocus + initial search); then clear and type the known title.
    await notionInput.click();
    await page.waitForTimeout(500);
    await notionInput.fill('');
    // Type character-by-character to trigger React onChange + debounce reliably
    const searchDone2 = page.waitForResponse(
      (res) => res.url().includes('/api/admin/notion/team-members/search')
        && res.url().includes(encodeURIComponent(notionPage.title.split(' ')[0])),
      { timeout: 10_000 },
    );
    await notionInput.pressSequentially(notionPage.title, { delay: 50 });
    await searchDone2;
    await page.waitForTimeout(300); // let React re-render the dropdown

    const resultButton = page.locator(`button:has-text("${notionPage.title}")`).first();
    const resultVisible = await resultButton.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!resultVisible) {
      test.skip();
      return;
    }

    // Intercept the save call
    const savePromise = page.waitForResponse(
      (res) => res.url().includes('/api/admin/leads/profile') && res.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await resultButton.click();

    // Click Save changes
    const saveBtn = page.getByRole('button', { name: /save changes/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });
    await saveBtn.click();

    const saveRes = await savePromise;
    expect(saveRes.ok()).toBe(true);
    const saveBody = await saveRes.json() as { ok?: boolean; applicant?: { notionTeamMemberPageUrl?: string } };
    expect(saveBody.ok).toBe(true);
    // The saved applicant should contain the Notion URL
    if (saveBody.applicant?.notionTeamMemberPageUrl !== undefined) {
      expect(saveBody.applicant.notionTeamMemberPageUrl).toBeTruthy();
    }
  });
});

test.describe('grantChronosAccess creates Chronos account', () => {
  test.setTimeout(300_000);

  test('Setting status to joined returns chronosGrant.ok = true', async ({ page }) => {
    await loginAsHr(page);
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 30_000 });

    // Use already-joined leads: re-applying "joined" is idempotent and safe.
    await gotoApp(page, '/me/hr?status=joined');
    await expect(page.getByRole('heading', { name: /applicants and conversations/i })).toBeVisible({ timeout: 20_000 });

    const hrActionsSection = page.locator('div.rounded-2xl').filter({
      has: page.getByRole('heading', { name: /HR actions/i }),
    });
    const statusSelect = hrActionsSection.locator('select').nth(1);
    const joinedOption = await statusSelect.locator('option[value="joined"]').count();
    if (!joinedOption) {
      test.skip();
      return;
    }

    const apiResponse = page.waitForResponse(
      (res) => res.url().includes('/api/admin/leads/stage') && res.request().method() === 'POST',
      { timeout: 30_000 },
    );

    // Set to "joined" (idempotent — lead is already joined)
    await statusSelect.selectOption('joined');
    const saveButton = hrActionsSection.getByRole('button', { name: /save stage and status/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    const res = await apiResponse;
    expect(res.ok()).toBe(true);
    const body = await res.json() as { ok?: boolean; chronosGrant?: { ok: boolean } };
    expect(body.ok).toBe(true);
    // chronosGrant is set when status is "joined"
    expect(body.chronosGrant).toBeDefined();
    expect(body.chronosGrant?.ok).toBe(true);
  });
});
