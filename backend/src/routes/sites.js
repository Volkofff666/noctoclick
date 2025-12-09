const express = require('express');
const crypto = require('crypto');
const pool = require('../db/pool');
const { authenticateToken, requireSiteAccess } = require('../middleware/auth');

const router = express.Router();

// Генерация API ключа
function generateApiKey() {
  return 'nk_' + crypto.randomBytes(32).toString('hex');
}

// GET /api/sites - Получить все сайты клиента
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Получаем client_id
    const clientResult = await pool.query(
      'SELECT id FROM clients WHERE user_id = $1',
      [req.user.id]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Профиль клиента не найден' });
    }

    const clientId = clientResult.rows[0].id;

    // Получаем сайты
    const sitesResult = await pool.query(`
      SELECT 
        id, name, domain, api_key, is_active, 
        tracker_installed, last_event_at, settings,
        created_at, updated_at
      FROM client_sites
      WHERE client_id = $1
      ORDER BY created_at DESC
    `, [clientId]);

    res.json({ sites: sitesResult.rows });
  } catch (err) {
    console.error('Get sites error:', err);
    res.status(500).json({ error: 'Ошибка получения сайтов' });
  }
});

// POST /api/sites - Добавить новый сайт
router.post('/', authenticateToken, async (req, res) => {
  const { name, domain } = req.body;

  // Валидация
  if (!name || !domain) {
    return res.status(400).json({ error: 'Название и домен обязательны' });
  }

  // Очищаем домен (http://, https://, www.)
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  try {
    // Получаем client_id
    const clientResult = await pool.query(
      'SELECT id FROM clients WHERE user_id = $1',
      [req.user.id]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Профиль клиента не найден' });
    }

    const clientId = clientResult.rows[0].id;

    // Проверяем, нет ли уже такого домена
    const existingResult = await pool.query(
      'SELECT id FROM client_sites WHERE domain = $1 AND client_id = $2',
      [cleanDomain, clientId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Сайт с таким доменом уже добавлен' });
    }

    // Генерируем API ключ
    const apiKey = generateApiKey();

    // Дефолтные настройки
    const defaultSettings = {
      maxClicksPerHour: 5,
      minTimeOnSite: 3,
      fraudScoreThreshold: 70,
      autoBlockEnabled: true,
      blockDuration: 168 // 7 дней
    };

    // Создаём сайт
    const siteResult = await pool.query(`
      INSERT INTO client_sites (client_id, name, domain, api_key, settings)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, domain, api_key, is_active, tracker_installed, settings, created_at
    `, [clientId, name, cleanDomain, apiKey, JSON.stringify(defaultSettings)]);

    const site = siteResult.rows[0];

    res.status(201).json({ site });
  } catch (err) {
    console.error('Create site error:', err);
    res.status(500).json({ error: 'Ошибка создания сайта' });
  }
});

// GET /api/sites/:siteId - Получить детали сайта
router.get('/:siteId', authenticateToken, requireSiteAccess, async (req, res) => {
  try {
    const siteResult = await pool.query(`
      SELECT 
        id, name, domain, api_key, is_active,
        tracker_installed, last_event_at, settings,
        created_at, updated_at
      FROM client_sites
      WHERE id = $1
    `, [req.siteId]);

    if (siteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Сайт не найден' });
    }

    res.json({ site: siteResult.rows[0] });
  } catch (err) {
    console.error('Get site error:', err);
    res.status(500).json({ error: 'Ошибка получения сайта' });
  }
});

// PUT /api/sites/:siteId - Обновить сайт
router.put('/:siteId', authenticateToken, requireSiteAccess, async (req, res) => {
  const { name, domain, isActive, settings } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (domain !== undefined) {
      const cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .toLowerCase();
      updates.push(`domain = $${paramCount}`);
      values.push(cleanDomain);
      paramCount++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }

    if (settings !== undefined) {
      updates.push(`settings = $${paramCount}`);
      values.push(JSON.stringify(settings));
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(req.siteId);

    const result = await pool.query(`
      UPDATE client_sites
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, domain, api_key, is_active, settings, updated_at
    `, values);

    res.json({ site: result.rows[0] });
  } catch (err) {
    console.error('Update site error:', err);
    res.status(500).json({ error: 'Ошибка обновления сайта' });
  }
});

// DELETE /api/sites/:siteId - Удалить сайт
router.delete('/:siteId', authenticateToken, requireSiteAccess, async (req, res) => {
  try {
    await pool.query('DELETE FROM client_sites WHERE id = $1', [req.siteId]);
    res.json({ message: 'Сайт успешно удалён' });
  } catch (err) {
    console.error('Delete site error:', err);
    res.status(500).json({ error: 'Ошибка удаления сайта' });
  }
});

// POST /api/sites/:siteId/regenerate-key - Перегенерировать API ключ
router.post('/:siteId/regenerate-key', authenticateToken, requireSiteAccess, async (req, res) => {
  try {
    const newApiKey = generateApiKey();

    const result = await pool.query(`
      UPDATE client_sites
      SET api_key = $1
      WHERE id = $2
      RETURNING id, name, domain, api_key
    `, [newApiKey, req.siteId]);

    res.json({ site: result.rows[0] });
  } catch (err) {
    console.error('Regenerate API key error:', err);
    res.status(500).json({ error: 'Ошибка перегенерации API ключа' });
  }
});

// POST /api/sites/:siteId/test - Тестовое событие (проверка установки)
router.post('/:siteId/test', authenticateToken, requireSiteAccess, async (req, res) => {
  try {
    // Проверяем, есть ли события за последние 5 минут
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM events
      WHERE site_id = $1
        AND created_at > NOW() - INTERVAL '5 minutes'
    `, [req.siteId]);

    const hasRecentEvents = parseInt(result.rows[0].count) > 0;

    if (hasRecentEvents) {
      // Обновляем статус
      await pool.query(`
        UPDATE client_sites
        SET tracker_installed = true, last_event_at = NOW()
        WHERE id = $1
      `, [req.siteId]);
    }

    res.json({
      installed: hasRecentEvents,
      message: hasRecentEvents 
        ? 'Трекер успешно установлен!' 
        : 'Событий не обнаружено. Проверьте установку трекера.'
    });
  } catch (err) {
    console.error('Test site error:', err);
    res.status(500).json({ error: 'Ошибка проверки' });
  }
});

// GET /api/sites/:siteId/stats - Статистика по сайту
router.get('/:siteId/stats', authenticateToken, requireSiteAccess, async (req, res) => {
  const { period = '24h' } = req.query;

  // Определяем временной интервал
  const intervals = {
    '1h': '1 hour',
    '6h': '6 hours',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days'
  };

  const interval = intervals[period] || '24 hours';

  try {
    // Общая статистика
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_fraud = false AND is_suspicious = false) as legitimate,
        COUNT(*) FILTER (WHERE is_suspicious = true AND is_fraud = false) as suspicious,
        COUNT(*) FILTER (WHERE is_fraud = true) as fraud
      FROM events
      WHERE site_id = $1
        AND created_at > NOW() - INTERVAL '${interval}'
    `, [req.siteId]);

    // Заблокированные IP
    const blockedResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM blocked_ips
      WHERE site_id = $1
        AND (auto_unblock_at IS NULL OR auto_unblock_at > NOW())
    `, [req.siteId]);

    const stats = statsResult.rows[0];

    res.json({
      stats: {
        total: parseInt(stats.total),
        legitimate: parseInt(stats.legitimate),
        suspicious: parseInt(stats.suspicious),
        fraud: parseInt(stats.fraud),
        blockedIps: parseInt(blockedResult.rows[0].count)
      }
    });
  } catch (err) {
    console.error('Get site stats error:', err);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

module.exports = router;