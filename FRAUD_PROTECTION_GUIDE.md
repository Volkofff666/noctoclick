# Руководство по запуску системы защиты от фрода NoctoClick

## Обзор системы

Система NoctoClick теперь включает продвинутую защиту от фрода с **10 алгоритмами детекции**:

### Алгоритмы детекции фрода

1. **Частота кликов** (40 баллов) - обнаружение слишком частых кликов с одного IP
2. **Время на сайте** (25 баллов) - анализ подозрительно коротких сессий
3. **Активность мыши** (20 баллов) - отслеживание движений мыши
4. **Fingerprint аномалии** (до 50 баллов) - проверка WebDriver, WebGL, плагинов
5. **Повторное использование fingerprint** (15 баллов) - детекция клонирования
6. **Headless browser** (30 баллов) - обнаружение ботов
7. **Отсутствие взаимодействий** (10 баллов) - нет кликов/нажатий клавиш
8. **Мгновенное взаимодействие** (15 баллов) - проверка ботов
9. **Аномальная прокрутка** (10 баллов) - неестественно быстрый скролл
10. **IP репутация** (до 20 баллов) - проверка истории фрода

### Дополнительные проверки
- Несоответствие часового пояса и языка
- Обнаружение VPN/Proxy
- Проверка разрешения экрана
- Несоответствие touch поддержки
- Подозрительное количество ядер CPU

---

## Быстрый старт для тестирования

### 1. Клонирование репозитория

```bash
git clone https://github.com/Volkofff666/noctoclick.git
cd noctoclick
```

### 2. Настройка PostgreSQL

```bash
# Запустите PostgreSQL
sudo service postgresql start

# Создайте базу данных
psql -U postgres

CREATE DATABASE noctoclick;
CREATE USER noctoclick_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE noctoclick TO noctoclick_user;
\q
```

### 3. Миграции БД

```bash
# Выполните миграции по порядку
psql -U noctoclick_user -d noctoclick -f backend/migrations/001_create_tables.sql
psql -U noctoclick_user -d noctoclick -f backend/migrations/002_add_fingerprinting.sql
psql -U noctoclick_user -d noctoclick -f backend/migrations/003_add_indexes.sql
psql -U noctoclick_user -d noctoclick -f backend/migrations/004_create_users_and_sites.sql
```

### 4. Настройка Backend

```bash
cd backend

# Установка зависимостей
npm install

# Копирование .env
cp .env.example .env

# Редактирование .env (укажите параметры БД)
nano .env
```

**Пример .env:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=noctoclick
DB_USER=noctoclick_user
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_key_here_minimum_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_here

PORT=3001
FRONTEND_URL=http://localhost:3000

# Fraud Detection Settings
FRAUD_MAX_CLICKS_PER_HOUR=10
FRAUD_MIN_TIME_ON_SITE=3
FRAUD_SCORE_THRESHOLD=70
FRAUD_AUTO_BLOCK_ENABLED=true
```

### 5. Запуск Backend

```bash
# Development режим
npm run dev

# Или production
npm start
```

Backend запустится на `http://localhost:3001`

### 6. Настройка Dashboard (Frontend)

```bash
cd ../dashboard

# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev
```

Dashboard откроется на `http://localhost:3000`

---

## Тестирование системы защиты

### Шаг 1: Регистрация

1. Откройте `http://localhost:3000/register`
2. Создайте аккаунт
3. Войдите в систему

### Шаг 2: Добавление сайта

1. Перейдите в "Мои сайты"
2. Нажмите "Добавить сайт"
3. Укажите название и домен
4. Скопируйте API ключ

### Шаг 3: Тестирование через API

```bash
# Проверка работы endpoint
curl http://localhost:3001/api/track/test

# Отправка тестового события (нормальное поведение)
curl -X POST http://localhost:3001/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "YOUR_API_KEY",
    "fingerprintHash": "test_fp_' $(date +%s)'",
    "fingerprint": {
      "userAgent": "Mozilla/5.0",
      "screenWidth": 1920,
      "screenHeight": 1080,
      "timezone": "Europe/Moscow",
      "language": "ru",
      "webgl": "supported",
      "plugins": "chrome-pdf",
      "hardwareConcurrency": 8
    },
    "behavior": {
      "mouseMovements": 150,
      "clicks": 5,
      "keyPresses": 20,
      "scrolls": 10,
      "timeOnPage": 45,
      "timeToFirstInteraction": 2.5,
      "scrollDepth": 80
    },
    "url": "https://example.com/test",
    "referrer": "https://google.com"
  }'

# Отправка фродового события (бот)
curl -X POST http://localhost:3001/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "YOUR_API_KEY",
    "fingerprintHash": "bot_fingerprint_123",
    "fingerprint": {
      "userAgent": "HeadlessChrome/91.0",
      "screenWidth": 1920,
      "screenHeight": 1080,
      "webdriver": true,
      "webgl": "not_supported",
      "plugins": "none",
      "hardwareConcurrency": 0
    },
    "behavior": {
      "mouseMovements": 0,
      "clicks": 0,
      "keyPresses": 0,
      "scrolls": 0,
      "timeOnPage": 0.5,
      "timeToFirstInteraction": 0.1,
      "scrollDepth": 0
    },
    "url": "https://example.com/test"
  }'
```

