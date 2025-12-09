/**
 * Fraud Detection Service
 * Analyzes events and detects fraudulent activity
 */

const config = require('../config');
const logger = require('../utils/logger');
const { query } = require('../db/postgres');

class FraudDetector {
  constructor() {
    this.thresholds = config.fraud;
  }

  /**
   * Analyze event for fraud
   */
  async analyze(data) {
    const { siteId, ip, fingerprint, fingerprintHash, behavior, clickCount } = data;
    
    let fraudScore = 0;
    let reasons = [];

    // Rule 1: Too many clicks from same IP
    if (clickCount > this.thresholds.maxClicksPerHour) {
      fraudScore += 40;
      reasons.push(`Too many clicks: ${clickCount} in last hour`);
    }

    // Rule 2: Very short time on site
    if (behavior && behavior.timeOnPage < this.thresholds.minTimeOnSite) {
      fraudScore += 25;
      reasons.push(`Short visit: ${behavior.timeOnPage}s`);
    }

    // Rule 3: No mouse movements
    if (behavior && behavior.mouseMovements === 0 && behavior.timeOnPage > 2) {
      fraudScore += 20;
      reasons.push('No mouse activity');
    }

    // Rule 4: Suspicious fingerprint patterns
    if (fingerprint) {
      const suspiciousFingerprint = await this.checkFingerprintAnomalies(fingerprint);
      if (suspiciousFingerprint.score > 0) {
        fraudScore += suspiciousFingerprint.score;
        reasons.push(...suspiciousFingerprint.reasons);
      }
    }

    // Rule 5: Same fingerprint hash seen multiple times
    const fpCount = await this.getFingerprintCount(siteId, fingerprintHash);
    if (fpCount > 10) {
      fraudScore += 15;
      reasons.push(`Fingerprint reuse: ${fpCount} times`);
    }

    // Rule 6: Headless browser detection
    if (behavior && this.detectHeadlessBrowser(fingerprint, behavior)) {
      fraudScore += 30;
      reasons.push('Headless browser detected');
    }

    // Rule 7: No interaction before leaving
    if (behavior && behavior.clicks === 0 && behavior.keyPresses === 0 && behavior.timeOnPage > 1) {
      fraudScore += 10;
      reasons.push('No interaction');
    }

    // Rule 8: Suspicious timing patterns
    if (behavior && behavior.timeToFirstInteraction !== null && behavior.timeToFirstInteraction < 0.5) {
      fraudScore += 15;
      reasons.push('Instant interaction (bot-like)');
    }

    // Cap fraud score at 100
    fraudScore = Math.min(fraudScore, 100);

    const isFraud = fraudScore >= this.thresholds.fraudScoreThreshold;
    const isSuspicious = fraudScore >= 40 && fraudScore < this.thresholds.fraudScoreThreshold;

    return {
      fraudScore,
      isFraud,
      isSuspicious,
      reason: reasons.join('; ')
    };
  }

  /**
   * Check fingerprint for anomalies
   */
  async checkFingerprintAnomalies(fingerprint) {
    let score = 0;
    let reasons = [];

    // Check for WebDriver
    if (fingerprint.webdriver === true) {
      score += 25;
      reasons.push('WebDriver detected');
    }

    // Check for missing features
    if (!fingerprint.webgl || fingerprint.webgl === 'not_supported') {
      score += 10;
      reasons.push('WebGL not supported');
    }

    // Check for plugins
    if (fingerprint.plugins === 'none' || fingerprint.plugins === '') {
      score += 5;
      reasons.push('No browser plugins');
    }

    // Check timezone mismatch with language
    if (this.detectTimezoneMismatch(fingerprint)) {
      score += 15;
      reasons.push('Timezone/language mismatch');
    }

    // Check for common VPN/proxy user-agents
    if (this.detectVPNUserAgent(fingerprint.userAgent)) {
      score += 10;
      reasons.push('VPN/Proxy detected');
    }

    return { score, reasons };
  }

