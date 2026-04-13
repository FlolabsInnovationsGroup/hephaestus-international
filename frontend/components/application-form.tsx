'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { LocationPicker } from '@/components/location-picker';
import { SourceSelect } from '@/components/source-select';

const phoneCodes = ['+1', '+33', '+34', '+39', '+44', '+49', '+91', '+971'];

export function ApplicationForm({ roleTitle, sourceOptions }: { roleTitle: string; sourceOptions: string[] }) {
  const normalizedSourceOptions = sourceOptions.length > 0 ? sourceOptions : ['Other'];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneCountryCode: '+33',
    phoneNumber: '',
    country: 'France',
    stateRegion: '',
    city: '',
    latitude: '48.8566',
    longitude: '2.3522',
    linkedinUrl: '',
    education: '',
    source: normalizedSourceOptions[0] ?? 'Other',
    referralName: '',
    cvFileName: '',
    cvUrl: '',
    safeSendersConfirmed: false,
    communicationConsent: false,
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.password.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('The new password and confirmation do not match.');
      return;
    }
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
        <Field label="Phone number*">
          <div className="flex gap-2">
            <select value={form.phoneCountryCode} onChange={(e) => update('phoneCountryCode', e.target.value)} className={`${inputClass} max-w-[110px]`}>
              {phoneCodes.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
            <input required value={form.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} className={inputClass} />
          </div>
        </Field>
        <Field label="New password*">
          <PasswordInput value={form.password} show={showPassword} onToggle={() => setShowPassword((v) => !v)} onChange={(value) => update('password', value)} helper="This password will be used for the new applicant profile you are creating now." />
        </Field>
        <Field label="Confirm new password*">
          <PasswordInput value={form.confirmPassword} show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} onChange={(value) => update('confirmPassword', value)} />
        </Field>
        <Field label="LinkedIn URL*"><input required value={form.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} className={inputClass} /></Field>
        <Field label="Source*">
          <SourceSelect options={normalizedSourceOptions} value={form.source} onChange={(value) => update('source', value)} />
        </Field>
        <Field label="Role*"><input value={roleTitle} disabled className={`${inputClass} bg-gray-100`} /></Field>
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
              const data = await res.json().catch(() => ({ error: 'CV upload failed.' }));
              if (!res.ok) {
                setError(data.details ? `${data.error} (${data.details})` : (data.error ?? 'CV upload failed.'));
                setUploadingCv(false);
                return;
              }
              update('cvFileName', data.cvFileName ?? file.name);
              update('cvUrl', data.cvUrl ?? '');
              if (data.warning) {
                setError(data.warning);
              }
              setUploadingCv(false);
            }}
            className={inputClass}
          />
          <p className="text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX.</p>
          {uploadingCv && <p className="text-sm text-[#00349B]">Uploading CV...</p>}
          {form.cvFileName && <p className="text-sm text-green-700">Uploaded: {form.cvFileName}</p>}
        </div>
      </Field>

      <div className="rounded-xl border border-blue-100 bg-white p-5">
        <p className="font-semibold text-gray-900">Location picker</p>
        <p className="mt-1 text-sm text-gray-600">Click the map or drag the marker. We will extract the city, state/region, and country automatically from the selected point.</p>
        <div className="mt-4 h-48 w-full overflow-hidden rounded-2xl">
          <LocationPicker
            latitude={Number(form.latitude)}
            longitude={Number(form.longitude)}
            onChange={(lat, lng, city, country, stateRegion) => {
              update('latitude', lat);
              update('longitude', lng);
              if (city) update('city', city);
              if (country) update('country', country);
              if (stateRegion) update('stateRegion', stateRegion);
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
      <Button type="submit" disabled={loading || uploadingCv || !form.safeSendersConfirmed || !form.communicationConsent} className="w-full">
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

function PasswordInput({ value, onChange, show, onToggle, helper }: { value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void; helper?: string }) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <input type={show ? 'text' : 'password'} required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} pr-20`} />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#00349B]">{show ? 'Hide' : 'Show'}</button>
      </div>
      {helper && <p className="flex items-start gap-2 text-xs text-gray-500"><span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[10px] font-bold text-[#00349B]">i</span><span>{helper}</span></p>}
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#00349B]';
