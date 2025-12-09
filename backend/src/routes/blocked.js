/**
 * Blocked IPs management
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const logger = require('../utils/logger');

// GET /api/blocked/:siteId - list blocked IPs
router.get('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { active = 'true' } = req.query;

    let sql = `
      SELECT 
        b.*,
        COUNT(e.id) as total_events
      FROM blocked_ips b
      LEFT JOIN events e ON b.ip_address = e.ip_address AND b.site_id = e.site_id
      WHERE b.site_id = (SELECT id FROM sites WHERE id::text = $1 OR api_key = $1)
    `;

    if (active === 'true') {
      sql += ' AND b.is_active = true';
    }

    sql += ' GROUP BY b.id ORDER BY b.blocked_at DESC';

    const result = await query(sql, [siteId]);

    res.json({
      blocked: result.rows
    });

  } catch (error) {
    logger.error('List blocked IPs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/blocked/:siteId - manually block IP
router.post('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { ip, reason, autoDuration } = req.body;

    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    // Get site ID
    const siteResult = await query(
      'SELECT id FROM sites WHERE id::text = $1 OR api_key = $1',
      [siteId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const siteDbId = siteResult.rows[0].id;

    // Calculate auto unblock time
    let autoUnblockAt = null;
    if (autoDuration) {
      const hours = parseInt(autoDuration);
      autoUnblockAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    // Insert or update blocked IP
    const result = await query(`
      INSERT INTO blocked_ips (site_id, ip_address, reason, auto_blocked, auto_unblock_at, is_active)
      VALUES ($1, $2, $3, false, $4, true)
      ON CONFLICT (site_id, ip_address) 
      DO UPDATE SET 
        reason = $3,
        auto_unblock_at = $4,
        is_active = true,
        blocked_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [siteDbId, ip, reason || 'Manually blocked', autoUnblockAt]);

    logger.info('IP manually blocked', { siteId: siteDbId, ip });

    res.status(201).json({
      blocked: result.rows[0]
    });

  } catch (error) {
    logger.error('Block IP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/blocked/:siteId/:ip - unblock IP
router.delete('/:siteId/:ip', async (req, res) => {
  try {
    const { siteId, ip } = req.params;

    const result = await query(`
      UPDATE blocked_ips 
      SET is_active = false, unblocked_at = CURRENT_TIMESTAMP
      WHERE site_id = (SELECT id FROM sites WHERE id::text = $1 OR api_key = $1)
        AND ip_address = $2
      RETURNING *
    `, [siteId, ip]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blocked IP not found' });
    }

    logger.info('IP unblocked', { siteId, ip });

    res.json({
      message: 'IP unblocked successfully',
      blocked: result.rows[0]
    });

  } catch (error) {
    logger.error('Unblock IP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/blocked/:siteId/export - export for Yandex Direct
router.get('/:siteId/export', async (req, res) => {
  try {
    const { siteId } = req.params;

    const result = await query(`
      SELECT ip_address
      FROM blocked_ips
      WHERE site_id = (SELECT id FROM sites WHERE id::text = $1 OR api_key = $1)
        AND is_active = true
      ORDER BY blocked_at DESC
      LIMIT 25
    `, [siteId]);

    const ips = result.rows.map(r => r.ip_address);

    res.json({
      ips,
      count: ips.length,
      maxYandex: 25,
      format: 'yandex_direct'
    });

  } catch (error) {
    logger.error('Export blocked IPs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;