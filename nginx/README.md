# NoctoClick Nginx Reverse Proxy

Основной reverse proxy для NoctoClick, обрабатывающий все входящие запросы.

## Маршрутизация

- `/api/*` → Backend API (port 3001)
- `/api/track` → Tracking endpoint (повышенный rate limit)
- `/health` → Health check
- `/*` → Dashboard (React SPA)

## Rate Limiting

- API endpoints: 10 запросов/сек, burst 20
- Tracking endpoint: 50 запросов/сек, burst 100
- Health check: без ограничений

## Security Headers

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: enabled

## Gzip Compression

Сжатие включено для:
- text/plain, text/css, text/javascript
- application/json, application/javascript
- image/svg+xml

## Caching

Статические файлы (картинки, CSS, JS, шрифты):
- Expires: 1 year
- Cache-Control: public, immutable

## Logs

- Access log: `/var/log/nginx/access.log`
- Error log: `/var/log/nginx/error.log`

## Проверка конфигурации

```bash
# Внутри контейнера
docker-compose exec nginx nginx -t

# Перезагрузка конфигурации
docker-compose exec nginx nginx -s reload
```

## Troubleshooting

### 502 Bad Gateway

Проверьте, что backend и dashboard запущены:
```bash
docker-compose ps
```

### 504 Gateway Timeout

Увеличьте timeout в конфигурации nginx.

### Rate Limit Exceeded

Если видите 429 Too Many Requests, увеличьте `rate` или `burst` в конфиге.
