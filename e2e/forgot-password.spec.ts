import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function getTestEmail(role: string): string {
  const path = join(process.cwd(), 'test_assets', 'test_users.json');
  if (existsSync(path)) {
    const data = JSON.parse(readFileSync(path, 'utf8')) as {
      users?: Array<{ emails?: string[]; role?: string }>;
    };
    const u = data.users?.find((user) => user.role === role);
    if (u) return (u.emails?.[0] ?? '').split(',')[0].trim();
  }
  return '';
}

test.describe('Forgot password', () => {
  test.setTimeout(60_000);

  test('UI: submitting shows success message for any email address', async ({ page }) => {
    await page.goto('/login?forgot=1', { waitUntil: 'load' });
    await expect(page.getByText(/forgot your password/i)).toBeVisible({ timeout: 10_000 });

    const emailInput = page.locator('input').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill('no-such-user@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();

    await expect(
      page.getByText(/if an applicant account exists.*reset link has been sent/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('API: known user gets a reset token (cooldown on second request proves token was created)', async ({
    request,
  }) => {
    const email = getTestEmail('member');
    if (!email) test.skip(true, 'No member user in test_assets/test_users.json');

    const first = await request.post('/api/auth/forgot-password', { data: { email } });
    expect(first.status()).toBe(200);
    const firstBody = (await first.json()) as { ok: boolean; cooldown?: boolean };
    expect(firstBody.ok).toBe(true);

    // A second immediate request must return cooldown=true — a live token exists in the DB.
    // (If cooldown was already true on the first request, a token was already live from a
    // previous run within the 2-hour window; either way, the flow ran to completion.)
    const second = await request.post('/api/auth/forgot-password', { data: { email } });
    expect(second.status()).toBe(200);
    const secondBody = (await second.json()) as { ok: boolean; cooldown?: boolean };
    expect(secondBody.ok).toBe(true);
    expect(secondBody.cooldown, 'Expected cooldown=true on second request — token must exist').toBe(true);
  });

  test('API: unknown email returns ok without error (anti-enumeration)', async ({ request }) => {
    const res = await request.post('/api/auth/forgot-password', {
      data: { email: 'totally-unknown-xyz-1234@example.com' },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
