import { execSync } from 'node:child_process';
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

function getLocalCommitSha(): string | null {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export default async function globalSetup() {
  const baseUrl = getBaseUrl();
  const maxWaitMs = 10 * 60 * 1000; // 10 minutes — covers cold starts + rolling deploys
  const pollMs = 15_000;
  const requestTimeoutMs = 90_000; // span most of a cold start in one attempt
  const start = Date.now();

  // Determine which commit we expect the service to be running.
  // If PLAYWRIGHT_BASE_URL is set (CI mode), the deploy job already confirmed
  // the correct commit — skip the commit check.
  const expectedSha = process.env.PLAYWRIGHT_BASE_URL ? null : getLocalCommitSha();

  console.log(
    `[globalSetup] Waiting for ${baseUrl}${expectedSha ? ` (commit ${expectedSha.slice(0, 8)})` : ''} …`,
  );

  // Poll /api/health until:
  //   1. The service is responsive (no 502 upstream-timeout)
  //   2. The commitSha in the response matches our local HEAD (if not in CI mode)
  //   3. db === 'ok'
  while (true) {
    try {
      const res = await fetch(`${baseUrl}/api/health`, {
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      if (res.ok) {
        const body = (await res.json()) as { ok?: boolean; db?: string; commitSha?: string };
        if (body.ok && body.db === 'ok') {
          if (expectedSha && body.commitSha !== expectedSha) {
            console.log(
              `[globalSetup] Service running ${body.commitSha?.slice(0, 8)}, want ${expectedSha.slice(0, 8)} — waiting for deploy…`,
            );
          } else {
            console.log(`[globalSetup] Service warm (${Math.round((Date.now() - start) / 1000)}s, sha=${body.commitSha?.slice(0, 8)})`);
            break;
          }
        } else {
          console.log(`[globalSetup] Health ok=${body.ok} db=${body.db}, retrying…`);
        }
      } else {
        console.log(`[globalSetup] Health status ${res.status}, retrying…`);
      }
    } catch (e) {
      console.log(`[globalSetup] Not ready: ${(e as Error).message}`);
    }

    if (Date.now() - start > maxWaitMs) {
      throw new Error('[globalSetup] Service did not become ready within 10 minutes');
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  // Warm the login page so the first test does not hit a cold Next.js init path.
  // /login is a server component but returns quickly for unauthenticated requests.
  try {
    await fetch(`${baseUrl}/login`, {
      headers: { Accept: 'text/html' },
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    });
  } catch { /* best-effort */ }

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
