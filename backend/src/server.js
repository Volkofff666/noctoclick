/**
 * NoctoClick API Server
 * Main entry point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./utils/logger');
const { initDatabase } = require('./db/postgres');
const { initRedis } = require('./db/redis');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database
    const { pool } = require('./db/postgres');
    await pool.query('SELECT 1');
    
    // Check Redis
    const { redis } = require('./db/redis');
    await redis.ping();
    
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: 'connected',
      redis: 'connected'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service unhealthy',
      error: config.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

// API Routes
app.use('/api/track', require('./routes/track'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/yandex', require('./routes/yandex'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/blocked', require('./routes/blocked'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  
  res.status(err.status || 500).json({
    error: config.nodeEnv === 'development' ? err.message : 'Internal Server Error',
    stack: config.nodeEnv === 'development' ? err.stack : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

let server;

async function shutdown() {
  logger.info('Received shutdown signal, closing server gracefully...');
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        // Close database connections
        const { pool } = require('./db/postgres');
        await pool.end();
        logger.info('Database connections closed');
        
        // Close Redis connection
        const { redis } = require('./db/redis');
        await redis.quit();
        logger.info('Redis connection closed');
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  }
}

// Start server
async function start() {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database initialized');
    
    // Initialize Redis
    await initRedis();
    logger.info('Redis initialized');
    
    // Start cron jobs
    require('./services/scheduler');
    logger.info('Scheduler started');
    
    // Start HTTP server
    server = app.listen(config.port, () => {
      logger.info(`🚀 NoctoClick API server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
start();

module.exports = app;