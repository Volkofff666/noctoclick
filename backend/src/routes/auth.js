const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  authenticateToken,
  JWT_SECRET,
  JWT_REFRESH_EXPIRES_IN
} = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register - Регистрация
router.post('/register', async (req, res) => {
  const { email, password, fullName, companyName } = req.body;

  // Валидация
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Некорректный email' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Проверка, существует ли пользователь
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хэшируем пароль
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Создаём пользователя
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email.toLowerCase(), passwordHash, 'client']
    );

    const user = userResult.rows[0];

    // Создаём профиль клиента
    await client.query(
      'INSERT INTO clients (user_id, full_name, company_name) VALUES ($1, $2, $3)',
      [user.id, fullName || null, companyName || null]
    );

    await client.query('COMMIT');

    // Генерируем токены
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Сохраняем refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
      'INSERT INTO user_sessions (user_id, refresh_token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [user.id, refreshToken, expiresAt, req.ip, req.headers['user-agent']]
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Ошибка регистрации' });
  } finally {
    client.release();
  }
});

// POST /api/auth/login - Вход
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    // Получаем пользователя
    const result = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Генерируем токены
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Сохраняем refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
      'INSERT INTO user_sessions (user_id, refresh_token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [user.id, refreshToken, expiresAt, req.ip, req.headers['user-agent']]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

// POST /api/auth/refresh - Обновление access token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token обязателен' });
  }

  try {
    // Проверяем refresh token
    jwt.verify(refreshToken, JWT_SECRET);

    // Ищем сессию в БД
    const sessionResult = await pool.query(
      'SELECT user_id, expires_at FROM user_sessions WHERE refresh_token = $1',
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: 'Невалидный refresh token' });
    }

    const session = sessionResult.rows[0];

    // Проверяем, не истёк ли
    if (new Date(session.expires_at) < new Date()) {
      await pool.query('DELETE FROM user_sessions WHERE refresh_token = $1', [refreshToken]);
      return res.status(401).json({ error: 'Refresh token истёк' });
    }

    // Получаем пользователя
    const userResult = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [session.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];

    // Генерируем новый access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      accessToken: newAccessToken
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(401).json({ error: 'Невалидный refresh token' });
  }
});

// POST /api/auth/logout - Выход
router.post('/logout', authenticateToken, async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    try {
      await pool.query(
        'DELETE FROM user_sessions WHERE refresh_token = $1 AND user_id = $2',
        [refreshToken, req.user.id]
      );
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  res.json({ message: 'Успешный выход' });
});

// GET /api/auth/me - Получить текущего пользователя
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Получаем полную информацию о пользователе и клиенте
    const result = await pool.query(`
      SELECT 
        u.id, u.email, u.role, u.email_verified,
        c.company_name, c.full_name, c.phone, c.telegram, c.timezone, c.language
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id
      WHERE u.id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.email_verified,
      profile: {
        companyName: user.company_name,
        fullName: user.full_name,
        phone: user.phone,
        telegram: user.telegram,
        timezone: user.timezone,
        language: user.language
      }
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Ошибка получения данных пользователя' });
  }
});

module.exports = router;