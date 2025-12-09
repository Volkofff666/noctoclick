/**
 * PostgreSQL connection pool
 */

const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

let pool = null;

/**
 * Initialize database connection pool
 */
async function initDatabase() {
  try {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('PostgreSQL connection pool initialized');

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected database error:', err);
    });

    return pool;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get pool instance
 */
function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
}

/**
 * Execute query with error handling
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (config.nodeEnv === 'development' && duration > 1000) {
      logger.warn(`Slow query (${duration}ms): ${text}`);
    }
    
    return result;
  } catch (error) {
    logger.error('Database query error:', { text, params, error: error.message });
    throw error;
  }
}

module.exports = {
  initDatabase,
  getPool,
  query,
  pool: () => getPool()
};