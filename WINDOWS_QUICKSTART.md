# 🚀 Быстрый запуск на Windows (с SQLite)

Это руководство позволит запустить **NoctoClick** на Windows **без установки PostgreSQL**! Используется SQLite - легкая база данных в одном файле.

---

## 💻 Предварительные требования

Вам нужно только:
- **Node.js 18+** - [скачать](https://nodejs.org/)
- **Git** - [скачать](https://git-scm.com/download/win)

---

## ⚡ Запуск за 5 минут

### Шаг 1: Клонирование репозитория

Откройте **PowerShell** или **CMD**:

```bash
git clone https://github.com/Volkofff666/noctoclick.git
cd noctoclick\backend
```

### Шаг 2: Установка зависимостей

```bash
npm install
```

### Шаг 3: Настройка окружения

```bash
copy .env.example .env
```

Откройте `.env` в блокноте и убедитесь, что:

```env
DB_TYPE=sqlite

JWT_SECRET=your_super_secret_key_here_minimum_32_characters_long
JWT_REFRESH_SECRET=your_refresh_secret_key_here_also_32_chars

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

FRAUD_MAX_CLICKS_PER_HOUR=10
FRAUD_MIN_TIME_ON_SITE=3
FRAUD_SCORE_THRESHOLD=70
FRAUD_AUTO_BLOCK_ENABLED=true
```

> ⚠️ **Важно:** Измените `JWT_SECRET` и `JWT_REFRESH_SECRET` на случайные строки!

### Шаг 4: Инициализация базы данных

```bash
npm run init
```

Вы увидите:
```
📦 Инициализация базы данных...
✅ База данных успешно инициализирована!

👤 Создание тестового пользователя...
   ✅ Пользователь создан: test@noctoclick.dev (ID: 1)
   🔑 Пароль: test123456

🌐 Создание тестового сайта...
   ✅ Сайт создан: Test Site (ID: 1)
   🔑 API Key: abc123def456...
```

**Сохраните API Key!** Он понадобится для тестирования.

### Шаг 5: Запуск сервера

```bash
npm run dev
```

Вы увидите:
```
⚡ Server running on port 3001
🐞 Using database: sqlite
✅ SQLite connected: D:\projects\noctoclick\backend\data\noctoclick.db
```

---

## 🧪 Тестирование защиты от фрода

### 1. Проверка работы API

Откройте новое окно PowerShell:

```powershell
curl http://localhost:3001/api/track/test
```

Ответ:
```json
{
  "success": true,
  "message": "NoctoClick tracker endpoint is working",
  "timestamp": "2025-12-13T19:00:00.000Z",
  "database": "sqlite"
}
```

### 2. Отправка нормального клика

Замените `YOUR_API_KEY` на API ключ из Шага 4:

```powershell
$body = @'
{
  "siteId": "YOUR_API_KEY",
  "fingerprintHash": "normal_user_123",
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
    "scrollDepth": 80
  },
  "url": "https://example.com/test"
}
'@

curl -Method POST -Uri http://localhost:3001/api/track `
  -ContentType "application/json" `
  -Body $body
```

Ответ:
```json
{
  "success": true,
  "fraudScore": 0,
  "status": "ok"
}
```

### 3. Отправка фродового клика (бот)

```powershell
$fraudBody = @'
{
  "siteId": "YOUR_API_KEY",
  "fingerprintHash": "bot_fingerprint_666",
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
    "timeToFirstInteraction": 0.1
  },
  "url": "https://example.com/test"
}
'@

curl -Method POST -Uri http://localhost:3001/api/track `
  -ContentType "application/json" `
  -Body $fraudBody
```

Ответ:
```json
{
  "success": true,
  "fraudScore": 95,
  "status": "fraud"
}
```

### 4. Просмотр базы данных

База данных находится в `backend/data/noctoclick.db`

Можно открыть с помощью:
- [DB Browser for SQLite](https://sqlitebrowser.org/dl/) (бесплатно)
- Или любого SQL-клиента

Примеры SQL-запросов:

```sql
-- Все события
SELECT * FROM events ORDER BY created_at DESC LIMIT 10;

-- Фродовые события
SELECT ip_address, fraud_score, fraud_reason, created_at 
FROM events 
WHERE is_fraud = 1 
ORDER BY created_at DESC;

-- Заблокированные IP
SELECT * FROM blocked_ips WHERE is_active = 1;

-- Статистика
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_fraud = 1 THEN 1 ELSE 0 END) as fraud,
  SUM(CASE WHEN is_suspicious = 1 THEN 1 ELSE 0 END) as suspicious,
  ROUND(AVG(fraud_score), 2) as avg_score
FROM events;
```

---

## 📦 Что внутри

### Алгоритмы детекции (10 проверок)

1. ✅ **Частота кликов** - более 10 кликов/час с одного IP
2. ✅ **Время на сайте** - менее 3 секунд
3. ✅ **Активность мыши** - отсутствие движений
4. ✅ **Fingerprint** - WebDriver, WebGL, плагины
5. ✅ **Повторное использование fingerprint**
6. ✅ **Headless browser** - Chrome, PhantomJS, Selenium
7. ✅ **Отсутствие взаимодействий**
8. ✅ **Мгновенное взаимодействие**
9. ✅ **Аномальная прокрутка**
10. ✅ **IP репутация** - история фрода

### Автоматическая блокировка

- ✅ Автоблок при 3+ фродовых кликах
- ✅ Блокировка на 7 дней
- ✅ Автоматическая разблокировка

---

## 🔧 Решение проблем

### Ошибка: "Cannot find module 'sqlite3'"

```bash
npm install sqlite3 --save
```

### Ошибка: "Не удается подключиться к БД"

Удалите файл БД и переинициализируйте:

```bash
del data\noctoclick.db
npm run init
```

### Порт 3001 занят

Измените порт в `.env`:

```env
PORT=3002
```

---

## 🚀 Следующие шаги

1. **Запустите Dashboard** (фронтенд):
   ```bash
   cd ..\dashboard
   npm install
   npm run dev
   ```

2. **Интегрируйте трекер** на свой сайт

3. **Перейдите на PostgreSQL** для production:
   - Установите PostgreSQL
   - Измените `DB_TYPE=postgres` в `.env`
   - Выполните миграции

---

## 📚 Дополнительные ресурсы

- 📝 [FRAUD_PROTECTION_GUIDE.md](FRAUD_PROTECTION_GUIDE.md) - полное руководство
- 🐛 [GitHub Issues](https://github.com/Volkofff666/noctoclick/issues)
- ❓ Есть вопросы? Создайте issue!

---

## ✨ Успехов!

Теперь у вас есть рабочая **система защиты от фрода** с 10 алгоритмами детекции и автоматической блокировкой! 🚀