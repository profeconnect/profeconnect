import { useEffect, type ReactNode } from 'react';
import { initializeAnalytics } from '../lib/analytics';
import { AnalyticsContext } from './analytics-context';

const noopValue = {
  consent: 'accepted' as const,
  accept: () => {},
  reject: () => {},
  openPreferences: () => {},
};

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initializeAnalytics();
  }, []);

  return (
    <AnalyticsContext.Provider value={noopValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}
