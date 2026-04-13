import { NextResponse } from 'next/server';
import { getUserById, getValidPasswordResetToken, resetApplicantPassword } from '@/lib/application-db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  try {
    const reset = await getValidPasswordResetToken(token);
    if (!reset) {
      return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 404 });
    }

    const user = await getUserById(reset.user_id ?? reset.userId);
    return NextResponse.json({
      reset: {
        email: user?.email ?? '',
        name: [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim(),
      },
    });
  } catch (error) {
    console.error('Reset password lookup failed', error);
    return NextResponse.json({ error: 'Unable to validate reset link right now.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? '');
  const password = String(body.password ?? '');

  if (!token || password.length < 8) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const reset = await getValidPasswordResetToken(token);
    if (!reset) {
      return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 404 });
    }

    await resetApplicantPassword(reset.user_id ?? reset.userId, password, reset.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Reset password failed', error);
    return NextResponse.json({ error: 'Unable to reset password right now.' }, { status: 500 });
  }
}
