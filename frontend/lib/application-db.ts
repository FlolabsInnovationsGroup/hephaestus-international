import { randomUUID } from 'crypto';
import { hash } from 'bcryptjs';
import { promises as fs } from 'fs';
import path from 'path';
import {
  demoApplicants,
  demoConversations,
  type ApplicantProfile,
  type ApplicationStage,
  type ConversationMessage,
  type DuplicateCandidate,
  type StageStep,
} from '@/app/application-data';
import { sql } from '@/lib/db';
import { isApplicantReviewWaitStage } from '@/lib/stage-definitions';

interface DuplicateReviewRow {
  id: string;
  primary_applicant_id: string;
  duplicate_applicant_id: string;
  status: 'pending' | 'confirmed_duplicate' | 'different_people' | 'merged';
  confidence_score: number;
  reasons: string[] | string;
  notes?: string | null;
}

interface UserEmailAliasRow {
  user_id: string;
  email: string;
}

const DB_PATH = path.join(process.cwd(), 'data', 'applicants.json');
const USE_POSTGRES = process.env.APPLICANT_STORAGE_DRIVER === 'postgres' || process.env.NODE_ENV === 'production';
const AUTO_MERGE_SCORE_THRESHOLD = 9;

interface ApplicationDbShape {
  applicants: ApplicantProfile[];
  conversations: ConversationMessage[];
  stageTransitions?: StageTransitionRecord[];
  stageResources?: StageResourceRecord[];
  stageResponses?: StageResourceResponseRecord[];
  stageDefinitions?: StageDefinitionRecord[];
}

export interface StageTransitionRecord {
  id: string;
  applicantId: string;
  stage: string;
  reachedAt: string;
}

export interface StageResourceRecord {
  id: string;
  stage: string;
  title: string;
  url: string;
  applicantPrompt: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StageResourceResponseRecord {
  id: string;
  resourceId: string;
  applicantId: string;
  responseText: string;
  submittedAt: string;
}

export interface HrStageResponseRecord extends StageResourceResponseRecord {
  applicantEmail: string;
  applicantName: string;
  stage: string;
  resourceTitle: string;
}

export interface StageDefinitionRecord {
  stageId: string;
  shortLabel: string;
  title: string;
  description: string;
  applicantAction: string;
  adminAction: string;
  active: boolean;
  updatedAt: string;
}

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(
      DB_PATH,
      JSON.stringify({ applicants: demoApplicants, conversations: demoConversations, stageTransitions: [], stageResources: [], stageResponses: [], stageDefinitions: [] }, null, 2),
      'utf8',
    );
  }
}

async function ensureApplicantLowEffortHoldColumns() {
  if (!sql) return;
  try {
    await sql`alter table website_applicants add column if not exists low_effort_rollback_after timestamptz`;
    await sql`alter table website_applicants add column if not exists low_effort_return_stage text`;
    await sql`alter table website_applicants add column if not exists notion_team_member_page_url text`;
  } catch (e) {
    console.warn('[ensureApplicantLowEffortHoldColumns]', e);
  }
}

export async function setLowEffortPendingHold(
  applicantId: string,
  returnStage: ApplicationStage,
  rollbackAfter: Date,
) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    await sql`
      update website_applicants
      set low_effort_return_stage = ${returnStage},
          low_effort_rollback_after = ${rollbackAfter.toISOString()},
          updated_at = now()
      where id = ${applicantId}
    `;
    return;
  }
  const db = await readDb();
  const applicant = db.applicants.find((a) => a.id === applicantId);
  if (!applicant) return;
  applicant.lowEffortReturnStage = returnStage;
  applicant.lowEffortRollbackAfter = rollbackAfter.toISOString();
  await writeDb(db);
}

export async function clearLowEffortPendingHold(applicantId: string) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    await sql`
      update website_applicants
      set low_effort_return_stage = null,
          low_effort_rollback_after = null,
          updated_at = now()
      where id = ${applicantId}
    `;
    return;
  }
  const db = await readDb();
  const applicant = db.applicants.find((a) => a.id === applicantId);
  if (!applicant) return;
  delete applicant.lowEffortReturnStage;
  delete applicant.lowEffortRollbackAfter;
  await writeDb(db);
}

