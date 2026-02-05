# Настройка деплоя Frontend на Vercel

Это руководство поможет вам настроить автоматический деплой frontend приложения Stogram на Vercel через GitHub Actions.

## 📋 Предварительные требования

1. Аккаунт на [Vercel](https://vercel.com)
2. GitHub репозиторий с кодом проекта
3. Backend развернут на Railway или другой платформе (для WebSocket и API)

## 🔧 Шаг 1: Настройка проекта в Vercel

### 1.1 Создание проекта в Vercel Dashboard

1. Войдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Нажмите "Add New Project"
3. Импортируйте ваш GitHub репозиторий
4. Настройте проект:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (корень репозитория)
   - **Build Command**: `cd client && npm ci && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `cd client && npm ci`

### 1.2 Получение Vercel токенов

1. Перейдите в [Vercel Settings > Tokens](https://vercel.com/account/tokens)
2. Создайте новый токен с именем "GitHub Actions"
3. Скопируйте токен (он понадобится для GitHub Secrets)

### 1.3 Получение Project ID и Organization ID

1. В Vercel Dashboard откройте ваш проект
2. Перейдите в Settings > General
3. Найдите:
   - **Project ID** (в разделе Project Details)
   - **Organization ID** (в разделе Team/Organization)

## 🔐 Шаг 2: Настройка GitHub Secrets

Добавьте следующие секреты в ваш GitHub репозиторий:

**Settings > Secrets and variables > Actions > New repository secret**

| Secret Name | Описание | Пример значения |
|------------|----------|-----------------|
| `VERCEL_TOKEN` | Personal Access Token из Vercel | `vercel_xxxxx...` |
| `VERCEL_ORG_ID` | Organization ID из Vercel | `team_xxxxx` |
| `VERCEL_PROJECT_ID` | Project ID из Vercel | `prj_xxxxx` |
| `VITE_API_URL` | URL вашего backend API | `https://your-app.railway.app` |
| `VITE_WS_URL` | URL для WebSocket соединений | `https://your-app.railway.app` |

### Как добавить секреты:

1. Перейдите в ваш GitHub репозиторий
2. Settings > Secrets and variables > Actions
3. Нажмите "New repository secret"
4. Введите имя и значение
5. Нажмите "Add secret"

## 🌐 Шаг 3: Настройка переменных окружения в Vercel

В Vercel Dashboard добавьте переменные окружения:

1. Откройте ваш проект в Vercel
2. Перейдите в Settings > Environment Variables
3. Добавьте следующие переменные:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | URL вашего backend | Production, Preview, Development |
| `VITE_WS_URL` | URL для WebSocket | Production, Preview, Development |

**Пример значений:**
- `VITE_API_URL`: `https://stogram-backend.railway.app`
- `VITE_WS_URL`: `https://stogram-backend.railway.app`

## 🔄 Шаг 4: Настройка CORS в Backend

Убедитесь, что ваш backend разрешает запросы с Vercel домена.

Обновите `server/src/index.ts`:

```typescript
const corsOptions = {
  origin: [
    'https://your-app.vercel.app',        // Vercel production
    'https://*.vercel.app',               // Vercel preview deployments
    'http://localhost:5173',              // Local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

## 🚀 Шаг 5: Первый деплой

### Вариант A: Автоматический деплой через GitHub Actions

1. Убедитесь, что все секреты добавлены в GitHub
2. Сделайте push в ветку `main`:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```
3. GitHub Actions автоматически запустит workflow `vercel-deploy.yml`
4. Проверьте статус в GitHub Actions tab

### Вариант B: Ручной деплой через Vercel CLI

1. Установите Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Войдите в Vercel:
   ```bash
   vercel login
   ```

3. Инициализируйте проект:
   ```bash
   vercel
   ```

4. Следуйте инструкциям в CLI

5. Деплой в production:
   ```bash
   vercel --prod
   ```

## 📁 Структура файлов

Созданные файлы для деплоя:

- `.github/workflows/build.yml` - Workflow для сборки приложения
- `.github/workflows/vercel-deploy.yml` - Workflow для автоматического деплоя на Vercel
- `vercel.json` - Конфигурация Vercel
- `.vercelignore` - Исключения для Vercel (не деплоить server, mobile и т.д.)

## 🔍 Проверка деплоя

После успешного деплоя:

1. Проверьте URL в Vercel Dashboard
2. Откройте приложение в браузере
3. Проверьте консоль браузера на ошибки
4. Убедитесь, что API запросы идут на правильный backend URL
5. Проверьте WebSocket соединение

## 🐛 Решение проблем

### Проблема: Build fails с ошибкой "Cannot find module"

**Решение**: Убедитесь, что `installCommand` в `vercel.json` правильно настроен:
```json
"installCommand": "cd client && npm ci"
```

### Проблема: API запросы идут на localhost

**Решение**: 
1. Проверьте, что переменные окружения `VITE_API_URL` и `VITE_WS_URL` установлены в Vercel
2. Убедитесь, что они также добавлены в GitHub Secrets для сборки

### Проблема: CORS ошибки

**Решение**: 
1. Добавьте ваш Vercel домен в `corsOptions.origin` в backend
2. Убедитесь, что `credentials: true` установлено

### Проблема: WebSocket не подключается

**Решение**:
1. Проверьте, что `VITE_WS_URL` указывает на ваш backend (Railway/Render)
2. Убедитесь, что backend поддерживает WebSocket соединения
3. Проверьте, что порт и протокол правильные (wss:// для HTTPS)

## 📊 Мониторинг

### GitHub Actions

Проверяйте статус деплоя в:
- GitHub > Actions tab
- Workflow runs для `vercel-deploy.yml`

### Vercel Dashboard

Мониторинг доступен в:
- Vercel Dashboard > Your Project > Deployments
- Analytics для production трафика
- Logs для отладки

## 🔄 Обновление деплоя

После каждого push в ветку `main`:
1. GitHub Actions автоматически соберет проект
2. Деплой на Vercel произойдет автоматически
3. Вы получите уведомление в Vercel Dashboard

## 📝 Дополнительные настройки

### Кастомный домен

1. В Vercel Dashboard перейдите в Settings > Domains
2. Добавьте ваш домен
3. Следуйте инструкциям по настройке DNS

### Preview Deployments

Vercel автоматически создает preview deployments для каждого PR:
- URL будет доступен в комментариях PR
- Используются те же переменные окружения, что и для production

### Environment Variables по окружениям

Вы можете настроить разные значения для:
- **Production**: основной домен
- **Preview**: PR и ветки
- **Development**: локальная разработка

## ✅ Чеклист настройки

- [ ] Создан проект в Vercel Dashboard
- [ ] Получены VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
- [ ] Добавлены все секреты в GitHub
- [ ] Настроены переменные окружения в Vercel
- [ ] Обновлен CORS в backend
- [ ] Выполнен первый деплой
- [ ] Проверена работа приложения
- [ ] Проверены API запросы и WebSocket соединение

## 🔗 Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Deployment Guide](../deployment/RAILWAY_DEPLOYMENT.md)

---

**Примечание**: Backend должен быть развернут на платформе, поддерживающей WebSocket (Railway, Render, DigitalOcean и т.д.), так как Vercel не поддерживает долгоживущие WebSocket соединения.
