# 🚀 Руководство по настройке Telegram интеграции

## Содержание

1. [Создание Telegram бота](#создание-telegram-бота)
2. [Настройка серверной части](#настройка-серверной-части)
3. [Настройка клиентской части](#настройка-клиентской-части)
4. [Использование интеграции](#использование-интеграции)
5. [Telegram Mini App](#telegram-mini-app)
6. [Troubleshooting](#troubleshooting)

---

## Создание Telegram бота

### Шаг 1: Создайте бота через BotFather

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям:
   - Введите название бота (например: "Stogram Bot")
   - Введите username бота (должен заканчиваться на "bot", например: "stogram_messenger_bot")
4. Сохраните полученный **Bot Token** - он понадобится для настройки

### Шаг 2: Настройте бота

```
/setdescription - Установите описание бота
/setabouttext - Установите текст "О боте"
/setuserpic - Загрузите аватар бота
/setcommands - Установите список команд
```

Рекомендуемые команды для бота:
```
start - Начать работу с ботом
status - Проверить статус аккаунта
notifications - Управление уведомлениями (on/off)
bridge - Информация о мостах для чатов
help - Показать справку
```

### Шаг 3: Настройте Telegram Login

1. В [@BotFather](https://t.me/BotFather) отправьте `/setdomain`
2. Выберите вашего бота
3. Введите домен вашего приложения (например: `yourdomain.com`)

### Шаг 4: (Опционально) Создайте Mini App

1. В [@BotFather](https://t.me/BotFather) отправьте `/newapp`
2. Выберите вашего бота
3. Введите название приложения
4. Введите описание
5. Загрузите иконку (640x360 px)
6. Загрузите GIF или фото
7. Введите URL вашего приложения (например: `https://yourdomain.com/telegram-mini-app`)

---

## Настройка серверной части

### Шаг 1: Установите зависимости

```bash
cd server
npm install node-telegram-bot-api @types/node-telegram-bot-api
```

### Шаг 2: Настройте переменные окружения

Отредактируйте файл `server/.env`:

```env
# Telegram Integration
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_FROM_BOTFATHER
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook
TELEGRAM_USE_WEBHOOK=false
ENABLE_TELEGRAM_LOGIN=true
ENABLE_TELEGRAM_NOTIFICATIONS=true
ENABLE_TELEGRAM_BRIDGE=true
```

**Важно:**
- Замените `YOUR_BOT_TOKEN_FROM_BOTFATHER` на токен, полученный от BotFather
- Замените `your_bot_username` на username вашего бота
- Для production используйте `TELEGRAM_USE_WEBHOOK=true` и настройте HTTPS

### Шаг 3: Примените миграции базы данных

```bash
cd server
npx prisma generate
npx prisma migrate dev --name add_telegram_integration
```

Или используйте push для быстрого обновления:

```bash
npx prisma db push
```

### Шаг 4: Запустите сервер

```bash
npm run dev
```

Проверьте логи - вы должны увидеть:
```
🚀 Stogram server running on port 3001
📡 WebSocket server ready
🤖 Telegram bot initialized
```

---

## Настройка клиентской части

### Шаг 1: Добавьте Telegram Web App SDK

Откройте `client/index.html` и добавьте в `<head>`:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### Шаг 2: Обновите роутинг

Добавьте маршруты для Telegram страниц в `client/src/App.tsx`:

```typescript
import { TelegramSettingsPage } from './pages/TelegramSettingsPage';
import { TelegramMiniApp } from './pages/TelegramMiniApp';

// В компоненте роутинга:
<Route path="/settings/telegram" element={<TelegramSettingsPage />} />
<Route path="/telegram-mini-app" element={<TelegramMiniApp />} />
```

### Шаг 3: Добавьте ссылку в настройки

В компоненте настроек добавьте ссылку на страницу Telegram:

```typescript
<Link to="/settings/telegram">
  <div className="flex items-center space-x-3 p-4 hover:bg-gray-100 rounded-lg">
    <span className="text-2xl">📱</span>
    <div>
      <h3 className="font-semibold">Telegram интеграция</h3>
      <p className="text-sm text-gray-600">
        Связать аккаунт и настроить уведомления
      </p>
    </div>
  </div>
</Link>
```

---

## Использование интеграции

### Для пользователей

#### 1. Связывание аккаунта Telegram

1. Откройте веб-приложение Stogram
2. Перейдите в Настройки → Telegram интеграция
3. Нажмите кнопку "Login with Telegram"
4. Авторизуйтесь в Telegram
5. Подтвердите доступ

#### 2. Настройка уведомлений

1. В настройках Telegram включите "Уведомления в Telegram"
2. Нажмите "Сохранить настройки"
3. Отправьте тестовое уведомление для проверки

#### 3. Использование бота

1. Найдите вашего бота в Telegram
2. Отправьте `/start` для начала работы
3. Используйте команды:
   - `/status` - проверить статус
   - `/notifications on` - включить уведомления
   - `/notifications off` - выключить уведомления
   - `/help` - показать справку

#### 4. Создание моста для чата

1. Откройте настройки Telegram в веб-приложении
2. В разделе "Мосты для чатов" создайте новый мост
3. Выберите чат Stogram для синхронизации
4. Добавьте бота в группу Telegram
5. Все сообщения будут автоматически синхронизироваться

### Для разработчиков

#### API примеры

**Получить настройки:**
```typescript
const settings = await fetch('/api/telegram/settings', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Связать аккаунт:**
```typescript
const result = await fetch('/api/telegram/link', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: telegramUserId,
    first_name: firstName,
    username: username,
    // ... другие данные от Telegram
  })
});
```

**Создать мост:**
```typescript
const bridge = await fetch('/api/telegram/bridge', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    stogramChatId: 'chat-uuid',
    telegramChatId: '-123456789',
    telegramChatType: 'group',
    syncDirection: 'BIDIRECTIONAL'
  })
});
```

---

## Telegram Mini App

### Настройка

1. Создайте Mini App через BotFather (см. выше)
2. Установите URL на `https://yourdomain.com/telegram-mini-app`
3. Приложение автоматически определит запуск из Telegram

### Особенности

- **Автоматическая авторизация** - пользователи авторизуются через Telegram
- **Нативная тема** - приложение адаптируется к теме Telegram
- **Main Button** - использование главной кнопки Telegram
- **HapticFeedback** - тактильная обратная связь
- **Popup и Alert** - нативные диалоги Telegram

### Открытие Mini App

Пользователи могут открыть Mini App:
1. Через меню бота
2. Через inline кнопку в сообщении
3. Через прямую ссылку: `https://t.me/your_bot/app`

---

## Troubleshooting

### Бот не отвечает на команды

**Проблема:** Бот создан, но не реагирует на команды

**Решения:**
1. Проверьте, что токен бота правильно указан в `.env`
2. Убедитесь, что сервер запущен
3. Проверьте логи сервера на наличие ошибок
4. Для webhook убедитесь, что SSL сертификат валиден

### Telegram Login не работает

**Проблема:** Кнопка Login не появляется или не работает

**Решения:**
1. Проверьте, что домен настроен в BotFather через `/setdomain`
2. Убедитесь, что скрипт `telegram-widget.js` загружается
3. Проверьте console браузера на ошибки
4. Убедитесь, что используется HTTPS (для production)

### Уведомления не приходят

**Проблема:** Уведомления не отправляются в Telegram

**Решения:**
1. Проверьте, что аккаунт связан (telegramId заполнен)
2. Убедитесь, что уведомления включены в настройках
3. Проверьте, что пользователь не онлайн (уведомления отправляются только офлайн пользователям)
4. Проверьте логи сервера на ошибки отправки

### Мост не синхронизирует сообщения

**Проблема:** Сообщения не синхронизируются между Telegram и Stogram

**Решения:**
1. Убедитесь, что мост активен (`isActive: true`)
2. Проверьте направление синхронизации (`syncDirection`)
3. Убедитесь, что бот добавлен в группу Telegram
4. Дайте боту права администратора в группе (для чтения сообщений)
5. Проверьте Privacy Mode бота в BotFather

### Mini App не открывается

**Проблема:** Mini App показывает ошибку при открытии

**Решения:**
1. Проверьте, что URL Mini App правильно настроен в BotFather
2. Убедитесь, что страница доступна по HTTPS
3. Проверьте, что скрипт `telegram-web-app.js` загружается
4. Проверьте валидацию initData на сервере

### Ошибка "Invalid authentication data"

**Проблема:** При авторизации через Telegram возникает ошибка

**Решения:**
1. Проверьте, что токен бота совпадает в `.env` и BotFather
2. Убедитесь, что данные не истекли (срок действия 24 часа)
3. Проверьте правильность реализации верификации hash
4. Убедитесь, что часы сервера синхронизированы

---

## Полезные ссылки

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram Web Apps Guide](https://core.telegram.org/bots/webapps)
- [Telegram Login Widget](https://core.telegram.org/widgets/login)
- [BotFather Commands](https://core.telegram.org/bots#botfather)
- [node-telegram-bot-api GitHub](https://github.com/yagop/node-telegram-bot-api)

---

## Поддержка

Если у вас возникли проблемы:

1. Проверьте логи сервера: `npm run dev` (в папке server)
2. Проверьте console браузера
3. Откройте issue на GitHub
4. Напишите на support@stogram.com

---

<div align="center">
  <p><strong>Telegram интеграция v2.0</strong></p>
  <p>Все фазы реализованы и протестированы ✅</p>
</div>
