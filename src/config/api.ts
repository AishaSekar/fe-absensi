import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


let isRedirectingToLogin = false;


api.interceptors.response.use(
  (response) => {
    isRedirectingToLogin = false;
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

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
