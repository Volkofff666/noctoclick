-- NoctoClick Initial Database Schema

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sites_api_key ON sites(api_key);
CREATE INDEX idx_sites_domain ON sites(domain);

-- Events table (tracking data)
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    fingerprint_hash VARCHAR(32) NOT NULL,
    user_agent TEXT,
    url TEXT,
    referrer TEXT,
    
    -- Behavioral metrics
    mouse_movements INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    key_presses INTEGER DEFAULT 0,
    scrolls INTEGER DEFAULT 0,
    time_on_page INTEGER DEFAULT 0,
    time_to_first_interaction INTEGER,
    scroll_depth INTEGER DEFAULT 0,
    
    -- UTM parameters
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    yclid VARCHAR(255),
    
    -- Fraud analysis
    fraud_score INTEGER DEFAULT 0,
    is_fraud BOOLEAN DEFAULT FALSE,
    is_suspicious BOOLEAN DEFAULT FALSE,
    fraud_reason TEXT,
    
    -- Full fingerprint data (JSONB for flexibility)
    fingerprint_data JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_site_id ON events(site_id);
CREATE INDEX idx_events_ip_address ON events(ip_address);
CREATE INDEX idx_events_fingerprint_hash ON events(fingerprint_hash);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_fraud ON events(is_fraud, is_suspicious);
CREATE INDEX idx_events_fingerprint_data ON events USING GIN(fingerprint_data);

-- Blocked IPs table
CREATE TABLE IF NOT EXISTS blocked_ips (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    reason TEXT NOT NULL,
    auto_blocked BOOLEAN DEFAULT TRUE,
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_unblock_at TIMESTAMP,
    unblocked_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(site_id, ip_address)
);

CREATE INDEX idx_blocked_ips_site_id ON blocked_ips(site_id);
CREATE INDEX idx_blocked_ips_ip_address ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_active ON blocked_ips(is_active);
CREATE INDEX idx_blocked_ips_auto_unblock ON blocked_ips(auto_unblock_at) WHERE auto_unblock_at IS NOT NULL;

-- Clients table (users of the system)
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    
    -- Yandex Direct integration
    yandex_token TEXT,
    yandex_refresh_token TEXT,
    yandex_login VARCHAR(255),
    yandex_token_expires_at TIMESTAMP,
    
    -- Subscription
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_yandex_login ON clients(yandex_login);

-- Sites-Clients relationship (many-to-many)
CREATE TABLE IF NOT EXISTS client_sites (
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'owner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (client_id, site_id)
);

CREATE INDEX idx_client_sites_client_id ON client_sites(client_id);
CREATE INDEX idx_client_sites_site_id ON client_sites(site_id);

-- Yandex Direct campaigns
CREATE TABLE IF NOT EXISTS yandex_campaigns (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    campaign_id BIGINT NOT NULL,
    campaign_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(site_id, campaign_id)
);

CREATE INDEX idx_yandex_campaigns_site_id ON yandex_campaigns(site_id);
CREATE INDEX idx_yandex_campaigns_campaign_id ON yandex_campaigns(campaign_id);

-- Sync logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id BIGSERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'yandex_block', 'cleanup', etc
    status VARCHAR(50) NOT NULL, -- 'success', 'error'
    ips_blocked INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_logs_site_id ON sync_logs(site_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to sites
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to clients
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default test site
INSERT INTO sites (name, domain, api_key) 
VALUES ('Test Site', 'test.local', 'test-api-key-12345678')
ON CONFLICT (api_key) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE events IS 'Tracking events from client websites';
COMMENT ON TABLE blocked_ips IS 'IPs blocked due to fraudulent activity';
COMMENT ON TABLE sites IS 'Client websites being monitored';
COMMENT ON TABLE clients IS 'System users/clients';
COMMENT ON COLUMN events.fraud_score IS 'Fraud score from 0-100, higher = more suspicious';
COMMENT ON COLUMN events.fingerprint_data IS 'Complete fingerprint data in JSONB format';
COMMENT ON COLUMN blocked_ips.auto_unblock_at IS 'Automatic unblock timestamp, NULL = permanent block';