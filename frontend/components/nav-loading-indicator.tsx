'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationLoading } from '@/components/navigation-loading';

export function NavLoadingIndicator() {
  const pathname = usePathname();
  const { isNavigating, finishNavigation } = useNavigationLoading();

  useEffect(() => {
    finishNavigation();
  }, [pathname, finishNavigation]);

  if (!isNavigating) return null;

  return (
    <span
      aria-live="polite"
      aria-label="Loading next page"
      className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-[#4d79cc]"
    />
  );
}
