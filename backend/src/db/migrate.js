/**
 * Database migration runner
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

async function runMigrations() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  });

  try {
    logger.info('Starting database migrations...');

    // Create migrations table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Read migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      // Check if migration already executed
      const result = await pool.query(
        'SELECT * FROM migrations WHERE name = $1',
        [file]
      );

      if (result.rows.length > 0) {
        logger.info(`Migration ${file} already executed, skipping`);
        continue;
      }

      // Execute migration
      logger.info(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        await pool.query('COMMIT');
        logger.info(`✓ Migration ${file} completed`);
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✓ Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };