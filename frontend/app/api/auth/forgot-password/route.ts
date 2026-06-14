import { NextResponse } from 'next/server';
import { createPasswordResetTokenForUser, findUserByEmail, getActivePasswordResetTokenForUser } from '@/lib/application-db';
import { buildResetUrl, createPasswordResetToken, normalizeEmail } from '@/lib/auth-utils';
import { sendEmail } from '@/lib/mail';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ''));

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  try {
    const existing = await getActivePasswordResetTokenForUser(user.id);
    if (existing) {
      return NextResponse.json({ ok: true, cooldown: true, expiresAt: existing.expires_at ?? existing.expiresAt });
    }

    const token = createPasswordResetToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2);
    await createPasswordResetTokenForUser(user.id, token, expiresAt);

    const resetUrl = buildResetUrl(token, req.url);
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;

    await sendEmail({
      to: user.email,
      subject: 'Reset your FloLabs password',
      text: `Hi ${name},\n\nUse this link to reset your password: ${resetUrl}\n\nThis link expires in 2 hours.`,
      html: `<p>Hi ${name},</p><p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 2 hours.</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Forgot password failed', error);
    return NextResponse.json({ error: 'Unable to process password reset right now.' }, { status: 500 });
  }
}
