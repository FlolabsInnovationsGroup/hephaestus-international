'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { LocationPicker } from '@/components/location-picker';

const sourceOptions = ['LinkedIn', 'University', 'Referral', 'Search engine', 'Social media', 'Other'];

export function ApplicationForm({ roleTitle }: { roleTitle: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    country: 'France',
    stateRegion: '',
    city: '',
    latitude: '48.8566',
    longitude: '2.3522',
    linkedinUrl: '',
    education: '',
    source: 'LinkedIn',
    referralName: '',
    cvFileName: '',
    cvUrl: '',
    safeSendersConfirmed: false,
    communicationConsent: false,
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, roleAppliedFor: roleTitle }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Unable to create application' }));
      setError(data.error ?? 'Unable to create application');
      setLoading(false);
      return;
    }
    router.push('/me/application');
    router.refresh();
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-blue-100 bg-[#f7faff] p-8 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">Apply directly</p>
        <h4 className="mt-2 text-2xl font-bold text-gray-900">Internship application form</h4>
        <p className="mt-2 text-sm text-gray-600">After submission, your applicant profile will be created, and your dashboard will open immediately.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="First name*"><input required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className={inputClass} /></Field>
        <Field label="Last name*"><input required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className={inputClass} /></Field>
        <Field label="Email*"><input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} /></Field>
        <Field label="Password*"><input type="password" required minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} className={inputClass} /></Field>
        <Field label="Phone number*"><input required value={form.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} className={inputClass} /></Field>
        <Field label="State / Region"><input value={form.stateRegion} onChange={(e) => update('stateRegion', e.target.value)} className={inputClass} /></Field>
        <Field label="LinkedIn URL*"><input required value={form.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} className={inputClass} /></Field>
        <Field label="Source*">
          <select value={form.source} onChange={(e) => update('source', e.target.value)} className={inputClass}>
            {sourceOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Job title*"><input value={roleTitle} disabled className={`${inputClass} bg-gray-100`} /></Field>
        <Field label="Referral name"><input value={form.referralName} onChange={(e) => update('referralName', e.target.value)} className={inputClass} /></Field>
      </div>

      <Field label="Education*"><textarea required value={form.education} onChange={(e) => update('education', e.target.value)} className={`${inputClass} min-h-28`} /></Field>
      <Field label="CV / Resume*">
        <div className="space-y-3">
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingCv(true);
              setError('');
              const uploadData = new FormData();
              uploadData.append('file', file);
              const res = await fetch('/api/applications/cv', { method: 'POST', body: uploadData });
              const data = await res.json().catch(() => ({ error: 'Upload failed' }));
              if (!res.ok) {
                setError(data.error ?? 'Upload failed');
                setUploadingCv(false);
                return;
              }
              update('cvFileName', data.cvFileName ?? file.name);
              update('cvUrl', data.cvUrl ?? '');
              setUploadingCv(false);
            }}
            className={inputClass}
          />
          <p className="text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX. Stored in Vercel Blob.</p>
          {uploadingCv && <p className="text-sm text-[#00349B]">Uploading CV...</p>}
          {form.cvFileName && <p className="text-sm text-green-700">Uploaded: {form.cvFileName}</p>}
        </div>
      </Field>

      <div className="rounded-xl border border-blue-100 bg-white p-5">
        <p className="font-semibold text-gray-900">Location picker</p>
        <p className="mt-1 text-sm text-gray-600">Click the map or drag the marker. We will extract the city and country automatically from the selected point.</p>
        <div className="mt-4 h-48 w-full overflow-hidden rounded-2xl">
          <LocationPicker 
            latitude={Number(form.latitude)} 
            longitude={Number(form.longitude)} 
            onChange={(lat, lng, city, country) => {
              update('latitude', lat);
              update('longitude', lng);
              if (city) update('city', city);
              if (country) update('country', country);
            }} 
          />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm text-gray-700">
        <input type="checkbox" checked={form.safeSendersConfirmed} onChange={(e) => update('safeSendersConfirmed', e.target.checked)} className="mt-1" />
        <span>I added hr@flolabsinnovations.com to my contacts / safe senders*</span>
      </label>
      <label className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm text-gray-700">
        <input type="checkbox" checked={form.communicationConsent} onChange={(e) => update('communicationConsent', e.target.checked)} className="mt-1" />
        <span>By submitting, I consent to receiving relevant communications regarding my application.*</span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading || !form.safeSendersConfirmed || !form.communicationConsent} className="w-full">
        {loading ? 'Creating profile...' : 'Submit application'}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#00349B]';