async function ensurePostgresSchema() {
  if (!sql) throw new Error('DATABASE_URL is required for postgres applicant storage');
  await sql`
    create table if not exists website_applicants (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      password text not null,
      role text not null default 'applicant',
      hr_binary_role boolean default false,
      first_name text not null,
      last_name text not null,
      phone_number text,
      country text,
      state_region text,
      city text,
      latitude double precision,
      longitude double precision,
      linkedin_url text,
      education text,
      source text,
      referral_name text,
      cv_file_name text,
      cv_url text,
      profile_picture_url text,
      role_applied_for text,
      stage text not null default 'application_submitted',
      status text not null default 'applying',
      joined_at timestamptz not null default now(),
      last_visited_at timestamptz not null default now(),
      notes text,
      safe_senders_confirmed boolean default false,
      communication_consent boolean default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;
  await ensureApplicantLowEffortHoldColumns();
  await sql`
    create table if not exists website_applicant_conversations (
      id uuid primary key default gen_random_uuid(),
      applicant_id uuid not null references website_applicants(id) on delete cascade,
      author text not null,
      text text not null,
      created_at timestamptz not null default now()
    );
  `;
  await sql`
    create table if not exists website_password_reset_tokens (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      token text not null unique,
      expires_at timestamptz not null,
      used_at timestamptz,
      created_at timestamptz not null default now()
    );
  `;
}

async function ensureStageFeatureSchema() {
  if (!sql) return false;
  try {
    await sql`
      create table if not exists website_applicant_stage_transitions (
        id uuid primary key default gen_random_uuid(),
        applicant_id uuid not null,
        stage text not null,
        reached_at timestamptz not null default now()
      );
    `;
    await sql`
      create table if not exists website_stage_resources (
        id uuid primary key default gen_random_uuid(),
        stage text not null,
        title text not null,
        url text not null,
        applicant_prompt text not null default '',
        sort_order integer not null default 0,
        active boolean not null default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `;
    await sql`
      create table if not exists website_stage_resource_responses (
        id uuid primary key default gen_random_uuid(),
        resource_id uuid not null references website_stage_resources(id) on delete cascade,
        applicant_id uuid not null,
        response_text text not null,
        submitted_at timestamptz not null default now()
      );
    `;
    await sql`
      create table if not exists website_stage_definitions (
        stage_id text primary key,
        short_label text not null,
        title text not null,
        description text not null,
        applicant_action text not null,
        admin_action text not null,
        active boolean not null default true,
        updated_at timestamptz not null default now()
      );
    `;
    return true;
  } catch (error) {
    console.error('Stage feature schema unavailable:', error);
    return false;
  }
}

function rowToApplicant(row: any): ApplicantProfile {
  return {
    id: row.id,
    email: row.email,
    alternateEmails: [],
    mergedPhoneNumbers: row.phone_number ? [row.phone_number] : [],
    mergedLinkedinUrls: row.linkedin_url ? [row.linkedin_url] : [],
    mergedCountries: row.country ? [row.country] : [],
    mergedCities: row.city ? [row.city] : [],
    password: row.password,
    role: row.role,
    hrBinaryRole: row.hr_binary_role ?? false,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number ?? '',
    country: row.country ?? '',
    stateRegion: row.state_region ?? '',
    city: row.city ?? '',
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    linkedinUrl: row.linkedin_url ?? '',
    education: row.education ?? '',
    source: row.source ?? '',
    referralName: row.referral_name ?? '',
    cvFileName: row.cv_file_name ?? '',
    cvUrl: row.cv_url ?? '',
    profilePictureUrl: row.profile_picture_url ?? '',
    roleAppliedFor: row.role_applied_for ?? '',
    stage: row.stage,
    status: row.status,
    joinedAt: new Date(row.joined_at).toISOString(),
    lastVisitedAt: new Date(row.last_visited_at).toISOString(),
    notes: row.notes ?? '',
    safeSendersConfirmed: Boolean(row.safe_senders_confirmed),
    communicationConsent: Boolean(row.communication_consent),
    lowEffortRollbackAfter: row.low_effort_rollback_after
      ? new Date(row.low_effort_rollback_after).toISOString()
      : null,
    lowEffortReturnStage: row.low_effort_return_stage
      ? (row.low_effort_return_stage as ApplicationStage)
      : null,
    notionTeamMemberPageUrl: row.notion_team_member_page_url ?? '',
    chronosLastActiveAt: null,
  };
}

function rowToConversation(row: any): ConversationMessage {
  return {
    id: row.id,
    applicantId: row.applicant_id,
    author: row.author,
    text: row.text,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function readDb(): Promise<ApplicationDbShape> {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const applicants = await sql`select * from website_applicants order by created_at asc`;
    const conversations = await sql`select * from website_applicant_conversations order by created_at asc`;
    return {
      applicants: applicants.map(rowToApplicant),
      conversations: conversations.map(rowToConversation),
    };
  }

  await ensureDb();
  const raw = await fs.readFile(DB_PATH, 'utf8');
  const parsed = JSON.parse(raw) as ApplicationDbShape;
  return {
    applicants: parsed.applicants ?? [],
    conversations: parsed.conversations ?? [],
    stageTransitions: parsed.stageTransitions ?? [],
    stageResources: parsed.stageResources ?? [],
    stageResponses: parsed.stageResponses ?? [],
    stageDefinitions: parsed.stageDefinitions ?? [],
  };
}

export async function writeDb(data: ApplicationDbShape) {
  if (USE_POSTGRES && sql) {
    throw new Error('writeDb is not supported for postgres mode, use specific helpers');
  }
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeValue(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase();
}

interface NormalizedApplicantSignals {
  email: string;
  phone: string;
  linkedin: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
  education: string;
  roleAppliedFor: string;
}

async function getUserEmailAliasRows() {
  if (!(USE_POSTGRES && sql)) return [] as UserEmailAliasRow[];

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

  const rows = await sql`select user_id, email from user_email_aliases`;
  return rows as unknown as UserEmailAliasRow[];
}

async function getDuplicateReviewRows() {
  if (!(USE_POSTGRES && sql)) return [] as DuplicateReviewRow[];

  await sql`
    create table if not exists applicant_duplicate_reviews (
      id uuid primary key default gen_random_uuid(),
      primary_applicant_id uuid not null,
      duplicate_applicant_id uuid not null,
      status text not null default 'pending',
      confidence_score bigint not null default 0,
      reasons jsonb not null default '[]'::jsonb,
      reviewed_by_id uuid,
      reviewed_at timestamptz,
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint applicant_duplicate_reviews_pair_unique unique (primary_applicant_id, duplicate_applicant_id)
    );
  `;
  // These FK constraints were originally added against the Chronos `applicants` table,
  // but website_applicants IDs can also come from the `users` table (different UUID space).
  // Drop them so merge operations aren't blocked by FK violations.
  await sql`
    alter table applicant_duplicate_reviews
      drop constraint if exists applicant_duplicate_reviews_primary_applicant_id_applicants_id_,
      drop constraint if exists applicant_duplicate_reviews_duplicate_applicant_id_applicants_i;
  `;

  const rows = await sql`select id, primary_applicant_id, duplicate_applicant_id, status, confidence_score, reasons, notes from applicant_duplicate_reviews`;
  return rows as unknown as DuplicateReviewRow[];
}

function buildDuplicateCandidates(applicants: ApplicantProfile[], reviews: DuplicateReviewRow[] = []) {
  const byId = new Map<string, DuplicateCandidate[]>();
  const normalizedById = new Map<string, NormalizedApplicantSignals>(
    applicants.map((applicant) => [applicant.id, {
      email: normalizeValue(applicant.email),
      phone: normalizeValue(applicant.phoneNumber),
      linkedin: normalizeValue(applicant.linkedinUrl),
      firstName: normalizeValue(applicant.firstName),
      lastName: normalizeValue(applicant.lastName),
      city: normalizeValue(applicant.city),
      country: normalizeValue(applicant.country),
      education: normalizeValue(applicant.education),
      roleAppliedFor: normalizeValue(applicant.roleAppliedFor),
    }]),
  );
  const reviewByPair = new Map<string, DuplicateReviewRow>();

  for (const review of reviews) {
    const key = [review.primary_applicant_id, review.duplicate_applicant_id].sort().join('::');
    reviewByPair.set(key, review);
  }

  for (const applicant of applicants) byId.set(applicant.id, []);

  for (let i = 0; i < applicants.length; i += 1) {
    for (let j = i + 1; j < applicants.length; j += 1) {
      const applicant = applicants[i];
      const other = applicants[j];
      const applicantSignals = normalizedById.get(applicant.id);
      const otherSignals = normalizedById.get(other.id);
      if (!applicantSignals || !otherSignals) continue;
      if (otherSignals.email === applicantSignals.email) continue;
      let score = 0;
      let strongSignals = 0;
      const reasons: string[] = [];

      if (applicantSignals.phone && applicantSignals.phone === otherSignals.phone) {
        score += 6;
        strongSignals += 1;
        reasons.push('same phone number');
      }
      if (applicantSignals.linkedin && applicantSignals.linkedin === otherSignals.linkedin) {
        score += 4;
        strongSignals += 1;
        reasons.push('same LinkedIn URL');
      }
      if (applicantSignals.firstName === otherSignals.firstName && applicantSignals.lastName === otherSignals.lastName) {
        score += 3;
        reasons.push('same full name');
      }
      if (applicantSignals.city && applicantSignals.city === otherSignals.city) {
        score += 1;
        reasons.push('same city');
      }
      if (applicantSignals.country && applicantSignals.country === otherSignals.country) {
        score += 1;
        reasons.push('same country');
      }
      if (applicantSignals.education && applicantSignals.education === otherSignals.education) {
        score += 1;
        reasons.push('same education');
      }
      if (applicantSignals.roleAppliedFor && applicantSignals.roleAppliedFor === otherSignals.roleAppliedFor) {
        score += 1;
        reasons.push('same role applied for');
      }

      if (score < 7 || strongSignals === 0 || (strongSignals === 1 && reasons.length < 3)) {
        continue;
      }
      const review = reviewByPair.get([applicant.id, other.id].sort().join('::'));
      const reviewStatus = review?.status;
      if (reviewStatus === 'different_people') continue;
      const scoreValue = review ? Number(review.confidence_score ?? score) : score;
      const reasonsValue = review ? (Array.isArray(review.reasons) ? review.reasons : JSON.parse(String(review.reasons || '[]'))) : reasons;
      const effectiveReviewStatus = (!reviewStatus || reviewStatus === 'pending') && scoreValue >= AUTO_MERGE_SCORE_THRESHOLD
        ? 'merged'
        : reviewStatus;

      const applicantCandidates = byId.get(applicant.id) ?? [];
      applicantCandidates.push({
        id: other.id,
        email: other.email,
        fullName: `${other.firstName} ${other.lastName}`.trim(),
        score: scoreValue,
        reasons: reasonsValue,
        reviewId: review?.id,
        reviewStatus: effectiveReviewStatus,
        reviewNotes: review?.notes ?? undefined,
      });
      byId.set(applicant.id, applicantCandidates);

      const otherCandidates = byId.get(other.id) ?? [];
      otherCandidates.push({
        id: applicant.id,
        email: applicant.email,
        fullName: `${applicant.firstName} ${applicant.lastName}`.trim(),
        score: scoreValue,
        reasons: reasonsValue,
        reviewId: review?.id,
        reviewStatus: effectiveReviewStatus,
        reviewNotes: review?.notes ?? undefined,
      });
      byId.set(other.id, otherCandidates);
    }
  }

  for (const applicant of applicants) {
    const candidates = byId.get(applicant.id) ?? [];
    candidates.sort((a, b) => b.score - a.score || a.fullName.localeCompare(b.fullName));
    byId.set(applicant.id, candidates.slice(0, 5));
  }

  return byId;
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)));
}

function chronosUserToApplicant(row: any): ApplicantProfile {
  const name = String(row.name ?? '').trim();
  const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
  const chronosRole = String(row.role ?? '').toLowerCase();
  const hasHrAccess = chronosRole === 'hr';

  return {
    id: row.id,
    email: row.email,
    alternateEmails: [],
    mergedPhoneNumbers: [],
    mergedLinkedinUrls: [],
    mergedCountries: [],
    mergedCities: [],
    password: row.password,
    role: hasHrAccess ? 'admin' : 'applicant',
    hrBinaryRole: hasHrAccess,
    firstName: firstName || row.email,
    lastName: rest.join(' '),
    phoneNumber: '',
    country: '',
    stateRegion: '',
    city: '',
    latitude: 0,
    longitude: 0,
    linkedinUrl: '',
    education: '',
    source: 'Chronos',
    referralName: '',
    cvFileName: '',
    cvUrl: '',
    profilePictureUrl: '',
    roleAppliedFor: hasHrAccess ? 'FloLabs team member' : row.role,
    stage: 'joined',
    status: row.is_active === false ? 'terminated' : 'joined',
    joinedAt: new Date(row.created_at ?? Date.now()).toISOString(),
    lastVisitedAt: new Date(row.updated_at ?? Date.now()).toISOString(),
    notes: 'Authenticated through shared Chronos users table.',
    safeSendersConfirmed: true,
    communicationConsent: true,
    chronosLastActiveAt: (row.last_login_at ?? row.updated_at) ? new Date(row.last_login_at ?? row.updated_at).toISOString() : null,
  };
}

export async function findUserByEmail(email: string) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const rows = await sql`select * from website_applicants where lower(email) = lower(${email}) limit 1`;
    if (rows[0]) return rowToApplicant(rows[0]);

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

    const aliasRows = await sql`
      select u.id, u.email, u.name, u.password, u.role, u.is_active, u.created_at, u.updated_at
      from user_email_aliases a
      inner join users u on u.id = a.user_id
      where lower(a.email) = lower(${email})
      limit 1
    `;
    if (aliasRows[0]) return chronosUserToApplicant(aliasRows[0]);

    const chronosRows = await sql`select id, email, name, password, role, is_active, created_at, updated_at, last_login_at from users where lower(email) = lower(${email}) limit 1`.catch(() => sql!`select id, email, name, password, role, is_active, created_at, updated_at from users where lower(email) = lower(${email}) limit 1`);
    return chronosRows[0] ? chronosUserToApplicant(chronosRows[0]) : null;
  }
  const db = await readDb();
  return db.applicants.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUserById(id: string) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const rows = await sql`select * from website_applicants where id = ${id} limit 1`;
    if (rows[0]) return rowToApplicant(rows[0]);

    const chronosRows = await sql`select id, email, name, password, role, is_active, created_at, updated_at, last_login_at from users where id = ${id} limit 1`.catch(() => sql!`select id, email, name, password, role, is_active, created_at, updated_at from users where id = ${id} limit 1`);
    return chronosRows[0] ? chronosUserToApplicant(chronosRows[0]) : null;
  }
  const db = await readDb();
  return db.applicants.find((user) => user.id === id) ?? null;
}

export async function createApplicant(input: Omit<ApplicantProfile, 'id' | 'joinedAt' | 'lastVisitedAt'>) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const rows = await sql`
      insert into website_applicants (
        email, password, role, hr_binary_role, first_name, last_name, phone_number, country, state_region, city,
        latitude, longitude, linkedin_url, education, source, referral_name, cv_file_name, cv_url, profile_picture_url,
        role_applied_for, stage, status, notes, safe_senders_confirmed, communication_consent
      ) values (
        ${input.email}, ${input.password}, ${input.role}, ${input.hrBinaryRole ?? false}, ${input.firstName}, ${input.lastName}, ${input.phoneNumber}, ${input.country}, ${input.stateRegion ?? ''}, ${input.city},
        ${input.latitude}, ${input.longitude}, ${input.linkedinUrl}, ${input.education}, ${input.source}, ${input.referralName ?? ''}, ${input.cvFileName ?? ''}, ${input.cvUrl ?? ''}, ${input.profilePictureUrl ?? ''},
        ${input.roleAppliedFor}, ${input.stage}, ${input.status}, ${input.notes ?? ''}, ${input.safeSendersConfirmed ?? false}, ${input.communicationConsent ?? false}
      ) returning *
    `;
    const applicant = rowToApplicant(rows[0]);
    await sql`
      insert into website_applicant_conversations (id, applicant_id, author, text)
      values (${randomUUID()}, ${applicant.id}, 'paula', ${`Hi ${applicant.firstName}, welcome to FloLabs. Your application has been created for ${applicant.roleAppliedFor}. I will answer based on your current stage and what comes next in the process.`})
    `;
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (stageSchemaReady) {
      await sql`
        insert into website_applicant_stage_transitions (id, applicant_id, stage, reached_at)
        values (${randomUUID()}, ${applicant.id}, ${applicant.stage}, now())
      `;
    }
    return applicant;
  }

  const db = await readDb();
  const applicant: ApplicantProfile = {
    ...input,
    id: `lead-${String(db.applicants.filter((u) => u.role === 'applicant').length + 1).padStart(3, '0')}`,
    joinedAt: new Date().toISOString(),
    lastVisitedAt: new Date().toISOString(),
  };
  db.applicants.push(applicant);
  db.conversations.push({
    id: `msg-${Date.now()}`,
    applicantId: applicant.id,
    author: 'paula',
    text: `Hi ${applicant.firstName}, welcome to FloLabs. Your application has been created for ${applicant.roleAppliedFor}. I will answer based on your current stage and what comes next in the process.`,
    createdAt: new Date().toISOString(),
  });
  db.stageTransitions = db.stageTransitions ?? [];
  db.stageTransitions.push({
    id: `transition-${Date.now()}`,
    applicantId: applicant.id,
    stage: applicant.stage,
    reachedAt: new Date().toISOString(),
  });
  await writeDb(db);
  return applicant;
}

export async function getApplicants() {
  const db = await readDb();
  const byEmail = new Map(db.applicants.map((applicant) => [applicant.email.toLowerCase(), applicant]));
  const chronosLastActiveByEmail = new Map<string, string>();

  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    let chronosRows: any[] = [];
    try {
      chronosRows = await sql`select id, email, name, password, role, is_active, created_at, updated_at, last_login_at from users order by created_at desc`;
    } catch {
      chronosRows = await sql`select id, email, name, password, role, is_active, created_at, updated_at from users order by created_at desc`;
    }

    for (const row of chronosRows) {
      const email = String(row.email ?? '').toLowerCase();
      const activeAt = row.last_login_at ?? row.updated_at;
      if (email && activeAt) {
        chronosLastActiveByEmail.set(email, new Date(activeAt).toISOString());
      }
    }

    for (const row of chronosRows) {
      const email = String(row.email ?? '').toLowerCase();
      if (!email || byEmail.has(email)) continue;
      byEmail.set(email, chronosUserToApplicant(row));
    }

    const chronosApplicants = await sql`
      select id, email, name, phone, country, state_region, city, linkedin_url, education, current_job_title,
             role_applied_for, stage, status, joined_at, last_website_visit, source, created_at, updated_at,
             hubspot_status, hubspot_owner
      from applicants
      order by joined_at desc nulls last, created_at desc nulls last
    `;

    for (const row of chronosApplicants) {
      const email = String(row.email ?? '').toLowerCase();
      if (!email || byEmail.has(email)) continue;
      const name = String(row.name ?? '').trim();
      const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
      byEmail.set(email, {
        id: row.id,
        email: row.email,
        password: '',
        role: 'applicant',
        hrBinaryRole: false,
        firstName: firstName || row.email,
        lastName: rest.join(' '),
        phoneNumber: row.phone ?? '',
        country: row.country ?? '',
        stateRegion: row.state_region ?? '',
        city: row.city ?? '',
        latitude: 0,
        longitude: 0,
        linkedinUrl: row.linkedin_url ?? '',
        education: row.education ?? row.current_job_title ?? '',
        source: row.source ?? row.hubspot_owner ?? 'Chronos HubSpot import',
        referralName: '',
        cvFileName: '',
        cvUrl: '',
        profilePictureUrl: '',
        roleAppliedFor: row.role_applied_for ?? row.current_job_title ?? 'Imported contact',
        stage: row.stage ?? 'new',
        status: row.status === 'closed' ? 'rejected' : 'joined',
        joinedAt: new Date(row.joined_at ?? row.created_at ?? Date.now()).toISOString(),
        lastVisitedAt: new Date(row.last_website_visit ?? row.updated_at ?? row.created_at ?? Date.now()).toISOString(),
        notes: row.hubspot_status ?? 'Imported from Chronos applicants.',
        safeSendersConfirmed: false,
        communicationConsent: true,
      });
    }
  }

  const duplicateReviewRows = await getDuplicateReviewRows();
  const allApplicants = Array.from(byEmail.values());
  const allApplicantIds = new Set(allApplicants.map((applicant) => applicant.id));
  const mergedSecondaryIds = new Set<string>();
  for (const review of duplicateReviewRows) {
    if (review.status !== 'merged') continue;
    const primaryId = String(review.primary_applicant_id ?? '').trim();
    const secondaryId = String(review.duplicate_applicant_id ?? '').trim();
    if (!primaryId || !secondaryId) continue;
    if (!allApplicantIds.has(primaryId) || !allApplicantIds.has(secondaryId)) continue;
    mergedSecondaryIds.add(secondaryId);
  }

  const applicants = allApplicants.filter((applicant) => !mergedSecondaryIds.has(applicant.id));
  const applicantById = new Map(applicants.map((applicant) => [applicant.id, applicant]));
  const duplicateCandidates = buildDuplicateCandidates(applicants, duplicateReviewRows);
  const aliasRows = await getUserEmailAliasRows();
  const aliasMap = new Map<string, string[]>();

  for (const row of aliasRows) {
    const list = aliasMap.get(row.user_id) ?? [];
    list.push(row.email);
    aliasMap.set(row.user_id, list);
  }

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
      chronosLastActiveAt: chronosLastActiveByEmail.get(applicant.email.toLowerCase()) ?? applicant.chronosLastActiveAt ?? null,
    };
  });
}

export async function getApplicantConversations(applicantId: string) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const rows = await sql`select * from website_applicant_conversations where applicant_id = ${applicantId} order by created_at asc`;
    return rows.map(rowToConversation);
  }
  const db = await readDb();
  return db.conversations.filter((message) => message.applicantId === applicantId);
}

export async function addApplicantMessage(applicantId: string, author: ConversationMessage['author'], text: string) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const rows = await sql`
      insert into website_applicant_conversations (id, applicant_id, author, text)
      values (${randomUUID()}, ${applicantId}, ${author}, ${text})
      returning *
    `;
    return rowToConversation(rows[0]);
  }
  const db = await readDb();
  const message: ConversationMessage = {
    id: `msg-${Date.now()}`,
    applicantId,
    author,
    text,
    createdAt: new Date().toISOString(),
  };
  db.conversations.push(message);
  await writeDb(db);
  return message;
}

export async function updateApplicantStage(applicantId: string, stage: ApplicantProfile['stage'], status?: ApplicantProfile['status']) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    const previousRows = await sql`select stage from website_applicants where id = ${applicantId} limit 1`;
    const previousWebsiteStage = String(previousRows[0]?.stage ?? '');
    const rows = status
      ? await sql`update website_applicants set stage = ${stage}, status = ${status}, last_visited_at = now(), updated_at = now() where id = ${applicantId} returning *`
      : await sql`update website_applicants set stage = ${stage}, last_visited_at = now(), updated_at = now() where id = ${applicantId} returning *`;
    if (rows[0]) {
      const updatedWebsite = rows[0];
      if (stageSchemaReady && previousWebsiteStage !== stage) {
        await sql`
          insert into website_applicant_stage_transitions (id, applicant_id, stage, reached_at)
          values (${randomUUID()}, ${applicantId}, ${stage}, now())
        `;
      }
      if (status) {
        await sql`
          update applicants
          set stage = ${stage},
              status = ${status},
              last_website_visit = now(),
              updated_at = now()
          where id = ${applicantId} or lower(email) = lower(${updatedWebsite.email})
        `;
      } else {
        await sql`
          update applicants
          set stage = ${stage},
              last_website_visit = now(),
              updated_at = now()
          where id = ${applicantId} or lower(email) = lower(${updatedWebsite.email})
        `;
      }
      return rowToApplicant(updatedWebsite);
    }

    const chronosRows = status
      ? await sql`
          update applicants
          set stage = ${stage},
              status = ${status},
              last_website_visit = now(),
              updated_at = now()
          where id = ${applicantId}
          returning *
        `
      : await sql`
          update applicants
          set stage = ${stage},
              last_website_visit = now(),
              updated_at = now()
          where id = ${applicantId}
          returning *
        `;

    const chronos = chronosRows[0];
    if (chronos) {
      const previousChronosStage = String(chronos.stage ?? '');
      if (status) {
        await sql`
          update website_applicants
          set stage = ${stage},
              status = ${status},
              last_visited_at = now(),
              updated_at = now()
          where id = ${applicantId} or lower(email) = lower(${chronos.email})
        `;
      } else {
        await sql`
          update website_applicants
          set stage = ${stage},
              last_visited_at = now(),
              updated_at = now()
          where id = ${applicantId} or lower(email) = lower(${chronos.email})
        `;
      }
      if (stageSchemaReady && previousChronosStage !== stage) {
        await sql`
          insert into website_applicant_stage_transitions (id, applicant_id, stage, reached_at)
          values (${randomUUID()}, ${applicantId}, ${stage}, now())
        `;
      }
      const name = String(chronos.name ?? '').trim();
      const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
      const mappedStatus: ApplicantProfile['status'] = chronos.status === 'closed'
        ? 'rejected'
        : chronos.status === 'joined'
          ? 'joined'
          : chronos.status === 'waiting'
            ? 'waiting'
            : chronos.status === 'approved'
              ? 'approved'
              : chronos.status === 'signed'
                ? 'signed'
                : chronos.status === 'applying'
                  ? 'applying'
                  : chronos.status === 'terminated'
                    ? 'terminated'
                    : 'joined';
      const mappedStage: ApplicantProfile['stage'] = (chronos.stage ?? stage) as ApplicantProfile['stage'];
      return {
        id: chronos.id,
        email: chronos.email,
        password: '',
        role: 'applicant' as const,
        hrBinaryRole: false,
        firstName: firstName || chronos.email,
        lastName: rest.join(' '),
        phoneNumber: chronos.phone ?? '',
        country: chronos.country ?? '',
        stateRegion: chronos.state_region ?? '',
        city: chronos.city ?? '',
        latitude: 0,
        longitude: 0,
        linkedinUrl: chronos.linkedin_url ?? '',
        education: chronos.education ?? chronos.current_job_title ?? '',
        source: chronos.source ?? chronos.hubspot_owner ?? 'Chronos HubSpot import',
        referralName: '',
        cvFileName: '',
        cvUrl: '',
        profilePictureUrl: '',
        roleAppliedFor: chronos.role_applied_for ?? chronos.current_job_title ?? 'Imported contact',
        stage: mappedStage,
        status: mappedStatus,
        joinedAt: new Date(chronos.joined_at ?? chronos.created_at ?? Date.now()).toISOString(),
        lastVisitedAt: new Date(chronos.last_website_visit ?? chronos.updated_at ?? Date.now()).toISOString(),
        notes: chronos.hubspot_status ?? 'Imported from Chronos applicants.',
        safeSendersConfirmed: false,
        communicationConsent: true,
      };
    }

    const userRows = await sql`
      select id, email, name, password, role, is_active, created_at, updated_at
      from users
      where id = ${applicantId}
      limit 1
    `;
    const user = userRows[0];
    if (!user) return null;

    const fullName = String(user.name ?? '').trim();
    const [userFirstName, ...userRest] = fullName.split(/\s+/).filter(Boolean);
    const fallbackStatus: ApplicantProfile['status'] = status ?? (user.is_active === false ? 'waiting' : 'joined');
    const fallbackStage: ApplicantProfile['stage'] = stage ?? 'joined';

    const hydratedRows = await sql`
      insert into website_applicants (
        id, email, password, role, hr_binary_role, first_name, last_name, phone_number, country, state_region, city,
        latitude, longitude, linkedin_url, education, source, referral_name, cv_file_name, cv_url, profile_picture_url,
        role_applied_for, stage, status, notes, safe_senders_confirmed, communication_consent, joined_at, last_visited_at, updated_at
      ) values (
        ${user.id},
        ${user.email},
        ${user.password},
        'applicant',
        false,
        ${userFirstName || user.email},
        ${userRest.join(' ')},
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
        ${String(user.role ?? 'Team member')},
        ${fallbackStage},
        ${fallbackStatus},
        'Hydrated from Chronos users for HR stage update.',
        true,
        true,
        ${new Date(user.created_at ?? Date.now())},
        now(),
        now()
      )
      on conflict (id)
      do update set
        stage = excluded.stage,
        status = excluded.status,
        last_visited_at = now(),
        updated_at = now()
      returning *
    `;
    return hydratedRows[0] ? rowToApplicant(hydratedRows[0]) : null;
  }
  const db = await readDb();
  const applicant = db.applicants.find((candidate) => candidate.id === applicantId);
  if (!applicant) return null;
  const previousStage = applicant.stage;
  applicant.stage = stage;
  applicant.lastVisitedAt = new Date().toISOString();
  if (status) applicant.status = status;
  if (previousStage !== stage) {
    db.stageTransitions = db.stageTransitions ?? [];
    db.stageTransitions.push({
      id: `transition-${Date.now()}`,
      applicantId,
      stage,
      reachedAt: new Date().toISOString(),
    });
  }
  await writeDb(db);
  return applicant;
}

export async function createPasswordResetTokenForUser(userId: string, token: string, expiresAt: Date) {
  if (!(USE_POSTGRES && sql)) {
    throw new Error('Password reset tokens require postgres storage');
  }
  await ensurePostgresSchema();
  await sql`delete from website_password_reset_tokens where user_id = ${userId} and used_at is null and expires_at > now()`;
  const rows = await sql`
    insert into website_password_reset_tokens (user_id, token, expires_at)
    values (${userId}, ${token}, ${expiresAt})
    returning id, user_id, token, expires_at, used_at
  `;
  return rows[0];
}

export async function getActivePasswordResetTokenForUser(userId: string) {
  if (!(USE_POSTGRES && sql)) {
    throw new Error('Password reset tokens require postgres storage');
  }
  await ensurePostgresSchema();
  const rows = await sql`
    select id, user_id, token, expires_at, used_at
    from website_password_reset_tokens
    where user_id = ${userId} and used_at is null and expires_at > now()
    order by created_at desc
    limit 1
  `;
  return rows[0] ?? null;
}

export async function getValidPasswordResetToken(token: string) {
  if (!(USE_POSTGRES && sql)) {
    throw new Error('Password reset tokens require postgres storage');
  }
  await ensurePostgresSchema();
  const rows = await sql`
    select id, user_id, token, expires_at, used_at
    from website_password_reset_tokens
    where token = ${token} and used_at is null and expires_at > now()
    limit 1
  `;
  return rows[0] ?? null;
}

export async function resetApplicantPassword(userId: string, password: string, tokenId: string) {
  if (!(USE_POSTGRES && sql)) {
    throw new Error('Password reset requires postgres storage');
  }
  await ensurePostgresSchema();
  const hashedPassword = await hash(password, 12);
  const emailRows = await sql`
    select email from users where id = ${userId}
    union
    select email from user_email_aliases where user_id = ${userId}
  `;
  const emails = Array.from(new Set(emailRows.map((row) => String(row.email ?? '').trim().toLowerCase()).filter(Boolean)));

  await sql`update users set password = ${hashedPassword}, updated_at = now() where id = ${userId}`;
  await sql`update website_applicants set password = ${hashedPassword}, updated_at = now() where id = ${userId}`;

  if (emails.length > 0) {
    await sql`
      update website_applicants
      set password = ${hashedPassword}, updated_at = now()
      where lower(email) = any(${emails}::text[])
    `;
  }

  await sql`update website_password_reset_tokens set used_at = now() where id = ${tokenId}`;
}

async function persistEmailAliases(db: typeof sql, userId: string, primaryEmail: string, alternateEmails: string[]) {
  if (!db) return;
  // user_email_aliases has a FK on users.id — skip for website_applicants-only users
  const inUsers = await db`select id from users where id = ${userId} limit 1`.catch(() => []);
  if (!inUsers.length) return;
  await db`
    create table if not exists user_email_aliases (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      email text not null unique,
      is_primary boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;
  await db`delete from user_email_aliases where user_id = ${userId}`;
  await db`
    insert into user_email_aliases (user_id, email, is_primary)
    values (${userId}, ${primaryEmail.toLowerCase()}, true)
    on conflict (email) do update set user_id = excluded.user_id, is_primary = true, updated_at = now()
  `;
  for (const alt of alternateEmails) {
    const lower = alt.toLowerCase().trim();
    if (!lower || lower === primaryEmail.toLowerCase()) continue;
    await db`
      insert into user_email_aliases (user_id, email, is_primary)
      values (${userId}, ${lower}, false)
      on conflict (email) do update set user_id = excluded.user_id, is_primary = false, updated_at = now()
    `;
  }
}

export async function updateApplicantProfile(applicantId: string, updates: Partial<ApplicantProfile>): Promise<ApplicantProfile | null> {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const current = await getUserById(applicantId);
    if (!current) return null;
    const next = { ...current, ...updates };
    const rows = await sql`
      update website_applicants
      set email = ${next.email},
          first_name = ${next.firstName},
          last_name = ${next.lastName},
          phone_number = ${next.phoneNumber},
          country = ${next.country},
          state_region = ${next.stateRegion ?? ''},
          city = ${next.city},
          linkedin_url = ${next.linkedinUrl},
          education = ${next.education},
          source = ${next.source ?? ''},
          role_applied_for = ${next.roleAppliedFor ?? ''},
          notes = ${next.notes ?? ''},
          profile_picture_url = ${next.profilePictureUrl ?? ''},
          cv_file_name = ${next.cvFileName ?? ''},
          cv_url = ${next.cvUrl ?? ''},
          notion_team_member_page_url = ${next.notionTeamMemberPageUrl ?? ''},
          last_visited_at = now(),
          updated_at = now()
      where id = ${applicantId}
      returning *
    `;
    if (rows[0]) {
      if (updates.alternateEmails !== undefined) {
        await persistEmailAliases(sql, applicantId, next.email, updates.alternateEmails);
      }
      return rowToApplicant(rows[0]);
    }

    const chronosApplicantRows = await sql`
      update applicants
      set email = ${next.email},
          name = ${`${next.firstName} ${next.lastName}`.trim()},
          phone = ${next.phoneNumber},
          country = ${next.country},
          state_region = ${next.stateRegion ?? ''},
          city = ${next.city},
          linkedin_url = ${next.linkedinUrl},
          education = ${next.education},
          role_applied_for = ${next.roleAppliedFor},
          source = ${next.source ?? ''},
          last_website_visit = now(),
          updated_at = now()
      where id = ${applicantId}
      returning *
    `;

    if (chronosApplicantRows[0]) {
      const chronos = chronosApplicantRows[0];
      const name = String(chronos.name ?? '').trim();
      const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
      const mappedStatus: ApplicantProfile['status'] = chronos.status === 'closed'
        ? 'rejected'
        : chronos.status === 'joined'
          ? 'joined'
          : chronos.status === 'waiting'
            ? 'waiting'
            : chronos.status === 'approved'
              ? 'approved'
              : chronos.status === 'signed'
                ? 'signed'
                : chronos.status === 'applying'
                  ? 'applying'
                  : chronos.status === 'terminated'
                    ? 'terminated'
                    : 'joined';
      const mappedStage: ApplicantProfile['stage'] = (chronos.stage ?? current.stage) as ApplicantProfile['stage'];
      return {
        id: chronos.id,
        email: chronos.email,
        password: '',
        role: 'applicant' as const,
        hrBinaryRole: false,
        firstName: firstName || chronos.email,
        lastName: rest.join(' '),
        phoneNumber: chronos.phone ?? '',
        country: chronos.country ?? '',
        stateRegion: chronos.state_region ?? '',
        city: chronos.city ?? '',
        latitude: 0,
        longitude: 0,
        linkedinUrl: chronos.linkedin_url ?? '',
        education: chronos.education ?? chronos.current_job_title ?? '',
        source: chronos.source ?? chronos.hubspot_owner ?? 'Chronos HubSpot import',
        referralName: '',
        cvFileName: '',
        cvUrl: '',
        profilePictureUrl: '',
        roleAppliedFor: chronos.role_applied_for ?? chronos.current_job_title ?? 'Imported contact',
        stage: mappedStage,
        status: mappedStatus,
        joinedAt: new Date(chronos.joined_at ?? chronos.created_at ?? Date.now()).toISOString(),
        lastVisitedAt: new Date(chronos.last_website_visit ?? chronos.updated_at ?? Date.now()).toISOString(),
        notes: chronos.hubspot_status ?? 'Imported from Chronos applicants.',
        safeSendersConfirmed: false,
        communicationConsent: true,
      };
    }

    const chronosUserRows = await sql`
      update users
      set email = ${next.email},
          name = ${`${next.firstName} ${next.lastName}`.trim()},
          updated_at = now()
      where id = ${applicantId}
      returning id, email, name, password, role, is_active, created_at, updated_at
    `;
    return chronosUserRows[0] ? chronosUserToApplicant(chronosUserRows[0]) : null;
  }
  const db = await readDb();
  const applicant = db.applicants.find((candidate) => candidate.id === applicantId);
  if (!applicant) return null;
  Object.assign(applicant, updates, { lastVisitedAt: new Date().toISOString() });
  await writeDb(db);
  return applicant;
}

export async function touchApplicantWebsiteVisit(applicantId: string, email?: string) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    await sql`update website_applicants set last_visited_at = now(), updated_at = now() where id = ${applicantId}`;
    await sql`update users set updated_at = now() where id = ${applicantId}`;
    await sql`update applicants set last_website_visit = now(), updated_at = now() where id = ${applicantId}`;
    if (email) {
      await sql`update applicants set last_website_visit = now(), updated_at = now() where lower(email) = lower(${email})`;
    }
    return;
  }

  const db = await readDb();
  const applicant = db.applicants.find((candidate) => candidate.id === applicantId);
  if (!applicant) return;
  applicant.lastVisitedAt = new Date().toISOString();
  await writeDb(db);
}

