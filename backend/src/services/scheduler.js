/**
 * Cron scheduler for periodic tasks
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const config = require('../config');
const { query } = require('../db/postgres');
const FraudDetector = require('./fraud-detector');

// Run fraud detection and auto-blocking every hour
cron.schedule('0 * * * *', async () => {
  logger.info('Running hourly fraud detection...');
  
  try {
    // Get all sites
    const sites = await query('SELECT id, name FROM sites');
    
    const fraudDetector = new FraudDetector();
    let totalBlocked = 0;
    
    for (const site of sites.rows) {
      try {
        const result = await fraudDetector.autoBlock(site.id);
        totalBlocked += result.blocked;
        
        if (result.blocked > 0) {
          logger.info(`Auto-blocked ${result.blocked} IPs for site ${site.name}`);
        }
      } catch (error) {
        logger.error(`Error processing site ${site.id}:`, error);
      }
    }
    
    logger.info(`Hourly fraud detection completed. Total blocked: ${totalBlocked}`);
  } catch (error) {
    logger.error('Hourly fraud detection error:', error);
  }
});

// Cleanup old events every day at 3 AM
cron.schedule('0 3 * * *', async () => {
  logger.info('Running daily cleanup...');
  
  try {
    // Delete events older than 30 days
    const result = await query(
      "DELETE FROM events WHERE created_at < NOW() - INTERVAL '30 days'"
    );
    
    logger.info(`Deleted ${result.rowCount} old events`);
    
    // Auto-unblock IPs that reached auto_unblock_at
    const unblocked = await query(
      'UPDATE blocked_ips SET is_active = false, unblocked_at = CURRENT_TIMESTAMP WHERE auto_unblock_at IS NOT NULL AND auto_unblock_at <= CURRENT_TIMESTAMP AND is_active = true'
    );
    
    logger.info(`Auto-unblocked ${unblocked.rowCount} IPs`);
    
    // Log cleanup
    await query(
      "INSERT INTO sync_logs (site_id, sync_type, status) VALUES (1, 'cleanup', 'success')"
    );
    
  } catch (error) {
    logger.error('Daily cleanup error:', error);
  }
});

// Sync with Yandex Direct every hour (if configured)
if (config.sync.fraudSyncInterval > 0) {
  const interval = config.sync.fraudSyncInterval;
  
  cron.schedule(`0 */${interval} * * *`, async () => {
    logger.info('Running Yandex Direct sync...');
    
    try {
      // Get sites with Yandex integration
      const sites = await query(`
        SELECT DISTINCT s.id, s.name, c.yandex_token
        FROM sites s
        JOIN client_sites cs ON s.id = cs.site_id
        JOIN clients c ON cs.client_id = c.id
        WHERE c.yandex_token IS NOT NULL
      `);
      
      if (sites.rows.length === 0) {
        logger.info('No sites with Yandex integration');
        return;
      }
      
      const YandexClient = require('./yandex-client');
      
      for (const site of sites.rows) {
        try {
          const client = new YandexClient(site.yandex_token);
          const result = await client.syncBlockedIPs(site.id);
          
          logger.info(`Synced ${result.ips} IPs for site ${site.name}`);
        } catch (error) {
          logger.error(`Error syncing site ${site.id}:`, error);
        }
      }
      
    } catch (error) {
      logger.error('Yandex sync error:', error);
    }
  });
}

logger.info('Scheduler initialized');

module.exports = {};