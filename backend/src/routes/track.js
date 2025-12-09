/**
 * Tracking endpoint
 * Receives data from client-side tracker
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { incrementClickCounter, markSuspicious } = require('../db/redis');
const logger = require('../utils/logger');
const FraudDetector = require('../services/fraud-detector');

// POST /api/track - receive tracking data
router.post('/', async (req, res) => {
  try {
    const {
      siteId,
      fingerprint,
      fingerprintHash,
      behavior,
      url,
      referrer,
      utm
    } = req.body;

    // Get IP address from request
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.ip || 
               req.connection.remoteAddress;

    // Validate required fields
    if (!siteId || !fingerprintHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get site from database
    const siteResult = await query(
      'SELECT id FROM sites WHERE api_key = $1 OR id::text = $1',
      [siteId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const siteDbId = siteResult.rows[0].id;

    // Increment click counter in Redis
    const clickCount = await incrementClickCounter(siteDbId, ip);

    // Analyze for fraud
    const fraudDetector = new FraudDetector();
    const analysis = await fraudDetector.analyze({
      siteId: siteDbId,
      ip,
      fingerprint,
      fingerprintHash,
      behavior,
      clickCount
    });

    // Mark as suspicious in Redis if fraud detected
    if (analysis.isFraud || analysis.isSuspicious) {
      await markSuspicious(siteDbId, ip, analysis.reason);
    }

    // Save event to database
    await query(`
      INSERT INTO events (
        site_id,
        ip_address,
        fingerprint_hash,
        user_agent,
        url,
        referrer,
        mouse_movements,
        clicks,
        key_presses,
        scrolls,
        time_on_page,
        time_to_first_interaction,
        scroll_depth,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        yclid,
        fraud_score,
        is_fraud,
        is_suspicious,
        fraud_reason,
        fingerprint_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
    `, [
      siteDbId,
      ip,
      fingerprintHash,
      fingerprint?.userAgent || req.headers['user-agent'],
      url,
      referrer,
      behavior?.mouseMovements || 0,
      behavior?.clicks || 0,
      behavior?.keyPresses || 0,
      behavior?.scrolls || 0,
      behavior?.timeOnPage || 0,
      behavior?.timeToFirstInteraction,
      behavior?.scrollDepth || 0,
      utm?.utm_source,
      utm?.utm_medium,
      utm?.utm_campaign,
      utm?.utm_term,
      utm?.utm_content,
      utm?.yclid,
      analysis.fraudScore,
      analysis.isFraud,
      analysis.isSuspicious,
      analysis.reason,
      JSON.stringify(fingerprint)
    ]);

    logger.info('Event tracked', { 
      siteId: siteDbId, 
      ip, 
      fraudScore: analysis.fraudScore,
      isFraud: analysis.isFraud
    });

    res.status(200).json({
      success: true,
      fraudScore: analysis.fraudScore,
      // Don't expose too much info to client
      message: analysis.isFraud ? 'suspicious' : 'ok'
    });

  } catch (error) {
    logger.error('Track endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;