export async function getStageTransitions() {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (!stageSchemaReady) return [] as StageTransitionRecord[];
    const rows = await sql`
      select id, applicant_id, stage, reached_at
      from website_applicant_stage_transitions
      order by reached_at asc
    `;
    return rows.map((row) => ({
      id: String(row.id),
      applicantId: String(row.applicant_id),
      stage: String(row.stage),
      reachedAt: new Date(row.reached_at).toISOString(),
    })) as StageTransitionRecord[];
  }
  const db = await readDb();
  return db.stageTransitions ?? [];
}

export async function getStageResources(stage?: string) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (!stageSchemaReady) return [] as StageResourceRecord[];
    const rows = stage
      ? await sql`
          select id, stage, title, url, applicant_prompt, sort_order, active, created_at, updated_at
          from website_stage_resources
          where stage = ${stage}
          order by sort_order asc, created_at asc
        `
      : await sql`
          select id, stage, title, url, applicant_prompt, sort_order, active, created_at, updated_at
          from website_stage_resources
          order by stage asc, sort_order asc, created_at asc
        `;
    return rows.map((row) => ({
      id: String(row.id),
      stage: String(row.stage),
      title: String(row.title),
      url: String(row.url),
      applicantPrompt: String(row.applicant_prompt ?? ''),
      sortOrder: Number(row.sort_order ?? 0),
      active: Boolean(row.active),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    })) as StageResourceRecord[];
  }
  const db = await readDb();
  const resources = db.stageResources ?? [];
  return stage ? resources.filter((item) => item.stage === stage) : resources;
}

