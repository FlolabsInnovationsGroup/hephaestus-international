import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';

export type TestUser = {
  emails?: string[];
  password?: string;
  role?: string;
  userId?: string;
};

export function getCredentials(role: string): { email: string; password: string; userId?: string } {
  const path = join(process.cwd(), 'test_assets', 'test_users.json');
  if (existsSync(path)) {
    try {
      const data = JSON.parse(readFileSync(path, 'utf8')) as { users?: TestUser[] };
      const u = data.users?.find((user) => user.role === role);
      if (u) {
        const email = (u.emails?.[0] ?? '').split(',')[0].trim();
        return { email, password: u.password ?? '', userId: u.userId };
      }
    } catch {
      /* fall through */
    }
  }
  if (role === 'Human Resources') {
    return { email: 'zoom@flomadlabs.com', password: '' };
  }
  return { email: '', password: '' };
}

export function appHostname(): string {
  const base =
    process.env.PLAYWRIGHT_BASE_URL?.trim() ||
    (() => {
      const path = join(process.cwd(), 'test_assets', 'test_users.json');
      if (!existsSync(path)) return '';
      try {
        const data = JSON.parse(readFileSync(path, 'utf8')) as { baseUrl?: string };
        return data.baseUrl?.trim() ?? '';
      } catch {
        return '';
      }
    })() ||
    'https://efestos.international';
  return new URL(base).hostname;
}

/** App Runner often aborts `load`; prefer DOM ready + element waits. */
export async function gotoApp(page: Page, path: string) {
  const navTimeoutMs = 180_000;
  await page.goto(path, { waitUntil: 'commit', timeout: navTimeoutMs });
  await page.waitForLoadState('domcontentloaded', { timeout: navTimeoutMs }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
}

async function previewLogin(page: Page, email: string, password: string) {
  const res = await page.request.post('/api/auth/preview-login', {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`preview-login HTTP ${res.status()} for ${email}`);
  }
  const body = (await res.json()) as { ok?: boolean; hrBinaryRole?: boolean; error?: string };
  if (!body.ok) {
    throw new Error(`preview-login failed for ${email}: ${body.error ?? 'ok=false'}`);
  }
  return body;
}

export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
  landOn: RegExp = /\/me/,
) {
  await page.context().clearCookies();
  await previewLogin(page, email, password);
  const targetPath = landOn.test('https://example.com/me/hr') ? '/me/hr' : '/me/application';
  await gotoApp(page, targetPath);

  const authTimeoutMs = 120_000;
  try {
    await page.waitForURL(landOn, { timeout: authTimeoutMs });
  } catch {
    if (landOn.test(page.url())) return;
    throw new Error(`Login did not reach ${landOn} for ${email}. At: ${page.url()}`);
  }
}

export async function loginAsHr(page: Page) {
  const { email, password } = getCredentials('Human Resources');
  await loginWithCredentials(page, email, password, /\/me\/hr/);
  await page.locator('select[name="status"]').waitFor({ state: 'visible', timeout: 120_000 });
}

export async function loginAsMember(page: Page) {
  const { email, password, userId } = getCredentials('member');
  if (userId) {
    await page.context().clearCookies();
    await page.context().addCookies([
      {
        name: 'fl_preview_session',
        value: userId,
        domain: appHostname(),
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    return;
  }
  await loginWithCredentials(page, email, password, /\/me/);
}
