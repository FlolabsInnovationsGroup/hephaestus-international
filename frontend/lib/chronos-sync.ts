import { promises as fs } from 'fs';
import path from 'path';
import type { ApplicantProfile } from '@/app/application-data';
import { sql } from '@/lib/db';

const SYNC_PATH = path.join(process.cwd(), 'data', 'chronos-sync.json');

interface SyncShape {
  syncedApplicants: Array<{
    applicantId: string;
    email: string;
    fullName: string;
    roleAppliedFor: string;
    stage: string;
    status: string;
    joinedAt: string;
    lastWebsiteVisit: string;
    syncedAt: string;
    targetSystems: string[];
  }>;
}

async function ensureSyncFile() {
  try {
    await fs.access(SYNC_PATH);
  } catch {
    await fs.mkdir(path.dirname(SYNC_PATH), { recursive: true });
    await fs.writeFile(SYNC_PATH, JSON.stringify({ syncedApplicants: [] }, null, 2), 'utf8');
  }
}

async function readSyncFile(): Promise<SyncShape> {
  await ensureSyncFile();
  return JSON.parse(await fs.readFile(SYNC_PATH, 'utf8')) as SyncShape;
}

async function writeSyncFile(data: SyncShape) {
  await fs.writeFile(SYNC_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function shouldMarkSyncedToTeamMembers(applicant: ApplicantProfile) {
  const stage = applicant.stage?.toLowerCase?.() ?? '';
  const status = applicant.status?.toLowerCase?.() ?? '';
  return (
    stage === 'agreement_signed' ||
    stage === 'chronos_synced' ||
    stage === 'joined' ||
    status === 'signed' ||
    status === 'joined'
  );
}

export function canOnboardApplicant(applicant: ApplicantProfile) {
  return (applicant.status?.toLowerCase?.() ?? '') === 'signed';
}

function buildHubspotRawDataFromApplicant(applicant: ApplicantProfile) {
  const fullName = `${applicant.firstName} ${applicant.lastName}`.trim();
  const alternateEmails = Array.from(
    new Set(
      [applicant.email, ...(applicant.alternateEmails ?? [])]
        .map((value) => String(value ?? '').trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  const nowIso = new Date().toISOString();

  return {
    Email: applicant.email,
    'First Name': applicant.firstName,
    'Last Name': applicant.lastName,
    'First and Last Name': fullName || applicant.email,
    'Phone Number': applicant.phoneNumber,
    'Mobile Phone Number': applicant.phoneNumber,
    'WhatsApp Phone Number': applicant.phoneNumber,
    'Country/Region': applicant.country,
    'State/Region': applicant.stateRegion ?? '',
    City: applicant.city,
    Education: applicant.education,
    'LinkedIn URL': applicant.linkedinUrl,
    Source: applicant.source,
    'Record source': applicant.source,
    'Job Title': applicant.roleAppliedFor,
    'Status Flomad': applicant.status,
    'Lifecycle Stage': applicant.stage,
    'Lead Status': applicant.stage,
    'Date of application': applicant.joinedAt,
    'Create Date': applicant.joinedAt,
    'Last Activity Date': applicant.lastVisitedAt,
    'Last Modified Date': nowIso,
    'Additional email addresses': alternateEmails.slice(1).join(', '),
    emails: alternateEmails,
    rolesAppliedFor: [applicant.roleAppliedFor].filter(Boolean),
    'HubSpot last sync (Hephaestus)': nowIso,
  };
}

export async function syncApplicantToChronos(applicant: ApplicantProfile) {
  const data = await readSyncFile();
  const payload = {
    applicantId: applicant.id,
    email: applicant.email,
    fullName: `${applicant.firstName} ${applicant.lastName}`,
    roleAppliedFor: applicant.roleAppliedFor,
    stage: applicant.stage,
    status: applicant.status,
    joinedAt: applicant.joinedAt,
    lastWebsiteVisit: applicant.lastVisitedAt,
    syncedAt: new Date().toISOString(),
    targetSystems: ['Chronos', 'Team Members'],
  };

  const index = data.syncedApplicants.findIndex((entry) => entry.applicantId === applicant.id);
  if (index >= 0) data.syncedApplicants[index] = payload;
  else data.syncedApplicants.push(payload);

  await writeSyncFile(data);

  const chronosApiUrl = process.env.CHRONOS_SYNC_API_URL;
  const chronosSyncToken = process.env.CHRONOS_SYNC_TOKEN;

  let remote: { ok: boolean; status?: number; error?: string } | null = null;
  if (chronosApiUrl) {
    try {
      const response = await fetch(chronosApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(chronosSyncToken ? { Authorization: `Bearer ${chronosSyncToken}` } : {}),
        },
        body: JSON.stringify({
          externalApplicantId: applicant.id,
          hubspotRecordId: applicant.id,
          email: applicant.email,
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          name: `${applicant.firstName} ${applicant.lastName}`,
          phone: applicant.phoneNumber,
          country: applicant.country,
          stateRegion: applicant.stateRegion ?? '',
          city: applicant.city,
          linkedinUrl: applicant.linkedinUrl,
          education: applicant.education,
          roleAppliedFor: applicant.roleAppliedFor,
          stage: applicant.stage,
          status: applicant.status,
          joinedAt: applicant.joinedAt,
          lastWebsiteVisit: applicant.lastVisitedAt,
          source: applicant.source,
          hubspotStatus: applicant.status,
          hubspotLifecycleStage: applicant.stage,
          hubspotLeadStatus: applicant.stage,
          hubspotLastModifiedAt: new Date().toISOString(),
          hubspotRawData: buildHubspotRawDataFromApplicant(applicant),
          syncedToTeamMembers: shouldMarkSyncedToTeamMembers(applicant),
          ...(applicant.notionTeamMemberId?.trim() || applicant.notionTeamMemberPageUrl?.trim()
            ? {
                notionTeamMemberId: applicant.notionTeamMemberId?.trim() || null,
                notionTeamMemberPageUrl: applicant.notionTeamMemberPageUrl?.trim() || null,
              }
            : {}),
        }),
      });
      remote = response.ok ? { ok: true, status: response.status } : { ok: false, status: response.status, error: await response.text() };
    } catch (error) {
      remote = { ok: false, error: error instanceof Error ? error.message : 'Unknown sync error' };
    }
  }

  return { ...payload, remote };
}

export async function getChronosSyncRecords() {
  return (await readSyncFile()).syncedApplicants;
}

export async function revokeChronosAccess(applicant: ApplicantProfile): Promise<{ ok: boolean; error?: string }> {
  if (!sql) return { ok: false, error: 'No database connection' };
  const status = String(applicant.status ?? '').trim().toLowerCase();
  const exitStatus = status === 'graduated' || status === 'terminated' ? status : 'terminated';
  try {
    await sql`
      update flolabs_users
      set
        status = ${exitStatus},
        is_active = false,
        updated_at = now()
      where lower(email) = lower(${applicant.email}) or id::text = ${applicant.id}
    `;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function grantChronosAccess(applicant: ApplicantProfile): Promise<{ ok: boolean; error?: string }> {
  if (!sql) return { ok: false, error: 'No database connection' };
  try {
    const fullName = `${applicant.firstName ?? ''} ${applicant.lastName ?? ''}`.trim() || applicant.email;
    // Upsert shared identity row (physical table flolabs_users). ON CONFLICT (email) if id already differs.
    await sql`
      insert into flolabs_users (id, email, name, first_name, last_name, password, role, is_active, created_at, updated_at)
      values (
        ${applicant.id}::uuid,
        ${applicant.email.toLowerCase()},
        ${fullName},
        ${applicant.firstName ?? ''},
        ${applicant.lastName ?? ''},
        '__hephaestus_pending__',
        'member',
        true,
        now(),
        now()
      )
      on conflict (email) do update set
        is_active = true,
        name = excluded.name,
        updated_at = now()
    `;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}


export async function onboardApplicantToChronos(applicant: ApplicantProfile) {
  if (!canOnboardApplicant(applicant)) {
    return { ok: false, error: 'Applicant must be signed before onboarding.' };
  }
  return await syncApplicantToChronos(applicant);
}