export async function createStageResource(input: { stage: string; title: string; url: string; applicantPrompt: string }) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (!stageSchemaReady) throw new Error('Stage resources are unavailable in this environment');
    const orderRows = await sql`select coalesce(max(sort_order), -1) as max_order from website_stage_resources where stage = ${input.stage}`;
    const nextOrder = Number(orderRows[0]?.max_order ?? -1) + 1;
    const rows = await sql`
      insert into website_stage_resources (id, stage, title, url, applicant_prompt, sort_order, active)
      values (${randomUUID()}, ${input.stage}, ${input.title}, ${input.url}, ${input.applicantPrompt}, ${nextOrder}, true)
      returning id, stage, title, url, applicant_prompt, sort_order, active, created_at, updated_at
    `;
    const row = rows[0];
    return {
      id: String(row.id),
      stage: String(row.stage),
      title: String(row.title),
      url: String(row.url),
      applicantPrompt: String(row.applicant_prompt ?? ''),
      sortOrder: Number(row.sort_order ?? 0),
      active: Boolean(row.active),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    } as StageResourceRecord;
  }
  const db = await readDb();
  const stageResources = db.stageResources ?? [];
  const sameStage = stageResources.filter((resource) => resource.stage === input.stage);
  const resource: StageResourceRecord = {
    id: `resource-${Date.now()}`,
    stage: input.stage,
    title: input.title,
    url: input.url,
    applicantPrompt: input.applicantPrompt,
    sortOrder: sameStage.length,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  stageResources.push(resource);
  db.stageResources = stageResources;
  await writeDb(db);
  return resource;
}

