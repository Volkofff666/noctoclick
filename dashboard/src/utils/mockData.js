// Глобальные mock данные для всего проекта

// Mock Sites
export const mockSites = {
  sites: [
    {
      id: 1,
      name: 'Интернет-магазин "МегаШоп"',
      domain: 'megashop.ru',
      api_key: 'nck_live_1a2b3c4d5e6f7g8h9i0j',
      isActive: true,
      tracker_installed: true,
      createdAt: '2024-10-15T10:30:00Z',
      last_event_at: '2024-12-09T18:45:00Z'
    },
    {
      id: 2,
      name: 'Лендинг юридических услуг',
      domain: 'lawfirm-pro.ru',
      api_key: 'nck_live_2k3l4m5n6o7p8q9r0s1t',
      isActive: true,
      tracker_installed: true,
      createdAt: '2024-11-01T14:20:00Z',
      last_event_at: '2024-12-09T18:30:00Z'
    },
    {
      id: 3,
      name: 'Автосалон "Драйв"',
      domain: 'drive-auto.ru',
      api_key: 'nck_live_3u4v5w6x7y8z9a0b1c2d',
      isActive: true,
      tracker_installed: true,
      createdAt: '2024-11-10T09:15:00Z',
      last_event_at: '2024-12-09T17:50:00Z'
    },
    {
      id: 4,
      name: 'Стоматологическая клиника',
      domain: 'smile-clinic.ru',
      api_key: 'nck_live_4e5f6g7h8i9j0k1l2m3n',
      isActive: false,
      tracker_installed: false,
      createdAt: '2024-11-20T11:45:00Z',
      last_event_at: null
    },
    {
      id: 5,
      name: 'Агентство недвижимости',
      domain: 'realty-expert.ru',
      api_key: 'nck_live_5o6p7q8r9s0t1u2v3w4x',
      isActive: true,
      tracker_installed: true,
      createdAt: '2024-11-25T16:30:00Z',
      last_event_at: '2024-12-09T18:20:00Z'
    }
  ]
};

// Mock Stats для Dashboard
export const mockDashboardStats = (siteId) => ({
  stats: {
    total: 15847,
    legitimate: 12678,
    suspicious: 2156,
    fraud: 1013
  }
});

// Mock Events
export const mockEvents = {
  events: [
    {
      id: 1,
      ip: '195.82.146.23',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      fraud_score: 15,
      is_fraud: false,
      is_suspicious: false,
      created_at: '2024-12-09T18:45:00Z'
    },
    {
      id: 2,
      ip: '91.201.115.67',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      fraud_score: 12,
      is_fraud: false,
      is_suspicious: false,
      created_at: '2024-12-09T18:42:00Z'
    },
    {
      id: 3,
      ip: '178.176.35.142',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      fraud_score: 65,
      is_fraud: false,
      is_suspicious: true,
      created_at: '2024-12-09T18:40:00Z'
    },
    {
      id: 4,
      ip: '5.188.210.8',
      user_agent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
      fraud_score: 88,
      is_fraud: true,
      is_suspicious: true,
      created_at: '2024-12-09T18:38:00Z'
    },
    {
      id: 5,
      ip: '185.220.101.34',
      user_agent: 'python-requests/2.28.1',
      fraud_score: 95,
      is_fraud: true,
      is_suspicious: true,
      created_at: '2024-12-09T18:35:00Z'
    },
    {
      id: 6,
      ip: '46.138.245.89',
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      fraud_score: 22,
      is_fraud: false,
      is_suspicious: false,
      created_at: '2024-12-09T18:33:00Z'
    },
    {
      id: 7,
      ip: '95.161.228.186',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
      fraud_score: 18,
      is_fraud: false,
      is_suspicious: false,
      created_at: '2024-12-09T18:30:00Z'
    },
    {
      id: 8,
      ip: '37.143.12.76',
      user_agent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      fraud_score: 10,
      is_fraud: false,
      is_suspicious: false,
      created_at: '2024-12-09T18:28:00Z'
    },
    {
      id: 9,
      ip: '109.252.45.123',
      user_agent: 'curl/7.68.0',
      fraud_score: 92,
      is_fraud: true,
      is_suspicious: true,
      created_at: '2024-12-09T18:25:00Z'
    },
    {
      id: 10,
      ip: '217.118.90.45',
      user_agent: 'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/119.0 Firefox/119.0',
      fraud_score: 28,
      is_fraud: false,
      is_suspicious: false,
      created_at: '2024-12-09T18:22:00Z'
    }
  ]
};

// Mock Time Series для графика
export const mockTimeSeries = {
  data: [
    { date: '00:00', legitimate: 45, suspicious: 8, fraud: 3 },
    { date: '01:00', legitimate: 32, suspicious: 5, fraud: 2 },
    { date: '02:00', legitimate: 28, suspicious: 4, fraud: 1 },
    { date: '03:00', legitimate: 25, suspicious: 3, fraud: 2 },
    { date: '04:00', legitimate: 30, suspicious: 5, fraud: 1 },
    { date: '05:00', legitimate: 38, suspicious: 6, fraud: 2 },
    { date: '06:00', legitimate: 52, suspicious: 9, fraud: 4 },
    { date: '07:00', legitimate: 68, suspicious: 12, fraud: 5 },
    { date: '08:00', legitimate: 85, suspicious: 15, fraud: 7 },
    { date: '09:00', legitimate: 102, suspicious: 18, fraud: 9 },
    { date: '10:00', legitimate: 125, suspicious: 22, fraud: 11 },
    { date: '11:00', legitimate: 148, suspicious: 25, fraud: 13 },
    { date: '12:00', legitimate: 165, suspicious: 28, fraud: 15 },
    { date: '13:00', legitimate: 178, suspicious: 30, fraud: 16 },
    { date: '14:00', legitimate: 192, suspicious: 33, fraud: 18 },
    { date: '15:00', legitimate: 205, suspicious: 35, fraud: 19 },
    { date: '16:00', legitimate: 188, suspicious: 32, fraud: 17 },
    { date: '17:00', legitimate: 172, suspicious: 29, fraud: 15 },
    { date: '18:00', legitimate: 155, suspicious: 26, fraud: 14 },
    { date: '19:00', legitimate: 138, suspicious: 23, fraud: 12 },
    { date: '20:00', legitimate: 120, suspicious: 20, fraud: 10 },
    { date: '21:00', legitimate: 95, suspicious: 16, fraud: 8 },
    { date: '22:00', legitimate: 72, suspicious: 12, fraud: 6 },
    { date: '23:00', legitimate: 58, suspicious: 10, fraud: 4 }
  ]
};

