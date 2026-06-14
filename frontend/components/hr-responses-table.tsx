'use client';

import { useState, useMemo } from 'react';
import stepsData from '@/app/STEPS.json';

const steps = stepsData as { id: string; title: string; shortLabel: string }[];

function AiOutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-gray-300">—</span>;
  if (outcome === 'next') {
    return <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Passed</span>;
  }
  if (outcome === 'previous') {
    return <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">Declined</span>;
  }
  return <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Redo</span>;
}
const stageTitleMap = new Map(steps.map((s) => [s.id, s.title]));
const stageOrderMap = new Map(steps.map((s, i) => [s.id, i]));

type Row = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  stage: string;
  resourceTitle: string;
  responseText: string;
  submittedAt: string;
  aiOutcome: string | null;
};

export function HrResponsesTable({ rows }: { rows: Row[] }) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const stagesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.stage, (map.get(row.stage) ?? 0) + 1);
    }
    return [...map.entries()].sort(([a], [b]) => {
      const ai = stageOrderMap.get(a) ?? 999;
      const bi = stageOrderMap.get(b) ?? 999;
      return ai - bi;
    });
  }, [rows]);

  const filtered = selectedStage ? rows.filter((r) => r.stage === selectedStage) : rows;

  return (
    <div className="flex gap-5 items-start">
      <aside className="w-56 shrink-0 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm sticky top-28 self-start">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Stages</p>
        <button
          type="button"
          onClick={() => setSelectedStage(null)}
          className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
            selectedStage === null
              ? 'bg-[#eef5ff] font-semibold text-[#00349B]'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          All stages
          <span className="ml-1 text-xs font-normal opacity-60">({rows.length})</span>
        </button>
        {stagesWithCounts.map(([stageId, count]) => (
          <button
            key={stageId}
            type="button"
            onClick={() => setSelectedStage(stageId)}
            className={`mt-0.5 w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
              selectedStage === stageId
                ? 'bg-[#eef5ff] font-semibold text-[#00349B]'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {stageTitleMap.get(stageId) ?? stageId}
            <span className="ml-1 text-xs font-normal opacity-50">({count})</span>
          </button>
        ))}
      </aside>

      <div className="min-w-0 flex-1 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Responses</h1>
        <p className="mt-1 text-sm text-gray-600">
          {selectedStage
            ? `${stageTitleMap.get(selectedStage) ?? selectedStage} — ${filtered.length} response${filtered.length === 1 ? '' : 's'}`
            : `All stages — ${rows.length} response${rows.length === 1 ? '' : 's'}`}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-blue-100 text-xs uppercase tracking-[0.08em] text-gray-500">
                <th className="px-3 py-2">Applicant</th>
                {!selectedStage && <th className="px-3 py-2">Stage</th>}
                <th className="px-3 py-2">Content</th>
                <th className="px-3 py-2">Response</th>
                <th className="px-3 py-2">AI</th>
                <th className="px-3 py-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={selectedStage ? 5 : 6}>
                    No responses yet.
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 align-top">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-gray-900">{row.applicantName}</p>
                    <p className="text-xs text-gray-500">{row.applicantEmail}</p>
                  </td>
                  {!selectedStage && (
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {stageTitleMap.get(row.stage) ?? row.stage}
                    </td>
                  )}
                  <td className="px-3 py-3 text-gray-700">{row.resourceTitle}</td>
                  <td className="px-3 py-3 text-gray-700 max-w-[520px] whitespace-pre-wrap">{row.responseText}</td>
                  <td className="px-3 py-3"><AiOutcomeBadge outcome={row.aiOutcome} /></td>
                  <td suppressHydrationWarning className="px-3 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(row.submittedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
