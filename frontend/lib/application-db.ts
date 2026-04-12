import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { demoApplicants, demoConversations, type ApplicantProfile, type ConversationMessage } from '@/app/application-data';
import { sql } from '@/lib/db';

const DB_PATH = path.join(process.cwd(), 'data', 'applicants.json');
const USE_POSTGRES = process.env.APPLICANT_STORAGE_DRIVER === 'postgres' || process.env.NODE_ENV === 'production';

interface ApplicationDbShape {
  applicants: ApplicantProfile[];
  conversations: ConversationMessage[];
}

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify({ applicants: demoApplicants, conversations: demoConversations }, null, 2), 'utf8');
  }
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
      status text not null default 'active',
      joined_at timestamptz not null default now(),
      last_visited_at timestamptz not null default now(),
      notes text,
      safe_senders_confirmed boolean default false,
      communication_consent boolean default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;
  await sql`
    create table if not exists website_applicant_conversations (
      id uuid primary key default gen_random_uuid(),
      applicant_id uuid not null references website_applicants(id) on delete cascade,
      author text not null,
      text text not null,
      created_at timestamptz not null default now()
    );
  `;
}

function rowToApplicant(row: any): ApplicantProfile {
  return {
    id: row.id,
    email: row.email,
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
  return JSON.parse(raw) as ApplicationDbShape;
}

export async function writeDb(data: ApplicationDbShape) {
  if (USE_POSTGRES && sql) {
    throw new Error('writeDb is not supported for postgres mode, use specific helpers');
  }
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function chronosUserToApplicant(row: any): ApplicantProfile {
  const name = String(row.name ?? '').trim();
  const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    role: row.role === 'admin' ? 'admin' : 'hr',
    hrBinaryRole: row.role === 'admin',
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
    roleAppliedFor: row.role,
    stage: 'chronos_synced',
    status: row.is_active === false ? 'waiting' : 'approved',
    joinedAt: new Date(row.created_at ?? Date.now()).toISOString(),
    lastVisitedAt: new Date(row.updated_at ?? Date.now()).toISOString(),
    notes: 'Authenticated through shared Chronos users table.',
    safeSendersConfirmed: true,
    communicationConsent: true,
  };
}

export async function findUserByEmail(email: string) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const rows = await sql`select * from website_applicants where lower(email) = lower(${email}) limit 1`;
    if (rows[0]) return rowToApplicant(rows[0]);

    const chronosRows = await sql`select id, email, name, password, role, is_active, created_at, updated_at from users where lower(email) = lower(${email}) limit 1`;
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

    const chronosRows = await sql`select id, email, name, password, role, is_active, created_at, updated_at from users where id = ${id} limit 1`;
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
  await writeDb(db);
  return applicant;
}

export async function getApplicants() {
  const db = await readDb();
  return db.applicants;
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
    const rows = status
      ? await sql`update website_applicants set stage = ${stage}, status = ${status}, last_visited_at = now(), updated_at = now() where id = ${applicantId} returning *`
      : await sql`update website_applicants set stage = ${stage}, last_visited_at = now(), updated_at = now() where id = ${applicantId} returning *`;
    return rows[0] ? rowToApplicant(rows[0]) : null;
  }
  const db = await readDb();
  const applicant = db.applicants.find((candidate) => candidate.id === applicantId);
  if (!applicant) return null;
  applicant.stage = stage;
  applicant.lastVisitedAt = new Date().toISOString();
  if (status) applicant.status = status;
  await writeDb(db);
  return applicant;
}

export async function updateApplicantProfile(applicantId: string, updates: Partial<ApplicantProfile>) {
  if (USE_POSTGRES && sql) {
    await ensurePostgresSchema();
    const current = await getUserById(applicantId);
    if (!current) return null;
    const next = { ...current, ...updates };
    const rows = await sql`
      update website_applicants
      set first_name = ${next.firstName},
          last_name = ${next.lastName},
          phone_number = ${next.phoneNumber},
          country = ${next.country},
          state_region = ${next.stateRegion ?? ''},
          city = ${next.city},
          linkedin_url = ${next.linkedinUrl},
          education = ${next.education},
          profile_picture_url = ${next.profilePictureUrl ?? ''},
          cv_file_name = ${next.cvFileName ?? ''},
          cv_url = ${next.cvUrl ?? ''},
          last_visited_at = now(),
          updated_at = now()
      where id = ${applicantId}
      returning *
    `;
    return rows[0] ? rowToApplicant(rows[0]) : null;
  }
  const db = await readDb();
  const applicant = db.applicants.find((candidate) => candidate.id === applicantId);
  if (!applicant) return null;
  Object.assign(applicant, updates, { lastVisitedAt: new Date().toISOString() });
  await writeDb(db);
  return applicant;
}
