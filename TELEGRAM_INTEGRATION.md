# 📱 Telegram Integration Guide

## Возможности интеграции с Telegram

Stogram может интегрироваться с Telegram несколькими способами для расширения функциональности и улучшения пользовательского опыта.

---

## 🔗 Типы интеграции

### 1. **Telegram Bot API** (Рекомендуется)

Создание бота для взаимодействия с пользователями Telegram напрямую из Stogram.

#### Возможности:
- **Уведомления**: Отправка уведомлений о новых сообщениях через Telegram бота
- **Мосты сообщений**: Пересылка сообщений между Telegram и Stogram
- **Команды**: Управление Stogram через команды бота
- **Синхронизация**: Синхронизация чатов между платформами
- **Бэкап**: Автоматическое резервное копирование чатов в Telegram

#### Реализация:
```typescript
// Пример интеграции с Telegram Bot API
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

// Отправка уведомления в Telegram
export async function sendTelegramNotification(
  telegramUserId: string,
  message: string
) {
  try {
    await bot.sendMessage(telegramUserId, message, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
}

// Получение обновлений из Telegram
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Пересылка сообщения в Stogram
  await forwardMessageToStogram(chatId, text);
});
```

#### Необходимые пакеты:
```bash
npm install node-telegram-bot-api
npm install --save-dev @types/node-telegram-bot-api
```

---

### 2. **Telegram Login Widget**

Позволяет пользователям входить в Stogram используя свой Telegram аккаунт.

#### Возможности:
- Быстрая авторизация через Telegram
- Получение базовой информации профиля
- Связывание Telegram аккаунта с Stogram

#### Реализация:
```html
<!-- Добавить на страницу входа -->
<script async src="https://telegram.org/js/telegram-widget.js?22"
  data-telegram-login="YOUR_BOT_USERNAME"
  data-size="large"
  data-auth-url="https://yourdomain.com/auth/telegram"
  data-request-access="write">
</script>
```

```typescript
// Backend обработка авторизации
app.post('/auth/telegram', async (req, res) => {
  const { id, first_name, username, photo_url, auth_date, hash } = req.body;
  
  // Верификация данных от Telegram
  if (verifyTelegramAuth(req.body)) {
    // Создать или найти пользователя
    const user = await findOrCreateUserByTelegram(id, {
      displayName: first_name,
      username,
      avatar: photo_url
    });
    
    // Выдать JWT токен
    const token = generateJWT(user.id);
    res.json({ token, user });
  }
});
```

---

### 3. **Telegram Mini Apps** (TWA - Telegram Web Apps)

Запуск Stogram как мини-приложения внутри Telegram.

#### Возможности:
- Полноценное приложение внутри Telegram
- Доступ к API Telegram
- Нативная интеграция с UI Telegram
- Встроенные платежи

#### Реализация:
```html
<!-- index.html -->
<script src="https://telegram.org/js/telegram-web-app.js"></script>

<script>
  // Инициализация Telegram Web App
  const tg = window.Telegram.WebApp;
  
  // Настройка темы
  tg.expand();
  tg.MainButton.text = "Отправить сообщение";
  tg.MainButton.show();
  
  // Обработка действий
  tg.MainButton.onClick(() => {
    tg.sendData(JSON.stringify({ action: 'send_message' }));
  });
</script>
```

---

### 4. **Telegram Channel/Group Bridge**

Мост между каналами/группами Telegram и Stogram.

#### Возможности:
- Синхронизация сообщений
- Репостинг контента
- Управление группами
- Модерация

#### Реализация:
```typescript
// Мост для синхронизации
class TelegramStogramBridge {
  async syncMessage(telegramMessage: any, stogramChatId: string) {
    // Конвертация формата сообщения
    const message = this.convertTelegramMessage(telegramMessage);
    
    // Отправка в Stogram
    await sendStogramMessage(stogramChatId, message);
  }
  
  async syncFromStogram(stogramMessage: any, telegramChatId: number) {
    // Конвертация и отправка в Telegram
    await bot.sendMessage(telegramChatId, stogramMessage.content);
  }
}
```

---

### 5. **Telegram Passport Integration**

Использование Telegram Passport для верификации пользователей.

#### Возможности:
- KYC верификация
- Проверка личности
- Безопасная передача документов

---

## 🛠 Архитектура интеграции

```
┌─────────────────────────────────────────────────────────┐
│                    Stogram Application                   │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │    Frontend   │  │    Backend    │  │   Database  │ │
│  │  React + TS   │  │  Node + TS    │  │ PostgreSQL  │ │
│  └───────┬───────┘  └───────┬───────┘  └──────────── │ │
│          │                   │                          │
└──────────┼───────────────────┼──────────────────────────┘
           │                   │
           │         ┌─────────┴─────────┐
           │         │ Telegram Bridge   │
           │         │    Service        │
           │         └─────────┬─────────┘
           │                   │
           │         ┌─────────┴─────────┐
           │         │  Telegram Bot API │
           └─────────┤   & Web App API   │
                     └───────────────────┘
                              │
                     ┌────────┴────────┐
                     │  Telegram Servers│
                     └─────────────────┘
```

---

## 📦 Необходимые компоненты

### 1. Создание Telegram бота

