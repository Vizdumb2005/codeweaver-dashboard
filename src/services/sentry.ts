import { api } from './api';
import { dashboardStore } from '../store/store';

export interface Breadcrumb {
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  timestamp: string;
  data?: any;
}

export interface ErrorReport {
  message: string;
  stack: string;
  breadcrumbs: Breadcrumb[];
  extra?: any;
  dsn: string;
  timestamp: string;
}

class SentryPlaceholder {
  private breadcrumbs: Breadcrumb[] = [];
  private readonly maxBreadcrumbs = 100;
  private isInitialized = false;

  /**
   * Initializes global error listeners and subscriptions
   */
  init() {
    if (this.isInitialized) return;

    const dsn = import.meta.env.VITE_SENTRY_DSN || '';
    if (!dsn) {
      console.warn('[Sentry Placeholder] No DSN provided. Error tracking will run in offline mode.');
    }

    // 1. Capture Unhandled Exceptions
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message));
    });

    // 2. Capture Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const errorInstance = reason instanceof Error ? reason : new Error(String(reason));
      this.captureException(errorInstance);
    });

    // 3. Navigation Breadcrumbs (subscribe to store changes)
    try {
      dashboardStore.subscribe((state, prevState) => {
        if (state.activeTab !== prevState.activeTab) {
          this.addBreadcrumb({
            category: 'navigation',
            message: `Navigated from "${prevState.activeTab}" to "${state.activeTab}"`,
            level: 'info',
          });
        }
      });
    } catch (e) {
      // Gracefully bypass if store isn't available during testing
    }

    // 4. User Interaction Breadcrumbs (clicks)
    window.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      const id = target.id ? `#${target.id}` : '';
      const className = target.className && typeof target.className === 'string'
        ? `.${target.className.split(' ').join('.')}`
        : '';
      const text = target.innerText ? ` ("${target.innerText.slice(0, 30).trim()}")` : '';
      this.addBreadcrumb({
        category: 'ui',
        message: `User clicked: ${target.tagName.toLowerCase()}${id}${className}${text}`,
        level: 'info',
      });
    }, true); // Capture phase to trace clicks early

    // 5. API Request/Response Breadcrumbs via API Interceptors
    try {
      api.addRequestInterceptor((options) => {
        // Prevent infinite reporting loop by skipping error/vitals reports
        if (options.url.includes('/v1/errors') || options.url.includes('/v1/metrics/frontend')) {
          return options;
        }
        this.addBreadcrumb({
          category: 'api',
          message: `Request: ${options.method || 'GET'} ${options.url}`,
          level: 'info',
        });
        return options;
      });

      api.addResponseInterceptor((response) => {
        this.addBreadcrumb({
          category: 'api',
          message: `Response Success: ${response.success}`,
          level: 'info',
        });
        return response;
      });

      api.addErrorInterceptor((error) => {
        this.addBreadcrumb({
          category: 'api',
          message: `Request Error: ${error.code || 'UNKNOWN'} - ${error.message}`,
          level: 'error',
        });
        return error;
      });
    } catch (e) {
      // Gracefully bypass
    }

    this.isInitialized = true;
    this.addBreadcrumb({
      category: 'lifecycle',
      message: 'Sentry tracking initialized',
      level: 'info',
    });
  }

  /**
   * Add a new breadcrumb to the local buffer
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>) {
    const newBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    };
    this.breadcrumbs.push(newBreadcrumb);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Manually capture and report an exception
   */
  captureException(error: Error | string | any, extraContext?: any) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    const dsn = import.meta.env.VITE_SENTRY_DSN || 'local-fallback';

    const payload: ErrorReport = {
      message: errorInstance.message,
      stack: errorInstance.stack || '',
      breadcrumbs: [...this.breadcrumbs],
      extra: extraContext,
      dsn,
      timestamp: new Date().toISOString(),
    };

    // Log the error to the dev console complying with the console checking rules
    console.error('[Sentry Error Telemetry]:', errorInstance, payload);

    // Send payload to backend error tracker endpoint
    api.post('/v1/errors', payload as any).catch((err) => {
      console.warn('[Sentry Placeholder] Failed to submit telemetry report:', err);
    });
  }

  /**
   * Capture custom debug/log messages
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' | 'debug' = 'info') {
    this.addBreadcrumb({
      category: 'manual',
      message,
      level,
    });
  }

  /**
   * Retrieve currently cached breadcrumbs for inspection or unit testing
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Reset local breadcrumb list (primarily for tests)
   */
  clear() {
    this.breadcrumbs = [];
  }
}

export const sentry = new SentryPlaceholder();
