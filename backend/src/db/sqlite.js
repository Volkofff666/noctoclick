/**
 * SQLite Database Connection (better-sqlite3)
 * Простая альтернатива PostgreSQL для локального тестирования
 * Использует better-sqlite3 - работает на Windows без Visual Studio!
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Путь к файлу базы данных
const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'noctoclick.db');

// Создаем директорию для БД если не существует
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Создаем подключение к SQLite
const db = new Database(DB_PATH, { verbose: console.log });

// Включаем foreign keys
db.pragma('foreign_keys = ON');

logger.info(`SQLite connected: ${DB_PATH}`);

/**
 * Выполнить SQL запрос (для SELECT)
 */
function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all(params);
    return Promise.resolve({ rows });
  } catch (err) {
    logger.error('SQLite query error:', { sql, error: err.message });
    return Promise.reject(err);
  }
}

/**
 * Выполнить SQL запрос (для INSERT/UPDATE/DELETE)
 */
function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(params);
    return Promise.resolve({ 
      lastID: result.lastInsertRowid,
      changes: result.changes,
      rows: [{ id: result.lastInsertRowid }] 
    });
  } catch (err) {
    logger.error('SQLite run error:', { sql, error: err.message });
    return Promise.reject(err);
  }
}

/**
 * Получить одну строку
 */
function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const row = stmt.get(params);
    return Promise.resolve({ rows: row ? [row] : [] });
  } catch (err) {
    logger.error('SQLite get error:', { sql, error: err.message });
    return Promise.reject(err);
  }
}

/**
 * Выполнить несколько запросов в транзакции
 */
function transaction(queries) {
  try {
    const results = db.transaction(() => {
      const output = [];
      for (const { sql, params } of queries) {
        const stmt = db.prepare(sql);
        const result = stmt.run(params);
        output.push({ lastID: result.lastInsertRowid, changes: result.changes });
      }
      return output;
    })();
    return Promise.resolve(results);
  } catch (err) {
    logger.error('SQLite transaction error:', err);
    return Promise.reject(err);
  }
}

/**
 * Закрыть соединение
 */
function close() {
  try {
    db.close();
    logger.info('SQLite connection closed');
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Инициализация базы данных (создание таблиц)
 */
async function init() {
  try {
    logger.info('Initializing SQLite database...');

    // Создаем таблицу users
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создаем таблицу client_sites
    db.exec(`
      CREATE TABLE IF NOT EXISTS client_sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        api_key TEXT UNIQUE NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Создаем таблицу events
    db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        fingerprint_hash TEXT NOT NULL,
        user_agent TEXT,
        url TEXT,
        referrer TEXT,
        mouse_movements INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        key_presses INTEGER DEFAULT 0,
        scrolls INTEGER DEFAULT 0,
        time_on_page REAL DEFAULT 0,
        time_to_first_interaction REAL,
        scroll_depth INTEGER DEFAULT 0,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_term TEXT,
        utm_content TEXT,
        yclid TEXT,
        fraud_score INTEGER DEFAULT 0,
        is_fraud INTEGER DEFAULT 0,
        is_suspicious INTEGER DEFAULT 0,
        fraud_reason TEXT,
        fingerprint_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES client_sites(id) ON DELETE CASCADE
      )
    `);

    // Создаем таблицу blocked_ips
    db.exec(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        reason TEXT,
        auto_blocked INTEGER DEFAULT 0,
        auto_unblock_at DATETIME,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        unblocked_at DATETIME,
        FOREIGN KEY (site_id) REFERENCES client_sites(id) ON DELETE CASCADE,
        UNIQUE(site_id, ip_address)
      )
    `);

    // Создаем индексы для производительности
    db.exec('CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_events_ip ON events(ip_address)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_events_fingerprint ON events(fingerprint_hash)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_events_fraud ON events(is_fraud, is_suspicious)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_blocked_site_ip ON blocked_ips(site_id, ip_address)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_blocked_active ON blocked_ips(is_active)');

    logger.info('SQLite database initialized successfully');
    return true;
  } catch (error) {
    logger.error('SQLite init error:', error);
    throw error;
  }
}

// Экспортируем функции
module.exports = {
  db,
  query,
  run,
  get,
  transaction,
  close,
  init
};