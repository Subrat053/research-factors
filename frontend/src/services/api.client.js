import axios from 'axios';

export function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL;
  const isBrowser = typeof window !== 'undefined';
  const isRemote = isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

  // If on a remote production domain, rewrite any accidental loopback/localhost address to same-origin
  if (isRemote) {
    if (!configuredUrl || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(configuredUrl)) {
      return `${window.location.origin}${basePath}/api/v1`;
    }
    return configuredUrl;
  }

  return configuredUrl || 'http://localhost:5005/api/v1';
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Bearer token fallback for cross-domain auth
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('rf_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore localStorage access restrictions if any
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for uniform error parsing
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Unable to connect to server. Please try again.'
    };
    return Promise.reject(errorResponse);
  }
);
