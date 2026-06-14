import type { ApplicantProfile } from '@/app/application-data';
import { sql } from '@/lib/db';
import {
  buildDuplicateCandidatesFromReviewsOnly,
  getDuplicateReviewRows,
  listFloLabsUsers,
  rowToApplicant,
  schemaReady,
} from '@/lib/application-db';

const FLOLABS_USER_LIST_COLUMNS = [
  'id', 'email', 'password', 'name', 'role', 'hr_binary_role', 'first_name', 'last_name', 'phone_number',
  'country', 'state_region', 'city', 'latitude', 'longitude', 'linkedin_url', 'education', 'source',
  'referral_name', 'cv_file_name', 'cv_url', 'profile_picture_url', 'role_applied_for', 'stage', 'status',
  'joined_at', 'last_visited_at', 'notes', 'safe_senders_confirmed', 'communication_consent',
  'low_effort_rollback_after', 'low_effort_return_stage', 'notion_team_member_page_url',
  'last_login_at', 'created_at', 'updated_at',
].join(', ');

export type HrApplicantFilters = {
  q?: string;
  stage?: string;
  status?: string;
  source?: string;
  country?: string;
  city?: string;
  sort?: string;
  joinedFrom?: string;
  joinedTo?: string;
  visitedFrom?: string;
  visitedTo?: string;
  duplicateReview?: string;
  hasNotion?: string;
};

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)));
}

function hrOrderBy(sort: string | undefined) {
  const tieBreaker = 'u.id asc';
  switch (sort) {
    case 'name_asc':
      return `lower(coalesce(nullif(trim(first_name), ''), name)) asc, lower(coalesce(nullif(trim(last_name), ''), '')) asc, ${tieBreaker}`;
    case 'name_desc':
      return `lower(coalesce(nullif(trim(first_name), ''), name)) desc, lower(coalesce(nullif(trim(last_name), ''), '')) desc, ${tieBreaker}`;
    case 'visited_asc':
      return `coalesce(last_visited_at, updated_at, created_at) asc, ${tieBreaker}`;
    case 'visited_desc':
      return `coalesce(last_visited_at, updated_at, created_at) desc, ${tieBreaker}`;
    case 'joined_asc':
      return `coalesce(joined_at, created_at) asc, ${tieBreaker}`;
    case 'joined_desc':
    default:
      return `coalesce(joined_at, created_at) desc, ${tieBreaker}`;
  }
}

