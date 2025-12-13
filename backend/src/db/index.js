/**
 * Database Adapter
 * Автоматически выбирает SQLite или PostgreSQL в зависимости от настроек
 */

const logger = require('../utils/logger');

// Определяем какую БД использовать из env или по умолчанию SQLite
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

logger.info(`Using database: ${DB_TYPE}`);

let db;

if (DB_TYPE === 'sqlite') {
  // SQLite для локальной разработки и тестирования
  db = require('./sqlite');
} else if (DB_TYPE === 'postgres' || DB_TYPE === 'postgresql') {
  // PostgreSQL для продакшена
  db = require('./postgres');
} else {
  throw new Error(`Unsupported database type: ${DB_TYPE}`);
}

// Экспортируем функции
module.exports = {
  query: db.query,
  run: db.run || db.query, // для совместимости
  get: db.get || db.query,
  transaction: db.transaction,
  close: db.close,
  init: db.init
};