export async function deleteStageResource(resourceId: string) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (!stageSchemaReady) return;
    await sql`delete from website_stage_resources where id = ${resourceId}`;
    return;
  }
  const db = await readDb();
  db.stageResources = (db.stageResources ?? []).filter((item) => item.id !== resourceId);
  db.stageResponses = (db.stageResponses ?? []).filter((item) => item.resourceId !== resourceId);
  await writeDb(db);
}

export async function updateStageResource(input: {
  id: string;
  title: string;
  url: string;
  applicantPrompt: string;
}) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (!stageSchemaReady) throw new Error('Stage resources are unavailable in this environment');
    const rows = await sql`
      update website_stage_resources
      set title = ${input.title}, url = ${input.url}, applicant_prompt = ${input.applicantPrompt}, updated_at = now()
      where id = ${input.id}
      returning id, stage, title, url, applicant_prompt, sort_order, active, created_at, updated_at
    `;
    const row = rows[0];
    if (!row) throw new Error('Resource not found');
    return {
      id: String(row.id),
      stage: String(row.stage),
      title: String(row.title),
      url: String(row.url),
      applicantPrompt: String(row.applicant_prompt ?? ''),
      sortOrder: Number(row.sort_order ?? 0),
      active: Boolean(row.active),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    } as StageResourceRecord;
  }
  const db = await readDb();
  const list = db.stageResources ?? [];
  const index = list.findIndex((item) => item.id === input.id);
  if (index < 0) throw new Error('Resource not found');
  const prev = list[index];
  const next = { ...prev, title: input.title, url: input.url, applicantPrompt: input.applicantPrompt, updatedAt: new Date().toISOString() };
  list[index] = next;
  db.stageResources = list;
  await writeDb(db);
  return next;
}

