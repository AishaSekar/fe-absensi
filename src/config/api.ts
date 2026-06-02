import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track redirect state to prevent duplicate redirects
let isRedirectingToLogin = false;

// Handle 401 responses — redirect to login without full page refresh
api.interceptors.response.use(
  (response) => {
    isRedirectingToLogin = false;
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      // Skip redirect if:
      // 1. Already on an auth or public page
      // 2. The failing request was the login endpoint itself (wrong password etc.)
      // 3. A redirect is already queued
      const isPublicPage =
        currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/';

      const isLoginEndpoint =
        error.config?.url === '/login' ||
        (error.config?.url ?? '').includes('/login');

      if (!isPublicPage && !isLoginEndpoint && !isRedirectingToLogin) {
        isRedirectingToLogin = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Dispatch a custom event so App.tsx can use React Router's navigate
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