// Mock Hourly Data для Bar Chart
export const mockHourlyData = {
  data: [
    { hour: '00:00', clicks: 56 },
    { hour: '01:00', clicks: 39 },
    { hour: '02:00', clicks: 33 },
    { hour: '03:00', clicks: 30 },
    { hour: '04:00', clicks: 36 },
    { hour: '05:00', clicks: 46 },
    { hour: '06:00', clicks: 65 },
    { hour: '07:00', clicks: 85 },
    { hour: '08:00', clicks: 107 },
    { hour: '09:00', clicks: 129 },
    { hour: '10:00', clicks: 158 },
    { hour: '11:00', clicks: 186 },
    { hour: '12:00', clicks: 208 },
    { hour: '13:00', clicks: 224 },
    { hour: '14:00', clicks: 243 },
    { hour: '15:00', clicks: 259 },
    { hour: '16:00', clicks: 237 },
    { hour: '17:00', clicks: 216 },
    { hour: '18:00', clicks: 195 },
    { hour: '19:00', clicks: 173 },
    { hour: '20:00', clicks: 150 },
    { hour: '21:00', clicks: 119 },
    { hour: '22:00', clicks: 90 },
    { hour: '23:00', clicks: 72 }
  ]
};

// Mock Blocked IPs
export const mockBlockedIPs = {
  blocked: [
    {
      ip: '5.188.210.8',
      reason: 'Частые клики с одного IP (15 за час)',
      fraud_score: 88,
      blocked_at: '2024-12-09T18:38:00Z',
      auto_unblock_at: '2024-12-16T18:38:00Z',
      is_permanent: false
    },
    {
      ip: '185.220.101.34',
      reason: 'Обнаружен VPN/Proxy + подозрительный UA',
      fraud_score: 95,
      blocked_at: '2024-12-09T18:35:00Z',
      auto_unblock_at: null,
      is_permanent: true
    },
    {
      ip: '109.252.45.123',
      reason: 'Бот (curl)',
      fraud_score: 92,
      blocked_at: '2024-12-09T18:25:00Z',
      auto_unblock_at: null,
      is_permanent: true
    },
    {
      ip: '45.142.120.67',
      reason: 'Превышен лимит кликов (20 за 30 минут)',
      fraud_score: 85,
      blocked_at: '2024-12-09T17:15:00Z',
      auto_unblock_at: '2024-12-16T17:15:00Z',
      is_permanent: false
    },
    {
      ip: '89.108.78.234',
      reason: 'VPN + короткое время на сайте (<2 сек)',
      fraud_score: 78,
      blocked_at: '2024-12-09T16:45:00Z',
      auto_unblock_at: '2024-12-16T16:45:00Z',
      is_permanent: false
    },
    {
      ip: '193.29.57.161',
      reason: 'Подозрительное поведение (0 взаимодействий)',
      fraud_score: 72,
      blocked_at: '2024-12-09T15:30:00Z',
      auto_unblock_at: '2024-12-16T15:30:00Z',
      is_permanent: false
    },
    {
      ip: '91.215.85.143',
      reason: 'Множественные клики по одной рекламе',
      fraud_score: 82,
      blocked_at: '2024-12-09T14:20:00Z',
      auto_unblock_at: '2024-12-16T14:20:00Z',
      is_permanent: false
    },
    {
      ip: '176.59.46.89',
      reason: 'Ручная блокировка администратором',
      fraud_score: 65,
      blocked_at: '2024-12-08T10:15:00Z',
      auto_unblock_at: null,
      is_permanent: true
    }
  ]
};

// Mock Settings
export const mockSettings = {
  settings: {
    detection: {
      maxClicksPerHour: 5,
      minTimeOnSite: 3,
      fraudScoreThreshold: 70,
      blockDuration: 168
    },
    methods: {
      autoBlock: true,
      checkVPN: true,
      checkProxy: true,
      checkBots: true,
      deviceFingerprint: true
    },
    notifications: {
      email: true,
      emailAddress: 'admin@nocto.agency',
      telegram: false,
      telegramChatId: ''
    }
  }
};

// Mock Yandex Accounts
export const mockYandexAccounts = {
  accounts: [
    {
      id: 1,
      login: 'nocto-agency',
      clientId: '12345678',
      campaignsCount: 15,
      lastSync: '2024-12-09T18:00:00Z',
      isActive: true
    },
    {
      id: 2,
      login: 'client-lawfirm',
      clientId: '87654321',
      campaignsCount: 8,
      lastSync: '2024-12-09T17:30:00Z',
      isActive: true
    }
  ]
};

// Mock User Profile
export const mockUserProfile = {
  email: 'admin@nocto.agency',
  profile: {
    fullName: 'Александр Волков',
    company: 'Nocto Agency',
    phone: '+7 (999) 123-45-67',
    position: 'CEO & Founder'
  },
  createdAt: '2024-10-01T10:00:00Z'
};