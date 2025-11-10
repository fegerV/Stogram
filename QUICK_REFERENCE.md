# 🚀 Быстрая справка - Stogram

**Версия:** 2.0.0 | **Последнее обновление:** 10 ноября 2024

---

## 📂 Структура проекта

```
stogram/
├── client/          PWA React приложение
├── server/          Express.js Backend
├── mobile/          React Native мобильное приложение
├── docs/            Документация
└── [конфиги]        ESLint, Prettier, Docker и т.д.
```

---

## 🏃 Быстрый старт

### 1. Установка зависимостей

```bash
npm run install:all
```

### 2. Локальная разработка

```bash
# Запустить все приложения одновременно
npm run dev

# Или отдельно:
npm run dev:client   # React (http://localhost:3000)
npm run dev:server   # Express (http://localhost:5000)
```

### 3. Сборка

```bash
npm run build
```

### 4. Production

```bash
npm start
```

---

## 📁 Основные директории

### `/client` - Web приложение

| Папка | Содержимое |
|-------|-----------|
| `src/components` | React компоненты UI |
| `src/pages` | Страницы приложения |
| `src/services` | API запросы |
| `src/store` | State management |
| `src/hooks` | Custom hooks |
| `src/types` | TypeScript типы |
| `src/utils` | Утилиты |

**Ключевые файлы:**
- `vite.config.ts` - Vite конфигурация
- `tailwind.config.js` - Tailwind CSS
- `tsconfig.json` - TypeScript

---

### `/server` - Backend

| Папка | Содержимое |
|-------|-----------|
| `src/controllers` | 18 контроллеров (бизнес-логика) |
| `src/routes` | 19 маршрутов API |
| `src/services` | 13 сервисов |
| `src/middleware` | 5 middleware |
| `src/socket` | WebSocket (Socket.IO) |
| `src/types` | TypeScript типы |
| `src/utils` | Утилиты |
| `prisma` | Database ORM |

**Ключевые файлы:**
- `index.ts` - Точка входа сервера
- `prisma/schema.prisma` - Database schema
- `jest.config.js` - Jest тесты

---

### `/mobile` - Мобильное приложение

| Папка | Содержимое |
|-------|-----------|
| `src/screens` | 6 экранов приложения |
| `src/components` | React Native компоненты |
| `src/navigation` | Навигация (React Navigation) |
| `src/services` | API, WebSocket |
| `src/store` | State management |

---

## 🔌 API маршруты

```
/api/auth          Аутентификация
/api/users         Пользователи
/api/chats         Чаты
/api/messages      Сообщения
/api/bot           Боты
/api/analytics     Аналитика
/api/security      Безопасность
/api/telegram      Telegram интеграция
/api/webhooks      Вебхуки
/api/n8n           n8n интеграция
```

**Пример:**
```bash
POST /api/auth/login
POST /api/messages
GET  /api/chats/:id
```

---

## 🗄️ Database

**Тип:** PostgreSQL + Prisma ORM

### Основные таблицы

```
users         - Пользователи
chats         - Чаты
messages      - Сообщения
reactions     - Реакции к сообщениям
bots          - Интегрированные боты
auditLogs     - Логи действий
```

### Prisma команды

```bash
# Создать миграцию
npx prisma migrate dev --name <name>

# Синхронизировать schema
npx prisma db push

# Открыть Prisma Studio
npx prisma studio

# Генерировать Prisma клиент
npx prisma generate
```

---

## 🔐 Аутентификация

### JWT Tokens

```
Header: Authorization: Bearer <token>
Token lifetime: 15 minutes
Refresh token: 7 days
```

### 2FA (Двухфакторная аутентификация)

```
1. Регистрация TOTP (Time-based OTP)
2. Получение backup кодов
3. Верификация кода при входе
```

### Пример login

```javascript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { ... }
}
```

---

## 📨 WebSocket Events

### Отправка с клиента

```javascript
socket.emit('message:send', {
  chatId: '123',
  content: 'Hello',
  encrypted: true
})

socket.emit('typing:start', { chatId: '123' })
socket.emit('user:status', { status: 'online' })
```

### Получение с сервера

```javascript
socket.on('message:new', (data) => {
  console.log('Новое сообщение:', data)
})

socket.on('user:online', (userId) => {
  console.log('Пользователь онлайн:', userId)
})
```

---

## 🧪 Тесты

### Запуск тестов

```bash
# Server (Jest)
cd server && npm test

# Client (Vitest)
cd client && npm test

# Все тесты
npm run test:all
```

### Структура тестов

```
server/src/__tests__/
├── auth.test.ts
├── auditLog.test.ts
├── ipRateLimit.test.ts
└── setup.ts

client/src/__tests__/
└── [component tests]
```

