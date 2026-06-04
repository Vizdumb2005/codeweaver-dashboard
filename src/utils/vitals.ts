import { api } from '../services/api';

/**
 * Report a metric to the backend analytics endpoint
 */
export const reportMetric = (metric: 'LCP' | 'FID' | 'CLS', value: number, target: number) => {
  const satisfied = value < target;
  const payload = {
    metric,
    value,
    target,
    satisfied,
    timestamp: new Date().toISOString(),
  };

  api.post('/v1/metrics/frontend', payload).catch((err) => {
    console.warn(`[Web Vitals] Failed to send ${metric} metric:`, err);
  });
};

/**
 * Start tracking Core Web Vitals (LCP, FID, CLS) using native PerformanceObservers
 */
export const trackWebVitals = () => {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return;
  }

  // 1. LCP (Largest Contentful Paint) - Target < 2.5s (2500ms)
  let lcpValue: number | null = null;
  let lcpReported = false;

  const sendLCP = () => {
    if (lcpValue !== null && !lcpReported) {
      reportMetric('LCP', lcpValue, 2500);
      lcpReported = true;
    }
  };

  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcpValue = lastEntry.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // Gracefully handle environments without LCP support
  }

  // 2. FID (First Input Delay) - Target < 100ms
  let fidReported = false;
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const entry = entryList.getEntries()[0];
      if (entry && !fidReported) {
        const fidValue = (entry as any).processingStart - entry.startTime;
        reportMetric('FID', fidValue, 100);
        fidReported = true;
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    // Gracefully handle environments without FID support
  }

  // 3. CLS (Cumulative Layout Shift) - Target < 0.1
  let clsValue = 0;
  let clsReported = false;

  const sendCLS = () => {
    if (!clsReported) {
      reportMetric('CLS', clsValue, 0.1);
      clsReported = true;
    }
  };

  try {
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    // Gracefully handle environments without CLS support
  }

  // Listen for interaction events to finalize LCP measurement
  ['click', 'keydown', 'pointerdown'].forEach((type) => {
    window.addEventListener(type, sendLCP, { once: true, capture: true });
  });

  // Ensure metrics are reported when page visibility changes or user unloads the page
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendLCP();
      sendCLS();
    }
  });

  window.addEventListener('beforeunload', () => {
    sendLCP();
    sendCLS();
  });
};
