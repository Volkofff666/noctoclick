# NoctoClick - Система защиты от скликивания

Профессиональная SaaS-платформа для защиты контекстной рекламы от скликивания с интеграцией Яндекс.Директ.

## ✨ Возможности

### Для клиентов:
- ✅ **Multi-tenant архитектура** - каждый клиент со своим личным кабинетом
- ✅ **Управление сайтами** - добавление, редактирование, удаление
- ✅ **Realtime детекция фрода** - мгновенный анализ кликов
- ✅ **Автоматическая блокировка** - защита работает 24/7
- ✅ **Интеграция Яндекс.Директ** - синхронизация блокировок
- ✅ **Подробная аналитика** - графики, отчёты, экспорт

### Технологический стек:
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React 18 + Vite + Lucide Icons
- **Авторизация**: JWT (access + refresh tokens)
- **Трекер**: JavaScript SDK с fingerprinting
- **Deployment**: Docker + Docker Compose

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/Volkofff666/noctoclick.git
cd noctoclick
```

### 2. Настройка Backend

```bash
cd backend

# Установка зависимостей
npm install

# Копируем .env
cp .env.example .env

# Редактируем .env
nano .env
```

**Настройки .env:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=noctoclick
DB_USER=noctoclick_user
DB_PASSWORD=ваш_пароль

JWT_SECRET=ваш_супер_секретный_ключ

PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 3. Настройка PostgreSQL

```bash
# Запустите PostgreSQL (если ещё не установлен)
sudo service postgresql start

# Создайте базу данных
psql -U postgres

CREATE DATABASE noctoclick;
CREATE USER noctoclick_user WITH PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE noctoclick TO noctoclick_user;
\q
```

### 4. Миграции БД

```bash
# Выполните миграции
psql -U noctoclick_user -d noctoclick -f migrations/001_create_tables.sql
psql -U noctoclick_user -d noctoclick -f migrations/002_add_fingerprinting.sql
psql -U noctoclick_user -d noctoclick -f migrations/003_add_indexes.sql
psql -U noctoclick_user -d noctoclick -f migrations/004_create_users_and_sites.sql
```

### 5. Запуск Backend

```bash
# Development
npm run dev

# Production
npm start
```

Backend запустится на `http://localhost:3001`

### 6. Настройка Frontend

```bash
cd dashboard

# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev
```

Dashboard откроется на `http://localhost:3000`

---

## 💻 Использование

### Шаг 1: Регистрация

1. Откройте `http://localhost:3000/register`
2. Зарегистрируйте новый аккаунт
3. Вы будете автоматически залогинены

### Шаг 2: Добавление сайта

1. Перейдите на "Мои сайты"
2. Нажмите "Добавить сайт"
3. Введите название и домен
4. Нажмите "Инструкция" для получения кода трекера

### Шаг 3: Установка трекера на сайт

Добавьте этот код в `<head>` вашего сайта:

```html
<!-- NoctoClick Anti-Fraud Tracker -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://your-domain.com/tracker.js';
    script.async = true;
    script.setAttribute('data-api-key', 'ВАШ_API_КЛЮЧ');
    document.head.appendChild(script);
  })();
</script>
```

### Шаг 4: Настройка правил

1. Перейдите в "Настройки"
2. Установите пороги детекции
3. Включите автоматическую блокировку
4. Сохраните изменения

### Шаг 5: Подключение Яндекс.Директ

1. Перейдите в "Яндекс.Директ"
2. Нажмите "Подключить"
3. Авторизуйтесь через Yandex OAuth
4. Выберите кампании для защиты

---

## 🔨 Структура проекта

```
noctoclick/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, validation
│   │   ├── services/     # Business logic
│   │   └── db/           # Database
│   ├── migrations/       # SQL migrations
│   └── package.json
│
├── dashboard/          # React UI
│   ├── src/
│   │   ├── pages/        # Страницы
│   │   ├── components/   # Компоненты
│   │   ├── utils/        # API client
│   │   └── styles/       # CSS
│   └── package.json
│
├── tracker/            # JavaScript SDK
├── docker-compose.yml
└── README.md
```

---

## 📦 API Endpoints

### Авторизация

```
POST   /api/auth/register       - Регистрация
POST   /api/auth/login          - Вход
POST   /api/auth/logout         - Выход
POST   /api/auth/refresh        - Обновление token
GET    /api/auth/me            - Текущий пользователь
PUT    /api/auth/profile       - Обновление профиля
PUT    /api/auth/password      - Смена пароля
```

### Управление сайтами

```
GET    /api/sites              - Список сайтов
POST   /api/sites              - Добавить сайт
GET    /api/sites/:id          - Детали сайта
PUT    /api/sites/:id          - Обновить сайт
DELETE /api/sites/:id          - Удалить сайт
POST   /api/sites/:id/regenerate-key  - Перегенерировать API ключ
POST   /api/sites/:id/test     - Проверка установки
GET    /api/sites/:id/stats    - Статистика сайта
```

### Блокировки

```
GET    /api/blocked/:siteId              - Заблокированные IP
POST   /api/blocked/:siteId              - Заблокировать IP
DELETE /api/blocked/:siteId/:ip         - Разблокировать IP
GET    /api/blocked/:siteId/export/yandex - Экспорт для Яндекса
```

---

## 🐛 Отладка

### Проверка Backend

```bash
curl http://localhost:3001/health
```

### Проверка БД

```bash
psql -U noctoclick_user -d noctoclick

SELECT * FROM users;
SELECT * FROM client_sites;
```

### Logs

```bash
# Backend logs
cd backend
npm run dev

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

---

## 🚀 Production Deployment

### Docker Compose

```bash
# Сборка и запуск
docker-compose up -d

# Миграции БД
docker-compose exec backend npm run migrate

# Логи
docker-compose logs -f
```

---

## 📝 TODO

- [ ] Добавить методы updateProfile и changePassword в backend
- [ ] Реализовать Yandex OAuth интеграцию
- [ ] Добавить Email уведомления
- [ ] Добавить Telegram бот для алертов
- [ ] Реализовать биллинг (тарифы)
- [ ] Добавить unit тесты
- [ ] Написать документацию API

---

## 👥 Контакты

- **GitHub**: [Volkofff666](https://github.com/Volkofff666)
- **Email**: support@noctoclick.ru

---

## 📜 Лицензия

MIT License - см. [LICENSE](LICENSE)