1. Открыть [@BotFather](https://t.me/BotFather) в Telegram
2. Отправить `/newbot`
3. Следовать инструкциям для создания бота
4. Получить Bot Token
5. Сохранить токен в `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username
```

### 2. Настройка Telegram Login

1. В [@BotFather](https://t.me/BotFather) отправить `/setdomain`
2. Указать домен вашего приложения
3. Настроить OAuth callback URL

### 3. Создание Mini App

1. В [@BotFather](https://t.me/BotFather) отправить `/newapp`
2. Указать URL вашего приложения
3. Настроить параметры приложения

---

## 🔐 Безопасность

### Верификация данных от Telegram

```typescript
import crypto from 'crypto';

function verifyTelegramAuth(data: any): boolean {
  const secret = crypto
    .createHash('sha256')
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest();
  
  const { hash, ...items } = data;
  const dataCheckString = Object.keys(items)
    .sort()
    .map(k => `${k}=${items[k]}`)
    .join('\n');
  
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');
  
  return hmac === hash;
}
```

---

## 🚀 Примеры использования

### 1. Уведомления через бота

```typescript
// При получении нового сообщения в Stogram
async function onNewMessage(message: Message) {
  const recipient = await getUserById(message.recipientId);
  
  if (recipient.telegramId && recipient.settings.telegramNotifications) {
    await sendTelegramNotification(
      recipient.telegramId,
      `💬 Новое сообщение от ${message.sender.username}:\n${message.content}`
    );
  }
}
```

### 2. Команды бота

```typescript
// Обработка команд в Telegram боте
bot.onText(/\/status/, async (msg) => {
  const telegramId = msg.from?.id.toString();
  const user = await findUserByTelegramId(telegramId);
  
  if (user) {
    const unreadCount = await getUnreadCount(user.id);
    bot.sendMessage(msg.chat.id, 
      `📊 У вас ${unreadCount} непрочитанных сообщений в Stogram`
    );
  }
});

bot.onText(/\/send (.+)/, async (msg, match) => {
  const message = match?.[1];
  // Отправить сообщение в Stogram
});
```

### 3. Синхронизация чатов

```typescript
// Двусторонняя синхронизация
class ChatSync {
  async syncTelegramToStogram(telegramMsg: any) {
    const stogramChat = await findLinkedChat(telegramMsg.chat.id);
    if (stogramChat) {
      await createStogramMessage({
        chatId: stogramChat.id,
        content: telegramMsg.text,
        externalId: telegramMsg.message_id
      });
    }
  }
  
  async syncStogramToTelegram(stogramMsg: Message) {
    const telegramChat = await findLinkedTelegramChat(stogramMsg.chatId);
    if (telegramChat) {
      await bot.sendMessage(telegramChat.telegramId, stogramMsg.content);
    }
  }
}
```

---

## 📊 Преимущества интеграции

1. **Увеличение охвата**: Доступ к миллионам пользователей Telegram
2. **Удобство**: Пользователи могут использовать привычный мессенджер
3. **Уведомления**: Надежная система push-уведомлений Telegram
4. **Кроссплатформенность**: Работа на всех устройствах где есть Telegram
5. **Быстрая авторизация**: Упрощенный вход через Telegram
6. **Платежи**: Встроенная система платежей Telegram

---

## 🔧 Настройка в Stogram

### Backend (.env)
```env
# Telegram Integration
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook
ENABLE_TELEGRAM_LOGIN=true
ENABLE_TELEGRAM_NOTIFICATIONS=true
ENABLE_TELEGRAM_BRIDGE=true
```

### Настройки пользователя
Добавить в профиль пользователя:
```typescript
interface UserSettings {
  telegram: {
    connected: boolean;
    telegramId?: string;
    username?: string;
    notifications: boolean;
    syncMessages: boolean;
  }
}
```

---

## 📱 Mobile Deep Links

Создание ссылок для открытия чатов из Telegram:

```typescript
// Генерация deep link
function generateStogramDeepLink(chatId: string): string {
  return `https://t.me/your_bot?start=chat_${chatId}`;
}

// Обработка deep link в боте
bot.onText(/\/start chat_(.+)/, async (msg, match) => {
  const chatId = match?.[1];
  const webAppUrl = `https://yourdomain.com/chat/${chatId}`;
  
  bot.sendMessage(msg.chat.id, 'Открыть чат в Stogram:', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Открыть чат', web_app: { url: webAppUrl } }
      ]]
    }
  });
});
```

---

## 🎯 Рекомендации

1. **Начните с Bot API** - самый простой способ интеграции
2. **Используйте Webhook** вместо polling для production
3. **Кэширование** - кэшируйте данные для уменьшения запросов
4. **Rate Limiting** - соблюдайте лимиты API Telegram
5. **Обработка ошибок** - graceful fallback при недоступности Telegram
6. **Логирование** - записывайте все взаимодействия для отладки
7. **Тестирование** - создайте тестового бота для разработки

---

## 📚 Полезные ссылки

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram Web Apps Guide](https://core.telegram.org/bots/webapps)
- [Telegram Login Widget](https://core.telegram.org/widgets/login)
- [Telegram Passport](https://core.telegram.org/passport)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)

---

## 🔄 Roadmap интеграции

### Фаза 1 (v1.1)
- ✅ Telegram Bot базовый функционал
- ✅ Уведомления через бота
- ✅ Команды управления

### Фаза 2 (v1.2)
- 🔲 Telegram Login Widget
- 🔲 Связывание аккаунтов
- 🔲 Синхронизация профиля

### Фаза 3 (v1.3)
- 🔲 Мост для чатов
- 🔲 Двусторонняя синхронизация
- 🔲 Групповые чаты

### Фаза 4 (v2.0)
- 🔲 Telegram Mini App
- 🔲 Встроенные платежи
- 🔲 Telegram Passport
- 🔲 Полная интеграция

---

## 💡 Примеры кода

Готовые модули интеграции доступны в:
- `/server/src/services/telegramService.ts`
- `/server/src/controllers/telegramController.ts`
- `/server/src/routes/telegram.ts`

---

<div align="center">
  <p>Для вопросов и поддержки: support@stogram.com</p>
</div>
