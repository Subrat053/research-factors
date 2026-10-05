import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