### Шаг 4: Проверка статистики

```bash
# Получение статистики (нужен JWT token)
curl -X GET http://localhost:3001/api/stats/SITE_ID?period=24h \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Просмотр последних событий
curl -X GET http://localhost:3001/api/stats/SITE_ID/recent?limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Шаг 5: Симуляция фрода (для теста автоблокировки)

```bash
# Отправьте 15 фродовых кликов с одного IP
for i in {1..15}; do
  curl -X POST http://localhost:3001/api/track \
    -H "Content-Type: application/json" \
    -d '{
      "siteId": "YOUR_API_KEY",
      "fingerprintHash": "fraud_test_'$i'",
      "fingerprint": {
        "userAgent": "bot/1.0",
        "webdriver": true
      },
      "behavior": {
        "mouseMovements": 0,
        "clicks": 0,
        "timeOnPage": 0.3
      }
    }'
  sleep 1
done

# Проверка автоблокировки
curl -X GET http://localhost:3001/api/blocked/SITE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Проверка работы в БД

```sql
-- Подключение к БД
psql -U noctoclick_user -d noctoclick

-- Просмотр всех событий
SELECT 
  id,
  ip_address,
  fraud_score,
  is_fraud,
  is_suspicious,
  fraud_reason,
  created_at
FROM events
ORDER BY created_at DESC
LIMIT 20;

-- Просмотр фродовых событий
SELECT 
  ip_address,
  COUNT(*) as fraud_count,
  AVG(fraud_score) as avg_score,
  MAX(fraud_reason) as reason
FROM events
WHERE is_fraud = true
GROUP BY ip_address
ORDER BY fraud_count DESC;

-- Просмотр заблокированных IP
SELECT 
  ip_address,
  reason,
  auto_blocked,
  auto_unblock_at,
  created_at
FROM blocked_ips
WHERE is_active = true
ORDER BY created_at DESC;

-- Статистика по сайту
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_fraud = true) as fraud,
  COUNT(*) FILTER (WHERE is_suspicious = true) as suspicious,
  ROUND(AVG(fraud_score), 2) as avg_score
FROM events
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

---

## Ключевые API Endpoints

### Tracking
- `POST /api/track` - основной endpoint для трекинга
- `POST /api/track/batch` - пакетная отправка событий
- `GET /api/track/test` - проверка доступности

### Statistics
- `GET /api/stats/:siteId` - полная статистика по сайту
- `GET /api/stats/:siteId/recent` - последние события
- `GET /api/stats/:siteId/export` - экспорт данных (CSV/JSON)

### Blocked IPs
- `GET /api/blocked/:siteId` - список заблокированных IP
- `POST /api/blocked/:siteId` - ручная блокировка IP
- `DELETE /api/blocked/:siteId/:ip` - разблокировка IP

---

## Настройки защиты

В `.env` файле можно настроить:

```env
# Максимальное количество кликов с одного IP в час
FRAUD_MAX_CLICKS_PER_HOUR=10

# Минимальное время на сайте (секунды)
FRAUD_MIN_TIME_ON_SITE=3

# Порог fraud score для блокировки (0-100)
FRAUD_SCORE_THRESHOLD=70

# Автоматическая блокировка (true/false)
FRAUD_AUTO_BLOCK_ENABLED=true
```

---

## Что было улучшено

### 1. FraudDetector (`backend/src/services/fraud-detector.js`)
- ✅ 10 алгоритмов детекции фрода
- ✅ Проверка IP репутации
- ✅ Детекция headless браузеров
- ✅ Анализ fingerprint аномалий
- ✅ Автоматическая блокировка IP
- ✅ Статистика фрода

### 2. Track Endpoint (`backend/src/routes/track.js`)
- ✅ Проверка заблокированных IP
- ✅ In-memory счетчик кликов
- ✅ Пакетная обработка событий
- ✅ Асинхронная автоблокировка

### 3. Stats Endpoint (`backend/src/routes/stats.js`)
- ✅ Расширенная статистика
- ✅ Графики по времени
- ✅ Анализ устройств
- ✅ Причины фрода
- ✅ Экспорт данных (CSV/JSON)

---

## Troubleshooting

### Проблема: Backend не запускается

```bash
# Проверьте PostgreSQL
psql -U noctoclick_user -d noctoclick -c "SELECT 1;"

# Проверьте .env
cat backend/.env

# Проверьте логи
cd backend && npm run dev
```

### Проблема: Не сохраняются события

```sql
-- Проверьте структуру таблиц
psql -U noctoclick_user -d noctoclick
\d events
\d blocked_ips

-- Если таблицы нет, запустите миграции
```

### Проблема: Fraud score всегда 0

Проверьте, что отправляете `fingerprint` и `behavior` данные в правильном формате.

---

## Следующие шаги

1. Интеграция с Яндекс.Директ API
2. Реализация Telegram бота для уведомлений
3. ML-модель для предикции фрода
4. Redis для кэширования
5. WebSocket для real-time уведомлений

---

## Контакты

По вопросам и предложениям:
- GitHub: [Volkofff666](https://github.com/Volkofff666)
- Issues: [github.com/Volkofff666/noctoclick/issues](https://github.com/Volkofff666/noctoclick/issues)