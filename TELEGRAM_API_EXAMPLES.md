# 📚 Telegram Integration API - Примеры использования

## Содержание

1. [Базовая настройка](#базовая-настройка)
2. [Авторизация](#авторизация)
3. [Управление аккаунтом](#управление-аккаунтом)
4. [Уведомления](#уведомления)
5. [Мосты для чатов](#мосты-для-чатов)
6. [Mini App](#mini-app)
7. [Bot Commands](#bot-commands)

---

## Базовая настройка

### Backend (Node.js/Express)

```typescript
import express from 'express';
import telegramRoutes from './routes/telegram';

const app = express();

app.use('/api/telegram', telegramRoutes);
```

### Frontend (React)

```typescript
import { telegramService } from './services/telegramService';

// Использование в компонентах
const settings = await telegramService.getSettings();
```

---

## Авторизация

### 1. Telegram Login Widget

#### Frontend

```typescript
import React from 'react';
import { TelegramLoginButton } from './components/TelegramLoginButton';
import { telegramService } from './services/telegramService';

const LoginPage = () => {
  const handleTelegramAuth = async (user: any) => {
    try {
      const response = await telegramService.authWithTelegram(user);
      
      // Сохранить токен и перенаправить пользователя
      localStorage.setItem('token', response.token);
      window.location.href = '/';
    } catch (error) {
      console.error('Auth failed:', error);
    }
  };

  return (
    <div>
      <h1>Вход в Stogram</h1>
      
      {/* Обычная форма входа */}
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Пароль" />
      <button>Войти</button>
      
      {/* Telegram Login */}
      <div className="mt-4">
        <p>Или войдите через Telegram:</p>
        <TelegramLoginButton
          botUsername="your_bot_username"
          onAuth={handleTelegramAuth}
          buttonSize="large"
        />
      </div>
    </div>
  );
};
```

#### Backend - Верификация

```typescript
import crypto from 'crypto';

function verifyTelegramAuth(data: any): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  
  const secret = crypto
    .createHash('sha256')
    .update(botToken)
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

// Использование в контроллере
app.post('/api/telegram/auth', async (req, res) => {
  if (!verifyTelegramAuth(req.body)) {
    return res.status(400).json({ error: 'Invalid auth data' });
  }
  
  // Создать или найти пользователя
  const user = await findOrCreateUser(req.body);
  const token = generateJWT(user.id);
  
  res.json({ token, user });
});
```

### 2. Создание нового пользователя через Telegram

```typescript
async function findOrCreateUser(telegramData: any) {
  const { id, first_name, last_name, username, photo_url } = telegramData;
  
  // Найти существующего пользователя
  let user = await prisma.user.findFirst({
    where: { telegramId: id.toString() }
  });
  
  if (!user) {
    // Создать нового пользователя
    user = await prisma.user.create({
      data: {
        email: `telegram_${id}@stogram.local`,
        username: username || `tg_${id}`,
        password: '', // Пароль не требуется
        displayName: `${first_name}${last_name ? ` ${last_name}` : ''}`,
        avatar: photo_url,
        emailVerified: true,
        telegramId: id.toString(),
        telegramUsername: username,
        telegramFirstName: first_name,
        telegramLastName: last_name,
        telegramPhotoUrl: photo_url,
        telegramNotifications: true,
      }
    });
  }
  
  return user;
}
```

---

## Управление аккаунтом

### 1. Получить настройки интеграции

```typescript
// Frontend
const getSettings = async () => {
  const settings = await telegramService.getSettings();
  
  console.log('Linked:', settings.linked);
  console.log('Telegram ID:', settings.telegram?.id);
  console.log('Notifications:', settings.telegram?.notifications);
  console.log('Active bridges:', settings.telegram?.bridges.length);
};
```

```bash
# curl
curl -X GET http://localhost:3001/api/telegram/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ответ:**
```json
{
  "linked": true,
  "telegram": {
    "id": "123456789",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "photoUrl": "https://...",
    "notifications": true,
    "syncMessages": false,
    "syncProfile": true,
    "bridges": []
  },
  "botInfo": {
    "username": "stogram_bot",
    "isInitialized": true
  }
}
```

### 2. Связать существующий аккаунт Stogram с Telegram

```typescript
// Frontend
const linkAccount = async (authData: any) => {
  try {
    const result = await telegramService.linkAccount(authData);
    alert('Аккаунт успешно связан!');
  } catch (error) {
    alert('Не удалось связать аккаунт');
  }
};

// В компоненте
<TelegramLoginButton
  botUsername="your_bot_username"
  onAuth={linkAccount}
/>
```

```bash
# curl
curl -X POST http://localhost:3001/api/telegram/link \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123456789",
    "first_name": "John",
    "username": "john_doe",
    "auth_date": 1234567890,
    "hash": "..."
  }'
```

### 3. Отвязать Telegram аккаунт

```typescript
// Frontend
const unlinkAccount = async () => {
  if (!confirm('Вы уверены?')) return;
  
  await telegramService.unlinkAccount();
  alert('Аккаунт отвязан');
};
```

```bash
# curl
curl -X POST http://localhost:3001/api/telegram/unlink \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Обновить настройки

```typescript
// Frontend
const updateSettings = async () => {
  await telegramService.updateSettings({
    notifications: true,
    syncMessages: true,
    syncProfile: false
  });
};
```

```bash
# curl
curl -X PUT http://localhost:3001/api/telegram/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": true,
    "syncMessages": true,
    "syncProfile": false
  }'
```

---

## Уведомления

### 1. Автоматические уведомления о новых сообщениях

Реализовано в WebSocket handler:

```typescript
// server/src/socket/index.ts
socket.on('message:send', async (data) => {
  const message = await createMessage(data);
  
  // Отправить в WebSocket
  io.to(`chat:${chatId}`).emit('message:new', message);
  
  // Отправить Telegram уведомления офлайн пользователям
  const chatMembers = await getChatMembers(chatId);
  
  for (const member of chatMembers) {
    if (
      member.telegramId && 
      member.telegramNotifications &&
      !isUserOnline(member.id)
    ) {
      await telegramService.sendNotification(
        member.telegramId,
        `💬 Новое сообщение от ${message.sender.username}:\n\n${message.content}`
      );
    }
  }
});
```

### 2. Отправить тестовое уведомление

```typescript
// Frontend
const sendTestNotification = async () => {
  try {
    await telegramService.sendTestNotification();
    alert('Проверьте Telegram!');
  } catch (error) {
    alert('Не удалось отправить уведомление');
  }
};
```

```bash
# curl
curl -X POST http://localhost:3001/api/telegram/test-notification \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Отправить кастомное уведомление

```typescript
// Backend
import telegramService from '../services/telegramService';

async function sendCustomNotification(userId: string, message: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (user?.telegramId && user.telegramNotifications) {
    await telegramService.sendNotification(
      user.telegramId,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Открыть Stogram', url: 'https://yourdomain.com' }
          ]]
        }
      }
    );
  }
}
```

---

## Мосты для чатов

### 1. Создать мост для синхронизации чата

```typescript
// Frontend
const createBridge = async (stogramChatId: string) => {
  const bridge = await telegramService.createBridge({
    stogramChatId,
    telegramChatId: '-123456789', // ID группы Telegram
    telegramChatType: 'group',
    syncDirection: 'BIDIRECTIONAL'
  });
  
  console.log('Bridge created:', bridge);
};
```

```bash
# curl
curl -X POST http://localhost:3001/api/telegram/bridge \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stogramChatId": "chat-uuid",
    "telegramChatId": "-123456789",
    "telegramChatType": "group",
    "syncDirection": "BIDIRECTIONAL"
  }'
```

**Направления синхронизации:**
- `TELEGRAM_TO_STOGRAM` - только из Telegram в Stogram
- `STOGRAM_TO_TELEGRAM` - только из Stogram в Telegram
- `BIDIRECTIONAL` - двусторонняя синхронизация

### 2. Получить ID группы Telegram

```typescript
// В Telegram боте
bot.on('message', (msg) => {
  console.log('Chat ID:', msg.chat.id);
  console.log('Chat type:', msg.chat.type);
  
  // Для групп ID будет отрицательным: -123456789
});
```

### 3. Удалить мост

```typescript
// Frontend
const deleteBridge = async (bridgeId: string) => {
  await telegramService.deleteBridge(bridgeId);
  alert('Мост удален');
};
```

```bash
# curl
curl -X DELETE http://localhost:3001/api/telegram/bridge/BRIDGE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Переключить активность моста

```typescript
// Frontend
const toggleBridge = async (bridgeId: string, isActive: boolean) => {
  await telegramService.toggleBridge(bridgeId, isActive);
};
```

```bash
# curl
curl -X PATCH http://localhost:3001/api/telegram/bridge/BRIDGE_ID/toggle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### 5. Синхронизация сообщений

Автоматическая синхронизация реализована в:

```typescript
// Из Telegram в Stogram
bot.on('message', async (msg) => {
  const bridge = await findActiveBridge(msg.chat.id);
  
  if (bridge) {
    await telegramService.syncMessageToStogram(bridge, msg);
  }
});

// Из Stogram в Telegram
socket.on('message:send', async (data) => {
  const message = await createMessage(data);
  
  const bridges = await findActiveBridges(data.chatId);
  
  for (const bridge of bridges) {
    await telegramService.syncMessageToTelegram(bridge.id, message);
  }
});
```

---

## Mini App

### 1. Инициализация Mini App

```typescript
// Frontend - TelegramMiniApp.tsx
import React, { useEffect, useState } from 'react';

const TelegramMiniApp = () => {
  const [tg, setTg] = useState<any>(null);
  
  useEffect(() => {
    if (!window.Telegram?.WebApp) {
      alert('Откройте приложение из Telegram');
      return;
    }
    
    const telegram = window.Telegram.WebApp;
    setTg(telegram);
    
    // Инициализация
    telegram.ready();
    telegram.expand();
    
    // Установить цвета
    telegram.setHeaderColor('#1e40af');
    telegram.setBackgroundColor('#ffffff');
    
    // Показать главную кнопку
    telegram.MainButton.text = 'Открыть чат';
    telegram.MainButton.show();
    telegram.MainButton.onClick(() => {
      // Действие при нажатии
    });
    
    // Аутентификация
    authenticateUser(telegram);
  }, []);
  
  const authenticateUser = async (telegram: any) => {
    const initData = telegram.initData;
    const initDataUnsafe = telegram.initDataUnsafe;
    
    const response = await fetch('/api/telegram/mini-app/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, initDataUnsafe })
    });
    
    const data = await response.json();
    console.log('User authenticated:', data.user);
  };
  
  return (
    <div>
      <h1>Stogram Mini App</h1>
      {/* Ваш интерфейс */}
    </div>
  );
};
```

### 2. Использование Telegram UI элементов

```typescript
// Показать popup
tg.showPopup({
  title: 'Заголовок',
  message: 'Текст сообщения',
  buttons: [
    { id: 'ok', type: 'default', text: 'OK' },
    { id: 'cancel', type: 'cancel' }
  ]
}, (buttonId) => {
  console.log('Clicked:', buttonId);
});

