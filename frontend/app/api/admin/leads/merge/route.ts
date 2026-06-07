import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/application-store';
import { sql } from '@/lib/db';
import {
  collectMergeTimeEntrySourceIds,
  isMergeTimeEntrySourceStatus,
  reattributeMergedTimeEntries,
} from '@/lib/merge-time-entries';

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)));
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = String(value ?? '').trim();
    if (trimmed) return trimmed;
  }
  return null;
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

  const hydratedLeads = await sql`
    select
      id,
      email,
      first_name,
      last_name,
      phone_number,
      linkedin_url,
      city,
      country,
      role_applied_for,
      education,
      source,
      notes,
      notion_team_member_id,
      notion_team_member_page_url,
      status,
      is_active
    from flolabs_users
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
  const mergedName = [
    selectedFirstNames.join(' / ') || String(canonical.first_name ?? ''),
    selectedLastNames.join(' / ') || String(canonical.last_name ?? ''),
  ].filter(Boolean).join(' ').trim() || primaryEmail;
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

  const mergedNotionTeamMemberId = firstNonEmpty(
    String(canonical.notion_team_member_id ?? ''),
    ...hydratedLeads.map((lead) => String(lead.notion_team_member_id ?? '')),
  );
  const mergedNotionTeamMemberPageUrl = firstNonEmpty(
    String(canonical.notion_team_member_page_url ?? ''),
    ...hydratedLeads.map((lead) => String(lead.notion_team_member_page_url ?? '')),
  );

  // If any merged lead (including canonical) was at/after joined, promote canonical too.
  const anyJoined = hydratedLeads.some(
    (lead) => isMergeTimeEntrySourceStatus(String(lead.status ?? '')) && lead.is_active !== false,
  );
  const canonicalIsJoined = isMergeTimeEntrySourceStatus(String(canonical.status ?? ''));

  await sql`
    update flolabs_users
    set
      email = ${primaryEmail},
      name = ${mergedName},
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
      notion_team_member_id = coalesce(${mergedNotionTeamMemberId}, notion_team_member_id),
      notion_team_member_page_url = coalesce(${mergedNotionTeamMemberPageUrl}, notion_team_member_page_url),
      updated_at = now()
    where id = ${canonicalLeadId}
  `;

  // Promote canonical to "joined" / active if a joined lead was merged into them.
  if (anyJoined && !canonicalIsJoined) {
    await sql`
      update flolabs_users
      set status = 'joined', is_active = true, updated_at = now()
      where id = ${canonicalLeadId}
        and lower(role) not in ('admin', 'hr')
    `;
  } else if (anyJoined) {
    await sql`
      update flolabs_users
      set is_active = true, updated_at = now()
      where id = ${canonicalLeadId}
        and is_active = false
        and lower(role) not in ('admin', 'hr')
    `;
  }

  const secondaryLeadIds = leadIds.filter((id) => id !== canonicalLeadId);

  // Mark merged-away profiles inactive / closed (skip elevated roles).
  if (secondaryLeadIds.length > 0) {
    const secondaryEmails = hydratedLeads
      .filter((lead) => secondaryLeadIds.includes(String(lead.id)))
      .map((lead) => String(lead.email ?? '').toLowerCase())
      .filter(Boolean);
    await sql`
      update flolabs_users
      set status = 'closed', is_active = false, updated_at = now()
      where (id = any(${secondaryLeadIds}::uuid[]) or lower(email) = any(${secondaryEmails}::text[]))
        and lower(role) not in ('admin', 'hr')
    `.catch(() => null);
  }

  const chronosCanonicalUserId = canonicalLeadId;

  const secondaryEmailsLower = hydratedLeads
    .filter((l) => secondaryLeadIds.includes(String(l.id)))
    .map((l) => String(l.email ?? '').toLowerCase())
    .filter(Boolean);
  const secondaryUserRows = secondaryEmailsLower.length > 0
    ? await sql`
        select id from flolabs_users
        where id = any(${secondaryLeadIds}::uuid[])
           or lower(email) = any(${secondaryEmailsLower}::text[])
      `.catch(() => [])
    : [];
  const secondaryUserIds = [...new Set([
    ...secondaryLeadIds,
    ...secondaryUserRows.map((r: Record<string, unknown>) => String(r['id'])),
  ])].filter((id) => id !== chronosCanonicalUserId);

  const timeEntrySourceLeadIds = collectMergeTimeEntrySourceIds(
    hydratedLeads.map((lead) => ({ id: String(lead.id), status: String(lead.status ?? '') })),
    canonicalLeadId,
  );

  if (chronosCanonicalUserId && timeEntrySourceLeadIds.length > 0) {
    await reattributeMergedTimeEntries(sql, chronosCanonicalUserId, timeEntrySourceLeadIds);
  }

  if (chronosCanonicalUserId && secondaryUserIds.length > 0) {
    // Move tags owned by secondary users to the canonical (skip names that would conflict).
    await sql`
      update tags set user_id = ${chronosCanonicalUserId}::uuid
      where user_id = any(${secondaryUserIds}::uuid[])
        and lower(name) not in (
          select lower(name) from tags where user_id = ${chronosCanonicalUserId}::uuid
        )
    `.catch(() => null);
    // Delete remaining secondary tags (the ones that are duplicates already on canonical).
    await sql`
      delete from tags
      where user_id = any(${secondaryUserIds}::uuid[])
    `.catch(() => null);
  }

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
    select id, email from flolabs_users where id = ${canonicalLeadId} or lower(email) = lower(${primaryEmail}) limit 1
  `;
  if (canonicalUser[0]?.id) {
    const canonicalUserId = String(canonicalUser[0].id);
    if (secondaryUserIds.length > 0) {
      await sql`
        update user_email_aliases
        set user_id = ${canonicalUserId}::uuid, updated_at = now()
        where user_id = any(${secondaryUserIds}::uuid[])
      `.catch(() => null);
    }
    for (const email of selectedEmails) {
      await sql`
        insert into user_email_aliases (user_id, email, is_primary)
        values (${canonicalUserId}, ${email.toLowerCase()}, ${email.toLowerCase() === primaryEmail.toLowerCase()})
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
