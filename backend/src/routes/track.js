/**
 * Tracking endpoint
 * Receives data from client-side tracker and analyzes for fraud
 */

const express = require('express');
const router = express.Router();
const { query, run } = require('../db');
const logger = require('../utils/logger');
const FraudDetector = require('../services/fraud-detector');

/**
 * Get real IP address from request
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Increment click counter in memory
 */
const clickCounters = new Map();

function incrementClickCounter(siteId, ip) {
  const key = `${siteId}:${ip}`;
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  
  let counter = clickCounters.get(key) || [];
  counter = counter.filter(timestamp => timestamp > hourAgo);
  counter.push(now);
  clickCounters.set(key, counter);
  
  if (Math.random() < 0.01) {
    cleanupOldCounters();
  }
  
  return counter.length;
}

function cleanupOldCounters() {
  const hourAgo = Date.now() - (60 * 60 * 1000);
  for (const [key, timestamps] of clickCounters.entries()) {
    const recent = timestamps.filter(t => t > hourAgo);
    if (recent.length === 0) {
      clickCounters.delete(key);
    } else {
      clickCounters.set(key, recent);
    }
  }
}

/**
 * POST /api/track - main tracking endpoint
 */
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

    const ip = getClientIP(req);

    if (!siteId || !fingerprintHash) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        success: false 
      });
    }

    // Get site from database
    const siteResult = await query(
      'SELECT id, user_id, domain FROM client_sites WHERE api_key = ? OR id = ?',
      [siteId, siteId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Site not found',
        success: false 
      });
    }

    const site = siteResult.rows[0];
    const siteDbId = site.id;

    // Check if IP is blocked
    const blockedCheck = await query(
      `SELECT id, reason FROM blocked_ips 
       WHERE site_id = ? AND ip_address = ? 
       AND is_active = 1 
       AND (auto_unblock_at IS NULL OR auto_unblock_at > datetime('now'))`,
      [siteDbId, ip]
    );

    if (blockedCheck.rows.length > 0) {
      logger.warn('Blocked IP attempted access', { 
        siteId: siteDbId, 
        ip, 
        reason: blockedCheck.rows[0].reason 
      });
      
      return res.status(403).json({ 
        success: false,
        blocked: true,
        message: 'Access denied'
      });
    }

    // Increment click counter
    const clickCount = incrementClickCounter(siteDbId, ip);

    // Initialize fraud detector
    const fraudDetector = new FraudDetector();
    
    // Analyze for fraud
    const analysis = await fraudDetector.analyze({
      siteId: siteDbId,
      ip,
      fingerprint,
      fingerprintHash,
      behavior,
      clickCount
    });

    // Save event to database
    await run(`
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      siteDbId,
      ip,
      fingerprintHash,
      fingerprint?.userAgent || req.headers['user-agent'] || 'unknown',
      url || null,
      referrer || null,
      behavior?.mouseMovements || 0,
      behavior?.clicks || 0,
      behavior?.keyPresses || 0,
      behavior?.scrolls || 0,
      behavior?.timeOnPage || 0,
      behavior?.timeToFirstInteraction !== undefined ? behavior.timeToFirstInteraction : null,
      behavior?.scrollDepth || 0,
      utm?.utm_source || null,
      utm?.utm_medium || null,
      utm?.utm_campaign || null,
      utm?.utm_term || null,
      utm?.utm_content || null,
      utm?.yclid || null,
      analysis.fraudScore,
      analysis.isFraud ? 1 : 0,
      analysis.isSuspicious ? 1 : 0,
      analysis.reason,
      JSON.stringify(fingerprint)
    ]);

    logger.info('Event tracked', { 
      siteId: siteDbId, 
      ip, 
      fraudScore: analysis.fraudScore,
      isFraud: analysis.isFraud,
      isSuspicious: analysis.isSuspicious,
      clickCount
    });

    // If fraud detected, trigger auto-block check (async)
    if (analysis.isFraud && clickCount >= 3) {
      fraudDetector.autoBlock(siteDbId).catch(err => {
        logger.error('Auto-block failed', { error: err.message });
      });
    }

    res.status(200).json({
      success: true,
      fraudScore: analysis.fraudScore,
      status: analysis.isFraud ? 'fraud' : (analysis.isSuspicious ? 'suspicious' : 'ok')
    });

  } catch (error) {
    logger.error('Track endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

/**
 * GET /api/track/test - test endpoint
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NoctoClick tracker endpoint is working',
    timestamp: new Date().toISOString(),
    database: process.env.DB_TYPE || 'sqlite'
  });
});

module.exports = router;