export async function saveStageResourceResponse(input: { resourceId: string; applicantId: string; responseText: string }) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (!stageSchemaReady) throw new Error('Stage responses are unavailable in this environment');
    const rows = await sql`
      insert into website_stage_resource_responses (id, resource_id, applicant_id, response_text, submitted_at)
      values (${randomUUID()}, ${input.resourceId}, ${input.applicantId}, ${input.responseText}, now())
      returning id, resource_id, applicant_id, response_text, submitted_at
    `;
    return rows[0];
  }
  const db = await readDb();
  db.stageResponses = db.stageResponses ?? [];
  db.stageResponses.push({
    id: `response-${Date.now()}`,
    resourceId: input.resourceId,
    applicantId: input.applicantId,
    responseText: input.responseText,
    submittedAt: new Date().toISOString(),
  });
  await writeDb(db);
}

export async function getStageResponsesForApplicant(applicantId: string) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (!stageSchemaReady) return [] as StageResourceResponseRecord[];
    const rows = await sql`
      select id, resource_id, applicant_id, response_text, submitted_at
      from website_stage_resource_responses
      where applicant_id = ${applicantId}
      order by submitted_at desc
    `;
    return rows.map((row) => ({
      id: String(row.id),
      resourceId: String(row.resource_id),
      applicantId: String(row.applicant_id),
      responseText: String(row.response_text),
      submittedAt: new Date(row.submitted_at).toISOString(),
    })) as StageResourceResponseRecord[];
  }
  const db = await readDb();
  return (db.stageResponses ?? []).filter((item) => item.applicantId === applicantId);
}