// Показать alert
tg.showAlert('Это важное сообщение!');

// Показать confirm
tg.showConfirm('Вы уверены?', (confirmed) => {
  if (confirmed) {
    // Действие
  }
});

// Haptic feedback
tg.HapticFeedback.impactOccurred('medium');
tg.HapticFeedback.notificationOccurred('success');

// Открыть ссылку
tg.openLink('https://example.com');

// Отправить данные боту и закрыть приложение
tg.sendData(JSON.stringify({ action: 'something' }));
tg.close();
```

### 3. Backend валидация Mini App данных

```typescript
import crypto from 'crypto';

function validateMiniAppData(initData: string): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secret = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  const calculatedHash = crypto
    .createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');
  
  return hash === calculatedHash;
}
```

---

## Bot Commands

### 1. Обработка команд в боте

```typescript
// server/src/services/telegramService.ts

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, 'Добро пожаловать в Stogram Bot!');
});

// Команда с параметрами
bot.onText(/\/send (.+)/, async (msg, match) => {
  const text = match?.[1];
  // Отправить сообщение в Stogram
});

// Обработка callback buttons
bot.on('callback_query', async (query) => {
  const data = query.data;
  
  if (data === 'enable_notifications') {
    // Включить уведомления
    await bot.answerCallbackQuery(query.id, {
      text: 'Уведомления включены!'
    });
  }
});
```

### 2. Отправка интерактивных сообщений

```typescript
// С inline кнопками
await bot.sendMessage(chatId, 'Выберите действие:', {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '✅ Включить', callback_data: 'enable' },
        { text: '❌ Выключить', callback_data: 'disable' }
      ],
      [
        { text: '📊 Статистика', callback_data: 'stats' }
      ]
    ]
  }
});

