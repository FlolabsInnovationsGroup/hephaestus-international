'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { useNavigationLoading } from '@/components/navigation-loading';

export function NavLoadingIndicator() {
  const pathname = usePathname();
  const { isNavigating, finishNavigation } = useNavigationLoading();

  useEffect(() => {
    finishNavigation();
  }, [pathname, finishNavigation]);

  if (!isNavigating) return null;

  return (
    <Spinner size="md" className="text-blue-300" aria-label="Loading next page" />
  );
}
