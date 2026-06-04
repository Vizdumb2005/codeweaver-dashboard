import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackWebVitals, reportMetric } from '../src/utils/vitals';
import { api } from '../src/services/api';

vi.mock('../src/services/api', () => {
  return {
    api: {
      post: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

describe('Web Vitals Tracking', () => {
  let originalPerformanceObserver: any;
  let observeMock: any;
  let disconnectMock: any;
  let observerCallback: any;

  beforeEach(() => {
    vi.clearAllMocks();
    observeMock = vi.fn();
    disconnectMock = vi.fn();

    // Mock PerformanceObserver
    originalPerformanceObserver = global.PerformanceObserver;
    global.PerformanceObserver = class {
      constructor(callback: any) {
        observerCallback = callback;
      }
      observe = observeMock;
      disconnect = disconnectMock;
    } as any;
  });

  afterEach(() => {
    global.PerformanceObserver = originalPerformanceObserver;
  });

  it('should report metrics correctly via reportMetric', async () => {
    reportMetric('LCP', 1500, 2500);
    expect(api.post).toHaveBeenCalledWith('/v1/metrics/frontend', expect.objectContaining({
      metric: 'LCP',
      value: 1500,
      target: 2500,
      satisfied: true,
    }));

    reportMetric('FID', 120, 100);
    expect(api.post).toHaveBeenCalledWith('/v1/metrics/frontend', expect.objectContaining({
      metric: 'FID',
      value: 120,
      target: 100,
      satisfied: false,
    }));
  });

  it('should register LCP, FID, and CLS observers', () => {
    trackWebVitals();
    expect(observeMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'largest-contentful-paint' }));
    expect(observeMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'first-input' }));
    expect(observeMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'layout-shift' }));
  });

  it('should register visibility and unload event listeners', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    trackWebVitals();

    expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });
});
