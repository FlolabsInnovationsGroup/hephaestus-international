'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accountLabel, setAccountLabel] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? 'Invalid reset link');
        if (!cancelled) {
          setAccountLabel(data.reset?.email || data.reset?.name || '');
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The new password and confirmation do not match.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? 'Unable to reset password.');
      setLoading(false);
      return;
    }

    setSuccess('Password updated. Redirecting to login...');
    setLoading(false);
    setTimeout(() => {
      router.push('/login');
      router.refresh();
    }, 1200);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-blue-100 bg-white p-8 shadow-xl">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#00349B]">Password reset</p>
        <h2 className="text-2xl font-bold text-gray-900">Choose a new password</h2>
        <p className="mt-2 text-sm text-gray-600">{accountLabel ? `Resetting password for ${accountLabel}.` : 'Enter your new password below.'}</p>
      </div>
      <PasswordField label="New password" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
      <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Updating password...' : 'Update password'}</Button>
    </form>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 outline-none focus:border-[#00349B]" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#00349B]">{show ? 'Hide' : 'Show'}</button>
      </div>
    </div>
  );
}
