import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  if (body.secret !== secret) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const email = String(body.email ?? '').toLowerCase().trim();
  const password = String(body.password ?? 'bootstrap-hr-2026').trim();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  if (!sql) return NextResponse.json({ error: 'No DB' }, { status: 503 });

  // Try to update existing flolabs_users row first
  const existing = await sql`
    update flolabs_users
    set hr_binary_role = true, updated_at = now()
    where lower(email) = ${email}
    returning id, email, hr_binary_role
  `;
  if (existing.length > 0) return NextResponse.json({ ok: true, action: 'updated', user: existing[0] });

  // No flolabs_users row — look up or create one
  const chronosUser = await sql`
    select id, email, name, password from flolabs_users where lower(email) = ${email} limit 1
  `.catch(() => []);

  const hashed = await hash(password, 10);
  const [firstName, ...rest] = ((chronosUser[0]?.name as string) ?? email.split('@')[0]).split(/\s+/);
  const lastName = rest.join(' ') || '';

  const inserted = await sql`
    insert into flolabs_users (
      email, password, name, role, hr_binary_role, first_name, last_name,
      phone_number, country, city, latitude, longitude,
      linkedin_url, education, source, role_applied_for, stage, status
    ) values (
      ${email}, ${hashed}, ${((chronosUser[0]?.name as string) ?? email.split('@')[0]).trim() || email}, 'hr', true, ${firstName}, ${lastName},
      '', '', '', 0, 0,
      '', '', 'bootstrap', 'HR', 'joined', 'joined'
    )
    on conflict (email) do update set hr_binary_role = true, updated_at = now()
    returning id, email, hr_binary_role
  `;
  return NextResponse.json({ ok: true, action: 'inserted', user: inserted[0] });
}
