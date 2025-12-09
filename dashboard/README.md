# NoctoClick Dashboard

Профессиональный React-интерфейс для управления системой защиты от скликивания.

## Технологии

- **React 18** - UI библиотека
- **Vite** - Build tool (быстрая сборка)
- **React Router** - Роутинг
- **Recharts** - Графики и аналитика
- **Lucide React** - Библиотека иконок (SVG)
- **CSS Modules** - Изолированные стили
- **Axios** - HTTP клиент

## Структура

```
dashboard/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Main app component
│   ├── pages/
│   │   ├── Dashboard.jsx     # Главная страница
│   │   ├── BlockedIPs.jsx    # Управление блокировками
│   │   ├── Settings.jsx      # Настройки системы
│   │   └── YandexConnect.jsx # Интеграция с Яндекс.Директ
│   ├── components/
│   │   ├── Layout/           # Layout с сайдбаром
│   │   ├── StatsCards/       # Карточки статистики
│   │   ├── TrafficChart/     # График трафика
│   │   └── RecentEvents/     # Последние события
│   ├── styles/
│   │   ├── global.css        # Глобальные стили
│   │   └── variables.css     # CSS переменные (Design System)
│   └── utils/
│       └── api.js            # API клиент
├── public/
├── package.json
├── vite.config.js
└── Dockerfile
```

## Разработка

```bash
# Установка зависимостей
npm install

# Запуск dev сервера с hot reload
npm run dev

# Откроется на http://localhost:3000
```

## Сборка для production

```bash
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

## Фичи UI

### Дашборд
- ✅ Карточки со статистикой (всего, легитимные, подозрительные, фрод, заблокированные)
- ✅ Интерактивный график трафика (Recharts)
- ✅ Таблица последних событий
- ✅ Список suspicious IP-адресов
- ✅ Фильтры по периодам (1ч, 6ч, 24ч, 7д, 30д)

### Блокировки
- ✅ Список заблокированных IP с пагинацией
- ✅ Фильтры (Все / Авто / Ручные)
- ✅ Поиск по IP-адресу
- ✅ Модальное окно добавления IP
- ✅ Экспорт для Яндекс.Директ
- ✅ Разблокировка IP

### Настройки
- ✅ Range sliders для порогов детекции
- ✅ Toggle switches
- ✅ System info карточки
- ✅ Danger zone для критических действий

### Design System
- ✅ Профессиональная цветовая палитра
- ✅ Единые CSS переменные
- ✅ Lucide React иконки (SVG)
- ✅ Адаптивный дизайн
- ✅ Smooth анимации и transitions
- ✅ Темы готовы к расширению

## Иконки Lucide React

Используем библиотеку [Lucide React](https://lucide.dev/) - современные SVG иконки.

**Примеры использования:**

```jsx
import { Shield, BarChart3, Settings, Download } from 'lucide-react';

<Shield size={24} strokeWidth={2} />
<BarChart3 size={20} />
<Settings size={16} className={styles.icon} />
```

**Полный список иконок:** https://lucide.dev/icons/

## Интерфейс на русском

Весь UI переведён на русский язык:
- Меню навигации
- Заголовки и описания
- Формы и кнопки
- Сообщения об ошибках
- Placeholders

## Environment Variables

```env
VITE_API_URL=http://localhost:3001  # URL для API
```

## Стили

Используем CSS Modules для изоляции стилей:

```jsx
import styles from './Component.module.css';

function Component() {
  return <div className={styles.container}>...</div>;
}
```

## API Integration

API клиент с автоматическими interceptors:

```javascript
import { statsAPI, blockedAPI } from './utils/api';

const stats = await statsAPI.getSiteStats(siteId, '24h');
const blocked = await blockedAPI.getBlocked(siteId);
```

## Troubleshooting

### Port 3000 занят:
```bash
# Измени порт в vite.config.js
server: { port: 3001 }
```

### Hot reload не работает:
```bash
# Перезапусти dev сервер
npm run dev
```

### Ошибки импорта иконок:
```bash
# Переустанови зависимости
rm -rf node_modules package-lock.json
npm install
```
