import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/application-store';
import { sql } from '@/lib/db';

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)));
}

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const body = await request.json();
  const leadIds: string[] = Array.isArray(body.leadIds)
    ? body.leadIds.map((value: unknown) => String(value ?? '').trim()).filter(Boolean)
    : [];
  const canonicalLeadId = String(body.canonicalLeadId ?? '').trim();
  const keep = (body.keep ?? {}) as Record<string, unknown>;

  if (leadIds.length < 2 || !canonicalLeadId || !leadIds.includes(canonicalLeadId)) {
    return NextResponse.json({ error: 'Please select at least two leads and one canonical lead.' }, { status: 400 });
  }

  const leads = await sql`
    select id, email, first_name, last_name, phone_number, linkedin_url, city, country, role_applied_for, education, source, notes
    from website_applicants
    where id = any(${leadIds}::uuid[])
  `;
  if (leads.length !== leadIds.length) {
    const existingIds = new Set(leads.map((lead) => String(lead.id)));
    const missingIds = leadIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      await sql`
        insert into website_applicants (
          id, email, password, role, hr_binary_role, first_name, last_name, phone_number, country, state_region, city,
          latitude, longitude, linkedin_url, education, source, referral_name, cv_file_name, cv_url, profile_picture_url,
          role_applied_for, stage, status, joined_at, last_visited_at, notes, safe_senders_confirmed, communication_consent
        )
        select
          u.id,
          u.email,
          u.password,
          case when lower(u.role) = 'hr' then 'admin' else 'applicant' end,
          case when lower(u.role) = 'hr' then true else false end,
          split_part(coalesce(u.name, u.email), ' ', 1),
          coalesce(nullif(trim(replace(coalesce(u.name, ''), split_part(coalesce(u.name, ''), ' ', 1), '')), ''), ''),
          '',
          '',
          '',
          '',
          0,
          0,
          '',
          '',
          'Chronos users',
          '',
          '',
          '',
          '',
          case when lower(u.role) = 'hr' then 'FloLabs team member' else coalesce(u.role, 'Applicant') end,
          'joined',
          case when u.is_active then 'joined' else 'waiting' end,
          coalesce(u.created_at, now()),
          coalesce(u.updated_at, now()),
          'Hydrated from Chronos users for HR merge operation.',
          true,
          true
        from users u
        where u.id = any(${missingIds}::uuid[])
        on conflict (id) do nothing
      `;

      await sql`
        insert into website_applicants (
          id, email, password, role, hr_binary_role, first_name, last_name, phone_number, country, state_region, city,
          latitude, longitude, linkedin_url, education, source, referral_name, cv_file_name, cv_url, profile_picture_url,
          role_applied_for, stage, status, joined_at, last_visited_at, notes, safe_senders_confirmed, communication_consent
        )
        select
          a.id,
          a.email,
          '__external_account__',
          'applicant',
          false,
          split_part(coalesce(a.name, a.email), ' ', 1),
          coalesce(nullif(trim(replace(coalesce(a.name, ''), split_part(coalesce(a.name, ''), ' ', 1), '')), ''), ''),
          coalesce(a.phone, ''),
          coalesce(a.country, ''),
          coalesce(a.state_region, ''),
          coalesce(a.city, ''),
          0,
          0,
          coalesce(a.linkedin_url, ''),
          coalesce(a.education, ''),
          coalesce(a.source, 'Chronos applicants'),
          '',
          '',
          '',
          '',
          coalesce(a.role_applied_for, 'Imported applicant'),
          coalesce(a.stage, 'new'),
          case when a.status = 'joined' then 'joined' when a.status = 'closed' then 'rejected' else 'waiting' end,
          coalesce(a.joined_at, a.created_at, now()),
          coalesce(a.last_website_visit, a.updated_at, now()),
          coalesce(a.hubspot_status, 'Hydrated from Chronos applicants for HR merge operation.'),
          false,
          true
        from applicants a
        where a.id = any(${missingIds}::uuid[])
        on conflict (id) do nothing
      `;
    }
  }

  const hydratedLeads = await sql`
    select id, email, first_name, last_name, phone_number, linkedin_url, city, country, role_applied_for, education, source, notes
    from website_applicants
    where id = any(${leadIds}::uuid[])
  `;
  if (hydratedLeads.length !== leadIds.length) {
    return NextResponse.json({ error: 'Some selected leads no longer exist.' }, { status: 404 });
  }

  const canonical = hydratedLeads.find((lead) => lead.id === canonicalLeadId);
  if (!canonical) {
    return NextResponse.json({ error: 'Canonical lead not found.' }, { status: 404 });
  }

  const selectedEmails = unique(Array.isArray(keep.emails) ? keep.emails as string[] : hydratedLeads.map((lead) => String(lead.email ?? '')));
  const selectedPhoneNumbers = unique(Array.isArray(keep.phoneNumbers) ? keep.phoneNumbers as string[] : hydratedLeads.map((lead) => String(lead.phone_number ?? '')));
  const selectedLinkedinUrls = unique(Array.isArray(keep.linkedinUrls) ? keep.linkedinUrls as string[] : hydratedLeads.map((lead) => String(lead.linkedin_url ?? '')));
  const selectedCities = unique(Array.isArray(keep.cities) ? keep.cities as string[] : hydratedLeads.map((lead) => String(lead.city ?? '')));
  const selectedCountries = unique(Array.isArray(keep.countries) ? keep.countries as string[] : hydratedLeads.map((lead) => String(lead.country ?? '')));
  const selectedRoles = unique(Array.isArray(keep.rolesAppliedFor) ? keep.rolesAppliedFor as string[] : hydratedLeads.map((lead) => String(lead.role_applied_for ?? '')));
  const selectedEducation = unique(Array.isArray(keep.education) ? keep.education as string[] : hydratedLeads.map((lead) => String(lead.education ?? '')));
  const selectedSources = unique(Array.isArray(keep.sources) ? keep.sources as string[] : hydratedLeads.map((lead) => String(lead.source ?? '')));
  const selectedFirstNames = unique(Array.isArray(keep.firstNames) ? keep.firstNames as string[] : hydratedLeads.map((lead) => String(lead.first_name ?? '')));
  const selectedLastNames = unique(Array.isArray(keep.lastNames) ? keep.lastNames as string[] : hydratedLeads.map((lead) => String(lead.last_name ?? '')));

  const primaryEmail = selectedEmails.find((value) => value.toLowerCase() === String(canonical.email ?? '').toLowerCase()) ?? selectedEmails[0] ?? String(canonical.email ?? '');
  const mergedSummary = {
    mergedLeadIds: leadIds,
    kept: {
      emails: selectedEmails,
      phoneNumbers: selectedPhoneNumbers,
      linkedinUrls: selectedLinkedinUrls,
      cities: selectedCities,
      countries: selectedCountries,
      rolesAppliedFor: selectedRoles,
      education: selectedEducation,
      sources: selectedSources,
      firstNames: selectedFirstNames,
      lastNames: selectedLastNames,
    },
    mergedAt: new Date().toISOString(),
    mergedBy: viewer.email,
  };

  const mergedNotes = [String(canonical.notes ?? '').trim(), `MERGE_RECORD ${JSON.stringify(mergedSummary)}`].filter(Boolean).join('\n\n');

  await sql`
    update website_applicants
    set
      email = ${primaryEmail},
      first_name = ${selectedFirstNames.join(' / ') || String(canonical.first_name ?? '')},
      last_name = ${selectedLastNames.join(' / ') || String(canonical.last_name ?? '')},
      phone_number = ${selectedPhoneNumbers.join(', ') || String(canonical.phone_number ?? '')},
      linkedin_url = ${selectedLinkedinUrls.join(', ') || String(canonical.linkedin_url ?? '')},
      city = ${selectedCities.join(', ') || String(canonical.city ?? '')},
      country = ${selectedCountries.join(', ') || String(canonical.country ?? '')},
      role_applied_for = ${selectedRoles.join(' | ') || String(canonical.role_applied_for ?? '')},
      education = ${selectedEducation.join(' | ') || String(canonical.education ?? '')},
      source = ${selectedSources.join(' | ') || String(canonical.source ?? '')},
      notes = ${mergedNotes},
      updated_at = now()
    where id = ${canonicalLeadId}
  `;

  const secondaryLeadIds = leadIds.filter((id) => id !== canonicalLeadId);
  for (const secondaryId of secondaryLeadIds) {
    await sql`
      insert into applicant_duplicate_reviews (primary_applicant_id, duplicate_applicant_id, status, confidence_score, reasons, notes, reviewed_at, updated_at)
      values (${canonicalLeadId}, ${secondaryId}, 'merged', 999, '["manual merge"]'::jsonb, ${`Merged into ${canonicalLeadId} by HR multi-merge.`}, now(), now())
      on conflict (primary_applicant_id, duplicate_applicant_id)
      do update set status = 'merged', notes = excluded.notes, reviewed_at = now(), updated_at = now()
    `;
  }

  await sql`
    create table if not exists user_email_aliases (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      email text not null unique,
      is_primary boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;

  const canonicalUser = await sql`
    select id, email from users where id = ${canonicalLeadId} or lower(email) = lower(${primaryEmail}) limit 1
  `;
  if (canonicalUser[0]?.id) {
    for (const email of selectedEmails) {
      await sql`
        insert into user_email_aliases (user_id, email, is_primary)
        values (${canonicalUser[0].id}, ${email.toLowerCase()}, ${email.toLowerCase() === primaryEmail.toLowerCase()})
        on conflict (email) do update set user_id = excluded.user_id, is_primary = excluded.is_primary, updated_at = now()
      `;
    }
  }

  return NextResponse.json({
    ok: true,
    canonicalLeadId,
    mergedLeadIds: secondaryLeadIds,
    keptEmails: selectedEmails,
  });
}