function buildHrWhere(filters: HrApplicantFilters) {
  const clauses: string[] = [
    `u.id not in (
      select duplicate_applicant_id from applicant_duplicate_reviews where status = 'merged'
    )`,
    `coalesce(u.status, '') <> 'closed'`,
    `lower(trim(u.email)) not like '%@imported.local%'`,
    `lower(trim(u.email)) not like '%@flolabs.invalid%'`,
  ];

  const q = (filters.q ?? '').trim().toLowerCase();
  if (q) {
    const escaped = q.replace(/'/g, "''");
    clauses.push(`(
      lower(concat_ws(' ',
        coalesce(first_name, ''), coalesce(last_name, ''), coalesce(name, ''), coalesce(email, ''),
        coalesce(role_applied_for, ''), coalesce(source, ''), coalesce(city, ''), coalesce(country, ''),
        coalesce(education, ''), coalesce(linkedin_url, ''), coalesce(notes, '')
      )) like '%${escaped}%'
    )`);
  }

  if (filters.stage) clauses.push(`stage = '${filters.stage.replace(/'/g, "''")}'`);
  if (filters.status) clauses.push(`status = '${filters.status.replace(/'/g, "''")}'`);
  if (filters.source) clauses.push(`source = '${filters.source.replace(/'/g, "''")}'`);
  if (filters.country) clauses.push(`country = '${filters.country.replace(/'/g, "''")}'`);
  if (filters.city) clauses.push(`city = '${filters.city.replace(/'/g, "''")}'`);

  if (filters.joinedFrom) {
    clauses.push(`date_trunc('day', coalesce(joined_at, created_at)) >= '${filters.joinedFrom.replace(/'/g, "''")}'::date`);
  }
  if (filters.joinedTo) {
    clauses.push(`date_trunc('day', coalesce(joined_at, created_at)) <= '${filters.joinedTo.replace(/'/g, "''")}'::date`);
  }
  if (filters.visitedFrom) {
    clauses.push(`date_trunc('day', coalesce(last_visited_at, updated_at, created_at)) >= '${filters.visitedFrom.replace(/'/g, "''")}'::date`);
  }
  if (filters.visitedTo) {
    clauses.push(`date_trunc('day', coalesce(last_visited_at, updated_at, created_at)) <= '${filters.visitedTo.replace(/'/g, "''")}'::date`);
  }

  if (filters.hasNotion === 'yes') {
    clauses.push(`coalesce(nullif(trim(notion_team_member_page_url), ''), '') <> ''`);
  } else if (filters.hasNotion === 'no') {
    clauses.push(`coalesce(nullif(trim(notion_team_member_page_url), ''), '') = ''`);
  }

  const duplicateReview = filters.duplicateReview ?? '';
  if (duplicateReview === 'has_pending') {
    clauses.push(`exists (
      select 1 from applicant_duplicate_reviews r
      where (r.primary_applicant_id = u.id or r.duplicate_applicant_id = u.id)
        and r.status = 'pending'
    )`);
  } else if (duplicateReview === 'none') {
    clauses.push(`not exists (
      select 1 from applicant_duplicate_reviews r
      where r.primary_applicant_id = u.id or r.duplicate_applicant_id = u.id
    )`);
  } else if (duplicateReview) {
    const status = duplicateReview.replace(/'/g, "''");
    clauses.push(`exists (
      select 1 from applicant_duplicate_reviews r
      where (r.primary_applicant_id = u.id or r.duplicate_applicant_id = u.id)
        and r.status = '${status}'
    )`);
  }

  return clauses.join(' and ');
}

async function enrichApplicantBatch(applicants: ApplicantProfile[]) {
  if (applicants.length === 0) return applicants;

  const duplicateReviewRows = await getDuplicateReviewRows();
  const duplicateCandidates = buildDuplicateCandidatesFromReviewsOnly(applicants, duplicateReviewRows);

  const ids = applicants.map((a) => a.id);
  const aliasRows = sql
    ? await sql`select user_id, email from user_email_aliases where user_id = any(${ids}::uuid[])`
    : [];
  const aliasMap = new Map<string, string[]>();
  for (const row of aliasRows as Array<{ user_id: string; email: string }>) {
    const list = aliasMap.get(row.user_id) ?? [];
    list.push(row.email);
    aliasMap.set(row.user_id, list);
  }

  const applicantById = new Map(applicants.map((applicant) => [applicant.id, applicant]));

  return applicants.map((applicant) => {
    const candidates = duplicateCandidates.get(applicant.id) ?? [];
    const pendingCandidates = candidates.filter((candidate) => !candidate.reviewStatus || candidate.reviewStatus === 'pending');
    const related = pendingCandidates
      .map((candidate) => applicantById.get(candidate.id))
      .filter((value): value is ApplicantProfile => Boolean(value));

    return {
      ...applicant,
      alternateEmails: uniqueNonEmpty([...(aliasMap.get(applicant.id) ?? []), ...(applicant.alternateEmails ?? []), ...related.map((item) => item.email)]),
      mergedPhoneNumbers: uniqueNonEmpty([applicant.phoneNumber, ...related.map((item) => item.phoneNumber)]),
      mergedLinkedinUrls: uniqueNonEmpty([applicant.linkedinUrl, ...related.map((item) => item.linkedinUrl)]),
      mergedCountries: uniqueNonEmpty([applicant.country, ...related.map((item) => item.country)]),
      mergedCities: uniqueNonEmpty([applicant.city, ...related.map((item) => item.city)]),
      duplicateCandidates: candidates,
      duplicateNeedsReview: pendingCandidates.some((candidate) => candidate.score < 7 || candidate.reasons.length < 2),
      chronosLastActiveAt: applicant.chronosLastActiveAt ?? null,
    };
  });
}

async function ensureHrQueryReady() {
  if (!sql) return;
  await schemaReady();
  await getDuplicateReviewRows();
}

export async function countHrApplicants(filters: HrApplicantFilters) {
  if (!sql) return 0;
  await ensureHrQueryReady();
  const where = buildHrWhere(filters);
  const rows = await sql.unsafe(`select count(*)::int as count from flolabs_users u where ${where}`);
  return Number(rows[0]?.count ?? 0);
}

export async function searchHrApplicants(
  filters: HrApplicantFilters,
  { offset, limit }: { offset: number; limit: number },
) {
  if (!sql) {
    return enrichApplicantBatch(await listFloLabsUsers('desc'));
  }

  await ensureHrQueryReady();
  const where = buildHrWhere(filters);
  const orderBy = hrOrderBy(filters.sort);
  const rows = await sql.unsafe(
    `select ${FLOLABS_USER_LIST_COLUMNS}
     from flolabs_users u
     where ${where}
     order by ${orderBy}
     offset ${Math.max(0, offset)}
     limit ${Math.max(1, limit)}`,
  );
  return enrichApplicantBatch(rows.map(rowToApplicant));
}

export async function getHrFilterOptionsFromDb() {
  if (!sql) {
    return { sources: [] as string[], countries: [] as string[], cities: [] as string[], stages: [] as string[] };
  }

  await schemaReady();
  const [sources, countries, cities, stages] = await Promise.all([
    sql`select distinct source as value from flolabs_users where coalesce(nullif(trim(source), ''), '') <> '' order by 1`,
    sql`select distinct country as value from flolabs_users where coalesce(nullif(trim(country), ''), '') <> '' order by 1`,
    sql`select distinct city as value from flolabs_users where coalesce(nullif(trim(city), ''), '') <> '' order by 1`,
    sql`select distinct stage as value from flolabs_users where coalesce(nullif(trim(stage), ''), '') <> '' order by 1`,
  ]);

  return {
    sources: sources.map((r) => String(r.value)),
    countries: countries.map((r) => String(r.value)),
    cities: cities.map((r) => String(r.value)),
    stages: stages.map((r) => String(r.value)),
  };
}
