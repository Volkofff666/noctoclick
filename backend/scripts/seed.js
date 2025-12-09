/**
 * Seed test data for development
 */

const { Pool } = require('pg');
const config = require('../src/config');

async function seed() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  });

  try {
    console.log('🌱 Seeding test data...');

    // Get test site
    let site = await pool.query(
      "SELECT id FROM sites WHERE api_key = 'test-api-key-12345678'"
    );

    let siteId;
    if (site.rows.length === 0) {
      // Create test site
      const result = await pool.query(
        "INSERT INTO sites (name, domain, api_key) VALUES ('Test Site', 'test.local', 'test-api-key-12345678') RETURNING id"
      );
      siteId = result.rows[0].id;
      console.log('✓ Created test site');
    } else {
      siteId = site.rows[0].id;
      console.log('✓ Using existing test site');
    }

    // Generate legitimate events
    console.log('Generating 500 legitimate events...');
    for (let i = 0; i < 500; i++) {
      const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const fpHash = Math.random().toString(36).substring(2, 15);
      const hoursAgo = Math.floor(Math.random() * 24);
      
      await pool.query(`
        INSERT INTO events (
          site_id, ip_address, fingerprint_hash, user_agent, url,
          mouse_movements, clicks, key_presses, scrolls, time_on_page,
          time_to_first_interaction, scroll_depth, fraud_score, is_fraud,
          is_suspicious, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW() - INTERVAL '${hoursAgo} hours')
      `, [
        siteId,
        ip,
        fpHash,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'https://test.local/page',
        Math.floor(Math.random() * 200) + 50,
        Math.floor(Math.random() * 5) + 1,
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 3) + 1,
        Math.floor(Math.random() * 60) + 15,
        Math.floor(Math.random() * 5) + 1,
        Math.floor(Math.random() * 80) + 20,
        Math.floor(Math.random() * 20),
        false,
        false
      ]);
    }
    console.log('✓ Generated 500 legitimate events');

    // Generate fraud events
    console.log('Generating 100 fraudulent events...');
    const fraudIPs = [
      '10.0.0.1',
      '10.0.0.2',
      '10.0.0.3',
      '10.0.0.4',
      '10.0.0.5'
    ];

    for (let i = 0; i < 100; i++) {
      const ip = fraudIPs[i % fraudIPs.length];
      const fpHash = 'fraud-' + (i % 3); // Reuse fingerprints
      const hoursAgo = Math.floor(Math.random() * 24);
      
      await pool.query(`
        INSERT INTO events (
          site_id, ip_address, fingerprint_hash, user_agent, url,
          mouse_movements, clicks, key_presses, scrolls, time_on_page,
          time_to_first_interaction, scroll_depth, fraud_score, is_fraud,
          is_suspicious, fraud_reason, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW() - INTERVAL '${hoursAgo} hours')
      `, [
        siteId,
        ip,
        fpHash,
        'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/90.0',
        'https://test.local/page',
        0, // No mouse movements
        Math.floor(Math.random() * 3),
        0,
        0,
        Math.floor(Math.random() * 2) + 1, // Very short time
        0,
        0,
        Math.floor(Math.random() * 30) + 70, // High fraud score
        true,
        false,
        'Too many clicks; No mouse activity; Headless browser detected'
      ]);
    }
    console.log('✓ Generated 100 fraudulent events');

    // Block fraud IPs
    console.log('Blocking fraud IPs...');
    for (const ip of fraudIPs) {
      await pool.query(
        'INSERT INTO blocked_ips (site_id, ip_address, reason, auto_blocked) VALUES ($1, $2, $3, $4) ON CONFLICT (site_id, ip_address) DO NOTHING',
        [siteId, ip, 'Automated fraud detection', true]
      );
    }
    console.log('✓ Blocked 5 fraud IPs');

    // Statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) as fraud,
        SUM(CASE WHEN is_suspicious THEN 1 ELSE 0 END) as suspicious
      FROM events
      WHERE site_id = $1
    `, [siteId]);

    console.log('\n📊 Seed Summary:');
    console.log(`   Total events: ${stats.rows[0].total}`);
    console.log(`   Legitimate: ${stats.rows[0].total - stats.rows[0].fraud - stats.rows[0].suspicious}`);
    console.log(`   Fraudulent: ${stats.rows[0].fraud}`);
    console.log(`   Suspicious: ${stats.rows[0].suspicious}`);
    console.log(`   Blocked IPs: ${fraudIPs.length}`);
    console.log('\n✅ Seed completed successfully!');
    console.log('\n🔗 Test API key: test-api-key-12345678');
    console.log('🔗 Test site ID:', siteId);

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seed };