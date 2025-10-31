# 🔄 Migration Guide - Новые функции

Руководство по миграции базы данных для добавления новых функций в Stogram.

---

## 📋 Обзор изменений

### Новые таблицы:
1. **BlockedUser** - Блокировка пользователей
2. **ChatSettings** - Настройки чатов (мут, избранное, папки)
3. **Folder** - Папки для организации чатов
4. **PinnedMessage** - Закрепленные сообщения

### Изменения в существующих таблицах:
1. **User**:
   - `showOnlineStatus` (Boolean) - показывать онлайн статус
   - `showProfilePhoto` (Boolean) - показывать фото профиля
   - `showLastSeen` (Boolean) - показывать время последнего посещения

2. **Chat**:
   - `isSecret` (Boolean) - секретный чат

3. **Message**:
   - `isSilent` (Boolean) - тихое сообщение
   - `mentions` (String[]) - список упоминаний
   - `hashtags` (String[]) - список хэштегов

---

## 🚀 Автоматическая миграция (Рекомендуется)

### Шаг 1: Создать миграцию

```bash
cd server
npx prisma migrate dev --name add-new-features
```

Эта команда:
- Создаст SQL файл миграции
- Применит изменения к базе данных
- Сгенерирует новый Prisma Client

### Шаг 2: Проверить миграцию

```bash
npx prisma migrate status
```

### Шаг 3: Сгенерировать клиент (если не сделано автоматически)

```bash
npx prisma generate
```

---

## 🔧 Ручная миграция (Production)

Если вы предпочитаете применить миграцию вручную:

### Шаг 1: Создать SQL без применения

```bash
npx prisma migrate dev --create-only --name add-new-features
```

### Шаг 2: Проверить SQL файл

Файл будет создан в: `server/prisma/migrations/YYYYMMDDHHMMSS_add-new-features/migration.sql`

### Шаг 3: Применить вручную

```bash
# Подключитесь к вашей БД и выполните SQL
psql -U your_user -d your_database -f server/prisma/migrations/.../migration.sql
```

### Шаг 4: Отметить миграцию как выполненную

```bash
npx prisma migrate resolve --applied add-new-features
```

---

## 📦 SQL для ручного применения

Если у вас проблемы с Prisma Migrate, используйте этот SQL:

```sql
-- Add privacy settings to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "showProfilePhoto" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "showLastSeen" BOOLEAN NOT NULL DEFAULT true;

-- Add secret flag to Chat table
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "isSecret" BOOLEAN NOT NULL DEFAULT false;

-- Add new fields to Message table
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "isSilent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "mentions" TEXT[] DEFAULT '{}';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "hashtags" TEXT[] DEFAULT '{}';

-- Create BlockedUser table
CREATE TABLE IF NOT EXISTS "BlockedUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("id")
);

-- Create ChatSettings table
CREATE TABLE IF NOT EXISTS "ChatSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "folderId" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastReadMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSettings_pkey" PRIMARY KEY ("id")
);

-- Create Folder table
CREATE TABLE IF NOT EXISTS "Folder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- Create PinnedMessage table
CREATE TABLE IF NOT EXISTS "PinnedMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "pinnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PinnedMessage_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_userId_blockedId_key" UNIQUE ("userId", "blockedId");
ALTER TABLE "ChatSettings" ADD CONSTRAINT "ChatSettings_userId_chatId_key" UNIQUE ("userId", "chatId");
ALTER TABLE "PinnedMessage" ADD CONSTRAINT "PinnedMessage_userId_messageId_chatId_key" UNIQUE ("userId", "messageId", "chatId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "BlockedUser_userId_idx" ON "BlockedUser"("userId");
CREATE INDEX IF NOT EXISTS "BlockedUser_blockedId_idx" ON "BlockedUser"("blockedId");

CREATE INDEX IF NOT EXISTS "ChatSettings_userId_idx" ON "ChatSettings"("userId");
CREATE INDEX IF NOT EXISTS "ChatSettings_chatId_idx" ON "ChatSettings"("chatId");
CREATE INDEX IF NOT EXISTS "ChatSettings_folderId_idx" ON "ChatSettings"("folderId");
CREATE INDEX IF NOT EXISTS "ChatSettings_isFavorite_idx" ON "ChatSettings"("isFavorite");

CREATE INDEX IF NOT EXISTS "Folder_userId_idx" ON "Folder"("userId");
CREATE INDEX IF NOT EXISTS "Folder_order_idx" ON "Folder"("order");

CREATE INDEX IF NOT EXISTS "PinnedMessage_userId_idx" ON "PinnedMessage"("userId");
CREATE INDEX IF NOT EXISTS "PinnedMessage_messageId_idx" ON "PinnedMessage"("messageId");
CREATE INDEX IF NOT EXISTS "PinnedMessage_chatId_idx" ON "PinnedMessage"("chatId");

CREATE INDEX IF NOT EXISTS "Message_mentions_idx" ON "Message"("mentions");
CREATE INDEX IF NOT EXISTS "Message_hashtags_idx" ON "Message"("hashtags");
CREATE INDEX IF NOT EXISTS "Chat_isSecret_idx" ON "Chat"("isSecret");

-- Add foreign key constraints
ALTER TABLE "BlockedUser" 
    ADD CONSTRAINT IF NOT EXISTS "BlockedUser_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlockedUser" 
    ADD CONSTRAINT IF NOT EXISTS "BlockedUser_blockedId_fkey" 
    FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatSettings" 
    ADD CONSTRAINT IF NOT EXISTS "ChatSettings_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatSettings" 
    ADD CONSTRAINT IF NOT EXISTS "ChatSettings_chatId_fkey" 
    FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatSettings" 
    ADD CONSTRAINT IF NOT EXISTS "ChatSettings_folderId_fkey" 
    FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Folder" 
    ADD CONSTRAINT IF NOT EXISTS "Folder_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PinnedMessage" 
    ADD CONSTRAINT IF NOT EXISTS "PinnedMessage_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PinnedMessage" 
    ADD CONSTRAINT IF NOT EXISTS "PinnedMessage_messageId_fkey" 
    FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PinnedMessage" 
    ADD CONSTRAINT IF NOT EXISTS "PinnedMessage_chatId_fkey" 
    FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## ✅ Проверка миграции

После применения миграции, проверьте:

### 1. Статус миграции
```bash
npx prisma migrate status
```

### 2. Проверка таблиц
```bash
npx prisma studio
```
Откроется веб-интерфейс для просмотра базы данных.

### 3. Проверка в psql
```sql
-- Проверить новые таблицы
\dt

