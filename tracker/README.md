# NoctoClick Tracker

Клиентский JavaScript-трекер для сбора browser fingerprint и поведенческих метрик.

## Возможности

### Browser Fingerprinting
- User-Agent, язык, платформа
- Разрешение экрана и глубина цвета
- Часовой пояс и смещение
- WebGL fingerprint (видеокарта)
- Canvas fingerprint
- Audio fingerprint
- Список плагинов и шрифтов
- Поддержка touch и количество ядер CPU
- Объем памяти устройства

### Поведенческие метрики
- Движения мыши
- Клики и нажатия клавиш
- Скроллинг страницы
- Время на странице
- Время до первого взаимодействия
- Глубина просмотра контента

### UTM параметры
- Автоматический сбор UTM меток
- Яндекс.Директ Click ID (yclid)
- Реферер

## Установка

### 1. Базовое подключение

```html
<script 
    src="https://your-domain.com/noctoclick-tracker.js" 
    data-endpoint="https://api.noctoclick.local/api/track"
    data-site-id="your-site-id"
    data-noctoclick
></script>
```

### 2. С отладкой

```html
<script 
    src="noctoclick-tracker.js" 
    data-endpoint="http://localhost:3001/api/track"
    data-site-id="test-site"
    data-debug="true"
    data-noctoclick
></script>
```

## Параметры

- `data-endpoint` - URL API для отправки данных (обязательный)
- `data-site-id` - ID вашего сайта в системе (обязательный)
- `data-debug` - Включить отладочные логи в консоль (опционально)

## API

### NoctoClick.getData()
Возвращает все собранные данные:
```javascript
var data = NoctoClick.getData();
console.log(data.fingerprint);
console.log(data.behavior);
```

### NoctoClick.sendData()
Отправляет данные на сервер немедленно:
```javascript
NoctoClick.sendData();
```

### NoctoClick.init()
Переинициализирует трекер (обычно не требуется):
```javascript
NoctoClick.init();
```

## Когда отправляются данные

1. Автоматически через 5 секунд после загрузки страницы
2. При закрытии/перезагрузке страницы (beforeunload)
3. Вручную через `NoctoClick.sendData()`

## Тестирование

Откройте `test.html` в браузере для интерактивного тестирования:

1. Просто откройте файл в браузере
2. Откройте консоль (F12)
3. Используйте кнопки для тестирования разных сценариев
4. Смотрите собранные данные в консоли и на странице

## Размер и производительность

- Размер файла: ~12KB (не минифицирован)
- Размер после минификации: ~6KB
- Размер с gzip: ~2KB
- Асинхронная загрузка не блокирует рендеринг
- Минимальное влияние на производительность

## Совместимость

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- IE 11 (с ограничениями)

## Безопасность и приватность

- Не собирает персональные данные
- Не использует cookies
- Совместимо с GDPR
- Все данные анонимны
- IP-адрес определяется на сервере

## Минификация

Для production использования минифицируйте скрипт:

```bash
# Используя UglifyJS
uglifyjs noctoclick-tracker.js -c -m -o noctoclick-tracker.min.js

# Или используя Terser
terser noctoclick-tracker.js -c -m -o noctoclick-tracker.min.js
```

## Примеры использования

### SPA (React, Vue, Angular)

```javascript
// В index.html или при инициализации приложения
import('./noctoclick-tracker.js').then(() => {
  window.NoctoClick.init();
});
```

### На странице с формой

```html
<form onsubmit="NoctoClick.sendData()">
  <!-- форма -->
</form>
```

### Интеграция с Google Tag Manager

1. Создайте Custom HTML тег
2. Вставьте код подключения трекера
3. Настройте триггер на All Pages

## Troubleshooting

### Данные не отправляются

1. Проверьте консоль на ошибки
2. Убедитесь что `data-endpoint` указан верно
3. Проверьте CORS настройки на сервере
4. Включите `data-debug="true"` для отладки

### Fingerprint всегда одинаковый

- Это нормально для одного браузера/устройства
- Fingerprint меняется при изменении браузера, устройства или настроек

### Блокируется AdBlock

- Используйте собственный домен для хостинга скрипта
- Избегайте слов 'tracker', 'analytics' в URL

## Лицензия

© 2025 NoctoClick. Все права защищены.
