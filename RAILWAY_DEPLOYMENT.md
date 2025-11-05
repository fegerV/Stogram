# Развертывание Stogram на Railway.app

Это руководство поможет вам развернуть приложение Stogram (мессенджер с PWA, E2E шифрованием и расширенными функциями) на платформе Railway.app.

## Обзор архитектуры

Stogram состоит из:
- **Frontend**: React + Vite + TypeScript (клиент)
- **Backend**: Node.js + Express + TypeScript (сервер)
- **База данных**: PostgreSQL
- **Кэширование**: Redis
- **Дополнительно**: Prisma ORM, Socket.IO для real-time коммуникаций

## Предварительные требования

1. Аккаунт на [Railway.app](https://railway.app/)
2. GitHub репозиторий с кодом приложения
3. Установленный Railway CLI (опционально)

## Шаг 1: Подготовка репозитория

### 1.1 Создание railway.json

Создайте файл `railway.json` в корне проекта:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.2 Настройка Procfile для сервера

Создайте файл `Procfile` в корне проекта:

```
web: cd server && npm start
```

### 1.3 Обновление package.json

Убедитесь, что в корневом `package.json` есть необходимые скрипты:

```json
{
  "scripts": {
    "start": "cd server && npm start",
    "build": "cd client && npm run build && cd ../server && npm run build",
    "install:all": "npm install && cd client && npm install && cd ../server && npm install"
  }
}
```

## Шаг 2: Настройка окружения

### 2.1 Переменные окружения для Railway

В настройках проекта Railway добавьте следующие переменные окружения:

#### Основные переменные:
```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-generate-crypto-random-bytes
DOMAIN=your-app.railway.app
```

#### База данных PostgreSQL:
Railway автоматически предоставит переменные:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

#### Redis:
Если используете Railway Redis, добавьте:
```
REDIS_URL=redis://host:port
```

#### Дополнительные переменные (если нужны):
```
POSTGRES_USER=stogram
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=stogram_db
```

### 2.2 Генерация JWT Secret

Сгенерируйте безопасный ключ:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Шаг 3: Создание Railway проекта

### 3.1 Через веб-интерфейс

1. Войдите в [Railway.app](https://railway.app/)
2. Нажмите "New Project" → "Deploy from GitHub repo"
3. Выберите ваш репозиторий
4. Railway автоматически определит настройки

### 3.2 Через CLI

```bash
# Установка CLI
npm install -g @railway/cli

# Вход в систему
railway login

# Создание проекта
railway new
railway up
```

## Шаг 4: Настройка сервисов

### 4.1 Добавление PostgreSQL

1. В проекте Railway нажмите "New Service"
2. Выберите "Database" → "PostgreSQL"
3. Railway автоматически свяжет базу данных с вашим приложением
4. Переменная `DATABASE_URL` будет добавлена автоматически

### 4.2 Добавление Redis (опционально)

1. Нажмите "New Service"
2. Выберите "Database" → "Redis"
3. Переменная `REDIS_URL` будет добавлена автоматически

### 4.3 Настройка домена

1. Перейдите в настройки вашего сервиса
2. Во вкладке "Settings" → "Domain" вы увидите автоматически сгенерированный домен
3. Для кастомного домена добавьте его в настройках и настройте DNS

## Шаг 5: Миграция базы данных

### 5.1 Автоматическая миграция

Railway выполнит команду из Dockerfile:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

### 5.2 Ручная миграция (если нужно)

Через Railway CLI:
```bash
railway run "npx prisma migrate deploy"
```

## Шаг 6: Развертывание frontend

### Вариант 1: Развертывание вместе с backend

Добавьте в серверный код обслуживание статических файлов:

```typescript
// В server/src/index.ts
import express from 'express';
import path from 'path';

const app = express();

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, '../../client/dist')));

// API маршруты
app.use('/api', apiRoutes);

// Все остальные запросы направляем на React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
```

### Вариант 2: Отдельный сервис для frontend

1. Создайте отдельный Railway сервис для frontend
2. Создайте `railway.json` в директории `client`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run preview",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## Шаг 7: Мониторинг и логи

### 7.1 Просмотр логов

- В веб-интерфейсе: Перейдите в сервис → вкладка "Logs"
- Через CLI: `railway logs`

### 7.2 Метрики

- Во вкладке "Metrics" можно отслеживать:
  - CPU использование
  - Память
  - Сетевую активность
  - База данных запросы

## Шаг 8: Конфигурация для продакшена

### 8.1 Оптимизация сборки

Добавьте в корневой `package.json`:
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 8.2 Health checks

Добавьте health check endpoint в сервер:
```typescript
// server/src/routes/health.ts
import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

export default router;
```

### 8.3 Конфигурация Nginx (если нужно)

Для оптимизации обслуживания статических файлов можно добавить nginx.conf в client:
```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Кэширование статических assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Шаг 9: Тестирование развертывания

### 9.1 Проверка API

```bash
curl https://your-app.railway.app/health
```

### 9.2 Проверка frontend

Откройте в браузере: `https://your-app.railway.app`

### 9.3 Проверка WebSocket

Проверьте работу real-time функций в приложении.

## Шаг 10: Управление окружениями

### 10.1 Создание staging окружения

```bash
# Создание новой ветки
git checkout -b staging

# Развертывание в staging
railway up --environment staging
```

### 10.2 Переменные окружения для разных сред

Используйте префиксы в названиях переменных:
- `STAGING_DATABASE_URL`
- `PRODUCTION_DATABASE_URL`

## Troubleshooting

### Проблема: Сборка не работает

**Решение:**
1. Проверьте `package.json` на наличие всех зависимостей
2. Убедитесь, что `engines.node` указана правильно
3. Проверьте логи сборки

### Проблема: База данных не подключается

**Решение:**
1. Проверьте переменную `DATABASE_URL`
2. Убедитесь, что PostgreSQL сервис запущен
3. Проверьте сетевые настройки

### Проблема: Frontend не загружается

**Решение:**
1. Проверьте, что сборка прошла успешно
2. Убедитесь, что статические файлы правильно обслуживаются
3. Проверьте routing конфигурацию

### Проблема: WebSocket не работает

**Решение:**
1. Проверьте, что порт для Socket.IO открыт
2. Убедитесь, что CORS настроен правильно
3. Проверьте конфигурацию Railway для WebSocket

## Автоматизация развертывания

### GitHub Actions

Создайте `.github/workflows/railway-deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway-app/railway-action@v1
        with:
          api-token: ${{ secrets.RAILWAY_TOKEN }}
          service: your-service-name
```

## Стоимость и ресурсы

### Минимальная конфигурация:
- **Hobby план**: ~$5/месяц за сервис
- **PostgreSQL**: ~$5/месяц
- **Redis**: ~$5/месяц (опционально)

**Итого**: ~$10-15/месяц для базового развертывания

### Масштабирование:
- Автоматическое масштабирование доступно на Pro планах
- Можно настроить replica для базы данных
- CDN для статических файлов

## Безопасность

### Рекомендации:
1. Используйте Railway переменные окружения для секретов
2. Включите HTTPS (автоматически в Railway)
3. Настройте CORS для доменов
4. Используйте rate limiting
5. Регулярно обновляйте зависимости

## Заключение

Развертывание Stogram на Railway.app позволяет быстро получить работающее приложение с автоматическим масштабированием, HTTPS и управляемыми базами данных. Платформа особенно удобна для прототипирования и небольших проектов.

Для продакшена рассмотрите:
- Настройку мониторинга
- Бэкапы базы данных
- CDN для статических файлов
- Кастомные домены
- Дополнительные меры безопасности

Дополнительная информация:
- [Railway Documentation](https://docs.railway.app/)
- [Stogram Repository](https://github.com/your-repo/stogram)
- [Support](mailto:support@railway.app)