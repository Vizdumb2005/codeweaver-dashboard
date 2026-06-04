/* eslint-disable */
// API Service Client Abstraction

import type { ApiError, ApiResponse } from '../types/api';

/**
 * Configuration for API client requests
 */
export interface ApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * HTTP request methods supported by the API client
 */
export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

/**
 * Custom request options extending default fetch configuration
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, boolean | number | string>;
  data?: FormData | Record<string, unknown>;
  timeout?: number;
  retries?: number;
}

export type RequestInterceptor = (
  options: RequestOptions & { headers: Record<string, string>; url: string }
) => any | Promise<any>;

export type ResponseInterceptor = (response: ApiResponse<any>) => ApiResponse<any> | Promise<ApiResponse<any>>;
export type ErrorInterceptor = (error: any) => any | Promise<any>;

/**
 * Premium API Client supporting interceptors, retry cycles, and abort-timeouts
 */
export class ApiClient {
  private readonly config: ApiConfig;
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private readonly errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ApiConfig = {}) {
    this.config = {
      baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * Registers a callback to intercept requests before dispatching
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Registers a callback to intercept successful responses
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Registers a callback to intercept request failures
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Builds the full request URL incorporating query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, boolean | number | string>): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      const url = new URL(endpoint);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      return url.toString();
    }

    const base = this.config.baseUrl || '';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const urlStr = `${cleanBase}${cleanEndpoint}`;

    try {
      const url = new URL(urlStr, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      return url.toString();
    } catch {
      let queryStr = '';
      if (params) {
        const queryParams = Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&');
        if (queryParams) queryStr = `?${queryParams}`;
      }
      return `${urlStr}${queryStr}`;
    }
  }

  /**
   * Core request dispatcher with retry mechanism
   */
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const reqOptions = { ...options };
    const {
      params,
      data,
      timeout = this.config.timeout || 10000,
      retries = this.config.retries || 0,
    } = reqOptions;

    let url = this.buildUrl(endpoint, params);
    let headers: Record<string, string> = {
      ...this.config.headers,
      ...(reqOptions.headers as Record<string, string>),
    };

    // Run Request Interceptors
    for (const interceptor of this.requestInterceptors) {
      try {
        const result = await interceptor({ ...reqOptions, headers, url });
        if (result) {
          if (result.headers) headers = { ...headers, ...result.headers };
          if (result.url) url = result.url;
        }
      } catch (err) {
        console.error('[API Client] Request interceptor error:', err);
      }
    }

    let body: BodyInit | undefined;
    if (data) {
      if (data instanceof FormData) {
        body = data;
        delete headers['Content-Type'];
      } else {
        body = JSON.stringify(data);
      }
    }

    const executeAttempt = async (attempt: number): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal,
          ...reqOptions,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let error: ApiError;
          try {
            const errorData = await response.json().catch(() => ({}));
            error = {
              message: errorData.message || response.statusText,
              code: String(response.status),
              details: errorData,
              timestamp: new Date().toISOString(),
            };
          } catch {
            error = {
              message: response.statusText,
              code: String(response.status),
              details: {},
              timestamp: new Date().toISOString(),
            };
          }
          throw error;
        }

        let resultData: T;
        try {
          resultData = await response.json();
        } catch {
          resultData = {} as T;
        }

        let apiResponse: ApiResponse<T> = {
          data: resultData,
          success: true,
        };

        // Run Response Interceptors
        for (const interceptor of this.responseInterceptors) {
          apiResponse = await interceptor(apiResponse);
        }

        return apiResponse;
      } catch (error: any) {
        clearTimeout(timeoutId);

        let interceptedError = error;
        // Run Error Interceptors
        for (const interceptor of this.errorInterceptors) {
          try {
            interceptedError = await interceptor(interceptedError);
          } catch (err) {
            console.error('[API Client] Error interceptor failed:', err);
          }
        }

        const isNetworkError =
          error.code === 'NETWORK_ERROR' ||
          error.name === 'AbortError' ||
          error.message?.includes('fetch') ||
          !error.code;

        const isServerError = error.code && error.code.startsWith('5');

        if ((isNetworkError || isServerError) && attempt < retries) {
          const delayTime = (this.config.retryDelay || 1000) * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delayTime));
          return executeAttempt(attempt + 1);
        }

        if (error.name === 'AbortError') {
          throw {
            message: `Request timed out after ${timeout}ms`,
            code: 'TIMEOUT',
            details: {},
            timestamp: new Date().toISOString(),
          } as ApiError;
        }

        throw interceptedError;
      }
    };

    return executeAttempt(0);
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, options);
  }

  async post<T>(
    endpoint: string,
    data: FormData | Record<string, unknown>,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { ...options, data });
  }

  async put<T>(
    endpoint: string,
    data: Record<string, unknown>,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { ...options, data });
  }

  async patch<T>(
    endpoint: string,
    data: Record<string, unknown>,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, { ...options, data });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options);
  }
}

export const api = new ApiClient();

if (__ENV__ === 'development') {
  api.addRequestInterceptor((options) => {
    console.warn(
      `%c[API Request] %c${options.method || 'GET'}%c ${options.url}`,
      'color: #3b82f6; font-weight: bold;',
      'color: #10b981; font-weight: bold;',
      'color: var(--text-primary);',
      options.data || ''
    );
    return options;
  });

  api.addResponseInterceptor((response) => {
    console.warn(
      `%c[API Response] %cSuccess: ${response.success}`,
      'color: #10b981; font-weight: bold;',
      'color: var(--text-primary);',
      response.data
    );
    return response;
  });

  api.addErrorInterceptor((error) => {
    console.error(
      `%c[API Error] %c${error.code || 'UNKNOWN'}: ${error.message}`,
      'color: #ef4444; font-weight: bold;',
      'color: var(--text-primary);',
      error.details || error
    );
    return error;
  });
}
