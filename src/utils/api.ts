/* eslint-disable */
// API Utilities

import type { ApiError, ApiResponse } from '../types/api';

/**
 * Configuration for API requests
 */
export interface ApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Default API configuration
 */
const defaultConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
};

/**
 * HTTP request methods
 */
export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

/**
 * Request options
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, boolean | number | string>;
  data?: FormData | Record<string, unknown>;
  timeout?: number;
}

/**
 * Create an API client with configuration
 */
export class ApiClient {
  private readonly config: ApiConfig;

  constructor(config: ApiConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, boolean | number | string>): string {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Make an HTTP request
   */
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { params, data, timeout = this.config.timeout, ...fetchOptions } = options;

    const url = this.buildUrl(endpoint, params);

    const headers: Record<string, string> = {
      ...this.config.headers,
      ...(fetchOptions.headers as Record<string, string>),
    };

    // Handle FormData separately (don't set Content-Type)
    let body: BodyInit | undefined;
    if (data) {
      if (data instanceof FormData) {
        body = data;
        delete headers['Content-Type'];
      } else {
        body = JSON.stringify(data);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
        ...fetchOptions,
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
          };
        } catch {
          error = {
            message: response.statusText,
            code: String(response.status),
          };
        }
        throw error;
      }

      try {
        const result = await response.json();
        return {
          data: result,
          success: true,
        };
      } catch {
        return {
          data: {} as T,
          success: true,
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        throw {
          message: error.message,
          code: 'NETWORK_ERROR',
        } as ApiError;
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, options);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data: FormData | Record<string, unknown>,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { ...options, data });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data: Record<string, unknown>,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { ...options, data });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data: Record<string, unknown>,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, { ...options, data });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options);
  }
}

// Export a singleton instance
export const api = new ApiClient();
