'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NavLoadingIndicator } from '@/components/nav-loading-indicator';
import { useNavigationLoading } from '@/components/navigation-loading';

type Viewer = {
  firstName: string;
  email?: string;
  role?: string;
  hrBinaryRole?: boolean;
  profilePictureUrl?: string;
};

export function ProfileMenu({ viewer }: { viewer: Viewer | null }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { startNavigation } = useNavigationLoading();

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!viewer) {
    return (
      <Link href="/login" className="hidden md:inline-flex items-center text-sm font-medium text-white hover:text-blue-300 transition-colors">
        Log in
      </Link>
    );
  }

  const dashboardHref = viewer.hrBinaryRole || viewer.role === 'admin' ? '/me/hr' : '/me/application';
  const stagesHref = '/me/hr/stages';
  const initials = viewer.firstName.slice(0, 1).toUpperCase();

  const navigateTo = (href: string) => {
    setOpen(false);
    startNavigation();
    startTransition(() => {
      router.push(href);
      router.refresh();
    });
  };

  return (
    <div ref={ref} className="relative hidden md:flex items-center gap-2">
      {viewer.profilePictureUrl ? (
        <Image src={viewer.profilePictureUrl} alt={viewer.firstName} width={32} height={32} className="rounded-full object-cover" />
      ) : (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
          {initials}
        </span>
      )}
      <NavLoadingIndicator />

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10 hover:text-blue-300 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-72 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl">
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
            <button type="button" onClick={() => navigateTo('/profile')} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-[#f7faff]">
              Profile
            </button>
            <button type="button" onClick={() => navigateTo(dashboardHref)} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-[#f7faff]">
              Dashboard
            </button>
            {viewer.hrBinaryRole && (
              <button type="button" onClick={() => navigateTo(stagesHref)} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-[#f7faff]">
                Stages
              </button>
            )}
            {viewer.hrBinaryRole && (
              <button type="button" onClick={() => navigateTo('/me/hr/responses')} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-[#f7faff]">
                Responses
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                startNavigation();
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

      {isPending && <span className="sr-only">Loading</span>}
    </div>
  );
}
