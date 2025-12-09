/**
 * API Client for NoctoClick
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if exists
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

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const statsAPI = {
  getSiteStats: (siteId, period = '24h') => 
    api.get(`/stats/${siteId}`, { params: { period } }),
  
  getRecentEvents: (siteId, limit = 50) =>
    api.get(`/stats/${siteId}/recent`, { params: { limit } })
};

export const sitesAPI = {
  getAll: () => api.get('/sites'),
  getById: (id) => api.get(`/sites/${id}`),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`)
};

export const blockedAPI = {
  getBlocked: (siteId, active = true) =>
    api.get(`/blocked/${siteId}`, { params: { active } }),
  
  blockIP: (siteId, data) =>
    api.post(`/blocked/${siteId}`, data),
  
  unblockIP: (siteId, ip) =>
    api.delete(`/blocked/${siteId}/${ip}`),
  
  exportForYandex: (siteId) =>
    api.get(`/blocked/${siteId}/export`)
};

export const yandexAPI = {
  getAuthUrl: () => api.get('/yandex/auth'),
  handleCallback: (code) => api.get('/yandex/callback', { params: { code } }),
  getCampaigns: () => api.get('/yandex/campaigns'),
  syncBlocking: (siteId) => api.post('/yandex/sync', { siteId })
};

export default api;