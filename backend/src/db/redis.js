/**
 * Redis connection
 */

const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

let redis = null;

/**
 * Initialize Redis connection
 */
async function initRedis() {
  try {
    redis = new Redis(config.redis.url, {
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    // Test connection
    await redis.ping();
    logger.info('Redis connection established');

    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    throw error;
  }
}

/**
 * Get Redis instance
 */
function getRedis() {
  if (!redis) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return redis;
}

/**
 * Increment click counter for IP
 */
async function incrementClickCounter(siteId, ip) {
  const key = `clicks:${siteId}:${ip}`;
  const count = await redis.incr(key);
  
  // Set expiry to 24 hours if new key
  if (count === 1) {
    await redis.expire(key, 86400);
  }
  
  return count;
}

/**
 * Get click count for IP
 */
async function getClickCount(siteId, ip) {
  const key = `clicks:${siteId}:${ip}`;
  const count = await redis.get(key);
  return parseInt(count) || 0;
}

/**
 * Cache fingerprint hash
 */
async function cacheFingerprint(hash, data, ttl = 3600) {
  const key = `fingerprint:${hash}`;
  await redis.setex(key, ttl, JSON.stringify(data));
}

/**
 * Get cached fingerprint
 */
async function getCachedFingerprint(hash) {
  const key = `fingerprint:${hash}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Mark IP as suspicious
 */
async function markSuspicious(siteId, ip, reason) {
  const key = `suspicious:${siteId}:${ip}`;
  await redis.setex(key, 86400, reason);
}

/**
 * Check if IP is marked as suspicious
 */
async function isSuspicious(siteId, ip) {
  const key = `suspicious:${siteId}:${ip}`;
  return await redis.exists(key);
}

module.exports = {
  initRedis,
  getRedis,
  redis: () => getRedis(),
  incrementClickCounter,
  getClickCount,
  cacheFingerprint,
  getCachedFingerprint,
  markSuspicious,
  isSuspicious
};