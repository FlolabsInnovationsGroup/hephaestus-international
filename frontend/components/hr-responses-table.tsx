'use client';

import { formatStageLabel } from '@/lib/stage-definitions';

type Row = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  stage: string;
  resourceTitle: string;
  responseText: string;
  submittedAt: string;
};

export function HrResponsesTable({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">Responses</h1>
      <p className="mt-1 text-sm text-gray-600">Applicant takes submitted for stage content.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-blue-100 text-xs uppercase tracking-[0.08em] text-gray-500">
              <th className="px-3 py-2">Applicant</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Content</th>
              <th className="px-3 py-2">Response</th>
              <th className="px-3 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={5}>No responses yet.</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 align-top">
                <td className="px-3 py-3">
                  <p className="font-semibold text-gray-900">{row.applicantName}</p>
                  <p className="text-xs text-gray-500">{row.applicantEmail}</p>
                </td>
                <td className="px-3 py-3 text-gray-700">{formatStageLabel(row.stage)}</td>
                <td className="px-3 py-3 text-gray-700">{row.resourceTitle}</td>
                <td className="px-3 py-3 text-gray-700 max-w-[520px] whitespace-pre-wrap">{row.responseText}</td>
                <td className="px-3 py-3 text-gray-600">{new Date(row.submittedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
