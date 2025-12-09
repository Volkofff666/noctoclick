/**
 * Application configuration
 */

require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://noctoclick:password@localhost:5432/noctoclick',
    host: process.env.POSTGRES_HOST || 'postgres',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'noctoclick',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'noctoclick'
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://redis:6379'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-min-32-characters',
    expiresIn: '7d'
  },
  
  // Yandex Direct API
  yandex: {
    clientId: process.env.YANDEX_CLIENT_ID,
    clientSecret: process.env.YANDEX_CLIENT_SECRET,
    redirectUri: process.env.YANDEX_REDIRECT_URI,
    apiUrl: 'https://api.direct.yandex.com/json/v5'
  },
  
  // Fraud detection thresholds
  fraud: {
    maxClicksPerHour: parseInt(process.env.MAX_CLICKS_PER_HOUR) || 5,
    minTimeOnSite: parseInt(process.env.MIN_TIME_ON_SITE) || 3,
    fraudScoreThreshold: parseInt(process.env.FRAUD_SCORE_THRESHOLD) || 70,
    autoBlockEnabled: process.env.AUTO_BLOCK_ENABLED !== 'false'
  },
  
  // Sync intervals
  sync: {
    fraudSyncInterval: parseInt(process.env.FRAUD_SYNC_INTERVAL) || 60, // minutes
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL) || 1440 // minutes (24h)
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs'
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.API_RATE_LIMIT) || 100
  }
};