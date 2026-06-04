import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sentry } from '../src/services/sentry';
import { api } from '../src/services/api';

vi.mock('../src/services/api', () => {
  return {
    api: {
      post: vi.fn().mockResolvedValue({ success: true }),
      // Mock other methods if necessary
      addRequestInterceptor: vi.fn(),
      addResponseInterceptor: vi.fn(),
      addErrorInterceptor: vi.fn(),
    },
  };
});

describe('Sentry Placeholder Error Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sentry.clear();
  });

  it('should initialize and register breadcrumbs correctly', () => {
    sentry.init();
    sentry.addBreadcrumb({
      category: 'test',
      message: 'Test breadcrumb message',
      level: 'info',
    });

    const breadcrumbs = sentry.getBreadcrumbs();
    expect(breadcrumbs.length).toBeGreaterThan(0);
    expect(breadcrumbs[breadcrumbs.length - 1]).toEqual(
      expect.objectContaining({
        category: 'test',
        message: 'Test breadcrumb message',
        level: 'info',
      })
    );
  });

  it('should cap breadcrumbs list at maximum size of 100', () => {
    sentry.init();
    for (let i = 0; i < 120; i++) {
      sentry.addBreadcrumb({
        category: 'loop',
        message: `Message number ${i}`,
        level: 'debug',
      });
    }

    const breadcrumbs = sentry.getBreadcrumbs();
    expect(breadcrumbs.length).toBe(100);
    expect(breadcrumbs[0].message).toBe('Message number 20');
  });

  it('should successfully post an exception payload when calling captureException', () => {
    sentry.init();
    sentry.addBreadcrumb({
      category: 'lifecycle',
      message: 'Initial state before crash',
      level: 'info',
    });

    const mockError = new Error('Test unhandled crash');
    sentry.captureException(mockError, { component: 'AppShell' });

    expect(api.post).toHaveBeenCalledWith(
      '/v1/errors',
      expect.objectContaining({
        message: 'Test unhandled crash',
        stack: expect.any(String),
        extra: { component: 'AppShell' },
        breadcrumbs: expect.any(Array),
        dsn: expect.any(String),
        timestamp: expect.any(String),
      })
    );
  });

  it('should support captureMessage and log it to breadcrumbs', () => {
    sentry.init();
    sentry.captureMessage('Debug message logged', 'warning');

    const breadcrumbs = sentry.getBreadcrumbs();
    expect(breadcrumbs[breadcrumbs.length - 1]).toEqual(
      expect.objectContaining({
        category: 'manual',
        message: 'Debug message logged',
        level: 'warning',
      })
    );
  });
});
