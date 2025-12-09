import axios from 'axios';
import { mockAuthAPI, mockSitesAPI, mockStatsAPI, mockBlockedAPI } from './mockApi';

// 🔧 НАСТРОЙКА: переключатель между реальным API и mock
const USE_MOCK_API = true; // Поставь false когда backend будет готов

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Создаём axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor для добавления access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor для обновления token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если token истёк
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // Повторяем запрос
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token тоже истёк - выходим
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = USE_MOCK_API ? mockAuthAPI : {
  register: async (data) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/api/auth/logout', { refreshToken });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentSiteId');
  },
  
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  
  updateProfile: async (data) => {
    const response = await api.put('/api/auth/profile', data);
    return response.data;
  },
  
  changePassword: async (data) => {
    const response = await api.put('/api/auth/password', data);
    return response.data;
  }
};

// Sites API
export const sitesAPI = USE_MOCK_API ? mockSitesAPI : {
  getAll: async () => {
    const response = await api.get('/api/sites');
    return response.data;
  },
  
  getById: async (siteId) => {
    const response = await api.get(`/api/sites/${siteId}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/api/sites', data);
    return response.data;
  },
  
  update: async (siteId, data) => {
    const response = await api.put(`/api/sites/${siteId}`, data);
    return response.data;
  },
  
  delete: async (siteId) => {
    const response = await api.delete(`/api/sites/${siteId}`);
    return response.data;
  },
  
  regenerateKey: async (siteId) => {
    const response = await api.post(`/api/sites/${siteId}/regenerate-key`);
    return response.data;
  },
  
  test: async (siteId) => {
    const response = await api.post(`/api/sites/${siteId}/test`);
    return response.data;
  },
  
  getStats: async (siteId, period = '24h') => {
    const response = await api.get(`/api/sites/${siteId}/stats`, { params: { period } });
    return response.data;
  }
};

// Stats API
export const statsAPI = USE_MOCK_API ? mockStatsAPI : {
  getSiteStats: async (siteId, period = '24h') => {
    const response = await api.get(`/api/sites/${siteId}/stats`, { params: { period } });
    return response.data;
  },
  
  getEvents: async (siteId, params = {}) => {
    const response = await api.get(`/api/stats/${siteId}/events`, { params });
    return response.data;
  }
};

// Blocked IPs API
export const blockedAPI = USE_MOCK_API ? mockBlockedAPI : {
  getBlocked: async (siteId) => {
    const response = await api.get(`/api/blocked/${siteId}`);
    return response.data;
  },
  
  blockIP: async (siteId, data) => {
    const response = await api.post(`/api/blocked/${siteId}`, data);
    return response.data;
  },
  
  unblockIP: async (siteId, ip) => {
    const response = await api.delete(`/api/blocked/${siteId}/${ip}`);
    return response.data;
  },
  
  exportForYandex: async (siteId) => {
    const response = await api.get(`/api/blocked/${siteId}/export/yandex`);
    return response.data;
  }
};

export default api;