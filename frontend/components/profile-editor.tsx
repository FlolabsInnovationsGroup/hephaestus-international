'use client';

import { useState } from 'react';

type Viewer = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  stateRegion?: string;
  city: string;
  linkedinUrl: string;
  education: string;
  profilePictureUrl?: string;
};

export function ProfileEditor({ viewer }: { viewer: Viewer }) {
  const [form, setForm] = useState(viewer);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    setError('');
    const res = await fetch('/api/applications/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) setSaved(true);
  }

  function set<K extends keyof Viewer>(key: K, value: Viewer[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-4 md:grid-cols-2 text-sm text-gray-700">
      <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#e9f1ff] text-xl font-semibold text-[#00349B]">
            {form.profilePictureUrl ? <img src={form.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" /> : `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Profile picture</p>
            <p className="mt-1 text-sm text-gray-600">Upload a JPG, PNG, or WEBP image to store alongside the applicant record.</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                setError('');
                const payload = new FormData();
                payload.append('file', file);
                const res = await fetch('/api/applications/profile-picture', { method: 'POST', body: payload });
                const data = await res.json().catch(() => ({ error: 'Upload failed' }));
                if (!res.ok) {
                  setError(data.error ?? 'Upload failed');
                  setUploading(false);
                  return;
                }
                set('profilePictureUrl', data.profilePictureUrl ?? '');
                setUploading(false);
              }}
              className="mt-3 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#00349B]"
            />
            {uploading && <p className="mt-2 text-sm text-[#00349B]">Uploading picture...</p>}
          </div>
        </div>
      </div>
      <Field label="First name"><input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputClass} /></Field>
      <Field label="Last name"><input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputClass} /></Field>
      <Field label="Email"><input value={form.email} disabled className={`${inputClass} bg-gray-100`} /></Field>
      <Field label="Phone number"><input value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} className={inputClass} /></Field>
      <Field label="Country"><input value={form.country} onChange={(e) => set('country', e.target.value)} className={inputClass} /></Field>
      <Field label="State / Region"><input value={form.stateRegion ?? ''} onChange={(e) => set('stateRegion', e.target.value)} className={inputClass} /></Field>
      <Field label="City"><input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} /></Field>
      <Field label="LinkedIn"><input value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} className={inputClass} /></Field>
      <div className="md:col-span-2">
        <Field label="Education"><textarea value={form.education} onChange={(e) => set('education', e.target.value)} className={`${inputClass} min-h-28`} /></Field>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button className="rounded-xl bg-[#00349B] px-5 py-3 font-semibold text-white">{loading ? 'Saving...' : 'Save profile changes'}</button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block font-semibold">{label}</span>{children}</label>;
}

const inputClass = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#00349B]';
