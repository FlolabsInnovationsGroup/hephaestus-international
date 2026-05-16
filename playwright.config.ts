import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

function baseUrlFromTestUsersJson(): string | undefined {
  const path = join(process.cwd(), 'test_assets', 'test_users.json');
  if (!existsSync(path)) return undefined;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as { baseUrl?: string };
    const u = data.baseUrl?.trim();
    return u?.startsWith('http') ? u.replace(/\/$/, '') : undefined;
  } catch {
    return undefined;
  }
}

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  baseUrlFromTestUsersJson() ||
  'https://fykgssqbvg.us-east-1.awsapprunner.com';

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  timeout: process.env.CI ? 180_000 : 120_000,
  reporter: 'list',
  use: {
    baseURL,
    navigationTimeout: 180_000,
    actionTimeout: 60_000,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