---

## 📦 Зависимости

### Основные

**Frontend:**
```json
"react": "18+",
"typescript": "5+",
"vite": "^5.0.0",
"tailwindcss": "^3.3.0"
```

**Backend:**
```json
"express": "^4.18.0",
"prisma": "^5.0.0",
"socket.io": "^4.6.0",
"typescript": "5+"
```

**Mobile:**
```json
"react-native": "latest",
"react-navigation": "^6.0.0",
"typescript": "5+"
```

---

## 🐳 Docker

### Развертывание

```bash
# Запустить контейнеры
docker-compose up -d

# Остановить
docker-compose down

# Собрать образы
docker-compose build

# Просмотр логов
docker-compose logs -f
```

### Сервисы

```
- Client: http://localhost:3000
- Server: http://localhost:5000
- Database: postgres://localhost:5432
```

---

## 🔧 Конфигурация

### Environment переменные

Скопировать `.env.example` в `.env`:

```bash
cp .env.example .env
```

**Server `.env` переменные:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
ENCRYPTION_KEY=your_encryption_key
TELEGRAM_BOT_TOKEN=your_telegram_token
```

**Client `.env` переменные:**
```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

---

## 📊 Полезные скрипты

```bash
# Разработка
npm run dev                    Запустить все
npm run dev:client            Запустить только клиент
npm run dev:server            Запустить только сервер

# Сборка
npm run build                  Собрать оба приложения

# Docker
npm run docker:up             Docker Compose up
npm run docker:down           Docker Compose down
npm run docker:build          Собрать Docker образы

# Запуск
npm start                      Production режим
```

---

## 📚 Документация

| Файл | Описание |
|------|---------|
| `README.md` | Главный README |
| `PROJECT_STRUCTURE.md` | Детальная структура |
| `ARCHITECTURE_OVERVIEW.md` | Архитектура |
| `PROJECT_INTEGRITY_CHECK.md` | Проверка целостности |
| `docs/development/` | Developer документация |
| `CONTRIBUTING.md` | Рекомендации разработки |

---

## 🎯 Типичные задачи

### Добавить новый endpoint

1. Создать route в `/server/src/routes/`
2. Создать controller в `/server/src/controllers/`
3. Создать service в `/server/src/services/`
4. Зарегистрировать route в `src/index.ts`

### Добавить компонент (Web)

1. Создать компонент в `/client/src/components/`
2. Добавить пропс и стили (Tailwind)
3. Экспортировать из index

### Добавить экран (Mobile)

1. Создать экран в `/mobile/src/screens/`
2. Добавить навигацию в `/mobile/src/navigation/`
3. Подключить к navigator

### Миграция базы данных

1. Отредактировать `prisma/schema.prisma`
2. Создать миграцию: `npx prisma migrate dev --name <name>`
3. Миграция применится автоматически

---

## 🐛 Отладка

### Server

```bash
# С debug логами
DEBUG=* npm run dev:server

# VSCode Debug (добавить в launch.json)
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/server/dist/index.js"
}
```

### Client

```bash
# Chrome DevTools
# F12 → Console для логов
# F12 → Network для API запросов
```

### Database

```bash
# Открыть Prisma Studio
npx prisma studio

# Просмотр БД в pgAdmin
# http://localhost:5050
```

---

## ⚙️ Git workflow

### Branching strategy

```
main (production)
└── develop (staging)
    └── feature/... (разработка)

```

### Типичный workflow

```bash
# Создать фичу
git checkout -b feature/awesome-feature

# Коммитить изменения
git add .
git commit -m "feat: awesome feature"

# Пуш в репозиторий
git push origin feature/awesome-feature

# Создать Pull Request на develop
# После review → merge в develop
# develop → merge в main для production
```

---

## 📞 Контакты и помощь

- **Documentation:** Смотри `/docs` папку
- **Issues:** GitHub Issues
- **Contributing:** Смотри `CONTRIBUTING.md`
- **Security:** Смотри `SECURITY.md`

---

## ✨ Полезные советы

### 1. Форматирование кода
```bash
npm run format  # Prettier
npm run lint    # ESLint
```

### 2. Проверка типов
```bash
npm run type-check
```

### 3. Очистка проекта
```bash
rm -rf node_modules package-lock.json
npm install
```

### 4. Обновление зависимостей
```bash
npm update
npm audit fix
```

---

## 🚀 Развертывание на Railway

1. **Создать аккаунт** на [Railway.app](https://railway.app)
2. **Подключить репозиторий**
3. **Запустить скрипт:**
   ```bash
   ./setup-railway.sh
   ```
4. **Развертывание** будет автоматическим

---

**Последнее обновление:** 10 ноября 2024  
**Версия:** 2.0.0

