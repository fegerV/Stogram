# Руководство по использованию ботов в Stogram

## Содержание
1. [Введение](#введение)
2. [Создание бота](#создание-бота)
3. [Управление ботами](#управление-ботами)
4. [Bot API](#bot-api)
5. [Команды ботов](#команды-ботов)
6. [Вебхуки](#вебхуки)
7. [Примеры использования](#примеры-использования)

---

## Введение

Боты в Stogram позволяют автоматизировать взаимодействие с пользователями через API. Боты могут отправлять сообщения, обрабатывать команды и интегрироваться с внешними сервисами через вебхуки.

### Основные возможности:
- ✅ Создание и управление ботами через веб-интерфейс
- ✅ Отправка сообщений от имени бота
- ✅ Создание команд для ботов
- ✅ Вебхуки для интеграции с внешними сервисами
- ✅ Inline боты для быстрого доступа
- ✅ Безопасная аутентификация через токены

---

## Создание бота

### Через веб-интерфейс

1. Откройте **Настройки** → **Боты и интеграции**
2. Нажмите кнопку **"Создать бота"**
3. Заполните форму:
   - **Имя пользователя** (username) - уникальное имя бота (например: `mybot`)
   - **Отображаемое имя** (displayName) - имя, которое видят пользователи
   - **Описание** - описание функционала бота
   - **Inline бот** - включите, если бот должен работать как inline бот
4. Нажмите **"Создать"**

После создания бота вы получите **токен доступа**, который нужно сохранить в безопасном месте.

### Через API

```bash
POST /api/bots
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: application/json

{
  "username": "mybot",
  "displayName": "My Bot",
  "description": "Описание бота",
  "isInline": false
}
```

**Ответ:**
```json
{
  "id": "bot-uuid",
  "username": "mybot",
  "displayName": "My Bot",
  "description": "Описание бота",
  "token": "bot-token-here",
  "isActive": true,
  "isInline": false,
  "ownerId": "user-uuid",
  "createdAt": "2024-12-19T10:00:00Z"
}
```

⚠️ **Важно:** Сохраните токен сразу после создания! Он больше не будет показан.

---

## Управление ботами

### Получение списка ботов

```bash
GET /api/bots
Authorization: Bearer YOUR_USER_TOKEN
```

### Получение информации о боте

```bash
GET /api/bots/:botId
Authorization: Bearer YOUR_USER_TOKEN
```

### Обновление бота

```bash
PATCH /api/bots/:botId
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: application/json

{
  "displayName": "Новое имя",
  "description": "Новое описание",
  "isActive": true
}
```

### Регенерация токена

Если токен был скомпрометирован, его можно регенерировать:

```bash
POST /api/bots/:botId/regenerate-token
Authorization: Bearer YOUR_USER_TOKEN
```

**Ответ:**
```json
{
  "token": "новый-токен-здесь"
}
```

⚠️ **Внимание:** Старый токен перестанет работать сразу после регенерации!

### Удаление бота

```bash
DELETE /api/bots/:botId
Authorization: Bearer YOUR_USER_TOKEN
```

---

## Bot API

### Аутентификация

Все запросы к Bot API должны содержать токен бота в заголовке:

```
Authorization: Bearer BOT_TOKEN
```

или

```
token: BOT_TOKEN
```

### Отправка сообщений

Боты могут отправлять сообщения в чаты, где владелец бота является участником.

#### Текстовое сообщение

```bash
POST /api/bots/send-message
token: YOUR_BOT_TOKEN
Content-Type: application/json

{
  "chatId": "chat-uuid",
  "content": "Привет от бота!",
  "type": "TEXT"
}
```

#### Сообщение с файлом

```bash
POST /api/bots/send-message
token: YOUR_BOT_TOKEN
Content-Type: application/json

{
  "chatId": "chat-uuid",
  "content": "Вот изображение",
  "type": "IMAGE",
  "fileUrl": "/uploads/image.jpg",
  "fileName": "image.jpg",
  "fileSize": 102400
}
```

#### Типы сообщений

- `TEXT` - текстовое сообщение
- `IMAGE` - изображение
- `VIDEO` - видео
- `AUDIO` - аудио
- `FILE` - файл
- `VOICE` - голосовое сообщение
- `GIF` - GIF анимация

**Пример ответа:**
```json
{
  "id": "message-uuid",
  "content": "Привет от бота!",
  "type": "TEXT",
  "senderId": "owner-user-id",
  "chatId": "chat-uuid",
  "createdAt": "2024-12-19T10:00:00Z",
  "sender": {
    "id": "owner-user-id",
    "username": "owner",
    "displayName": "Owner",
    "avatar": null
  }
}
```

### Ограничения

- Бот может отправлять сообщения только в чаты, где владелец бота является участником
- Бот должен быть активен (`isActive: true`)
- Токен должен быть валидным

---

## Команды ботов

Команды позволяют пользователям взаимодействовать с ботом через специальные команды (например, `/start`, `/help`).

### Добавление команды

```bash
POST /api/bots/:botId/commands
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: application/json

{
  "command": "start",
  "description": "Начать работу с ботом"
}
```

Команда автоматически получит префикс `/`, если он не указан.

**Примеры команд:**
- `start` → `/start`
- `/help` → `/help`

### Удаление команды

```bash
DELETE /api/bots/commands/:commandId
Authorization: Bearer YOUR_USER_TOKEN
```

### Получение команд бота

Команды включены в ответ при получении информации о боте:

```bash
GET /api/bots/:botId
```

**Ответ включает:**
```json
{
  "id": "bot-uuid",
  "commands": [
    {
      "id": "command-uuid",
      "command": "/start",
      "description": "Начать работу с ботом"
    },
    {
      "id": "command-uuid-2",
      "command": "/help",
      "description": "Показать справку"
    }
  ]
}
```

---

## Вебхуки

Вебхуки позволяют боту получать уведомления о событиях из внешних сервисов.

### Настройка вебхука

Вебхуки настраиваются через обновление бота:

```bash
PATCH /api/bots/:botId
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: application/json

{
  "webhookUrl": "https://your-service.com/webhook"
}
```

### Получение вебхуков бота

```bash
GET /api/webhooks/bot/:botId
Authorization: Bearer YOUR_USER_TOKEN
```

---

## Примеры использования

### Пример 1: Простой эхо-бот

```javascript
const axios = require('axios');

const BOT_TOKEN = 'your-bot-token';
const API_URL = 'http://localhost:3001/api';

// Функция для отправки сообщения
async function sendMessage(chatId, text) {
  try {
    const response = await axios.post(
      `${API_URL}/bots/send-message`,
      {
        chatId,
        content: text,
        type: 'TEXT'
      },
      {
        headers: {
          token: BOT_TOKEN
        }
      }
    );
    console.log('Сообщение отправлено:', response.data);
  } catch (error) {
    console.error('Ошибка:', error.response?.data || error.message);
  }
}

// Использование
sendMessage('chat-uuid', 'Привет! Я эхо-бот.');
```

### Пример 2: Бот с командами

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const BOT_TOKEN = 'your-bot-token';
const API_URL = 'http://localhost:3001/api';

// Обработка команды /start
async function handleStartCommand(chatId) {
  await sendMessage(chatId, 'Добро пожаловать! Используйте /help для справки.');
}

// Обработка команды /help
async function handleHelpCommand(chatId) {
  const helpText = `
Доступные команды:
/start - Начать работу
/help - Показать справку
/time - Показать текущее время
  `;
  await sendMessage(chatId, helpText);
}

// Обработка команды /time
async function handleTimeCommand(chatId) {
  const now = new Date().toLocaleString('ru-RU');
  await sendMessage(chatId, `Текущее время: ${now}`);
}

// Вебхук для получения команд
app.post('/webhook', async (req, res) => {
  const { chatId, command, content } = req.body;
  
  switch (command) {
    case '/start':
      await handleStartCommand(chatId);
      break;
    case '/help':
      await handleHelpCommand(chatId);
      break;
    case '/time':
      await handleTimeCommand(chatId);
      break;
    default:
      await sendMessage(chatId, 'Неизвестная команда. Используйте /help для справки.');
  }
  
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Бот запущен на порту 3000');
});
```

### Пример 3: Бот с отправкой изображений

```javascript
async function sendImage(chatId, imageUrl, caption) {
  try {
    const response = await axios.post(
      `${API_URL}/bots/send-message`,
      {
        chatId,
        content: caption || '',
        type: 'IMAGE',
        fileUrl: imageUrl,
        fileName: 'image.jpg'
      },
      {
        headers: {
          token: BOT_TOKEN
        }
      }
    );
    console.log('Изображение отправлено:', response.data);
  } catch (error) {
    console.error('Ошибка:', error.response?.data || error.message);
  }
}

// Использование
sendImage('chat-uuid', '/uploads/photo.jpg', 'Вот красивое фото!');
```

### Пример 4: Интеграция с n8n

```javascript
// n8n workflow для обработки сообщений
// Webhook URL: https://your-n8n-instance.com/webhook/bot

// В n8n создайте workflow:
// 1. Webhook trigger
// 2. HTTP Request для отправки сообщения боту
// 3. Обработка логики
// 4. Отправка ответа через Bot API
```

---

## Безопасность

### Рекомендации:

1. **Храните токены в безопасности**
   - Никогда не коммитьте токены в Git
   - Используйте переменные окружения
   - Регенерируйте токены при подозрении на компрометацию

2. **Валидация входных данных**
   - Всегда проверяйте `chatId` перед отправкой сообщений
   - Валидируйте данные от пользователей

3. **Rate Limiting**
   - Соблюдайте ограничения API
   - Не отправляйте слишком много сообщений подряд

4. **Права доступа**
   - Бот может отправлять сообщения только в чаты владельца
   - Проверяйте права доступа перед операциями

---

## Ошибки и их решения

### Ошибка: "Bot token is required"
**Решение:** Убедитесь, что токен передается в заголовке `token` или `Authorization: Bearer TOKEN`

### Ошибка: "Invalid or inactive bot token"
**Решение:** 
- Проверьте правильность токена
- Убедитесь, что бот активен (`isActive: true`)

### Ошибка: "Chat not found or bot owner is not a member"
**Решение:** Владелец бота должен быть участником чата, в который бот пытается отправить сообщение

### Ошибка: "Bot with this username already exists"
**Решение:** Выберите другое имя пользователя для бота

---

## Дополнительные возможности

### Inline боты

Inline боты позволяют пользователям быстро получать результаты через специальный интерфейс. Для создания inline бота установите `isInline: true` при создании.

### Аналитика ботов

Используйте Analytics API для отслеживания активности ботов:

```bash
GET /api/analytics/bot/:botId
Authorization: Bearer YOUR_USER_TOKEN
```

### Расширенные функции

Для более сложных сценариев используйте Bot Enhanced API:

#### Inline клавиатуры

Создание inline клавиатуры для бота:

```bash
POST /api/bots-enhanced/:botId/keyboards
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: application/json

{
  "name": "main_menu",
  "buttons": [
    [
      { "text": "Кнопка 1", "callback_data": "button1" },
      { "text": "Кнопка 2", "callback_data": "button2" }
    ],
    [
      { "text": "Кнопка 3", "callback_data": "button3" }
    ]
  ]
}
```

Получение клавиатур бота:

```bash
GET /api/bots-enhanced/:botId/keyboards
Authorization: Bearer YOUR_USER_TOKEN
```

Отправка сообщения с клавиатурой:

```bash
POST /api/bots-enhanced/send-with-keyboard
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: application/json

{
  "chatId": "chat-uuid",
  "content": "Выберите действие:",
  "keyboardId": "keyboard-uuid"
}
```

#### Callback Queries

Обработка нажатий на кнопки inline клавиатуры:

```bash
POST /api/bots-enhanced/callback-query
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: application/json

{
  "botId": "bot-uuid",
  "messageId": "message-uuid",
  "callbackData": "button1"
}
```

Ответ на callback query:

```bash
POST /api/bots-enhanced/callback-query/:queryId/answer
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: application/json

{
  "text": "Действие выполнено!",
  "showAlert": false
}
```

#### Inline Queries

Обработка inline запросов (для inline ботов):

```bash
POST /api/bots-enhanced/inline-query
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: application/json

{
  "botId": "bot-uuid",
  "query": "поисковый запрос",
  "userId": "user-uuid"
}
```

Ответ на inline query:

```bash
POST /api/bots-enhanced/inline-query/:queryId/answer
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: application/json

{
  "results": [
    {
      "type": "article",
      "id": "1",
      "title": "Результат 1",
      "description": "Описание результата",
      "messageText": "Текст сообщения"
    }
  ]
}
```

Документация по расширенным функциям доступна в `server/src/controllers/botEnhancedController.ts`

---

## Полезные ссылки

- **Bot Manager UI:** Настройки → Боты и интеграции
- **API Endpoints:** `/api/bots/*`
- **Bot API:** `/api/bots/send-message`
- **Webhooks:** `/api/webhooks/bot/:botId`

---

## Заключение

Боты в Stogram предоставляют мощный инструмент для автоматизации и интеграции. Используйте их для создания умных помощников, автоматизации задач и интеграции с внешними сервисами.

Если у вас возникли вопросы или проблемы, проверьте логи сервера и убедитесь, что все токены и права доступа настроены правильно.
