// Mock API для локальной разработки без backend

// Fake данные
const MOCK_USER = {
  id: 1,
  email: 'demo@noctoclick.ru',
  role: 'client',
  emailVerified: true,
  profile: {
    fullName: 'Демо Пользователь',
    companyName: 'Nocto Agency',
    phone: '+7 (999) 123-45-67',
    telegram: '@noctoagency',
    timezone: 'Europe/Moscow',
    language: 'ru'
  }
};

const MOCK_SITES = [
  {
    id: 1,
    name: 'Nocto Agency',
    domain: 'nocto.agency',
    api_key: 'nk_demo_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
    is_active: true,
    tracker_installed: true,
    last_event_at: new Date().toISOString(),
    settings: {
      maxClicksPerHour: 5,
      minTimeOnSite: 3,
      fraudScoreThreshold: 70,
      autoBlockEnabled: true,
      blockDuration: 168
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Тестовый сайт',
    domain: 'test-site.ru',
    api_key: 'nk_demo_abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
    is_active: true,
    tracker_installed: false,
    last_event_at: null,
    settings: {
      maxClicksPerHour: 10,
      minTimeOnSite: 5,
      fraudScoreThreshold: 80,
      autoBlockEnabled: false,
      blockDuration: 24
    },
    created_at: '2024-02-01T14:30:00Z',
    updated_at: '2024-02-01T14:30:00Z'
  },
  {
    id: 3,
    name: 'Интернет-магазин',
    domain: 'shop-example.com',
    api_key: 'nk_demo_xyz123456789xyz123456789xyz123456789xyz123456789xyz123456789xyz',
    is_active: false,
    tracker_installed: true,
    last_event_at: '2024-03-10T08:15:00Z',
    settings: {
      maxClicksPerHour: 3,
      minTimeOnSite: 2,
      fraudScoreThreshold: 60,
      autoBlockEnabled: true,
      blockDuration: 72
    },
    created_at: '2024-01-20T12:00:00Z',
    updated_at: '2024-03-10T08:15:00Z'
  }
];

const MOCK_BLOCKED_IPS = [
  {
    ip: '192.168.1.100',
    reason: 'Автоматическая блокировка: превышен лимит кликов',
    fraud_score: 85,
    blocked_at: '2024-03-15T10:30:00Z',
    auto_unblock_at: '2024-03-22T10:30:00Z',
    is_permanent: false
  },
  {
    ip: '10.0.0.50',
    reason: 'Подозрительная активность: слишком быстрые клики',
    fraud_score: 92,
    blocked_at: '2024-03-14T15:20:00Z',
    auto_unblock_at: null,
    is_permanent: true
  },
  {
    ip: '203.0.113.45',
    reason: 'Ручная блокировка администратором',
    fraud_score: 78,
    blocked_at: '2024-03-10T09:00:00Z',
    auto_unblock_at: '2024-03-17T09:00:00Z',
    is_permanent: false
  }
];

const MOCK_STATS = {
  total: 15420,
  legitimate: 14250,
  suspicious: 890,
  fraud: 280,
  blockedIps: 12
};

const MOCK_EVENTS = [
  {
    id: 1,
    ip: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    is_fraud: false,
    is_suspicious: false,
    fraud_score: 15,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    ip: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    is_fraud: true,
    is_suspicious: true,
    fraud_score: 85,
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

// Delay для имитации сетевых запросов
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API
export const mockAuthAPI = {
  register: async (data) => {
    await delay();
    return {
      user: MOCK_USER,
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now()
    };
  },
  
  login: async (email, password) => {
    await delay();
    return {
      user: MOCK_USER,
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now()
    };
  },
  
  logout: async () => {
    await delay();
    return { message: 'Успешный выход' };
  },
  
  getMe: async () => {
    await delay();
    return MOCK_USER;
  },
  
  updateProfile: async (data) => {
    await delay();
    return {
      message: 'Профиль обновлён',
      profile: { ...MOCK_USER.profile, ...data }
    };
  },
  
  changePassword: async (data) => {
    await delay();
    return { message: 'Пароль успешно изменён' };
  }
};

export const mockSitesAPI = {
  getAll: async () => {
    await delay();
    return { sites: MOCK_SITES };
  },
  
  getById: async (siteId) => {
    await delay();
    const site = MOCK_SITES.find(s => s.id === parseInt(siteId));
    return { site: site || MOCK_SITES[0] };
  },
  
  create: async (data) => {
    await delay();
    const newSite = {
      id: MOCK_SITES.length + 1,
      name: data.name,
      domain: data.domain,
      api_key: 'nk_demo_' + Math.random().toString(36).substring(2, 66),
      is_active: true,
      tracker_installed: false,
      last_event_at: null,
      settings: {
        maxClicksPerHour: 5,
        minTimeOnSite: 3,
        fraudScoreThreshold: 70,
        autoBlockEnabled: true,
        blockDuration: 168
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    MOCK_SITES.push(newSite);
    return { site: newSite };
  },
  
  update: async (siteId, data) => {
    await delay();
    const site = MOCK_SITES.find(s => s.id === parseInt(siteId));
    if (site) {
      Object.assign(site, data, { updated_at: new Date().toISOString() });
    }
    return { site };
  },
  
  delete: async (siteId) => {
    await delay();
    const index = MOCK_SITES.findIndex(s => s.id === parseInt(siteId));
    if (index > -1) {
      MOCK_SITES.splice(index, 1);
    }
    return { message: 'Сайт удалён' };
  },
  
  regenerateKey: async (siteId) => {
    await delay();
    const site = MOCK_SITES.find(s => s.id === parseInt(siteId));
    if (site) {
      site.api_key = 'nk_demo_' + Math.random().toString(36).substring(2, 66);
    }
    return { site };
  },
  
  test: async (siteId) => {
    await delay();
    return {
      installed: true,
      message: 'Трекер успешно установлен!'
    };
  },
  
  getStats: async (siteId, period = '24h') => {
    await delay();
    return { stats: MOCK_STATS };
  }
};

export const mockStatsAPI = {
  getSiteStats: async (siteId, period = '24h') => {
    await delay();
    return { stats: MOCK_STATS };
  },
  
  getEvents: async (siteId, params = {}) => {
    await delay();
    return { events: MOCK_EVENTS };
  }
};

export const mockBlockedAPI = {
  getBlocked: async (siteId) => {
    await delay();
    return { blocked: MOCK_BLOCKED_IPS };
  },
  
  blockIP: async (siteId, data) => {
    await delay();
    const newBlock = {
      ip: data.ip,
      reason: data.reason || 'Ручная блокировка',
      fraud_score: 100,
      blocked_at: new Date().toISOString(),
      auto_unblock_at: data.duration ? new Date(Date.now() + data.duration * 3600000).toISOString() : null,
      is_permanent: !data.duration
    };
    MOCK_BLOCKED_IPS.push(newBlock);
    return { blocked: newBlock };
  },
  
  unblockIP: async (siteId, ip) => {
    await delay();
    const index = MOCK_BLOCKED_IPS.findIndex(b => b.ip === ip);
    if (index > -1) {
      MOCK_BLOCKED_IPS.splice(index, 1);
    }
    return { message: 'IP разблокирован' };
  },
  
  exportForYandex: async (siteId) => {
    await delay();
    return {
      ips: MOCK_BLOCKED_IPS.map(b => b.ip),
      format: 'yandex'
    };
  }
};