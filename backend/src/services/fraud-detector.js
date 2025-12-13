/**
 * Fraud Detection Service
 * Analyzes events and detects fraudulent activity
 */

const config = require('../config');
const logger = require('../utils/logger');
const { query } = require('../db/postgres');

class FraudDetector {
  constructor() {
    this.thresholds = config.fraud || {
      maxClicksPerHour: 10,
      minTimeOnSite: 3,
      fraudScoreThreshold: 70,
      autoBlockEnabled: true
    };
  }

  /**
   * Main analysis method - checks all fraud patterns
   */
  async analyze(data) {
    const { siteId, ip, fingerprint, fingerprintHash, behavior, clickCount } = data;
    
    let fraudScore = 0;
    let reasons = [];

    // Rule 1: Too many clicks from same IP (40 points)
    if (clickCount > this.thresholds.maxClicksPerHour) {
      fraudScore += 40;
      reasons.push(`Слишком много кликов: ${clickCount} за час`);
    }

    // Rule 2: Very short time on site (25 points)
    if (behavior && behavior.timeOnPage > 0 && behavior.timeOnPage < this.thresholds.minTimeOnSite) {
      fraudScore += 25;
      reasons.push(`Короткий визит: ${behavior.timeOnPage}с`);
    }

    // Rule 3: No mouse movements but page was active (20 points)
    if (behavior && behavior.mouseMovements === 0 && behavior.timeOnPage > 2) {
      fraudScore += 20;
      reasons.push('Отсутствие движений мыши');
    }

    // Rule 4: Suspicious fingerprint patterns (up to 50 points)
    if (fingerprint) {
      const suspiciousFingerprint = await this.checkFingerprintAnomalies(fingerprint);
      if (suspiciousFingerprint.score > 0) {
        fraudScore += suspiciousFingerprint.score;
        reasons.push(...suspiciousFingerprint.reasons);
      }
    }

    // Rule 5: Same fingerprint hash seen multiple times (15 points)
    const fpCount = await this.getFingerprintCount(siteId, fingerprintHash);
    if (fpCount > 10) {
      fraudScore += 15;
      reasons.push(`Повторное использование отпечатка: ${fpCount} раз`);
    }

    // Rule 6: Headless browser detection (30 points)
    if (behavior && this.detectHeadlessBrowser(fingerprint, behavior)) {
      fraudScore += 30;
      reasons.push('Обнаружен headless browser');
    }

    // Rule 7: No interaction before leaving (10 points)
    if (behavior && behavior.clicks === 0 && behavior.keyPresses === 0 && behavior.timeOnPage > 1) {
      fraudScore += 10;
      reasons.push('Нет взаимодействий с сайтом');
    }

    // Rule 8: Instant interaction - bot-like behavior (15 points)
    if (behavior && behavior.timeToFirstInteraction !== null && behavior.timeToFirstInteraction < 0.5) {
      fraudScore += 15;
      reasons.push('Мгновенное взаимодействие (бот)');
    }

    // Rule 9: Abnormal scroll patterns (10 points)
    if (behavior && behavior.scrolls > 0 && behavior.timeOnPage > 0) {
      const scrollsPerSecond = behavior.scrolls / behavior.timeOnPage;
      if (scrollsPerSecond > 5) {
        fraudScore += 10;
        reasons.push('Аномальная скорость прокрутки');
      }
    }

    // Rule 10: Check IP reputation
    const ipReputation = await this.checkIPReputation(siteId, ip);
    if (ipReputation.score > 0) {
      fraudScore += ipReputation.score;
      reasons.push(...ipReputation.reasons);
    }

    // Cap fraud score at 100
    fraudScore = Math.min(fraudScore, 100);

    const isFraud = fraudScore >= this.thresholds.fraudScoreThreshold;
    const isSuspicious = fraudScore >= 40 && fraudScore < this.thresholds.fraudScoreThreshold;

    return {
      fraudScore,
      isFraud,
      isSuspicious,
      reason: reasons.length > 0 ? reasons.join('; ') : 'Нет подозрений'
    };
  }

