/**
 * Statistics endpoints
 * Provides detailed fraud detection statistics
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const logger = require('../utils/logger');
const FraudDetector = require('../services/fraud-detector');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/stats/:siteId - comprehensive site statistics
 */
router.get('/:siteId', authenticate, async (req, res) => {
  try {
    const { siteId } = req.params;
    const { period = '24h' } = req.query;

    // Parse period to hours
    let hours = 24;
    if (period.endsWith('h')) {
      hours = parseInt(period);
    } else if (period.endsWith('d')) {
      hours = parseInt(period) * 24;
    } else if (period.endsWith('w')) {
      hours = parseInt(period) * 24 * 7;
    }

    // Validate hours range
    if (hours < 1 || hours > 720) { // max 30 days
      return res.status(400).json({ error: 'Invalid period range' });
    }

    // Get site and verify ownership
    const siteResult = await query(
      'SELECT id, name, domain, user_id FROM client_sites WHERE id::text = $1 AND user_id = $2',
      [siteId, req.userId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const site = siteResult.rows[0];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get fraud statistics from detector
    const fraudDetector = new FraudDetector();
    const fraudStats = await fraudDetector.getStats(site.id, hours);

    // Top fraud IPs with details
    const topIpsResult = await query(`
      SELECT 
        ip_address,
        COUNT(*) as click_count,
        ROUND(AVG(fraud_score)::numeric, 2) as avg_fraud_score,
        MAX(is_fraud) as is_fraud,
        MAX(fraud_reason) as reason,
        MAX(created_at) as last_seen
      FROM events 
      WHERE site_id = $1 AND created_at >= $2
      GROUP BY ip_address
      HAVING COUNT(*) > 3 OR MAX(is_fraud) = true
      ORDER BY click_count DESC, avg_fraud_score DESC
      LIMIT 20
    `, [site.id, since]);

    // Hourly distribution chart data
    const hourlyResult = await query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as total,
        SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) as fraud_count,
        SUM(CASE WHEN is_suspicious THEN 1 ELSE 0 END) as suspicious_count,
        ROUND(AVG(fraud_score)::numeric, 2) as avg_score
      FROM events
      WHERE site_id = $1 AND created_at >= $2
      GROUP BY hour
      ORDER BY hour ASC
    `, [site.id, since]);

    // Currently blocked IPs
    const blockedResult = await query(`
      SELECT 
        ip_address,
        reason,
        auto_blocked,
        auto_unblock_at,
        created_at
      FROM blocked_ips 
      WHERE site_id = $1 
      AND is_active = true
      AND (auto_unblock_at IS NULL OR auto_unblock_at > NOW())
      ORDER BY created_at DESC
      LIMIT 50
    `, [site.id]);

    // Fraud reasons breakdown
    const reasonsResult = await query(`
      SELECT 
        fraud_reason,
        COUNT(*) as count
      FROM events
      WHERE site_id = $1 
      AND created_at >= $2 
      AND (is_fraud = true OR is_suspicious = true)
      AND fraud_reason IS NOT NULL
      GROUP BY fraud_reason
      ORDER BY count DESC
      LIMIT 10
    `, [site.id, since]);

    // Geographic distribution (if available)
    const geoResult = await query(`
      SELECT 
        SUBSTRING(ip_address FROM 1 FOR POSITION('.' IN ip_address)) as ip_prefix,
        COUNT(*) as count,
        SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) as fraud_count
      FROM events
      WHERE site_id = $1 AND created_at >= $2
      GROUP BY ip_prefix
      ORDER BY count DESC
      LIMIT 20
    `, [site.id, since]);

    // Browser/device patterns
    const deviceResult = await query(`
      SELECT 
        CASE 
          WHEN user_agent ILIKE '%mobile%' THEN 'Mobile'
          WHEN user_agent ILIKE '%tablet%' THEN 'Tablet'
          ELSE 'Desktop'
        END as device_type,
        COUNT(*) as count,
        SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) as fraud_count,
        ROUND(AVG(fraud_score)::numeric, 2) as avg_fraud_score
      FROM events
      WHERE site_id = $1 AND created_at >= $2
      GROUP BY device_type
      ORDER BY count DESC
    `, [site.id, since]);

    // Response
    res.json({
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain
      },
      period: {
        hours: hours,
        label: period,
        from: since,
        to: new Date()
      },
      overview: {
        totalEvents: parseInt(fraudStats.total_events) || 0,
        fraudEvents: parseInt(fraudStats.fraud_events) || 0,
        suspiciousEvents: parseInt(fraudStats.suspicious_events) || 0,
        legitimateEvents: parseInt(fraudStats.total_events) - parseInt(fraudStats.fraud_events) - parseInt(fraudStats.suspicious_events) || 0,
        uniqueIPs: parseInt(fraudStats.unique_ips) || 0,
        uniqueFingerprints: parseInt(fraudStats.unique_fingerprints) || 0,
        avgFraudScore: parseFloat(fraudStats.avg_fraud_score) || 0,
        fraudRate: parseFloat(fraudStats.fraud_rate) || 0,
        blockedIPs: blockedResult.rows.length
      },
      topFraudIPs: topIpsResult.rows.map(row => ({
        ip: row.ip_address,
        clicks: parseInt(row.click_count),
        avgScore: parseFloat(row.avg_fraud_score),
        isFraud: row.is_fraud,
        reason: row.reason,
        lastSeen: row.last_seen
      })),
      blockedIPs: blockedResult.rows.map(row => ({
        ip: row.ip_address,
        reason: row.reason,
        autoBlocked: row.auto_blocked,
        unblockAt: row.auto_unblock_at,
        blockedAt: row.created_at
      })),
      timeline: hourlyResult.rows.map(row => ({
        hour: row.hour,
        total: parseInt(row.total),
        fraud: parseInt(row.fraud_count),
        suspicious: parseInt(row.suspicious_count),
        avgScore: parseFloat(row.avg_score)
      })),
      fraudReasons: reasonsResult.rows.map(row => ({
        reason: row.fraud_reason,
        count: parseInt(row.count)
      })),
      deviceBreakdown: deviceResult.rows.map(row => ({
        deviceType: row.device_type,
        count: parseInt(row.count),
        fraudCount: parseInt(row.fraud_count),
        avgFraudScore: parseFloat(row.avg_fraud_score)
      })),
      geoDistribution: geoResult.rows.slice(0, 10)
    });

  } catch (error) {
    logger.error('Stats endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stats/:siteId/recent - recent events feed
 */
router.get('/:siteId/recent', authenticate, async (req, res) => {
  try {
    const { siteId } = req.params;
    const { limit = 50, offset = 0, fraudOnly = false } = req.query;

    // Verify ownership
    const siteResult = await query(
      'SELECT id FROM client_sites WHERE id::text = $1 AND user_id = $2',
      [siteId, req.userId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const fraudFilter = fraudOnly === 'true' ? 'AND (is_fraud = true OR is_suspicious = true)' : '';

    const result = await query(`
      SELECT 
        id,
        ip_address,
        url,
        referrer,
        time_on_page,
        mouse_movements,
        clicks,
        key_presses,
        fraud_score,
        is_fraud,
        is_suspicious,
        fraud_reason,
        created_at
      FROM events
      WHERE site_id = $1 ${fraudFilter}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [siteResult.rows[0].id, limit, offset]);

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM events WHERE site_id = $1 ${fraudFilter}`,
      [siteResult.rows[0].id]
    );

    res.json({
      events: result.rows.map(row => ({
        id: row.id,
        ip: row.ip_address,
        url: row.url,
        referrer: row.referrer,
        timeOnPage: row.time_on_page,
        mouseMovements: row.mouse_movements,
        clicks: row.clicks,
        keyPresses: row.key_presses,
        fraudScore: row.fraud_score,
        isFraud: row.is_fraud,
        isSuspicious: row.is_suspicious,
        reason: row.fraud_reason,
        timestamp: row.created_at
      })),
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult.rows[0].total)
      }
    });

  } catch (error) {
    logger.error('Recent events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stats/:siteId/export - export fraud data
 */
router.get('/:siteId/export', authenticate, async (req, res) => {
  try {
    const { siteId } = req.params;
    const { format = 'csv', period = '24h' } = req.query;

    // Parse period
    let hours = 24;
    if (period.endsWith('h')) hours = parseInt(period);
    else if (period.endsWith('d')) hours = parseInt(period) * 24;

    // Verify ownership
    const siteResult = await query(
      'SELECT id, name FROM client_sites WHERE id::text = $1 AND user_id = $2',
      [siteId, req.userId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await query(`
      SELECT 
        ip_address,
        url,
        referrer,
        time_on_page,
        fraud_score,
        is_fraud,
        fraud_reason,
        created_at
      FROM events
      WHERE site_id = $1 AND created_at >= $2
      ORDER BY created_at DESC
    `, [siteResult.rows[0].id, since]);

    if (format === 'csv') {
      // Generate CSV
      const csv = [
        'IP,URL,Referrer,Time on Page,Fraud Score,Is Fraud,Reason,Timestamp',
        ...result.rows.map(row => 
          `"${row.ip_address}","${row.url || ''}","${row.referrer || ''}",${row.time_on_page},${row.fraud_score},${row.is_fraud},"${row.fraud_reason || ''}","${row.created_at}"`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fraud-data-${siteId}-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      // JSON format
      res.json({
        site: siteResult.rows[0].name,
        period: { hours, from: since, to: new Date() },
        data: result.rows
      });
    }

  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;