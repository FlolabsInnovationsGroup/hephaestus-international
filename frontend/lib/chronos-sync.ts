import { promises as fs } from 'fs';
import path from 'path';
import type { ApplicantProfile } from '@/app/application-data';

const SYNC_PATH = path.join(process.cwd(), 'data', 'chronos-sync.json');
const TEAM_MEMBERS_SYNC_INTERVAL_MS = 15 * 60 * 1000;

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
          email: applicant.email,
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          name: `${applicant.firstName} ${applicant.lastName}`,
          phone: applicant.phoneNumber,
          country: applicant.country,
          city: applicant.city,
          linkedinUrl: applicant.linkedinUrl,
          roleAppliedFor: applicant.roleAppliedFor,
          stage: applicant.stage,
          status: applicant.status,
          joinedAt: applicant.joinedAt,
          lastWebsiteVisit: applicant.lastVisitedAt,
          source: applicant.source,
          syncedToTeamMembers: shouldMarkSyncedToTeamMembers(applicant),
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


export async function onboardApplicantToChronos(applicant: ApplicantProfile) {
  if (!canOnboardApplicant(applicant)) {
    return { ok: false, error: 'Applicant must be signed before onboarding.' };
  }
  return await syncApplicantToChronos(applicant);
}

let teamMembersSyncPromise: Promise<{ ok: boolean; skipped?: boolean; status?: number; error?: string }> | null = null;

export async function maybeSyncTeamMembersPeriodically(force = false) {
  if (teamMembersSyncPromise) return teamMembersSyncPromise;

  teamMembersSyncPromise = (async () => {
    try {
      const records = await getChronosSyncRecords();
      const latestSyncAt = records
        .map((entry) => new Date(entry.syncedAt).getTime())
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a)[0] ?? 0;

      if (!force && latestSyncAt && Date.now() - latestSyncAt < TEAM_MEMBERS_SYNC_INTERVAL_MS) {
        return { ok: true, skipped: true };
      }

      const cronUrl = process.env.CHRONOS_TEAM_MEMBERS_SYNC_URL;
      if (!cronUrl) {
        return { ok: false, error: 'CHRONOS_TEAM_MEMBERS_SYNC_URL is not configured.' };
      }

      const response = await fetch(cronUrl, {
        method: 'GET',
        headers: {
          ...(process.env.CHRONOS_CRON_SECRET ? { Authorization: `Bearer ${process.env.CHRONOS_CRON_SECRET}` } : {}),
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        return { ok: false, status: response.status, error: await response.text() };
      }

      return { ok: true, status: response.status };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown Team Members sync error' };
    } finally {
      teamMembersSyncPromise = null;
    }
  })();

  return teamMembersSyncPromise;
}
