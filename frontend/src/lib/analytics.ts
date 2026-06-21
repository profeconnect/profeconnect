type AnalyticsValue = string | number | boolean;

export type AnalyticsEventParams = Record<
  string,
  AnalyticsValue | undefined
>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = (
  import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
)?.trim();
const analyticsEnabled =
  (import.meta.env.VITE_GA_ENABLED as string | undefined) === 'true';
const debugMode =
  (import.meta.env.VITE_GA_DEBUG as string | undefined) === 'true';

let initialized = false;

export function isAnalyticsFeatureEnabled(): boolean {
  return Boolean(analyticsEnabled && measurementId);
}

function ensureGtag() {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function () {
      window.dataLayer?.push(arguments);
    };
}

export function initializeAnalytics(): boolean {
  if (!isAnalyticsFeatureEnabled() || initialized || typeof window === 'undefined') {
    return initialized;
  }

  ensureGtag();

  const script = document.createElement('script');
  script.id = 'google-analytics-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId!)}`;
  script.addEventListener('error', () => {
    console.warn('No se pudo cargar Google Analytics.');
  });
  document.head.appendChild(script);

  window.gtag?.('js', new Date());
  window.gtag?.('config', measurementId, {
    send_page_view: false,
    debug_mode: debugMode,
  });

  initialized = true;
  return true;
}

export function trackPageView(pathname: string) {
  if (!initializeAnalytics()) return;

  window.gtag?.('event', 'page_view', {
    page_path: pathname,
    page_location: `${window.location.origin}${pathname}`,
    page_title: document.title,
    debug_mode: debugMode,
    send_to: measurementId!,
  });
}

export function trackEvent(
  eventName: string,
  params: AnalyticsEventParams = {}
) {
  if (!initializeAnalytics()) return;

  const safeParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );

  window.gtag?.('event', eventName, {
    ...safeParams,
    debug_mode: debugMode,
    send_to: measurementId!,
  });
}
