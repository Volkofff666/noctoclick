/**
 * SQLite Database Connection
 * Простая альтернатива PostgreSQL для локального тестирования
 */

const sqlite3 = require('sqlite3').verbose();
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
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    logger.error('SQLite connection error:', err);
    throw err;
  }
  logger.info(`SQLite connected: ${DB_PATH}`);
});

// Включаем foreign keys
db.run('PRAGMA foreign_keys = ON');

/**
 * Выполнить SQL запрос (для SELECT)
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        logger.error('SQLite query error:', { sql, error: err.message });
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
}

/**
 * Выполнить SQL запрос (для INSERT/UPDATE/DELETE)
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        logger.error('SQLite run error:', { sql, error: err.message });
        reject(err);
      } else {
        resolve({ 
          lastID: this.lastID,
          changes: this.changes,
          rows: [{ id: this.lastID }] 
        });
      }
    });
  });
}

/**
 * Получить одну строку
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        logger.error('SQLite get error:', { sql, error: err.message });
        reject(err);
      } else {
        resolve({ rows: row ? [row] : [] });
      }
    });
  });
}

/**
 * Выполнить несколько запросов в транзакции
 */
function transaction(queries) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      try {
        const results = [];
        for (const { sql, params } of queries) {
          db.run(sql, params, function(err) {
            if (err) throw err;
            results.push({ lastID: this.lastID, changes: this.changes });
          });
        }
        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
          } else {
            resolve(results);
          }
        });
      } catch (error) {
        db.run('ROLLBACK');
        reject(error);
      }
    });
  });
}

/**
 * Закрыть соединение
 */
function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        logger.info('SQLite connection closed');
        resolve();
      }
    });
  });
}

/**
 * Инициализация базы данных (создание таблиц)
 */
async function init() {
  try {
    logger.info('Initializing SQLite database...');

    // Создаем таблицу users
    await run(`
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
    await run(`
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
    await run(`
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
    await run(`
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
    await run('CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_events_ip ON events(ip_address)');
    await run('CREATE INDEX IF NOT EXISTS idx_events_fingerprint ON events(fingerprint_hash)');
    await run('CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)');
    await run('CREATE INDEX IF NOT EXISTS idx_events_fraud ON events(is_fraud, is_suspicious)');
    await run('CREATE INDEX IF NOT EXISTS idx_blocked_site_ip ON blocked_ips(site_id, ip_address)');
    await run('CREATE INDEX IF NOT EXISTS idx_blocked_active ON blocked_ips(is_active)');

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