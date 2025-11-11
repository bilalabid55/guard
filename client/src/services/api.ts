import axios from 'axios';

// Create axios instance with base configuration
const apiEnv = process.env.REACT_APP_API_URL;
const defaultApi = 'https://guard-ujfi.onrender.com/api';
const apiBase = apiEnv || defaultApi;
const serviceRoot = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

const api = axios.create({
  baseURL: serviceRoot,
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
