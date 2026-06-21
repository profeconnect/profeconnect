import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

export default function AnalyticsTracker() {
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const pathname = location.pathname;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    trackPageView(pathname);
  }, [location.pathname]);

  return null;
}
