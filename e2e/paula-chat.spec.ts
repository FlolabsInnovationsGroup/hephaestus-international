import { test, expect, type Page } from '@playwright/test';
import { getCredentials, gotoApp, loginAsMember, loginWithCredentials } from './lib/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const { email: MEMBER_EMAIL, password: MEMBER_PASSWORD } = getCredentials('member');

const hasMemberCredentials = Boolean(MEMBER_EMAIL);

// ---------------------------------------------------------------------------
// 1. Chat UI is visible to applicants
// ---------------------------------------------------------------------------
test.describe('Paula Ferry — chat UI visibility', () => {
  test.setTimeout(180_000);

  test('applicant sees chat section on /me/application', async ({ page }) => {
    if (!hasMemberCredentials) {
      test.skip(true, 'No member credentials in test_users.json');
    }

    await loginAsMember(page);
    await gotoApp(page, '/me/application');
    await page.waitForTimeout(2_000);

    await page.screenshot({ path: 'test-results/paula-01-applicant-dashboard.png', fullPage: true });

    // Chat input placeholder or section heading should be visible
    const chatInput = page.locator('input[placeholder*="Ask Paula"]');
    const chatSection = page.getByText('Paula Ferry').first();

    const chatInputVisible = await chatInput.isVisible().catch(() => false);
    const chatSectionVisible = await chatSection.isVisible().catch(() => false);

    expect(chatInputVisible || chatSectionVisible, 'Expected chat section or Paula name to be visible').toBe(true);
  });

  test('initial messages are rendered in the chat area', async ({ page }) => {
    if (!hasMemberCredentials) {
      test.skip(true, 'No member credentials in test_users.json');
    }

    await loginAsMember(page);
    await gotoApp(page, '/me/application');
    await page.waitForTimeout(2_000);

    // Look for a message bubble (Paula messages are in the blue bg container)
    const messageBubbles = page.locator('.rounded-2xl');
    const count = await messageBubbles.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Paula responds to messages via API
// ---------------------------------------------------------------------------
test.describe('Paula Ferry — API responses', () => {
  test.setTimeout(180_000);

  test('POST /api/applications/message returns ok:true with non-empty reply', async ({ page }) => {
    if (!hasMemberCredentials) {
      test.skip(true, 'No member credentials in test_users.json');
    }

    await loginAsMember(page);

    const res = await page.request.post('/api/applications/message', {
      data: { text: 'Hello, I have a question about the process' },
    });

    expect(res.status()).toBe(200);

    const body = await res.json() as { ok: boolean; reply?: { text: string; author: string; id: string } };
    expect(body.ok).toBe(true);
    expect(body.reply).toBeDefined();
    expect(typeof body.reply!.text).toBe('string');
    expect(body.reply!.text.length).toBeGreaterThan(0);
  });

  test('Paula reply is concise (under 1200 characters)', async ({ page }) => {
    if (!hasMemberCredentials) {
      test.skip(true, 'No member credentials in test_users.json');
    }

    await loginAsMember(page);

    const res = await page.request.post('/api/applications/message', {
      data: { text: 'Hello, I have a question about the process' },
    });

    const body = await res.json() as { ok: boolean; reply?: { text: string } };
    expect(body.reply!.text.length).toBeLessThan(1200);
  });

  test('POST returns 401 without a session', async ({ page }) => {
    await page.context().clearCookies();

    const res = await page.request.post('/api/applications/message', {
      data: { text: 'Hello' },
    });

    expect(res.status()).toBe(401);
  });

  test('POST with empty text returns 400', async ({ page }) => {
    if (!hasMemberCredentials) {
      test.skip(true, 'No member credentials in test_users.json');
    }

    await loginAsMember(page);

    const res = await page.request.post('/api/applications/message', {
      data: { text: '' },
    });

    expect(res.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 3. Low-effort detection — short message gets guidance about materials
// ---------------------------------------------------------------------------
test.describe('Paula Ferry — low-effort detection', () => {
  test.setTimeout(180_000);

  test('very short message "ok" receives guidance about stage materials', async ({ page }) => {
    if (!hasMemberCredentials) {
      test.skip(true, 'No member credentials in test_users.json');
    }

    await loginAsMember(page);

    const res = await page.request.post('/api/applications/message', {
      data: { text: 'ok' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; reply?: { text: string } };
    expect(body.ok).toBe(true);

    const replyText = (body.reply?.text ?? '').toLowerCase();
    // Paula should guide towards reading materials / prompts or acknowledging effort
    const containsGuidance =
      replyText.includes('material') ||
      replyText.includes('prompt') ||
      replyText.includes('open') ||
      replyText.includes('resource') ||
      replyText.includes('effort') ||
      replyText.includes('read') ||
      replyText.includes('stage') ||
      replyText.includes('content');

    expect(containsGuidance, `Expected guidance keywords in reply: "${body.reply?.text}"`).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Greeting gets Paula intro
// ---------------------------------------------------------------------------
test.describe('Paula Ferry — greeting response', () => {
  test.setTimeout(180_000);

  test('greeting message gets a helpful, non-error reply', async ({ page }) => {
    if (!hasMemberCredentials) {
      test.skip(true, 'No member credentials in test_users.json');
    }

    await loginAsMember(page);

    const res = await page.request.post('/api/applications/message', {
      data: { text: 'Hello Paula, can you help me?' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; reply?: { text: string } };
    expect(body.ok).toBe(true);

    const replyText = (body.reply?.text ?? '').toLowerCase();

    // Should contain a helpful acknowledgement — not an error
    const isHelpful =
      replyText.includes('paula') ||
      replyText.includes('hr') ||
      replyText.includes('help') ||
      replyText.includes('hello') ||
      replyText.includes('hi') ||
      replyText.includes('sure') ||
      replyText.includes('happy') ||
      replyText.includes('glad') ||
      replyText.includes('question') ||
      replyText.includes('stage');

    expect(isHelpful, `Expected helpful reply, got: "${body.reply?.text}"`).toBe(true);

    // Should not start with an error pattern
    expect(replyText).not.toMatch(/^error|^sorry, (an error|something went wrong)/i);
  });

  test('reply author is "paula"', async ({ page }) => {
    if (!hasMemberCredentials) {
      test.skip(true, 'No member credentials in test_users.json');
    }

    await loginAsMember(page);

    const res = await page.request.post('/api/applications/message', {
      data: { text: 'Hello Paula, can you help me?' },
    });

    const body = await res.json() as { ok: boolean; reply?: { author: string; text: string } };
    expect(body.reply?.author).toBe('paula');
  });
});

// ---------------------------------------------------------------------------
// 5. Fallback: reply is always non-empty even with a minimal message
// ---------------------------------------------------------------------------
test.describe('Paula Ferry — fallback robustness', () => {
  test.setTimeout(180_000);

  test('reply text is always a non-empty string', async ({ page }) => {
    if (!hasMemberCredentials) {
      test.skip(true, 'No member credentials in test_users.json');
    }

    await loginAsMember(page);

    const messages = [
      'what do I need to do?',
      'I finished the stage',
      'hi',
    ];

    for (const text of messages) {
      const res = await page.request.post('/api/applications/message', { data: { text } });
      expect(res.status(), `Expected 200 for "${text}"`).toBe(200);

      const body = await res.json() as { ok: boolean; reply?: { text: string } };
      expect(body.ok, `Expected ok:true for "${text}"`).toBe(true);
      expect(body.reply?.text.length ?? 0, `Expected non-empty reply for "${text}"`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. UI-level: full round-trip via tesororeptilipotermius@gmail.com
//
// Paula always replies — to every applicant message, without exception.
// The reply path branches:
//   • OPENAI_API_KEY present  → GPT-4.1-nano with stage context + effort hint
//   • No API key (fallback)   → rule-based pattern matching:
//       < 14 chars / "ok" / "hi" / ≤2 words no "?" → guide to read materials
//       "paid"/"salary"/"compensation"              → defer to HR
//       "meeting"/"orientation"/"oliver"            → orientation timing
//       "what next"/"next step"/"timeline"          → points to right panel
//       "cv"/"resume"/"file"                        → CV update
//       "hello"/"hi"/"hey"                          → greeting intro
//       "thank"                                     → welcome response
//       anything else                               → generic process reply
// ---------------------------------------------------------------------------
const MEMBER_EMAIL_DIRECT = 'tesororeptilipotermius@gmail.com';
const { password: MEMBER_PASSWORD_DIRECT } = getCredentials('member');

async function loginAsMemberDirect(page: Page) {
  await loginWithCredentials(page, MEMBER_EMAIL_DIRECT, MEMBER_PASSWORD_DIRECT, /\/me/);
}

test.describe('Paula Ferry — UI round-trip (tesororeptilipotermius@gmail.com)', () => {
  test.setTimeout(180_000);

  // Helper: type a message in the chat input and wait for Paula's reply bubble
  async function sendAndWaitForReply(page: Page, messageText: string) {
    const chatInput = page.locator('input[placeholder*="Ask Paula"]');
    await expect(chatInput).toBeVisible({ timeout: 30_000 });

    const countBefore = await page.locator('[class*="max-w-"][class*="rounded-2xl"]').count();

    const replyPromise = page.waitForResponse(
      r => {
        try { return new URL(r.url()).pathname === '/api/applications/message' && r.request().method() === 'POST'; }
        catch { return false; }
      },
      { timeout: 60_000 }
    );

    await chatInput.fill(messageText);
    await page.getByRole('button', { name: /^Send$/i }).click();
    const res = await replyPromise;
    expect(res.status(), `/api/applications/message returned ${res.status()}`).toBe(200);

    const body = await res.json() as { ok: boolean; reply?: { text: string; author: string } };
    expect(body.ok).toBe(true);
    expect(body.reply?.text.length ?? 0).toBeGreaterThan(0);
    expect(body.reply?.author).toBe('paula');

    // Two new bubbles must appear: applicant's message + Paula's reply
    await page.waitForFunction(
      ({ sel, before }: { sel: string; before: number }) =>
        document.querySelectorAll(sel).length >= before + 2,
      { sel: '[class*="max-w-"][class*="rounded-2xl"]', before: countBefore },
      { timeout: 30_000 }
    );

    return body.reply!;
  }

  test('normal question — Paula replies with non-empty text as author "paula"', async ({ page }) => {
    await loginAsMemberDirect(page);
    await gotoApp(page, '/me/application');

    const reply = await sendAndWaitForReply(page, 'What should I focus on for the current stage?');
    expect(reply.text.length).toBeGreaterThan(0);
    expect(reply.author).toBe('paula');
  });

  test('low-effort message "ok" — Paula guides to open materials', async ({ page }) => {
    await loginAsMemberDirect(page);
    await gotoApp(page, '/me/application');

    const reply = await sendAndWaitForReply(page, 'ok');
    // Fallback: short message → materials / prompts guidance
    const lower = reply.text.toLowerCase();
    const hasMaterialsGuidance =
      lower.includes('material') || lower.includes('prompt') || lower.includes('open') ||
      lower.includes('read') || lower.includes('stage') || lower.includes('content') ||
      lower.includes('help') || lower.includes('sentences');
    expect(hasMaterialsGuidance, `Expected materials guidance, got: "${reply.text}"`).toBe(true);
  });

  test('greeting "Hello Paula" — Paula responds with a helpful greeting', async ({ page }) => {
    await loginAsMemberDirect(page);
    await gotoApp(page, '/me/application');

    const reply = await sendAndWaitForReply(page, 'Hello Paula');
    const lower = reply.text.toLowerCase();
    // Should be a helpful response, not an error
    const isHelpful =
      lower.includes('hello') || lower.includes('hi') || lower.includes('paula') ||
      lower.includes('help') || lower.includes('happy') || lower.includes('sure') ||
      lower.includes('welcome') || lower.includes('coordinator') || lower.includes('question');
    expect(isHelpful, `Expected helpful greeting reply, got: "${reply.text}"`).toBe(true);
    expect(lower).not.toMatch(/^error/);
  });

  test('next-step question — Paula points to the right panel', async ({ page }) => {
    await loginAsMemberDirect(page);
    await gotoApp(page, '/me/application');

    const reply = await sendAndWaitForReply(page, 'What is my next step?');
    const lower = reply.text.toLowerCase();
    const pointsToPanel =
      lower.includes('right') || lower.includes('panel') || lower.includes('stage') ||
      lower.includes('step') || lower.includes('current') || lower.includes('dashboard') ||
      lower.includes('prompts') || lower.includes('form');
    expect(pointsToPanel, `Expected next-step guidance, got: "${reply.text}"`).toBe(true);
  });

  test('both message bubbles appear — applicant first, then Paula', async ({ page }) => {
    await loginAsMemberDirect(page);
    await gotoApp(page, '/me/application');

    const userMsg = `E2E round-trip — ${Date.now()}`;
    const chatInput = page.locator('input[placeholder*="Ask Paula"]');
    await expect(chatInput).toBeVisible({ timeout: 30_000 });

    const countBefore = await page.locator('[class*="max-w-"][class*="rounded-2xl"]').count();

    const replyPromise = page.waitForResponse(
      r => {
        try { return new URL(r.url()).pathname === '/api/applications/message' && r.request().method() === 'POST'; }
        catch { return false; }
      },
      { timeout: 60_000 }
    );
    await chatInput.fill(userMsg);
    await page.getByRole('button', { name: /^Send$/i }).click();
    await replyPromise;

    await page.waitForFunction(
      ({ sel, before }: { sel: string; before: number }) =>
        document.querySelectorAll(sel).length >= before + 2,
      { sel: '[class*="max-w-"][class*="rounded-2xl"]', before: countBefore },
      { timeout: 30_000 }
    );

    // The user's message bubble must be visible in the chat
    const userBubble = page.locator('[class*="max-w-"][class*="rounded-2xl"]').filter({ hasText: userMsg });
    await expect(userBubble).toHaveCount(1, { timeout: 10_000 });

    // And the "You" author label must be inside it
    const authorLabel = userBubble.locator('p').first();
    await expect(authorLabel).toHaveText('You', { timeout: 5_000 });
  });
});