-- Проверить структуру таблицы User
\d "User"

-- Проверить новые таблицы
SELECT * FROM "BlockedUser" LIMIT 1;
SELECT * FROM "ChatSettings" LIMIT 1;
SELECT * FROM "Folder" LIMIT 1;
SELECT * FROM "PinnedMessage" LIMIT 1;
```

---

## 🔄 Откат миграции (Rollback)

Если что-то пошло не так:

### Автоматический откат
```bash
# Откатить последнюю миграцию
npx prisma migrate resolve --rolled-back add-new-features

# Применить предыдущую версию
npx prisma migrate deploy
```

### Ручной откат
```sql
-- Удалить новые таблицы
DROP TABLE IF EXISTS "PinnedMessage" CASCADE;
DROP TABLE IF EXISTS "Folder" CASCADE;
DROP TABLE IF EXISTS "ChatSettings" CASCADE;
DROP TABLE IF EXISTS "BlockedUser" CASCADE;

-- Удалить новые колонки
ALTER TABLE "User" DROP COLUMN IF EXISTS "showOnlineStatus";
ALTER TABLE "User" DROP COLUMN IF EXISTS "showProfilePhoto";
ALTER TABLE "User" DROP COLUMN IF EXISTS "showLastSeen";

ALTER TABLE "Chat" DROP COLUMN IF EXISTS "isSecret";

ALTER TABLE "Message" DROP COLUMN IF EXISTS "isSilent";
ALTER TABLE "Message" DROP COLUMN IF EXISTS "mentions";
ALTER TABLE "Message" DROP COLUMN IF EXISTS "hashtags";
```

---

## 📊 Production Migration

### Подготовка

1. **Создать резервную копию БД**
```bash
pg_dump -U postgres -d stogram_db > backup_before_migration.sql
```

2. **Протестировать на staging**
```bash
# На staging окружении
npx prisma migrate deploy
```

3. **Проверить работу приложения**

### Применение на Production

```bash
# 1. Остановить приложение (опционально)
pm2 stop stogram

# 2. Применить миграцию
cd server
npx prisma migrate deploy

# 3. Проверить статус
npx prisma migrate status

# 4. Запустить приложение
pm2 start stogram
```

---

## 🐛 Troubleshooting

### Проблема: "Migration already exists"
```bash
npx prisma migrate resolve --applied migration_name
```

### Проблема: "Database is out of sync"
```bash
npx prisma migrate reset  # ВНИМАНИЕ: Удалит все данные!
# Или
npx prisma db push  # Синхронизировать без миграции
```

### Проблема: "Foreign key constraint violation"
Убедитесь, что:
1. Все referenced таблицы существуют
2. Нет orphaned records
3. Constraint names уникальны

### Проблема: "Column already exists"
```sql
-- Проверить существование колонки перед добавлением
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true;
```

---

## 📝 После миграции

### 1. Обновить Prisma Client
```bash
npx prisma generate
```

### 2. Перезапустить приложение
```bash
npm run dev  # Development
# Или
pm2 restart stogram  # Production
```

### 3. Проверить логи
```bash
# Development
# Проверьте консоль

# Production
pm2 logs stogram
```

### 4. Тестирование
- Попробуйте создать папку
- Заблокируйте пользователя
- Отправьте сообщение с хэштегом
- Проверьте поиск

---

## ✅ Чеклист миграции

- [ ] Создана резервная копия БД
- [ ] Миграция протестирована на staging
- [ ] Prisma schema обновлена
- [ ] Миграция применена: `npx prisma migrate dev`
- [ ] Prisma Client сгенерирован: `npx prisma generate`
- [ ] Новые таблицы созданы
- [ ] Индексы созданы
- [ ] Foreign keys настроены
- [ ] Приложение перезапущено
- [ ] Функционал протестирован
- [ ] Логи проверены на ошибки

---

## 📞 Поддержка

Если возникли проблемы:

1. **Проверьте логи Prisma**
```bash
DEBUG="prisma:*" npx prisma migrate dev
```

2. **Проверьте документацию Prisma**
https://www.prisma.io/docs/concepts/components/prisma-migrate

3. **Свяжитесь с поддержкой**
- Email: support@stogram.com
- GitHub Issues

---

<div align="center">
  <p><strong>Удачи с миграцией! 🚀</strong></p>
</div>
