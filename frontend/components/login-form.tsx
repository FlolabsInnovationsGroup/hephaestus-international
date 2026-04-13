'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/button';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('ava.ross@example.com');
  const [password, setPassword] = useState('preview123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/preview-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Login failed' }));
      setError(data.error ?? 'Login failed');
      setLoading(false);
      return;
    }
    const data = await res.json();
    router.push(data.role === 'applicant' ? '/me/application' : '/me/hr');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-blue-100 bg-white p-8 shadow-xl">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#00349B]" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#00349B]" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span />
        <Link href="/login?forgot=1" className="text-sm font-medium text-[#00349B] hover:underline">Forgot my password</Link>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</Button>
    </form>
  );
}
