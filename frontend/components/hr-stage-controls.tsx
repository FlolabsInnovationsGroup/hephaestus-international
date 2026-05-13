'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatStageLabel, orderedStageIds } from '@/lib/stage-definitions';

const stageOptions = orderedStageIds;

const statusOptions = ['applying', 'waiting', 'signed', 'joined', 'approved', 'rejected', 'graduated', 'terminated'];
const blacklistedCountries = ['Afghanistan', 'Belarus', 'Iran', 'North Korea', 'Russia', 'Syria'];

function statusForStage(stageId: string): string {
  const idx = orderedStageIds.indexOf(stageId as (typeof orderedStageIds)[number]);
  if (idx < 0) return 'applying';
  if (idx <= 8) return 'applying';   // stages 1–9: application_submitted → masterclass_submitted
  if (idx <= 10) return 'waiting';   // stages 10–11: second_meeting, agreement_sent
  if (idx === 11) return 'signed';   // stage 12: agreement_signed
  if (idx === 12) return 'joined';   // stage 13: chronos_synced
  return 'joined';                    // stage 14: joined (actively using Chronos)
}

export function HrStageControls({ applicantId, stage, status }: { applicantId: string; stage: string; status: string }) {
  const [nextStage, setNextStage] = useState(stage);
  const [nextStatus, setNextStatus] = useState(status);
  const [loading, setLoading] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const router = useRouter();

  const canOnboard = nextStatus === 'signed';

  async function save() {
    setLoading(true);
    await fetch('/api/admin/leads/stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantId, stage: nextStage, status: nextStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  async function onboard() {
    if (!canOnboard) return;
    setOnboarding(true);
    await fetch('/api/admin/leads/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantId }),
    });
    setOnboarding(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">HR actions</h2>
      <div className="mt-4 grid gap-4">
        <label>
          <span className="mb-2 block text-sm font-semibold text-gray-700">Stage</span>
          <select value={nextStage} onChange={(e) => { setNextStage(e.target.value); setNextStatus(statusForStage(e.target.value)); }} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
            {stageOptions.map((option) => <option key={option} value={option}>{formatStageLabel(option)}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold text-gray-700">Status</span>
          <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
            {nextStatus === 'active' && <option value="active" disabled>active</option>}
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        {nextStage === 'new' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold uppercase tracking-[0.14em] text-red-800">New outreach screening</p>
            <p className="mt-1">Applicants from these countries should be declined at this stage:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {blacklistedCountries.map((country) => (
                <li key={country}>{country}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button onClick={save} disabled={loading} className="rounded-xl bg-[#00349B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Saving...' : 'Save stage and status'}</button>
          <button
            type="button"
            onClick={onboard}
            disabled={!canOnboard || onboarding}
            className="rounded-xl border border-[#00349B] px-4 py-3 text-sm font-semibold text-[#00349B] disabled:cursor-not-allowed disabled:opacity-50"
            title={canOnboard ? 'Run the legacy onboarding flow' : 'Available only once the applicant reaches signed status'}
          >
            {onboarding ? 'Onboarding...' : 'Onboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