export async function getStageResponsesForHr() {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (!stageSchemaReady) return [] as HrStageResponseRecord[];
    const rows = await sql`
      select
        r.id,
        r.resource_id,
        r.applicant_id,
        r.response_text,
        r.submitted_at,
        coalesce(w.email, u.email, a.email, '') as applicant_email,
        trim(coalesce(w.first_name, split_part(coalesce(u.name, a.name, ''), ' ', 1), '')) as applicant_first_name,
        trim(
          coalesce(
            w.last_name,
            regexp_replace(coalesce(u.name, a.name, ''), '^[^ ]+\s*', ''),
            ''
          )
        ) as applicant_last_name,
        s.stage as stage,
        s.title as resource_title
      from website_stage_resource_responses r
      inner join website_stage_resources s on s.id = r.resource_id
      left join website_applicants w on w.id = r.applicant_id
      left join users u on u.id = r.applicant_id
      left join applicants a on a.id = r.applicant_id
      order by r.submitted_at desc
    `;
    return rows.map((row) => ({
      id: String(row.id),
      resourceId: String(row.resource_id),
      applicantId: String(row.applicant_id),
      responseText: String(row.response_text),
      submittedAt: new Date(row.submitted_at).toISOString(),
      applicantEmail: String(row.applicant_email ?? ''),
      applicantName: `${String(row.applicant_first_name ?? '').trim()} ${String(row.applicant_last_name ?? '').trim()}`.trim() || 'Unknown applicant',
      stage: String(row.stage),
      resourceTitle: String(row.resource_title),
    })) as HrStageResponseRecord[];
  }

  const db = await readDb();
  const applicantById = new Map((db.applicants ?? []).map((applicant) => [applicant.id, applicant]));
  const resourceById = new Map((db.stageResources ?? []).map((resource) => [resource.id, resource]));
  return (db.stageResponses ?? [])
    .map((item) => {
      const applicant = applicantById.get(item.applicantId);
      const resource = resourceById.get(item.resourceId);
      return {
        ...item,
        applicantEmail: applicant?.email ?? '',
        applicantName: applicant ? `${applicant.firstName} ${applicant.lastName}`.trim() : 'Unknown applicant',
        stage: resource?.stage ?? '',
        resourceTitle: resource?.title ?? '',
      };
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()) as HrStageResponseRecord[];
}

