/**
 * Axios API client configuration.
 *
 * This module creates a pre-configured axios instance for making API requests
 * to the Flask backend with proper authentication (JWT cookies) and error handling.
 */

import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Send cookies (JWT tokens) with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];
let hasFailedRefresh = false; // Track if refresh has failed to prevent retry loops

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Reset failed refresh flag on any successful response
    if (response.config.url?.includes('/auth/login')) {
      hasFailedRefresh = false;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest.url || '';

    // NEVER try to refresh for ANY auth endpoint - be very explicit
    const isAuthUrl = url.includes('auth/me') ||
        url.includes('auth/login') ||
        url.includes('auth/register') ||
        url.includes('auth/refresh') ||
        url.includes('auth/logout') ||
        url.includes('auth/oauth') ||
        url.includes('auth/verify') ||
        url.includes('auth/forgot') ||
        url.includes('auth/reset');

    if (isAuthUrl) {
      // Just reject auth endpoint errors without any retry
      return Promise.reject(error);
    }

    // For non-auth endpoints with 401, try refresh ONCE per session
    if (error.response?.status === 401 && !hasFailedRefresh && !originalRequest._retry) {
      if (isRefreshing) {
        // Already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the access token
        await apiClient.post('/auth/refresh');
        processQueue(null);
        isRefreshing = false;
        hasFailedRefresh = false;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        hasFailedRefresh = true; // Prevent any more refresh attempts
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Reset the failed refresh flag when user successfully logs in
apiClient.interceptors.request.use((config) => {
  // Reset the flag on successful login
  if (config.url?.includes('/auth/login') && config.method === 'post') {
    hasFailedRefresh = false;
  }
  return config;
});

export default apiClient;
