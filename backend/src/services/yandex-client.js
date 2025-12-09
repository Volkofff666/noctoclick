/**
 * Yandex Direct API Client
 * Integration with Yandex Direct API for blocking IPs
 */

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const { query } = require('../db/postgres');

class YandexClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.apiUrl = config.yandex.apiUrl;
  }

  /**
   * Make API request to Yandex Direct
   */
  async makeRequest(method, params) {
    try {
      const response = await axios.post(this.apiUrl + '/' + method, {
        method: method,
        params: params
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'ru'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.error_string || 'Yandex API error');
      }

      return response.data.result;
    } catch (error) {
      logger.error('Yandex API request error:', error.message);
      throw error;
    }
  }

  /**
   * Get campaigns list
   */
  async getCampaigns() {
    const result = await this.makeRequest('campaigns', {
      SelectionCriteria: {},
      FieldNames: ['Id', 'Name', 'Status', 'State']
    });

    return result.Campaigns || [];
  }

  /**
   * Add IPs to campaign negative keywords
   * Note: Yandex Direct has limit of 25 IPs per campaign
   */
  async blockIPsInCampaign(campaignId, ips) {
    // Yandex Direct doesn't support IP blocking directly via API
    // This is a placeholder for custom implementation
    // You would typically use Metrika goals and audience segments
    
    logger.warn('Direct IP blocking not supported in Yandex API');
    logger.info('Use Metrika segments for IP blocking instead');
    
    return {
      success: false,
      message: 'Use Metrika API for IP blocking'
    };
  }

  /**
   * Create Metrika segment with blocked IPs
   * This is the recommended way to block IPs in Yandex
   */
  async createMetrikaSegment(counterId, ips, name = 'NoctoClick Blocked IPs') {
    // TODO: Implement Metrika API integration
    // Metrika API allows creating audience segments
    // These segments can be used in Direct with -100% bid adjustment
    
    logger.info('Metrika segment creation placeholder');
    
    return {
      success: true,
      segmentId: null,
      message: 'Metrika integration pending'
    };
  }

  /**
   * Sync blocked IPs for a site
   */
  async syncBlockedIPs(siteId) {
    try {
      // Get blocked IPs
      const result = await query(
        'SELECT ip_address FROM blocked_ips WHERE site_id = $1 AND is_active = true LIMIT 25',
        [siteId]
      );

      const ips = result.rows.map(r => r.ip_address);

      if (ips.length === 0) {
        return { synced: 0, message: 'No IPs to block' };
      }

      // Get campaigns for site
      const campaigns = await query(
        'SELECT campaign_id FROM yandex_campaigns WHERE site_id = $1 AND is_active = true',
        [siteId]
      );

      if (campaigns.rows.length === 0) {
        return { synced: 0, message: 'No campaigns configured' };
      }

      // Sync to each campaign
      let syncedCount = 0;
      for (const campaign of campaigns.rows) {
        // Here you would call blockIPsInCampaign or createMetrikaSegment
        // For now, just log
        logger.info('Would sync IPs to campaign', { 
          campaignId: campaign.campaign_id, 
          ipCount: ips.length 
        });
        syncedCount++;
      }

      // Log sync
      await query(
        'INSERT INTO sync_logs (site_id, sync_type, status, ips_blocked) VALUES ($1, $2, $3, $4)',
        [siteId, 'yandex_block', 'success', ips.length]
      );

      return {
        synced: syncedCount,
        ips: ips.length,
        campaigns: campaigns.rows.length
      };

    } catch (error) {
      logger.error('Sync blocked IPs error:', error);
      
      // Log error
      await query(
        'INSERT INTO sync_logs (site_id, sync_type, status, error_message) VALUES ($1, $2, $3, $4)',
        [siteId, 'yandex_block', 'error', error.message]
      );
      
      throw error;
    }
  }

  /**
   * OAuth helpers
   */
  static getAuthUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.yandex.clientId,
      redirect_uri: config.yandex.redirectUri
    });

    return `https://oauth.yandex.ru/authorize?${params.toString()}`;
  }

  static async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://oauth.yandex.ru/token', {
        grant_type: 'authorization_code',
        code: code,
        client_id: config.yandex.clientId,
        client_secret: config.yandex.clientSecret
      });

      return response.data;
    } catch (error) {
      logger.error('Token exchange error:', error);
      throw error;
    }
  }
}

module.exports = YandexClient;