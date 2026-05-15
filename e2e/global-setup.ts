import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function getBaseUrl(): string {
  const path = join(process.cwd(), 'test_assets', 'test_users.json');
  if (existsSync(path)) {
    try {
      const data = JSON.parse(readFileSync(path, 'utf8')) as { baseUrl?: string };
      const u = data.baseUrl?.trim();
      if (u?.startsWith('http')) return u.replace(/\/$/, '');
    } catch { /* fall through */ }
  }
  return process.env.PLAYWRIGHT_BASE_URL?.trim() || 'https://fykgssqbvg.us-east-1.awsapprunner.com';
}

function getBootstrapEmail(): string {
  const path = join(process.cwd(), 'test_assets', 'test_users.json');
  if (existsSync(path)) {
    try {
      const data = JSON.parse(readFileSync(path, 'utf8')) as {
        users?: Array<{ emails?: string[]; role?: string }>;
      };
      const hr = data.users?.find((u) => u.role === 'Human Resources');
      if (hr) return (hr.emails?.[0] ?? '').split(',')[0].trim();
    } catch { /* fall through */ }
  }
  return 'zoom@flomadlabs.com';
}

export default async function globalSetup() {
  const baseUrl = getBaseUrl();
  const maxWaitMs = 5 * 60 * 1000;
  const pollMs = 12_000;
  const requestTimeoutMs = 35_000;
  const start = Date.now();

  console.log(`[globalSetup] Waiting for service at ${baseUrl} …`);

  // Poll /api/health until warm (handles App Runner cold starts > 120 s)
  while (true) {
    try {
      const res = await fetch(`${baseUrl}/api/health`, {
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      if (res.ok) {
        const body = (await res.json()) as { ok?: boolean; db?: string };
        if (body.ok && body.db === 'ok') {
          console.log(`[globalSetup] Service warm (${Math.round((Date.now() - start) / 1000)}s)`);
          break;
        }
      }
      console.log(`[globalSetup] Health check status ${res.status}, retrying…`);
    } catch (e) {
      console.log(`[globalSetup] Not ready: ${(e as Error).message}`);
    }

    if (Date.now() - start > maxWaitMs) {
      throw new Error('[globalSetup] Service did not warm up within 5 minutes');
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  // Ensure the HR test user has hr_binary_role set (required after every fresh deploy)
  const email = getBootstrapEmail();
  try {
    const res = await fetch(`${baseUrl}/api/admin/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: '6IXvIoMfk8MCMOvWzBPAWgnlwl0T6gAPaAxpYMtO8xkA', email }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await res.json()) as { ok?: boolean };
    console.log(`[globalSetup] Bootstrap ${email}: ok=${body.ok}`);
  } catch (e) {
    console.warn(`[globalSetup] Bootstrap failed (non-fatal): ${(e as Error).message}`);
  }
}
