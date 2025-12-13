/**
 * Tracking endpoint
 * Receives data from client-side tracker and analyzes for fraud
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const logger = require('../utils/logger');
const FraudDetector = require('../services/fraud-detector');

/**
 * Get real IP address from request
 */
function getClientIP(req) {
  // Check X-Forwarded-For header (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Check X-Real-IP header
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  
  // Fallback to direct connection IP
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Increment click counter in memory (simple implementation)
 */
const clickCounters = new Map();

function incrementClickCounter(siteId, ip) {
  const key = `${siteId}:${ip}`;
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  
  // Get or create counter for this IP
  let counter = clickCounters.get(key) || [];
  
  // Remove clicks older than 1 hour
  counter = counter.filter(timestamp => timestamp > hourAgo);
  
  // Add current click
  counter.push(now);
  
  // Update counter
  clickCounters.set(key, counter);
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance
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

    // Get real client IP
    const ip = getClientIP(req);

    // Validate required fields
    if (!siteId || !fingerprintHash) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        success: false 
      });
    }

    // Get site from database (support both API key and site ID)
    const siteResult = await query(
      'SELECT id, user_id, domain FROM client_sites WHERE api_key = $1 OR id::text = $1',
      [siteId]
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
       WHERE site_id = $1 AND ip_address = $2 
       AND is_active = true 
       AND (auto_unblock_at IS NULL OR auto_unblock_at > NOW())`,
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
      analysis.isFraud,
      analysis.isSuspicious,
      analysis.reason,
      JSON.stringify(fingerprint)
    ]);

    // Log the event
    logger.info('Event tracked', { 
      siteId: siteDbId, 
      ip, 
      fraudScore: analysis.fraudScore,
      isFraud: analysis.isFraud,
      isSuspicious: analysis.isSuspicious,
      clickCount
    });

    // If fraud detected, trigger auto-block check (async, don't wait)
    if (analysis.isFraud && clickCount >= 3) {
      fraudDetector.autoBlock(siteDbId).catch(err => {
        logger.error('Auto-block failed', { error: err.message });
      });
    }

    // Return response (don't expose too much info to client)
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
 * GET /api/track/test - test endpoint for tracker installation
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NoctoClick tracker endpoint is working',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/track/batch - batch event tracking (for performance)
 */
router.post('/batch', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ 
        error: 'Events array required',
        success: false 
      });
    }

    // Limit batch size
    if (events.length > 100) {
      return res.status(400).json({ 
        error: 'Maximum 100 events per batch',
        success: false 
      });
    }

    const results = [];
    const fraudDetector = new FraudDetector();

    for (const event of events) {
      try {
        const ip = getClientIP(req);
        
        // Get site
        const siteResult = await query(
          'SELECT id FROM client_sites WHERE api_key = $1 OR id::text = $1',
          [event.siteId]
        );

        if (siteResult.rows.length === 0) continue;

        const siteDbId = siteResult.rows[0].id;
        const clickCount = incrementClickCounter(siteDbId, ip);

        // Analyze fraud
        const analysis = await fraudDetector.analyze({
          siteId: siteDbId,
          ip,
          fingerprint: event.fingerprint,
          fingerprintHash: event.fingerprintHash,
          behavior: event.behavior,
          clickCount
        });

        // Save event
        await query(`
          INSERT INTO events (
            site_id, ip_address, fingerprint_hash, user_agent,
            url, referrer, mouse_movements, clicks, key_presses,
            scrolls, time_on_page, fraud_score, is_fraud, is_suspicious,
            fraud_reason, fingerprint_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          siteDbId, ip, event.fingerprintHash,
          event.fingerprint?.userAgent || req.headers['user-agent'],
          event.url, event.referrer,
          event.behavior?.mouseMovements || 0,
          event.behavior?.clicks || 0,
          event.behavior?.keyPresses || 0,
          event.behavior?.scrolls || 0,
          event.behavior?.timeOnPage || 0,
          analysis.fraudScore, analysis.isFraud, analysis.isSuspicious,
          analysis.reason, JSON.stringify(event.fingerprint)
        ]);

        results.push({ success: true, fraudScore: analysis.fraudScore });

      } catch (err) {
        logger.error('Batch event error:', err);
        results.push({ success: false, error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    logger.error('Batch track error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

module.exports = router;