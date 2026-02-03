import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const generateQuestion = async (content, type = 'text', provider = null) => {
  const response = await api.post('/generate-question', { content, type, provider });
  return response.data;
};

export const evaluateAnswer = async (formData, provider = null) => {
  const response = await api.post('/evaluate-answer', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: provider ? { provider } : {},
  });
  return response.data;
};

export const getLlmProviders = async () => {
  const response = await api.get('/llm/providers');
  return response.data;
};

export const register = async (email, password, displayName) => {
  const response = await api.post('/auth/register', { email, password, display_name: displayName });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getSessions = async (page = 1, limit = 10) => {
  const response = await api.get('/sessions', { params: { page, limit } });
  return response.data;
};

export const getSession = async (id) => {
  const response = await api.get(`/sessions/${id}`);
  return response.data;
};

export const saveSession = async (sessionData) => {
  const response = await api.post('/sessions', sessionData);
  return response.data;
};

export const getStatistics = async () => {
  const response = await api.get('/statistics/overview');
  return response.data;
};

export default api;
