import axios from 'axios';

// API Base Configuration - MUST be http://localhost:5000/api
const API_BASE_URL = 'http://localhost:5000/api';

console.log('[API Config] Using baseURL:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Add authentication token
// Similar to how Dribbble/Behance attach auth tokens to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('[API Request]', config.method?.toUpperCase(), config.url, '| Token:', token ? 'present' : 'none');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle errors globally
// Similar to how modern apps handle 401 (redirect to login) automatically
api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.status, response.statusText, '| Data keys:', Object.keys(response.data).slice(0, 3));
    return response.data; // Return just the data
  },
  (error) => {
    console.log('[API Error]', error.response?.status, error.response?.statusText, '| Data:', error.response?.data);
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle 429 Too Many Requests - Rate limiting
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please slow down.');
    }
    
    // Preserve full error structure so catch blocks can access message
    const errorData = error.response?.data || { message: error.message || 'Network error' };
    return Promise.reject(errorData);
  }
);

export default api;
