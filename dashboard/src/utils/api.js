import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Создаём axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем токен к каждому запросу
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

// Обработка ошибок и обновление токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        // Если refresh не удался - редирект на логин
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me').then(res => res.data),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Sites API
export const sitesAPI = {
  getAll: () => api.get('/sites').then(res => res.data),
  getById: (id) => api.get(`/sites/${id}`).then(res => res.data),
  getStats: (id, period = '24h') => api.get(`/sites/${id}/stats?period=${period}`).then(res => res.data),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`)
};

// Stats API
export const statsAPI = {
  getEvents: (siteId, params) => api.get(`/stats/${siteId}/events`, { params }).then(res => res.data),
  getTimeSeries: (siteId, period = '24h') => api.get(`/stats/${siteId}/timeseries?period=${period}`).then(res => res.data),
  getHourlyData: (siteId) => api.get(`/stats/${siteId}/hourly`).then(res => res.data)
};

// Blocked IPs API
export const blockedAPI = {
  getBlocked: (siteId) => api.get(`/blocked/${siteId}`).then(res => res.data),
  blockIP: (siteId, data) => api.post(`/blocked/${siteId}`, data),
  unblockIP: (siteId, ip) => api.delete(`/blocked/${siteId}/${ip}`),
  exportForYandex: (siteId) => api.get(`/blocked/${siteId}/export/yandex`).then(res => res.data)
};

// Settings API
export const settingsAPI = {
  getSettings: (siteId) => api.get(`/settings/${siteId}`).then(res => res.data),
  updateSettings: (siteId, data) => api.put(`/settings/${siteId}`, data)
};

// Yandex API
export const yandexAPI = {
  getAuthUrl: () => api.get('/yandex/auth-url').then(res => res.data),
  getAccounts: () => api.get('/yandex/accounts').then(res => res.data),
  syncAccount: (accountId) => api.post(`/yandex/accounts/${accountId}/sync`),
  disconnect: (accountId) => api.delete(`/yandex/accounts/${accountId}`)
};

// Affiliate API
export const affiliateAPI = {
  getStats: () => api.get('/affiliate/stats').then(res => res.data),
  getReferrals: () => api.get('/affiliate/referrals').then(res => res.data),
  getEarnings: () => api.get('/affiliate/earnings').then(res => res.data),
  getEarningsChart: () => api.get('/affiliate/earnings/chart').then(res => res.data),
  requestPayout: (data) => api.post('/affiliate/payout', data)
};

export default api;