// С кнопками клавиатуры
await bot.sendMessage(chatId, 'Главное меню:', {
  reply_markup: {
    keyboard: [
      ['📬 Мои сообщения', '👥 Контакты'],
      ['⚙️ Настройки']
    ],
    resize_keyboard: true
  }
});

// С Web App кнопкой
await bot.sendMessage(chatId, 'Открыть приложение:', {
  reply_markup: {
    inline_keyboard: [[
      {
        text: 'Открыть Stogram',
        web_app: { url: 'https://yourdomain.com/telegram-mini-app' }
      }
    ]]
  }
});
```

---

## Примеры интеграции в компоненты

### React Hook для Telegram интеграции

```typescript
// hooks/useTelegram.ts
import { useState, useEffect } from 'react';
import { telegramService } from '../services/telegramService';

export const useTelegram = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const data = await telegramService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const linkAccount = async (authData: any) => {
    await telegramService.linkAccount(authData);
    await loadSettings();
  };
  
  const unlinkAccount = async () => {
    await telegramService.unlinkAccount();
    await loadSettings();
  };
  
  return {
    settings,
    loading,
    linkAccount,
    unlinkAccount,
    reload: loadSettings
  };
};

// Использование в компоненте
const MyComponent = () => {
  const { settings, linkAccount } = useTelegram();
  
  return (
    <div>
      {settings?.linked ? (
        <p>Telegram подключен!</p>
      ) : (
        <TelegramLoginButton onAuth={linkAccount} />
      )}
    </div>
  );
};
```

---

<div align="center">
  <p><strong>Полная документация по Telegram Integration API</strong></p>
  <p>Для дополнительной информации см. TELEGRAM_SETUP_GUIDE.md</p>
</div>
