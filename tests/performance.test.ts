import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportPerformanceMetric } from '../src/utils/performance';
import { api } from '../src/services/api';

vi.mock('../src/services/api', () => {
  return {
    api: {
      post: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

describe('Performance Metric Logger & Reporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register global function on window', () => {
    expect(window.reportPerformanceMetric).toBeTypeOf('function');
  });

  it('should post metric payload in production/test environments', () => {
    reportPerformanceMetric('tab-switch-time', 24.5);
    expect(api.post).toHaveBeenCalledWith(
      '/v1/metrics/frontend',
      expect.objectContaining({
        metric: 'PERF',
        operation: 'tab-switch-time',
        value: 24.5,
        timestamp: expect.any(String),
      })
    );
  });
});