  /**
   * Check fingerprint for anomalies and bot indicators
   */
  async checkFingerprintAnomalies(fingerprint) {
    let score = 0;
    let reasons = [];

    // WebDriver detection (25 points)
    if (fingerprint.webdriver === true || fingerprint.webdriver === 'true') {
      score += 25;
      reasons.push('WebDriver обнаружен');
    }

    // Missing WebGL (10 points)
    if (!fingerprint.webgl || fingerprint.webgl === 'not_supported') {
      score += 10;
      reasons.push('WebGL не поддерживается');
    }

    // No browser plugins (5 points)
    if (fingerprint.plugins === 'none' || fingerprint.plugins === '' || fingerprint.plugins === '0') {
      score += 5;
      reasons.push('Отсутствуют плагины');
    }

    // Timezone/language mismatch (15 points)
    if (this.detectTimezoneMismatch(fingerprint)) {
      score += 15;
      reasons.push('Несоответствие часового пояса и языка');
    }

    // VPN/Proxy detection (10 points)
    if (this.detectVPNUserAgent(fingerprint.userAgent)) {
      score += 10;
      reasons.push('VPN/Proxy обнаружен');
    }

    // Screen resolution anomalies (5 points)
    if (this.detectScreenAnomalies(fingerprint)) {
      score += 5;
      reasons.push('Аномальное разрешение экрана');
    }

    // Touch support mismatch (5 points)
    if (this.detectTouchMismatch(fingerprint)) {
      score += 5;
      reasons.push('Несоответствие поддержки touch');
    }

    // Missing or suspicious hardware concurrency (10 points)
    if (fingerprint.hardwareConcurrency === 0 || fingerprint.hardwareConcurrency > 64) {
      score += 10;
      reasons.push('Подозрительное количество ядер CPU');
    }

    return { score, reasons };
  }

  /**
   * Get fingerprint usage count in last 7 days
   */
  async getFingerprintCount(siteId, fingerprintHash) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM events 
         WHERE site_id = $1 AND fingerprint_hash = $2 
         AND created_at >= NOW() - INTERVAL '7 days'`,
        [siteId, fingerprintHash]
      );
      return parseInt(result.rows[0]?.count) || 0;
    } catch (error) {
      logger.error('Error getting fingerprint count:', error);
      return 0;
    }
  }

  /**
   * Check IP reputation based on historical data
   */
  async checkIPReputation(siteId, ip) {
    let score = 0;
    let reasons = [];

    try {
      // Check if IP was previously flagged as fraudulent
      const fraudHistory = await query(
        `SELECT COUNT(*) as fraud_count 
         FROM events 
         WHERE site_id = $1 AND ip_address = $2 
         AND is_fraud = true 
         AND created_at >= NOW() - INTERVAL '30 days'`,
        [siteId, ip]
      );

      const fraudCount = parseInt(fraudHistory.rows[0]?.fraud_count) || 0;
      if (fraudCount > 0) {
        score += Math.min(fraudCount * 5, 20);
        reasons.push(`IP ранее помечен как фродовый (${fraudCount} раз)`);
      }

      // Check if IP is currently blocked
      const blockedCheck = await query(
        `SELECT reason FROM blocked_ips 
         WHERE site_id = $1 AND ip_address = $2 
         AND is_active = true 
         AND (auto_unblock_at IS NULL OR auto_unblock_at > NOW())`,
        [siteId, ip]
      );

      if (blockedCheck.rows.length > 0) {
        score += 30;
        reasons.push('IP в черном списке');
      }

    } catch (error) {
      logger.error('Error checking IP reputation:', error);
    }

    return { score, reasons };
  }

  /**
   * Detect headless browser indicators
   */
  detectHeadlessBrowser(fingerprint, behavior) {
    if (!fingerprint) return false;

    const ua = (fingerprint.userAgent || '').toLowerCase();
    
    // Explicit headless browser detection
    if (ua.includes('headlesschrome') || ua.includes('headless')) return true;
    if (ua.includes('phantomjs')) return true;
    if (ua.includes('selenium')) return true;
    
    // Chrome CDP indicators
    if (fingerprint.chrome && fingerprint.chrome.runtime) {
      return true;
    }

    // Missing canvas but has WebGL (unusual combination)
    if (!fingerprint.canvas && fingerprint.webgl && fingerprint.webgl !== 'not_supported') {
      return true;
    }

    // Zero hardware concurrency
    if (fingerprint.hardwareConcurrency === 0) {
      return true;
    }

    // Permissions API not available (common in headless)
    if (fingerprint.permissions === false || fingerprint.permissions === 'denied') {
      return true;
    }

    return false;
  }

  /**
   * Detect timezone/language mismatch
   */
  detectTimezoneMismatch(fingerprint) {
    if (!fingerprint.timezone || !fingerprint.language) return false;

    const tz = (fingerprint.timezone || '').toLowerCase();
    const lang = (fingerprint.language || '').toLowerCase();

    // Russia/CIS checks
    if (lang.includes('ru') || lang.includes('russian')) {
      if (tz.includes('america') || tz.includes('pacific')) return true;
    }

    // English checks
    if (lang.includes('en-us') || lang.includes('english')) {
      if (tz.includes('asia/shanghai') || tz.includes('asia/kolkata')) return true;
    }

    // Chinese checks
    if (lang.includes('zh') || lang.includes('chinese')) {
      if (tz.includes('america') || tz.includes('europe')) return true;
    }
    
    return false;
  }

  /**
   * Detect VPN/Proxy in user agent
   */
  detectVPNUserAgent(userAgent) {
    if (!userAgent) return false;

    const ua = userAgent.toLowerCase();
    const suspiciousKeywords = [
      'vpn', 'proxy', 'tor', 'anonymizer', 
      'hidester', 'proxifier', 'tunnelbear'
    ];
    
    return suspiciousKeywords.some(keyword => ua.includes(keyword));
  }

  /**
   * Detect screen resolution anomalies
   */
  detectScreenAnomalies(fingerprint) {
    if (!fingerprint.screenWidth || !fingerprint.screenHeight) return false;

    const width = parseInt(fingerprint.screenWidth);
    const height = parseInt(fingerprint.screenHeight);

    // Suspiciously small or large resolutions
    if (width < 800 || width > 7680) return true;
    if (height < 600 || height > 4320) return true;

    // Unusual aspect ratios
    const ratio = width / height;
    if (ratio < 1 || ratio > 3) return true;

    return false;
  }

  /**
   * Detect touch support mismatch (mobile UA but no touch)
   */
  detectTouchMismatch(fingerprint) {
    if (!fingerprint.userAgent) return false;

    const ua = fingerprint.userAgent.toLowerCase();
    const isMobileUA = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
    const hasTouch = fingerprint.touchSupport === true || fingerprint.touchSupport === 'true';

    // Mobile user agent but no touch support
    if (isMobileUA && !hasTouch) return true;

    return false;
  }

  /**
   * Get IPs that should be blocked based on fraud patterns
   */
  async getIPsToBlock(siteId) {
    try {
      const result = await query(`
        SELECT 
          ip_address,
          COUNT(*) as fraud_count,
          ROUND(AVG(fraud_score)::numeric, 2) as avg_score,
          MAX(fraud_reason) as reason,
          MAX(created_at) as last_fraud_at
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
    if (!this.thresholds.autoBlockEnabled) {
      logger.info('Auto-block disabled in config');
      return { blocked: 0, analyzed: 0 };
    }

