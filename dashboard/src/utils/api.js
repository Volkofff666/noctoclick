import axios from 'axios';
import * as mockData from './mockData';
import * as mockAffiliate from './mockAffiliate';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 🎭 Глобальный переключатель моков
const USE_MOCK_DATA = true;

// Helper для имитации задержки
const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

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
  register: async (data) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: { message: 'Регистрация успешна' } };
    }
    return api.post('/auth/register', data);
  },
  login: async (data) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      localStorage.setItem('accessToken', 'mock_token_' + Date.now());
      return { data: { accessToken: 'mock_token', refreshToken: 'mock_refresh' } };
    }
    return api.post('/auth/login', data);
  },
  logout: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay(200);
      localStorage.removeItem('accessToken');
      return { data: { message: 'Logged out' } };
    }
    return api.post('/auth/logout');
  },
  getMe: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay(300);
      return mockData.mockUserProfile;
    }
    return api.get('/auth/me').then(res => res.data);
  },
  updateProfile: async (data) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: { ...mockData.mockUserProfile, ...data } };
    }
    return api.put('/auth/profile', data);
  }
};

// Sites API
export const sitesAPI = {
  getAll: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockData.mockSites;
    }
    return api.get('/sites').then(res => res.data);
  },
  getById: async (id) => {
    if (USE_MOCK_DATA) {
      await mockDelay(300);
      const site = mockData.mockSites.sites.find(s => s.id === parseInt(id));
      return { site };
    }
    return api.get(`/sites/${id}`).then(res => res.data);
  },
  getStats: async (id, period = '24h') => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockData.mockDashboardStats(id);
    }
    return api.get(`/sites/${id}/stats?period=${period}`).then(res => res.data);
  },
  create: async (data) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newSite = {
        id: mockData.mockSites.sites.length + 1,
        ...data,
        api_key: 'nck_live_' + Math.random().toString(36).substr(2, 20),
        isActive: true,
        tracker_installed: false,
        createdAt: new Date().toISOString(),
        last_event_at: null
      };
      mockData.mockSites.sites.push(newSite);
      return { data: { site: newSite } };
    }
    return api.post('/sites', data);
  },
  update: async (id, data) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: { message: 'Сайт обновлён' } };
    }
    return api.put(`/sites/${id}`, data);
  },
  delete: async (id) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockData.mockSites.sites.findIndex(s => s.id === parseInt(id));
      if (index > -1) {
        mockData.mockSites.sites.splice(index, 1);
      }
      return { data: { message: 'Сайт удалён' } };
    }
    return api.delete(`/sites/${id}`);
  },
  regenerateKey: async (id) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const site = mockData.mockSites.sites.find(s => s.id === parseInt(id));
      if (site) {
        site.api_key = 'nck_live_' + Math.random().toString(36).substr(2, 20);
      }
      return { data: { message: 'API ключ перегенерирован' } };
    }
    return api.post(`/sites/${id}/regenerate-key`);
  }
};

// Stats API
export const statsAPI = {
  getEvents: async (siteId, params) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockData.mockEvents;
    }
    return api.get(`/stats/${siteId}/events`, { params }).then(res => res.data);
  },
  getTimeSeries: async (siteId, period = '24h') => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockData.mockTimeSeries;
    }
    return api.get(`/stats/${siteId}/timeseries?period=${period}`).then(res => res.data);
  },
  getHourlyData: async (siteId) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockData.mockHourlyData;
    }
    return api.get(`/stats/${siteId}/hourly`).then(res => res.data);
  }
};

// Blocked IPs API
export const blockedAPI = {
  getBlocked: async (siteId) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockData.mockBlockedIPs;
    }
    return api.get(`/blocked/${siteId}`).then(res => res.data);
  },
  blockIP: async (siteId, data) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: { message: 'IP заблокирован' } };
    }
    return api.post(`/blocked/${siteId}`, data);
  },
  unblockIP: async (siteId, ip) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: { message: 'IP разблокирован' } };
    }
    return api.delete(`/blocked/${siteId}/${ip}`);
  },
  exportForYandex: async (siteId) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const ips = mockData.mockBlockedIPs.blocked.map(b => b.ip);
      return { ips };
    }
    return api.get(`/blocked/${siteId}/export/yandex`).then(res => res.data);
  }
};

// Settings API
export const settingsAPI = {
  getSettings: async (siteId) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockData.mockSettings;
    }
    return api.get(`/settings/${siteId}`).then(res => res.data);
  },
  updateSettings: async (siteId, data) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: { message: 'Настройки сохранены' } };
    }
    return api.put(`/settings/${siteId}`, data);
  }
};

// Yandex API
export const yandexAPI = {
  getAuthUrl: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { url: 'https://oauth.yandex.ru/authorize?response_type=code&client_id=mock' };
    }
    return api.get('/yandex/auth-url').then(res => res.data);
  },
  getAccounts: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockData.mockYandexAccounts;
    }
    return api.get('/yandex/accounts').then(res => res.data);
  },
  syncAccount: async (accountId) => {
    if (USE_MOCK_DATA) {
      await mockDelay(1000);
      return { data: { message: 'Синхронизация завершена', synced: 8 } };
    }
    return api.post(`/yandex/accounts/${accountId}/sync`);
  },
  disconnect: async (accountId) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: { message: 'Аккаунт отключён' } };
    }
    return api.delete(`/yandex/accounts/${accountId}`);
  }
};

// Affiliate API
export const affiliateAPI = {
  getStats: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockAffiliate.mockAffiliateStats;
    }
    return api.get('/affiliate/stats').then(res => res.data);
  },
  getReferrals: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockAffiliate.mockReferrals;
    }
    return api.get('/affiliate/referrals').then(res => res.data);
  },
  getEarnings: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockAffiliate.mockEarnings;
    }
    return api.get('/affiliate/earnings').then(res => res.data);
  },
  getEarningsChart: async () => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockAffiliate.mockEarningsChart;
    }
    return api.get('/affiliate/earnings/chart').then(res => res.data);
  },
  requestPayout: async (data) => {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return { data: { message: 'Заявка на вывод отправлена' } };
    }
    return api.post('/affiliate/payout', data);
  }
};

export default api;