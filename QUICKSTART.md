# ⚡ Быстрый старт Stogram

Это руководство поможет вам быстро запустить Stogram на вашей локальной машине.

---

## 📋 Требования

Перед началом убедитесь, что у вас установлено:

- **Node.js** 18 или выше
- **npm** или **yarn**
- **PostgreSQL** 15 или выше
- **Docker и Docker Compose** (опционально, для контейнеризованного запуска)
- **Redis** (опционально, для кэширования)

---

## 🚀 Быстрая установка (5 минут)

### Вариант 1: Использование скрипта автоматической установки

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd stogram

# Запустите скрипт быстрого старта
chmod +x quick-start.sh
./quick-start.sh
```

Скрипт автоматически:
- Установит все зависимости
- Настроит переменные окружения
- Запустит Docker контейнеры для PostgreSQL и Redis
- Выполнит миграции базы данных
- Запустит приложение

### Вариант 2: Ручная установка

#### Шаг 1: Клонируйте репозиторий

```bash
git clone <repository-url>
cd stogram
```

#### Шаг 2: Установите зависимости

```bash
npm run install:all
```

Это установит зависимости для клиента и сервера.

#### Шаг 3: Настройте переменные окружения

**Сервер:**
```bash
cd server
cp .env.example .env
nano .env  # или используйте ваш любимый редактор
```

Минимальная конфигурация `.env`:
```env
# База данных
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stogram"

# JWT секрет (генерируйте безопасный ключ)
JWT_SECRET="your-very-secure-secret-key-change-this"

# Порт сервера
PORT=3001

# URL клиента (для CORS)
CLIENT_URL="http://localhost:5173"

# Опционально: Redis
REDIS_URL="redis://localhost:6379"
```

**Клиент:**
```bash
cd ../client
cp .env.example .env
nano .env
```

Конфигурация `.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

#### Шаг 4: Запустите базу данных

**С Docker:**
```bash
cd ..
docker-compose up -d postgres redis
```

**Без Docker:** Убедитесь, что PostgreSQL запущен и создайте базу данных:
```bash
createdb stogram
```

#### Шаг 5: Выполните миграции базы данных

```bash
cd server
npx prisma migrate dev
npx prisma generate
cd ..
```

#### Шаг 6: Запустите приложение

```bash
npm run dev
```

Приложение запустится на:
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:3001
- 📡 WebSocket: ws://localhost:3001

---

## 🐳 Быстрый запуск с Docker

Самый простой способ запустить Stogram - использовать Docker Compose.

### Шаг 1: Настройте переменные окружения

```bash
cp .env.example .env
nano .env  # настройте если нужно
```

### Шаг 2: Запустите все сервисы

```bash
docker-compose up -d --build
```

Это запустит:
- PostgreSQL базу данных
- Redis для кэширования
- Backend сервер
- Frontend приложение
- Nginx обратный прокси

### Шаг 3: Выполните миграции

```bash
docker-compose exec server npx prisma migrate deploy
```

### Шаг 4: Откройте приложение

Перейдите в браузере на http://localhost

---

## 🧪 Проверка установки

Используйте скрипт проверки для диагностики:

```bash
chmod +x verify-setup.sh
./verify-setup.sh
```

Скрипт проверит:
- ✅ Установку Node.js и npm
- ✅ Подключение к PostgreSQL
- ✅ Подключение к Redis (если настроен)
- ✅ Наличие необходимых файлов
- ✅ Правильность переменных окружения

---

## 👤 Создание первого пользователя

После запуска приложения:

1. Откройте http://localhost:5173
2. Нажмите "Регистрация"
3. Заполните форму:
   - Email: your-email@example.com
   - Имя пользователя: yourusername
   - Пароль: (минимум 6 символов)
4. Нажмите "Зарегистрироваться"

Вы автоматически войдете в систему!

---

## 📱 Основные функции для тестирования

### 1. Создайте чат

