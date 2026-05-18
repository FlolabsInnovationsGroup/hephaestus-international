'use client';

import { useState } from 'react';
import { formatStageLabel } from '@/lib/stage-definitions';

type HrFiltersProps = {
  params: {
    lead?: string;
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
    more?: string;
  };
  stageOptions: string[];
  statusOptions: string[];
  sourceOptions: string[];
  countryOptions: string[];
  cityOptions: string[];
};

export function HrFilters({ params, stageOptions, statusOptions, sourceOptions, countryOptions, cityOptions }: HrFiltersProps) {
  const [moreOpen, setMoreOpen] = useState(params.more === '1');

  return (
    <form className="space-y-4" method="get">
      <input type="hidden" name="lead" value={params.lead ?? ''} />
      <input type="hidden" name="more" value={moreOpen ? '1' : '0'} />
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="xl:max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">HR workspace</p>
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Applicants and conversations</h1>
          <p className="mt-2 text-gray-600">Preview of the lead management area for Chronos admins with the HR binary role.</p>
        </div>
        <div className="flex-1 xl:max-w-[1100px]">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="Search"><input name="q" defaultValue={params.q ?? ''} placeholder="Search leads" className={inputClass} /></FilterField>
            <FilterField label="Stage"><select name="stage" defaultValue={params.stage ?? ''} className={inputClass}><option value="">All stages</option>{stageOptions.map((value) => <option key={value} value={value}>{formatStageLabel(value)}</option>)}</select></FilterField>
            <FilterField label="Status"><select name="status" defaultValue={params.status ?? ''} className={inputClass}><option value="">All statuses</option>{statusOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></FilterField>
            <FilterField label="Source"><select name="source" defaultValue={params.source ?? ''} className={inputClass}><option value="">All sources</option>{sourceOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></FilterField>
            <FilterField label="Sort by"><select name="sort" defaultValue={params.sort ?? 'joined_desc'} className={inputClass}><option value="joined_desc">Newest joined</option><option value="joined_asc">Oldest joined</option><option value="visited_desc">Recently visited</option><option value="visited_asc">Least recently visited</option><option value="name_asc">Name A-Z</option><option value="name_desc">Name Z-A</option></select></FilterField>
            <FilterField label="Duplicate review"><select name="duplicateReview" defaultValue={params.duplicateReview ?? ''} className={inputClass}><option value="">Any</option><option value="has_pending">Has pending review</option><option value="confirmed_duplicate">Confirmed duplicate</option><option value="different_people">Different people</option><option value="merged">Merged</option><option value="none">No duplicate review</option></select></FilterField>
            <FilterField label="Notion page"><select name="hasNotion" defaultValue={params.hasNotion ?? ''} className={inputClass}><option value="">All leads</option><option value="yes">Has Notion page</option><option value="no">No Notion page</option></select></FilterField>
            <FilterField label="More"><button type="button" onClick={() => setMoreOpen((v) => !v)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">...</button></FilterField>
            <FilterField label="Apply"><button type="submit" data-testid="apply-filter" className="w-full rounded-xl bg-[#00349B] px-4 py-3 text-sm font-semibold text-white">Apply</button></FilterField>
          </div>
          {moreOpen && (
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Country"><select name="country" defaultValue={params.country ?? ''} className={inputClass}><option value="">All countries</option>{countryOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></FilterField>
              <FilterField label="City"><select name="city" defaultValue={params.city ?? ''} className={inputClass}><option value="">All cities</option>{cityOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></FilterField>
              <FilterField label="Joined from"><input type="date" name="joinedFrom" defaultValue={params.joinedFrom ?? ''} className={inputClass} /></FilterField>
              <FilterField label="Joined to"><input type="date" name="joinedTo" defaultValue={params.joinedTo ?? ''} className={inputClass} /></FilterField>
              <FilterField label="Visited from"><input type="date" name="visitedFrom" defaultValue={params.visitedFrom ?? ''} className={inputClass} /></FilterField>
              <FilterField label="Visited to"><input type="date" name="visitedTo" defaultValue={params.visitedTo ?? ''} className={inputClass} /></FilterField>
              <FilterField label="Reset"><a href="/me/hr" className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Reset filters</a></FilterField>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00349B]';
