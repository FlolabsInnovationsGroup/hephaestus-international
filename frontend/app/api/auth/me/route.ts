import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/application-store';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });
    return NextResponse.json({
      ok: true,
      hrBinaryRole: user.hrBinaryRole ?? false,
      role: user.role,
      email: user.email,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
