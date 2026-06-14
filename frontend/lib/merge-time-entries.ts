import type postgres from 'postgres';

/**
 * Time entry reattribution when HR merges duplicate flolabs_users profiles.
 * Chronos reads entries via user_id and flolabs_id (see FloLabs_Chronos time-entry-applicant.ts).
 */

export const MERGE_TIME_ENTRY_SOURCE_STATUSES = [
  'joined',
  'approved',
  'graduated',
  'terminated',
] as const;

export type MergeTimeEntrySourceStatus = (typeof MERGE_TIME_ENTRY_SOURCE_STATUSES)[number];

export type MergeLeadForTimeEntries = {
  id: string;
  status?: string | null;
};

export function isMergeTimeEntrySourceStatus(status: string | null | undefined): boolean {
  const normalized = String(status ?? '').trim().toLowerCase();
  return (MERGE_TIME_ENTRY_SOURCE_STATUSES as readonly string[]).includes(normalized);
}

/** Merged-away leads at/after joined that may own historical Chronos time entries. */
export function collectMergeTimeEntrySourceIds(
  leads: MergeLeadForTimeEntries[],
  canonicalLeadId: string,
): string[] {
  const ids = new Set<string>();
  for (const lead of leads) {
    const id = String(lead.id ?? '').trim();
    if (!id || id === canonicalLeadId) continue;
    if (!isMergeTimeEntrySourceStatus(lead.status)) continue;
    ids.add(id);
  }
  return [...ids];
}

/** Source owner ids for UPDATE … WHERE, excluding the canonical profile. */
export function expandTimeEntryOwnerIds(
  sourceLeadIds: string[],
  canonicalUserId: string,
  legacyEntryUserIds: string[] = [],
): string[] {
  const canonical = String(canonicalUserId ?? '').trim();
  return [...new Set([
    ...sourceLeadIds.map((id) => String(id ?? '').trim()).filter(Boolean),
    ...legacyEntryUserIds.map((id) => String(id ?? '').trim()).filter(Boolean),
  ])].filter((id) => id !== canonical);
}

export type MergeTimeEntryReattributePlan = {
  canonicalUserId: string;
  sourceOwnerIds: string[];
  shouldRun: boolean;
};

export function buildMergeTimeEntryReattributePlan(input: {
  leads: MergeLeadForTimeEntries[];
  canonicalLeadId: string;
  legacyEntryUserIds?: string[];
}): MergeTimeEntryReattributePlan {
  const canonicalUserId = String(input.canonicalLeadId ?? '').trim();
  const sourceLeadIds = collectMergeTimeEntrySourceIds(input.leads, canonicalUserId);
  const sourceOwnerIds = expandTimeEntryOwnerIds(
    sourceLeadIds,
    canonicalUserId,
    input.legacyEntryUserIds ?? [],
  );
  return {
    canonicalUserId,
    sourceOwnerIds,
    shouldRun: Boolean(canonicalUserId && sourceOwnerIds.length > 0),
  };
}

/**
 * Re-point time_entries from merged-away joined+ profiles to the canonical profile.
 * Sets user_id, flolabs_id, and applicant_id together so Chronos "Last 7 Days" queries match.
 */
export async function reattributeMergedTimeEntries(
  sql: postgres.Sql,
  canonicalUserId: string,
  sourceLeadIds: string[],
): Promise<{ entriesUpdated: number }> {
  const canonical = String(canonicalUserId ?? '').trim();
  const initialSources = [...new Set(
    sourceLeadIds.map((id) => String(id ?? '').trim()).filter(Boolean),
  )].filter((id) => id !== canonical);

  if (!canonical || initialSources.length === 0) {
    return { entriesUpdated: 0 };
  }

  // Entries imported before flolabs_users unification may use a legacy users.id in user_id
  // while flolabs_id / applicant_id still reference the merged-away flolabs_users row.
  const legacyRows = await sql`
    select distinct user_id::text as id
    from time_entries
    where (
      flolabs_id = any(${initialSources}::uuid[])
      or applicant_id = any(${initialSources}::uuid[])
    )
      and user_id is not null
      and user_id <> ${canonical}::uuid
  `;

  const sourceOwnerIds = expandTimeEntryOwnerIds(
    initialSources,
    canonical,
    legacyRows.map((row) => String(row['id'] ?? '')),
  );

  if (sourceOwnerIds.length === 0) {
    return { entriesUpdated: 0 };
  }

  const updated = await sql`
    update time_entries
    set
      user_id = ${canonical}::uuid,
      flolabs_id = ${canonical}::uuid,
      applicant_id = ${canonical}::uuid,
      updated_at = now()
    where user_id = any(${sourceOwnerIds}::uuid[])
       or flolabs_id = any(${sourceOwnerIds}::uuid[])
       or applicant_id = any(${sourceOwnerIds}::uuid[])
    returning id
  `;

  return { entriesUpdated: updated.length };
}