  /**
   * Get fingerprint usage count
   */
  async getFingerprintCount(siteId, fingerprintHash) {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM events WHERE site_id = $1 AND fingerprint_hash = $2 AND created_at >= NOW() - INTERVAL \'7 days\'',
        [siteId, fingerprintHash]
      );
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      logger.error('Error getting fingerprint count:', error);
      return 0;
    }
  }

  /**
   * Detect headless browser
   */
  detectHeadlessBrowser(fingerprint, behavior) {
    if (!fingerprint) return false;

    // Headless Chrome indicators
    const ua = fingerprint.userAgent || '';
    if (ua.includes('HeadlessChrome')) return true;
    
    // PhantomJS
    if (ua.includes('PhantomJS')) return true;

    // No canvas but has WebGL (unusual)
    if (!fingerprint.canvas && fingerprint.webgl && fingerprint.webgl !== 'not_supported') {
      return true;
    }

    // Zero hardware concurrency
    if (fingerprint.hardwareConcurrency === 0) {
      return true;
    }

    return false;
  }

  /**
   * Detect timezone mismatch
   */
  detectTimezoneMismatch(fingerprint) {
    if (!fingerprint.timezone || !fingerprint.language) return false;

    // Simple heuristic: check if timezone matches language region
    const tz = fingerprint.timezone.toLowerCase();
    const lang = fingerprint.language.toLowerCase();

    // Example: if language is 'ru' but timezone is 'America/New_York'
    if (lang.includes('ru') && tz.includes('america')) return true;
    if (lang.includes('en-us') && (tz.includes('europe') || tz.includes('asia'))) return true;
    
    return false;
  }

  /**
   * Detect VPN/Proxy user agent
   */
  detectVPNUserAgent(userAgent) {
    if (!userAgent) return false;

    const ua = userAgent.toLowerCase();
    const vpnKeywords = ['vpn', 'proxy', 'tor', 'anonymizer'];
    
    return vpnKeywords.some(keyword => ua.includes(keyword));
  }

  /**
   * Get IPs to block for a site
   */
  async getIPsToBlock(siteId) {
    try {
      // Get IPs with high fraud scores or multiple fraud events
      const result = await query(`
        SELECT 
          ip_address,
          COUNT(*) as fraud_count,
          AVG(fraud_score) as avg_score,
          MAX(fraud_reason) as reason
        FROM events
        WHERE site_id = $1 
          AND created_at >= NOW() - INTERVAL '24 hours'
          AND (is_fraud = true OR fraud_score >= 60)
        GROUP BY ip_address
        HAVING COUNT(*) >= 3
        ORDER BY fraud_count DESC, avg_score DESC
        LIMIT 50
      `, [siteId]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting IPs to block:', error);
      return [];
    }
  }

  /**
   * Auto-block fraudulent IPs
   */
  async autoBlock(siteId) {
    if (!config.fraud.autoBlockEnabled) {
      logger.info('Auto-block disabled');
      return { blocked: 0 };
    }

    try {
      const ipsToBlock = await this.getIPsToBlock(siteId);
      let blockedCount = 0;

      for (const ipData of ipsToBlock) {
        // Check if already blocked
        const existing = await query(
          'SELECT id FROM blocked_ips WHERE site_id = $1 AND ip_address = $2 AND is_active = true',
          [siteId, ipData.ip_address]
        );

        if (existing.rows.length === 0) {
          // Block for 7 days
          const autoUnblockAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          
          await query(
            'INSERT INTO blocked_ips (site_id, ip_address, reason, auto_blocked, auto_unblock_at) VALUES ($1, $2, $3, true, $4)',
            [siteId, ipData.ip_address, ipData.reason, autoUnblockAt]
          );
          
          blockedCount++;
          logger.info('Auto-blocked IP', { siteId, ip: ipData.ip_address, reason: ipData.reason });
        }
      }

      return { blocked: blockedCount, analyzed: ipsToBlock.length };
    } catch (error) {
      logger.error('Auto-block error:', error);
      throw error;
    }
  }
}

module.exports = FraudDetector;