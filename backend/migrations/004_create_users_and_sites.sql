-- Миграция для multi-tenant системы
-- Создаём таблицы для пользователей, клиентов и их сайтов

-- Таблица пользователей (для авторизации)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'client' NOT NULL, -- client, admin, manager
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Таблица клиентов (профили)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  full_name VARCHAR(255),
  phone VARCHAR(50),
  telegram VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'Europe/Moscow',
  language VARCHAR(10) DEFAULT 'ru',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON clients(user_id);

-- Таблица сайтов клиентов
CREATE TABLE IF NOT EXISTS client_sites (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- название сайта ("Мой интернет-магазин")
  domain VARCHAR(255) NOT NULL, -- домен (example.com)
  api_key VARCHAR(64) UNIQUE NOT NULL, -- уникальный ключ для трекера
  is_active BOOLEAN DEFAULT true,
  tracker_installed BOOLEAN DEFAULT false, -- проверка установки трекера
  last_event_at TIMESTAMP, -- последнее событие (для проверки активности)
  settings JSONB DEFAULT '{}'::jsonb, -- настройки детекции для этого сайта
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_client_sites_client_id ON client_sites(client_id);
CREATE INDEX idx_client_sites_api_key ON client_sites(api_key);
CREATE INDEX idx_client_sites_domain ON client_sites(domain);

-- Таблица JWT токенов (refresh tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Обновляем таблицу sites: привязываем к client_sites
-- Добавляем связь site_id в таблицу events
ALTER TABLE events ADD COLUMN IF NOT EXISTS site_id INTEGER REFERENCES client_sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id);

-- Обновляем таблицу blocked_ips: привязываем к сайту
ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS site_id INTEGER REFERENCES client_sites(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_blocked_ips_site_id ON blocked_ips(site_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_sites_updated_at BEFORE UPDATE ON client_sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Комментарии к таблицам
COMMENT ON TABLE users IS 'Пользователи системы (авторизация)';
COMMENT ON TABLE clients IS 'Профили клиентов';
COMMENT ON TABLE client_sites IS 'Сайты клиентов';
COMMENT ON TABLE user_sessions IS 'JWT refresh токены';

-- Создаём тестового пользователя (пароль: password123)
-- Хэш для bcrypt с солью 10: password123
INSERT INTO users (email, password_hash, role, email_verified) 
VALUES ('test@noctoclick.ru', '$2b$10$rKW8qVXhKJYJ7pQlJZJXW.Yn5fZZqHGKqKcQx4YJ3LJ2JZJXHqKPO', 'client', true)
ON CONFLICT (email) DO NOTHING;

-- Создаём профиль клиента для тестового пользователя
INSERT INTO clients (user_id, company_name, full_name)
SELECT id, 'Test Company', 'Тестовый Пользователь'
FROM users WHERE email = 'test@noctoclick.ru'
ON CONFLICT (user_id) DO NOTHING;