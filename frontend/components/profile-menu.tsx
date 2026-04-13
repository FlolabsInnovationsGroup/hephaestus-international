'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Viewer = {
  firstName: string;
  email?: string;
  role?: string;
  hrBinaryRole?: boolean;
  profilePictureUrl?: string;
};

export function ProfileMenu({ viewer }: { viewer: Viewer | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  if (!viewer) {
    return (
      <Link href="/login" className="hidden md:inline-flex items-center text-sm font-medium text-white hover:text-blue-300 transition-colors">
        Log in
      </Link>
    );
  }

  const dashboardHref = viewer.hrBinaryRole || viewer.role === 'admin' ? '/me/hr' : '/me/application';
  const initials = viewer.firstName.slice(0, 1).toUpperCase();

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-blue-300 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {viewer.profilePictureUrl ? (
          <Image src={viewer.profilePictureUrl} alt={viewer.firstName} width={28} height={28} className="rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">
            {initials}
          </span>
        )}
        <span>Profile</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl">
          <div className="border-b border-blue-50 px-4 py-4">
            <div className="flex items-center gap-3">
              {viewer.profilePictureUrl ? (
                <Image src={viewer.profilePictureUrl} alt={viewer.firstName} width={44} height={44} className="rounded-full object-cover" />
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#eef5ff] text-sm font-semibold text-[#00349B]">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{viewer.firstName}</p>
                {viewer.email && <p className="truncate text-xs text-gray-500">{viewer.email}</p>}
              </div>
            </div>
          </div>

          <div className="p-2">
            <Link href="/profile" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-[#f7faff]">
              My info
            </Link>
            <Link href={dashboardHref} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-[#f7faff]">
              Dashboard
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/auth/preview-logout', { method: 'POST' });
                setOpen(false);
                router.push('/');
                router.refresh();
              }}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
