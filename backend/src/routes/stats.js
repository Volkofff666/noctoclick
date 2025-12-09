/**
 * Statistics endpoints
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const logger = require('../utils/logger');

// GET /api/stats/:siteId - get site statistics
router.get('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { period = '24h' } = req.query;

    // Parse period
    let hours = 24;
    if (period.endsWith('h')) {
      hours = parseInt(period);
    } else if (period.endsWith('d')) {
      hours = parseInt(period) * 24;
    }

    // Get site
    const siteResult = await query(
      'SELECT id, name, domain FROM sites WHERE id = $1 OR api_key = $1',
      [siteId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const site = siteResult.rows[0];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Total events
    const totalResult = await query(
      'SELECT COUNT(*) as total FROM events WHERE site_id = $1 AND created_at >= $2',
      [site.id, since]
    );

    // Fraud events
    const fraudResult = await query(
      'SELECT COUNT(*) as fraud FROM events WHERE site_id = $1 AND created_at >= $2 AND is_fraud = true',
      [site.id, since]
    );

    // Suspicious events
    const suspiciousResult = await query(
      'SELECT COUNT(*) as suspicious FROM events WHERE site_id = $1 AND created_at >= $2 AND is_suspicious = true',
      [site.id, since]
    );

    // Blocked IPs count
    const blockedResult = await query(
      'SELECT COUNT(*) as blocked FROM blocked_ips WHERE site_id = $1 AND is_active = true',
      [site.id]
    );

    // Top fraud IPs
    const topIpsResult = await query(`
      SELECT 
        ip_address,
        COUNT(*) as click_count,
        AVG(fraud_score) as avg_fraud_score,
        MAX(is_fraud) as is_fraud
      FROM events 
      WHERE site_id = $1 AND created_at >= $2
      GROUP BY ip_address
      HAVING COUNT(*) > 3 OR MAX(is_fraud) = true
      ORDER BY click_count DESC
      LIMIT 10
    `, [site.id, since]);

    // Hourly distribution
    const hourlyResult = await query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as total,
        SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) as fraud_count,
        SUM(CASE WHEN is_suspicious THEN 1 ELSE 0 END) as suspicious_count
      FROM events
      WHERE site_id = $1 AND created_at >= $2
      GROUP BY hour
      ORDER BY hour ASC
    `, [site.id, since]);

    res.json({
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain
      },
      period: `${hours}h`,
      stats: {
        total: parseInt(totalResult.rows[0].total),
        fraud: parseInt(fraudResult.rows[0].fraud),
        suspicious: parseInt(suspiciousResult.rows[0].suspicious),
        legitimate: parseInt(totalResult.rows[0].total) - parseInt(fraudResult.rows[0].fraud) - parseInt(suspiciousResult.rows[0].suspicious),
        blockedIps: parseInt(blockedResult.rows[0].blocked)
      },
      topIps: topIpsResult.rows,
      hourly: hourlyResult.rows
    });

  } catch (error) {
    logger.error('Stats endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/:siteId/recent - recent events
router.get('/:siteId/recent', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { limit = 50 } = req.query;

    const result = await query(`
      SELECT 
        id,
        ip_address,
        url,
        time_on_page,
        fraud_score,
        is_fraud,
        is_suspicious,
        fraud_reason,
        created_at
      FROM events
      WHERE site_id = (SELECT id FROM sites WHERE id::text = $1 OR api_key = $1)
      ORDER BY created_at DESC
      LIMIT $2
    `, [siteId, limit]);

    res.json({
      events: result.rows
    });

  } catch (error) {
    logger.error('Recent events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;