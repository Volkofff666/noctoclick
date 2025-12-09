const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'noctoclick-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m'; // access token на 15 минут
const JWT_REFRESH_EXPIRES_IN = '7d'; // refresh token на 7 дней

// Генерация access token
function generateAccessToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Генерация refresh token
function generateRefreshToken() {
  return jwt.sign(
    { type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

// Middleware для проверки авторизации
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Получаем пользователя из БД
    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истёк', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Неверный токен' });
  }
}

// Middleware для проверки роли
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    next();
  };
}

// Проверка, что пользователь имеет доступ к сайту
async function requireSiteAccess(req, res, next) {
  const siteId = req.params.siteId || req.body.siteId;
  
  if (!siteId) {
    return res.status(400).json({ error: 'Не указан ID сайта' });
  }

  try {
    // Получаем client_id пользователя
    const clientResult = await pool.query(
      'SELECT id FROM clients WHERE user_id = $1',
      [req.user.id]
    );

    if (clientResult.rows.length === 0) {
      return res.status(403).json({ error: 'Клиент не найден' });
    }

    const clientId = clientResult.rows[0].id;

    // Проверяем, что сайт принадлежит этому клиенту
    const siteResult = await pool.query(
      'SELECT id FROM client_sites WHERE id = $1 AND client_id = $2',
      [siteId, clientId]
    );

    if (siteResult.rows.length === 0) {
      return res.status(403).json({ error: 'Доступ к сайту запрещён' });
    }

    req.siteId = parseInt(siteId);
    req.clientId = clientId;
    next();
  } catch (err) {
    console.error('Error checking site access:', err);
    return res.status(500).json({ error: 'Ошибка проверки доступа' });
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  authenticateToken,
  requireRole,
  requireSiteAccess,
  JWT_SECRET,
  JWT_REFRESH_EXPIRES_IN
};