- Нажмите кнопку "+" в списке чатов
- Выберите тип чата (приватный, группа, канал)
- Добавьте участников
- Начните общение!

### 2. Отправьте сообщение

- Откройте чат
- Введите текст в поле ввода
- Нажмите Enter или кнопку отправки
- Попробуйте упоминания (@username) и хэштеги (#tag)

### 3. Попробуйте медиа

- Нажмите на кнопку скрепки
- Загрузите изображение, видео или файл
- Запишите голосовое сообщение

### 4. Создайте бота

- Откройте Настройки → Боты
- Нажмите "Создать бота"
- Заполните информацию
- Скопируйте токен для использования Bot API

### 5. Настройте вебхук

- В настройках бота выберите "Вебхуки"
- Добавьте URL вашего сервера
- Выберите события для подписки
- Сохраните

---

## 🔧 Полезные команды

### Разработка

```bash
# Запустить dev серверы
npm run dev

# Запустить только клиент
npm run dev:client

# Запустить только сервер
npm run dev:server
```

### База данных

```bash
# Создать миграцию
cd server && npx prisma migrate dev --name your_migration_name

# Применить миграции в продакшн
cd server && npx prisma migrate deploy

# Сгенерировать Prisma Client
cd server && npx prisma generate

# Открыть Prisma Studio (GUI для БД)
cd server && npx prisma studio

# Сбросить базу данных (ОСТОРОЖНО!)
cd server && npx prisma migrate reset
```

### Docker

```bash
# Запустить все контейнеры
docker-compose up -d

# Остановить контейнеры
docker-compose down

# Просмотр логов
docker-compose logs -f

# Пересобрать контейнеры
docker-compose up -d --build

# Удалить все (включая volumes)
docker-compose down -v
```

### Продакшн сборка

```bash
# Собрать клиент
npm run build

# Запустить сервер
npm start
```

---

## 🐛 Решение проблем

### Проблема: "Port 5173 already in use"

```bash
# Найти процесс использующий порт
lsof -i :5173

# Убить процесс
kill -9 <PID>
```

### Проблема: "Cannot connect to database"

```bash
# Проверьте статус PostgreSQL
sudo systemctl status postgresql

# Или с Docker
docker-compose ps postgres

# Проверьте DATABASE_URL в .env
echo $DATABASE_URL
```

### Проблема: "Prisma Client error"

```bash
# Регенерируйте Prisma Client
cd server
npx prisma generate

# Если не помогло, удалите node_modules и переустановите
rm -rf node_modules
npm install
npx prisma generate
```

### Проблема: "CORS errors"

Убедитесь, что в `server/.env`:
```env
CLIENT_URL="http://localhost:5173"
```

И в `client/.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

---

## 📚 Следующие шаги

После успешного запуска:

1. 📖 Прочитайте [ДОКУМЕНТАЦИЯ.md](./ДОКУМЕНТАЦИЯ.md) для полной документации
2. 👥 Изучите [USER_GUIDE.md](./USER_GUIDE.md) для руководства пользователя
3. 🤝 Прочитайте [CONTRIBUTING.md](./CONTRIBUTING.md) если хотите участвовать в разработке
4. 🚀 Изучите [DEPLOYMENT.md](./DEPLOYMENT.md) для развертывания в продакшн
5. 🔒 Ознакомьтесь с [SECURITY.md](./SECURITY.md) для рекомендаций по безопасности

---

## 🆘 Получить помощь

Если возникли проблемы:

- 📧 Email: support@stogram.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/stogram/issues)
- 💬 Discord: [Сообщество Stogram](https://discord.gg/stogram)

---

## 🎉 Готово!

Теперь у вас запущен полнофункциональный мессенджер Stogram! 

Начните исследовать все функции:
- 💬 Обмен сообщениями
- 📞 Видео звонки
- 🤖 Боты
- 🎭 Стикеры
- 📁 Папки чатов
- И многое другое!

**Приятного использования!** 🚀
