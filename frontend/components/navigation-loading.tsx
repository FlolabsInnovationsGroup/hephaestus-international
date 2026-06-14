'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type NavigationLoadingContextValue = {
  isNavigating: boolean;
  startNavigation: () => void;
  finishNavigation: () => void;
};

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(null);

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const startNavigation = useCallback(() => setIsNavigating(true), []);
  const finishNavigation = useCallback(() => setIsNavigating(false), []);

  const value = useMemo<NavigationLoadingContextValue>(() => ({
    isNavigating,
    startNavigation,
    finishNavigation,
  }), [finishNavigation, isNavigating, startNavigation]);

  return <NavigationLoadingContext.Provider value={value}>{children}</NavigationLoadingContext.Provider>;
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error('useNavigationLoading must be used within NavigationLoadingProvider');
  }
  return context;
}
