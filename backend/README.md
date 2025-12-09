# NoctoClick Backend API

Node.js/Express API сервер для обработки антифрод данных.

## Структура

```
backend/
├── src/
│   ├── config.js              # Конфигурация приложения
│   ├── server.js              # Главный файл сервера
│   ├── db/
│   │   ├── postgres.js        # PostgreSQL подключение
│   │   ├── redis.js           # Redis подключение
│   │   └── migrate.js         # Миграции БД
│   ├── routes/
│   │   ├── track.js           # POST /api/track - прием данных от трекера
│   │   ├── stats.js           # GET /api/stats - статистика
│   │   ├── yandex.js          # Yandex Direct API
│   │   ├── sites.js           # Управление сайтами
│   │   └── blocked.js         # Список заблокированных IP
│   ├── services/
│   │   ├── fraud-detector.js  # Детекция фрода
│   │   ├── yandex-client.js   # Yandex Direct клиент
│   │   └── scheduler.js       # Cron задачи
│   ├── middleware/
│   │   ├── auth.js            # JWT авторизация
│   │   └── rateLimit.js       # Rate limiting
│   └── utils/
│       └── logger.js          # Winston logger
├── scripts/
│   └── seed.js                # Тестовые данные
├── migrations/
│   └── 001_initial.sql        # SQL миграции
├── package.json
├── Dockerfile                 # Production образ
└── Dockerfile.dev             # Dev образ с hot reload
```

## Основные endpoints

### Health Check
```
GET /health
```

### Tracking
```
POST /api/track
Body: { fingerprint, behavior, siteId, url, utm, ... }
```

### Statistics
```
GET /api/stats/:siteId?period=24h
```

### Yandex Direct
```
GET /api/yandex/auth - OAuth авторизация
GET /api/yandex/callback - OAuth callback
GET /api/yandex/campaigns - Список кампаний
POST /api/yandex/sync - Синхронизация блокировок
```

## Разработка

```bash
# Установка зависимостей
npm install

# Запуск в dev режиме (с hot reload)
npm run dev

# Миграции БД
npm run migrate

# Seed тестовых данных
npm run seed
```

## Production

```bash
# Сборка Docker образа
docker build -t noctoclick-backend .

# Запуск
docker run -p 3001:3001 --env-file .env noctoclick-backend
```

## Переменные окружения

См. `.env.example` в корне проекта.

## Логирование

Логи записываются в:
- `logs/error.log` - только ошибки
- `logs/combined.log` - все логи
- Console - в dev режиме

Формат: JSON (для парсинга) или colored text (dev).

## Graceful Shutdown

Сервер корректно завершает работу при получении SIGTERM/SIGINT:
1. Закрывает HTTP сервер
2. Закрывает соединения с БД
3. Закрывает Redis
4. Завершает текущие запросы (макс 30 сек)

## Health Checks

Endpoint `/health` проверяет:
- Статус сервера
- Подключение к PostgreSQL
- Подключение к Redis
- Uptime и время

Возвращает 200 OK если всё работает, 503 если проблемы.
