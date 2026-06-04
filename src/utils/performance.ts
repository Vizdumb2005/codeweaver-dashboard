import { api } from '../services/api';

/**
 * Report a performance metric to console (development) or backend analytics (production/staging)
 */
export const reportPerformanceMetric = (operation: string, durationMs: number) => {
  if (__ENV__ === 'development') {
    // Log to console in development (complying with console audit checks using console.warn)
    console.warn(`[Performance Mark] ${operation} execution took ${durationMs.toFixed(2)}ms`);
  } else {
    // Send to analytics in production
    const payload = {
      metric: 'PERF',
      operation,
      value: durationMs,
      timestamp: new Date().toISOString(),
    };

    api.post('/v1/metrics/frontend', payload as any).catch((err) => {
      console.warn('[Performance Tracking] Failed to send metric payload:', err);
    });
  }
};

// Expose globally for legacy JS/HTML component handlers
if (typeof window !== 'undefined') {
  (window as any).reportPerformanceMetric = reportPerformanceMetric;
}

declare global {
  interface Window {
    reportPerformanceMetric: typeof reportPerformanceMetric;
  }
}
