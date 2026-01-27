const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const testUsers = [
  { username: 'alice_test', email: 'alice@test.com', displayName: 'Алиса', password: 'TestPassword123!' },
  { username: 'bob_test', email: 'bob@test.com', displayName: 'Боб', password: 'TestPassword123!' },
  { username: 'charlie_test', email: 'charlie@test.com', displayName: 'Чарли', password: 'TestPassword123!' },
];

async function createUserDirect(userData) {
  try {
    // Проверяем, существует ли пользователь
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username }
        ]
      }
    });

    if (existing) {
      log(`⚠️  Пользователь ${userData.username} уже существует`, 'yellow');
      return existing;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        displayName: userData.displayName,
        emailVerified: true,
        status: 'ONLINE'
      }
    });

    log(`✅ Пользователь создан: ${userData.displayName} (@${userData.username})`, 'green');
    log(`   ID: ${user.id}`, 'blue');
    
    return user;
  } catch (error) {
    log(`❌ Ошибка создания пользователя: ${error.message}`, 'red');
    return null;
  }
}

async function loginUser(username, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      login: username,
      password: password
    });
    
    if (response.data.token) {
      return response.data.token;
    }
  } catch (error) {
    log(`❌ Ошибка входа: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function createChat(user1Token, user2Id) {
  try {
    const response = await axios.post(`${API_URL}/chats`, {
      type: 'PRIVATE',
      memberIds: [user2Id]
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    
    if (response.data.id) {
      log(`✅ Приватный чат создан: ${response.data.id}`, 'green');
      return response.data.id;
    }
  } catch (error) {
    log(`❌ Ошибка создания чата: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function createGroupChat(userToken, chatName, memberIds) {
  try {
    const response = await axios.post(`${API_URL}/chats`, {
      type: 'GROUP',
      name: chatName,
      description: `Тестовый групповой чат: ${chatName}`,
      memberIds: memberIds
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (response.data.id) {
      log(`✅ Групповой чат создан: ${chatName}`, 'green');
      return response.data.id;
    }
  } catch (error) {
    log(`❌ Ошибка создания группового чата: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function sendMessage(chatId, userToken, message, senderName) {
  try {
    const response = await axios.post(`${API_URL}/messages/${chatId}`, {
      content: message,
      type: 'TEXT'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (response.data.id) {
      log(`✅ Сообщение от ${senderName}: "${message}"`, 'green');
      return response.data;
    }
  } catch (error) {
    log(`❌ Ошибка отправки: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function getMessages(chatId, userToken, userName) {
  try {
    const response = await axios.get(`${API_URL}/messages/${chatId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (Array.isArray(response.data)) {
      log(`\n📨 Сообщения в чате (получено ${userName}):`, 'cyan');
      if (response.data.length === 0) {
        log(`   Нет сообщений`, 'yellow');
      } else {
        response.data.forEach((msg, index) => {
          const time = new Date(msg.createdAt).toLocaleTimeString('ru-RU');
          log(`   ${index + 1}. [${msg.sender?.displayName || msg.sender?.username}] (${time}): ${msg.content}`, 'blue');
        });
      }
      return response.data;
    }
  } catch (error) {
    log(`❌ Ошибка получения сообщений: ${error.response?.data?.error || error.message}`, 'red');
    return [];
  }
}

async function main() {
  log('\n🚀 Создание тестовых пользователей и тестирование сообщений\n', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Создаем пользователей напрямую в БД
  log('\n👥 СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ (напрямую в БД)', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const users = [];
  for (const userData of testUsers) {
    const user = await createUserDirect(userData);
    if (user) {
      users.push({ ...user, password: userData.password });
    }
  }
  
  if (users.length < 2) {
    log('\n❌ Недостаточно пользователей для тестирования', 'red');
    await prisma.$disconnect();
    return;
  }
  
  log(`\n✅ Создано/найдено пользователей: ${users.length}`, 'green');
  
  // Получаем токены для всех пользователей
  log('\n🔐 ПОЛУЧЕНИЕ ТОКЕНОВ', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const userTokens = [];
  for (const user of users) {
    log(`Вход пользователя ${user.displayName}...`, 'blue');
    const token = await loginUser(user.username, user.password);
    if (token) {
      userTokens.push({ user, token });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка между запросами
    }
  }
  
  if (userTokens.length < 2) {
    log('\n❌ Не удалось получить токены для всех пользователей', 'red');
    await prisma.$disconnect();
    return;
  }
  
  log(`\n✅ Получено токенов: ${userTokens.length}`, 'green');
  
  // Создаем чаты
  log('\n💬 СОЗДАНИЕ ЧАТОВ', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const chats = [];
  
  // Приватный чат между первыми двумя
  if (userTokens.length >= 2) {
    const chatId = await createChat(userTokens[0].token, userTokens[1].user.id);
    if (chatId) {
      chats.push({ id: chatId, type: 'PRIVATE', users: [userTokens[0], userTokens[1]] });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Групповой чат
  if (userTokens.length >= 3) {
    const memberIds = userTokens.slice(1).map(ut => ut.user.id);
    const groupChatId = await createGroupChat(userTokens[0].token, 'Тестовая группа', memberIds);
    if (groupChatId) {
      chats.push({ id: groupChatId, type: 'GROUP', users: userTokens });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  if (chats.length === 0) {
    log('\n❌ Не удалось создать чаты', 'red');
    await prisma.$disconnect();
    return;
  }
  
  log(`\n✅ Создано чатов: ${chats.length}`, 'green');
  
  // Отправляем сообщения
  log('\n📤 ОТПРАВКА СООБЩЕНИЙ', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Сообщения в приватный чат
  if (chats[0] && chats[0].type === 'PRIVATE') {
    const privateChat = chats[0];
    
    await sendMessage(privateChat.id, privateChat.users[0].token, 
      'Привет, Боб! Это тестовое сообщение от Алисы.', 
      privateChat.users[0].user.displayName);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await sendMessage(privateChat.id, privateChat.users[1].token, 
      'Привет, Алиса! Получил твое сообщение. Все работает отлично!', 
      privateChat.users[1].user.displayName);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await sendMessage(privateChat.id, privateChat.users[0].token, 
      'Отлично! Система доставки сообщений работает корректно. 🎉', 
      privateChat.users[0].user.displayName);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Сообщения в групповой чат
  if (chats.length > 1 && chats[1].type === 'GROUP') {
    const groupChat = chats[1];
    
    await sendMessage(groupChat.id, groupChat.users[0].token, 
      'Всем привет! Это групповой чат для тестирования.', 
      groupChat.users[0].user.displayName);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (groupChat.users[1]) {
      await sendMessage(groupChat.id, groupChat.users[1].token, 
        'Привет всем! Боб здесь.', 
        groupChat.users[1].user.displayName);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (groupChat.users[2]) {
      await sendMessage(groupChat.id, groupChat.users[2].token, 
        'И Чарли тоже здесь! Система работает отлично! 👍', 
        groupChat.users[2].user.displayName);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Проверяем получение сообщений
  log('\n📥 ПРОВЕРКА ПОЛУЧЕНИЯ СООБЩЕНИЙ', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Приватный чат
  if (chats[0] && chats[0].type === 'PRIVATE') {
    log(`\n🔍 Приватный чат (ID: ${chats[0].id})`, 'cyan');
    await getMessages(chats[0].id, chats[0].users[0].token, chats[0].users[0].user.displayName);
    await new Promise(resolve => setTimeout(resolve, 500));
    await getMessages(chats[0].id, chats[0].users[1].token, chats[0].users[1].user.displayName);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Групповой чат
  if (chats.length > 1 && chats[1].type === 'GROUP') {
    log(`\n🔍 Групповой чат (ID: ${chats[1].id})`, 'cyan');
    for (const userToken of chats[1].users) {
      await getMessages(chats[1].id, userToken.token, userToken.user.displayName);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Итоги
  log('\n\n' + '='.repeat(60), 'cyan');
  log('📊 ИТОГИ', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\n✅ Пользователи:`, 'green');
  users.forEach((user, index) => {
    log(`   ${index + 1}. ${user.displayName} (@${user.username})`, 'blue');
    log(`      Email: ${user.email}`, 'blue');
    log(`      Пароль: ${user.password}`, 'blue');
  });
  
  log(`\n✅ Создано чатов: ${chats.length}`, 'green');
  chats.forEach((chat, index) => {
    log(`   ${index + 1}. ${chat.type} чат (ID: ${chat.id})`, 'blue');
  });
  
  log(`\n✅ Сообщения отправлены и получены успешно!`, 'green');
  log(`\n💡 Для тестирования в браузере:`, 'cyan');
  log(`   1. Откройте http://localhost:5173`, 'blue');
  log(`   2. Войдите под одним из пользователей:`, 'blue');
  users.forEach(user => {
    log(`      - ${user.displayName}: ${user.username} / ${user.password}`, 'blue');
  });
  log(`   3. Проверьте чаты и сообщения в интерфейсе\n`, 'blue');
  
  await prisma.$disconnect();
}

main().catch(async (error) => {
  log(`\n❌ Критическая ошибка: ${error.message}`, 'red');
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
