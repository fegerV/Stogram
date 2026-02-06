# Деплой Backend на Render + Neon PostgreSQL

## 📋 Архитектура

```
Frontend (Vercel)  →  Backend (Render)  →  PostgreSQL (Neon)
stogram.vercel.app     stogram.onrender.com    neon.tech
```

## 🗄️ Шаг 1: Создание базы данных в Neon

1. Зарегистрируйтесь на [neon.tech](https://neon.tech)
2. Нажмите "Create Project"
3. Настройте:
   - **Project name**: `stogram`
   - **Region**: `EU (Frankfurt)` (ближе к Render)
   - **Compute size**: Free tier (0.25 CU)
4. После создания скопируйте **Connection string**:
   ```
   postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/stogram?sslmode=require
   ```

## 🚀 Шаг 2: Деплой Backend на Render

### Вариант A: Через Dashboard (рекомендуется)

1. Зарегистрируйтесь на [render.com](https://render.com)
2. Нажмите "New +" → "Web Service"
3. Подключите GitHub репозиторий
4. Настройте:
   - **Name**: `stogram-server`
   - **Region**: `Frankfurt (EU Central)`
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && node dist/index.js`
   - **Plan**: `Free`

### Вариант B: Через render.yaml (Infrastructure as Code)

Файл `render.yaml` уже создан в корне репозитория. Render автоматически его обнаружит.

## 🔐 Шаг 3: Настройка переменных окружения в Render

В Render Dashboard → ваш сервис → Environment:

| Variable | Value | Описание |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://...@neon.tech/stogram?sslmode=require` | Connection string из Neon |
| `JWT_SECRET` | (сгенерируйте длинный ключ) | Секрет для JWT токенов |
| `CLIENT_URL` | `https://stogram-client.vercel.app` | URL фронтенда на Vercel |
| `NODE_ENV` | `production` | Окружение |
| `PORT` | `3001` | Порт сервера |

### Настройка SMTP (опционально, для отправки email)

Для отправки писем верификации email и восстановления пароля настройте SMTP переменные.

📧 **Подробная инструкция:** [SMTP_SETUP.md](./SMTP_SETUP.md)

**Быстрый старт:**
- `SMTP_HOST` — SMTP сервер (например, `smtp.gmail.com`)
- `SMTP_PORT` — порт (обычно `587` для TLS или `465` для SSL)
- `SMTP_USER` — email для авторизации
- `SMTP_PASS` — пароль или App Password
- `SMTP_SECURE` — `false` для TLS (порт 587) или `true` для SSL (порт 465)
- `SMTP_FROM` — email отправителя (опционально)

**Примеры для популярных провайдеров:**
- Gmail: `smtp.gmail.com:587` (требуется App Password)
- Яндекс: `smtp.yandex.ru:465` (требуется Пароль приложения)
- MAIL.RU: `smtp.mail.ru:465` (требуется Пароль приложения)

См. [SMTP_SETUP.md](./SMTP_SETUP.md) для подробных инструкций.

### Генерация JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🌐 Шаг 4: Обновление Vercel Environment Variables

В Vercel Dashboard → ваш проект → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://stogram-server.onrender.com` |
| `VITE_WS_URL` | `https://stogram-server.onrender.com` |

**Важно**: После изменения переменных сделайте Redeploy в Vercel.

## 🔄 Шаг 5: Инициализация базы данных

После первого деплоя на Render, Prisma автоматически выполнит миграции.

Для создания тестовых пользователей, используйте Render Shell:
1. В Render Dashboard → ваш сервис → Shell
2. Выполните:
   ```bash
   npx ts-node src/scripts/createTestUsers.ts
   ```

## ⚠️ Особенности Free Tier

### Render Free:
- Сервис **засыпает** через 15 минут неактивности
- Первый запрос после сна: **~30-50 секунд** (cold start)
- 750 часов/месяц (достаточно для одного сервиса)
- Нет кастомных доменов на Free

### Neon Free:
- **500 MB** хранилища
- **0.25 Compute Units**
- Автоматическая приостановка при неактивности
- Compute восстанавливается за ~1 секунду

### Рекомендации:
- Для тестирования Free tier достаточно
- Для production рассмотрите Render Starter ($7/мес) — без cold starts
- WebSocket может обрываться при cold start — фронтенд имеет авто-реконнект

## 🐛 Решение проблем

### Build Failed на Render
1. Проверьте Root Directory = `server`
2. Убедитесь что `prisma generate` выполняется до `npm run build`
3. Проверьте логи сборки в Render Dashboard

### Database Connection Error
1. Убедитесь что `DATABASE_URL` содержит `?sslmode=require`
2. Проверьте что IP Render разрешён в Neon (по умолчанию — все IP разрешены)

### CORS Errors
1. Убедитесь что `CLIENT_URL` в Render = точный URL из Vercel
2. Можно указать несколько URL через запятую:
   ```
   https://stogram-client.vercel.app,https://stogram-client-xxx.vercel.app
   ```