export async function getStageDefinitions(baseSteps: StageStep[]) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (!stageSchemaReady) {
      return baseSteps.map((step) => ({
        stageId: step.id,
        shortLabel: step.shortLabel,
        title: step.title,
        description: step.description,
        applicantAction: step.applicantAction,
        adminAction: step.adminAction,
        active: true,
        updatedAt: new Date().toISOString(),
      })) as StageDefinitionRecord[];
    }
    const rows = await sql`
      select stage_id, short_label, title, description, applicant_action, admin_action, active, updated_at
      from website_stage_definitions
    `;
    const byId = new Map(
      rows.map((row) => [String(row.stage_id), {
        stageId: String(row.stage_id),
        shortLabel: String(row.short_label),
        title: String(row.title),
        description: String(row.description),
        applicantAction: String(row.applicant_action),
        adminAction: String(row.admin_action),
        active: Boolean(row.active),
        updatedAt: new Date(row.updated_at).toISOString(),
      } as StageDefinitionRecord]),
    );
    return baseSteps.map((step) => byId.get(step.id) ?? {
      stageId: step.id,
      shortLabel: step.shortLabel,
      title: step.title,
      description: step.description,
      applicantAction: step.applicantAction,
      adminAction: step.adminAction,
      active: true,
      updatedAt: new Date().toISOString(),
    }) as StageDefinitionRecord[];
  }

  const db = await readDb();
  const byId = new Map((db.stageDefinitions ?? []).map((item) => [item.stageId, item]));
  return baseSteps.map((step) => byId.get(step.id) ?? {
    stageId: step.id,
    shortLabel: step.shortLabel,
    title: step.title,
    description: step.description,
    applicantAction: step.applicantAction,
    adminAction: step.adminAction,
    active: true,
    updatedAt: new Date().toISOString(),
  }) as StageDefinitionRecord[];
}

export async function saveStageDefinition(input: {
  stageId: string;
  shortLabel: string;
  title: string;
  description: string;
  applicantAction: string;
  adminAction: string;
  active: boolean;
}) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const stageSchemaReady = await ensureStageFeatureSchema();
    if (!stageSchemaReady) throw new Error('Stage definitions are unavailable in this environment');
    await sql`
      insert into website_stage_definitions (stage_id, short_label, title, description, applicant_action, admin_action, active, updated_at)
      values (${input.stageId}, ${input.shortLabel}, ${input.title}, ${input.description}, ${input.applicantAction}, ${input.adminAction}, ${input.active}, now())
      on conflict (stage_id)
      do update set
        short_label = excluded.short_label,
        title = excluded.title,
        description = excluded.description,
        applicant_action = excluded.applicant_action,
        admin_action = excluded.admin_action,
        active = excluded.active,
        updated_at = now()
    `;
    return;
  }

  const db = await readDb();
  const current = db.stageDefinitions ?? [];
  const next = current.filter((item) => item.stageId !== input.stageId);
  next.push({
    ...input,
    updatedAt: new Date().toISOString(),
  });
  db.stageDefinitions = next;
  await writeDb(db);
}
