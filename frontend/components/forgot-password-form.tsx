'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/button';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? 'Unable to send reset email.');
      setLoading(false);
      return;
    }

    setSuccess('If an applicant account exists for this email, a reset link has been sent.');
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-blue-100 bg-white p-8 shadow-xl">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">Password recovery</p>
        <h2 className="text-2xl font-bold text-gray-900">Forgot your password?</h2>
        <p className="mt-2 text-sm text-gray-600">Enter your applicant email and we’ll send you a reset link.</p>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#00349B]" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending link...' : 'Send reset link'}</Button>
      <Link href="/login" className="block text-center text-sm font-medium text-[#00349B] hover:underline">Back to login</Link>
    </form>
  );
}
