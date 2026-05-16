import { expect, test } from '@playwright/test';
import { loginAsHr } from './lib/auth';

test.describe('Team Member search performance', () => {
  test.setTimeout(300_000);

  test('cached directory search responds in under 90s after warm-up', async ({ page, request }) => {
    await loginAsHr(page);
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const base = page.url().replace(/\/me\/hr.*/, '');

    const warm = await request.get(`${base}/api/admin/notion/team-members/search?q=`, {
      headers: { Cookie: cookieHeader },
    });
    expect(warm.status()).toBe(200);

    const started = Date.now();
    const res = await request.get(`${base}/api/admin/notion/team-members/search?q=ahmed`, {
      headers: { Cookie: cookieHeader },
    });
    const elapsedMs = Date.now() - started;

    expect(res.status()).toBe(200);
    const body = await res.json() as { results?: unknown[]; error?: string };
    expect(body.error).toBeUndefined();
    expect(Array.isArray(body.results)).toBe(true);
    expect(elapsedMs).toBeLessThan(90_000);
  });
});
