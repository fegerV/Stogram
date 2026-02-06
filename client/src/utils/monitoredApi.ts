import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { performanceMonitor } from './performance';

interface MonitoredRequestConfig extends AxiosRequestConfig {
  enableMonitoring?: boolean;
  metadata?: {
    startTime?: number;
  };
}

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class MonitoredApi {
  private instance: AxiosInstance;

  constructor(baseURL?: string) {
    // If baseURL is provided, use it. Otherwise, construct from API_URL
    // If baseURL starts with '/', it's a relative path - prepend API_URL
    // If baseURL is undefined, use API_URL + '/api'
    let finalBaseURL: string;
    if (baseURL) {
      if (baseURL.startsWith('/')) {
        // Relative path - prepend API_URL
        finalBaseURL = `${API_URL}${baseURL}`;
      } else {
        // Absolute URL
        finalBaseURL = baseURL;
      }
    } else {
      // Default to API_URL + '/api'
      finalBaseURL = `${API_URL}/api`;
    }

    this.instance = axios.create({
      baseURL: finalBaseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for monitoring
        config.metadata = { startTime: performance.now() };
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const endTime = performance.now();
        const startTime = (response.config as any).metadata?.startTime || 0;
        const duration = endTime - startTime;

        // Log performance metrics
        if ((response.config as MonitoredRequestConfig).enableMonitoring !== false) {
          performanceMonitor.trackInteraction(
            'api_call',
            response.config.url || 'unknown',
            duration
          );
        }

        // Log slow requests
        if (duration > 1000) {
          console.warn(`Slow API request: ${response.config.url} took ${duration.toFixed(2)}ms`);
        }

        return response;
      },
      (error) => {
        // Calculate request duration for failed requests
        const endTime = performance.now();
        const duration = endTime - error.config?.metadata?.startTime || 0;

        // Log failed request metrics
        if ((error.config as MonitoredRequestConfig)?.enableMonitoring !== false) {
          performanceMonitor.trackInteraction(
            'api_error',
            error.config?.url || 'unknown',
            duration
          );
        }

        // Handle common errors
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request method with monitoring
  async request<T = any>(config: MonitoredRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.request(config);
  }

  // HTTP methods with built-in monitoring
  async get<T = any>(url: string, config?: MonitoredRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get(url, config);
  }

  async post<T = any>(
    url: string, 
    data?: any, 
    config?: MonitoredRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.post(url, data, config);
  }

  async put<T = any>(
    url: string, 
    data?: any, 
    config?: MonitoredRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.put(url, data, config);
  }

  async patch<T = any>(
    url: string, 
    data?: any, 
    config?: MonitoredRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: MonitoredRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete(url, config);
  }

  // File upload with progress monitoring
  async uploadFile<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: MonitoredRequestConfig
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.instance.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  // Batch requests
  async batchRequests<T = any>(requests: Array<() => Promise<T>>): Promise<T[]> {
    const startTime = performance.now();
    
    try {
      const results = await Promise.all(requests.map(req => req()));
      const endTime = performance.now();
      
      performanceMonitor.trackInteraction(
        'batch_api_call',
        `${requests.length} requests`,
        endTime - startTime
      );
      
      return results;
    } catch (error) {
      const endTime = performance.now();
      
      performanceMonitor.trackInteraction(
        'batch_api_error',
        `${requests.length} requests`,
        endTime - startTime
      );
      
      throw error;
    }
  }

  // Request with retry
  async requestWithRetry<T = any>(
    config: MonitoredRequestConfig,
    maxRetries = 3,
    delay = 1000
  ): Promise<AxiosResponse<T>> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(config);
      } catch (error: any) {
        lastError = error;

        // Don't retry on 4xx errors (except 429)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }

    throw lastError;
  }
}

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime?: number;
    };
  }
}

// Create default instance
export const monitoredApi = new MonitoredApi();

// Create specialized instances for different services
export const authApi = new MonitoredApi('/api/auth');
export const chatApi = new MonitoredApi('/api/chat');
export const userApi = new MonitoredApi('/api/users');
export const botApi = new MonitoredApi('/api/bots');
export const analyticsApi = new MonitoredApi('/api/analytics');