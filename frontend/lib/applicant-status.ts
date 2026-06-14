import type { ApplicantStatus } from '@/app/application-data';

/** Same values as FloLabs Chronos `src/lib/applicant-status.ts`. */
export const APPLICANT_STATUS_VALUES: ApplicantStatus[] = [
  'applying',
  'waiting',
  'approved',
  'rejected',
  'signed',
  'joined',
  'graduated',
  'terminated',
];

const LABELS: Record<ApplicantStatus, string> = {
  applying: 'Applying',
  waiting: 'Waiting',
  approved: 'Approved',
  rejected: 'Rejected',
  signed: 'Signed',
  joined: 'Joined',
  graduated: 'Graduated',
  terminated: 'Terminated',
};

export function formatApplicantStatusLabel(status: string | null | undefined): string {
  const value = String(status ?? '').trim().toLowerCase() as ApplicantStatus;
  if (APPLICANT_STATUS_VALUES.includes(value)) return LABELS[value];
  const trimmed = String(status ?? '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : '—';
}

export function chronosAccessDisabled(status: string | null | undefined): boolean {
  const value = String(status ?? '').trim().toLowerCase();
  return value === 'graduated' || value === 'terminated';
}
