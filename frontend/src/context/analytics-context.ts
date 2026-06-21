import { createContext, useContext } from 'react';

export type AnalyticsConsent = 'accepted' | 'denied' | null;

export interface AnalyticsContextValue {
  consent: AnalyticsConsent;
  accept: () => void;
  reject: () => void;
  openPreferences: () => void;
}

export const AnalyticsContext = createContext<
  AnalyticsContextValue | undefined
>(undefined);

export function useAnalyticsConsent(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error(
      'useAnalyticsConsent debe usarse dentro de AnalyticsProvider'
    );
  }

  return context;
}

