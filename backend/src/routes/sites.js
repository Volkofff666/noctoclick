/**
 * Sites management endpoints
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const logger = require('../utils/logger');
const crypto = require('crypto');

// GET /api/sites - list all sites
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.id,
        s.name,
        s.domain,
        s.api_key,
        s.created_at,
        COUNT(e.id) as total_events,
        SUM(CASE WHEN e.is_fraud THEN 1 ELSE 0 END) as fraud_events
      FROM sites s
      LEFT JOIN events e ON s.id = e.site_id AND e.created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);

    res.json({
      sites: result.rows
    });

  } catch (error) {
    logger.error('List sites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sites/:id - get site details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM sites WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({
      site: result.rows[0]
    });

  } catch (error) {
    logger.error('Get site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sites - create new site
router.post('/', async (req, res) => {
  try {
    const { name, domain } = req.body;

    if (!name || !domain) {
      return res.status(400).json({ error: 'Name and domain are required' });
    }

    // Generate API key
    const apiKey = crypto.randomBytes(32).toString('hex');

    const result = await query(
      'INSERT INTO sites (name, domain, api_key) VALUES ($1, $2, $3) RETURNING *',
      [name, domain, apiKey]
    );

    logger.info('Site created', { siteId: result.rows[0].id, domain });

    res.status(201).json({
      site: result.rows[0]
    });

  } catch (error) {
    logger.error('Create site error:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Site already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/sites/:id - update site
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain } = req.body;

    const result = await query(
      'UPDATE sites SET name = COALESCE($1, name), domain = COALESCE($2, domain) WHERE id = $3 RETURNING *',
      [name, domain, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    logger.info('Site updated', { siteId: id });

    res.json({
      site: result.rows[0]
    });

  } catch (error) {
    logger.error('Update site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/sites/:id - delete site
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM sites WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    logger.info('Site deleted', { siteId: id });

    res.json({
      message: 'Site deleted successfully'
    });

  } catch (error) {
    logger.error('Delete site error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;