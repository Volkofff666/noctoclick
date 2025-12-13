/**
 * Database Initialization Script
 * Автоматически создает таблицы в SQLite
 */

require('dotenv').config();
const db = require('../src/db');

async function initDatabase() {
  try {
    console.log('📦 Инициализация базы данных...');
    
    if (db.init) {
      await db.init();
      console.log('✅ База данных успешно инициализирована!');
    } else {
      console.log('⚠️  Функция init не поддерживается для данной БД');
    }

    // Создаем тестового пользователя
    console.log('\n👤 Создание тестового пользователя...');
    
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    
    const testEmail = 'test@noctoclick.dev';
    const testPassword = 'test123456';
    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    // Проверяем есть ли уже пользователь
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [testEmail]
    );
    
    let userId;
    if (existingUser.rows && existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log(`   ℹ️  Пользователь ${testEmail} уже существует (ID: ${userId})`);
    } else {
      const userResult = await db.run(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
        [testEmail, passwordHash, 'Test User']
      );
      userId = userResult.lastID || userResult.rows[0].id;
      console.log(`   ✅ Пользователь создан: ${testEmail} (ID: ${userId})`);
      console.log(`   🔑 Пароль: ${testPassword}`);
    }

    // Создаем тестовый сайт
    console.log('\n🌐 Создание тестового сайта...');
    
    const apiKey = crypto.randomBytes(16).toString('hex');
    
    const existingSite = await db.query(
      'SELECT id, api_key FROM client_sites WHERE user_id = ?',
      [userId]
    );
    
    if (existingSite.rows && existingSite.rows.length > 0) {
      console.log(`   ℹ️  Сайт уже существует (ID: ${existingSite.rows[0].id})`);
      console.log(`   🔑 API Key: ${existingSite.rows[0].api_key}`);
    } else {
      const siteResult = await db.run(
        'INSERT INTO client_sites (user_id, name, domain, api_key) VALUES (?, ?, ?, ?)',
        [userId, 'Test Site', 'localhost', apiKey]
      );
      const siteId = siteResult.lastID || siteResult.rows[0].id;
      console.log(`   ✅ Сайт создан: Test Site (ID: ${siteId})`);
      console.log(`   🔑 API Key: ${apiKey}`);
    }

    console.log('\n✨ Инициализация завершена!');
    console.log('\n🚀 Теперь можно запустить сервер: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
    process.exit(1);
  }
}

initDatabase();