import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 30000 // 30 second timeout
});

// Request interceptor - add auth token and request ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add unique request ID for tracking
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network errors
    if (!error.response) {
      console.error('Network error - check connection');
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    const originalRequest = error.config;

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem('accessToken', res.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle error response normalization for TRD v2.0 schema
    const serverErrorMessage = error.response.data?.error?.message || error.response.data?.message;
    if (serverErrorMessage) {
      error.message = serverErrorMessage;
    }

    // Handle 403 Forbidden
    if (error.response.status === 403) {
      return Promise.reject(new Error(serverErrorMessage || 'You do not have permission to perform this action.'));
    }

    // Handle 500 Server Error
    if (error.response.status === 500) {
      return Promise.reject(new Error(serverErrorMessage || 'Server error. Please try again later.'));
    }

    return Promise.reject(error);
  }
);

export default api;