    try {
      const ipsToBlock = await this.getIPsToBlock(siteId);
      let blockedCount = 0;

      for (const ipData of ipsToBlock) {
        // Check if already blocked
        const existing = await query(
          `SELECT id FROM blocked_ips 
           WHERE site_id = $1 AND ip_address = $2 
           AND is_active = true`,
          [siteId, ipData.ip_address]
        );

        if (existing.rows.length === 0) {
          // Auto-block for 7 days
          const autoUnblockAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          
          await query(
            `INSERT INTO blocked_ips (
              site_id, ip_address, reason, auto_blocked, auto_unblock_at, created_at
            ) VALUES ($1, $2, $3, true, $4, NOW())`,
            [siteId, ipData.ip_address, ipData.reason || 'Автоматическая блокировка', autoUnblockAt]
          );
          
          blockedCount++;
          logger.info('Auto-blocked IP', { 
            siteId, 
            ip: ipData.ip_address, 
            reason: ipData.reason,
            fraudCount: ipData.fraud_count,
            avgScore: ipData.avg_score
          });
        }
      }

      // Auto-unblock expired IPs
      await query(
        `UPDATE blocked_ips 
         SET is_active = false, unblocked_at = NOW() 
         WHERE site_id = $1 
         AND is_active = true 
         AND auto_blocked = true 
         AND auto_unblock_at <= NOW()`,
        [siteId]
      );

      logger.info('Auto-block completed', { siteId, blocked: blockedCount, analyzed: ipsToBlock.length });

      return { 
        blocked: blockedCount, 
        analyzed: ipsToBlock.length,
        ips: ipsToBlock.map(ip => ({
          ip: ip.ip_address,
          fraudCount: ip.fraud_count,
          avgScore: ip.avg_score
        }))
      };
    } catch (error) {
      logger.error('Auto-block error:', error);
      throw error;
    }
  }

  /**
   * Get fraud statistics for dashboard
   */
  async getStats(siteId, hours = 24) {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total_events,
          COUNT(*) FILTER (WHERE is_fraud = true) as fraud_events,
          COUNT(*) FILTER (WHERE is_suspicious = true) as suspicious_events,
          COUNT(DISTINCT ip_address) as unique_ips,
          COUNT(DISTINCT fingerprint_hash) as unique_fingerprints,
          ROUND(AVG(fraud_score)::numeric, 2) as avg_fraud_score,
          ROUND((COUNT(*) FILTER (WHERE is_fraud = true)::numeric / NULLIF(COUNT(*), 0) * 100), 2) as fraud_rate
        FROM events
        WHERE site_id = $1
        AND created_at >= NOW() - INTERVAL '${hours} hours'
      `, [siteId]);

      return stats.rows[0] || {
        total_events: 0,
        fraud_events: 0,
        suspicious_events: 0,
        unique_ips: 0,
        unique_fingerprints: 0,
        avg_fraud_score: 0,
        fraud_rate: 0
      };
    } catch (error) {
      logger.error('Error getting fraud stats:', error);
      return null;
    }
  }
}

module.exports = FraudDetector;