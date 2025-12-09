# NoctoClick Dashboard

React-приложение для управления и мониторинга антифрод системы.

## Технологии

- **React 18** - UI библиотека
- **Vite** - Build tool (быстрая сборка)
- **React Router** - Роутинг
- **Recharts** - Графики и аналитика
- **CSS Modules** - Стили (БЕЗ Tailwind!)
- **Axios** - HTTP клиент

## Структура

```
dashboard/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Main app component
│   ├── pages/
│   │   ├── Dashboard.jsx     # Главная страница
│   │   ├── BlockedIPs.jsx    # Список блокировок
│   │   ├── Settings.jsx      # Настройки
│   │   └── YandexConnect.jsx # Yandex OAuth
│   ├── components/
│   │   ├── Layout/
│   │   ├── TrafficChart.jsx  # График трафика
│   │   ├── StatsCards.jsx    # Карточки статистики
│   │   ├── BlockedIPsTable.jsx
│   │   └── ...
│   ├── styles/
│   │   ├── global.css        # Глобальные стили
│   │   └── variables.css     # CSS переменные
│   └── utils/
│       └── api.js            # API client
├── public/
├── package.json
├── vite.config.js
└── Dockerfile
```

## Разработка

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка для production
npm run build

# Preview production build
npm run preview
```

## Docker

```bash
# Development
docker build -f Dockerfile.dev -t noctoclick-dashboard:dev .
docker run -p 3000:3000 -v $(pwd)/src:/app/src noctoclick-dashboard:dev

# Production
docker build --build-arg VITE_API_URL=http://noctoclick.local/api -t noctoclick-dashboard .
docker run -p 80:80 noctoclick-dashboard
```

## Environment Variables

- `VITE_API_URL` - URL для API (default: http://localhost:3001)

## CSS Modules

Каждый компонент имеет свой `.module.css` файл:

```jsx
import styles from './Component.module.css';

function Component() {
  return <div className={styles.container}>...</div>;
}
```

## Цветовая схема

См. `src/styles/variables.css`:
- Primary: #667eea (фиолетовый)
- Danger: #f56565 (красный)
- Success: #48bb78 (зелёный)
- Warning: #ed8936 (оранжевый)

## Proxy

В dev режиме все запросы к `/api` проксируются на backend (localhost:3001).
