'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const stageOptions = [
  'application_submitted',
  'new',
  'contacted',
  'interested_review',
  'before_meeting',
  'meeting_recordings_submitted',
  'saturday_meeting',
  'attended',
  'masterclass_submitted',
  'second_meeting',
  'agreement_sent',
  'agreement_signed',
  'chronos_synced',
  'joined',
];

const statusOptions = ['active', 'waiting', 'approved', 'rejected', 'signed', 'joined'];

export function HrStageControls({ applicantId, stage, status }: { applicantId: string; stage: string; status: string }) {
  const [nextStage, setNextStage] = useState(stage);
  const [nextStatus, setNextStatus] = useState(status);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">HR actions</h2>
      <div className="mt-4 grid gap-4">
        <label>
          <span className="mb-2 block text-sm font-semibold text-gray-700">Stage</span>
          <select value={nextStage} onChange={(e) => setNextStage(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
            {stageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold text-gray-700">Status</span>
          <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]">
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <button onClick={save} disabled={loading} className="rounded-xl bg-[#00349B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Saving...' : 'Save stage and status'}</button>
      </div>
    </div>
  );
}
