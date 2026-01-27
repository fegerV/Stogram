const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Проверка подключения к базе данных...\n');
    
    // Подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных успешно!');
    
    // Получаем список таблиц
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `;
    
    console.log(`\n📊 Найдено таблиц: ${tables.length}`);
    if (tables.length > 0) {
      console.log('Таблицы в базе данных:');
      tables.forEach(t => console.log(`  - ${t.name}`));
    }
    
    // Проверяем таблицу User
    try {
      const userCount = await prisma.user.count();
      console.log(`\n👤 Количество пользователей: ${userCount}`);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        console.log('\n⚠️ Таблица User еще не создана');
      } else {
        throw err;
      }
    }
    
    // Проверяем таблицу Chat
    try {
      const chatCount = await prisma.chat.count();
      console.log(`💬 Количество чатов: ${chatCount}`);
    } catch (err) {
      // Игнорируем если таблица не существует
    }
    
    // Проверяем таблицу Message
    try {
      const messageCount = await prisma.message.count();
      console.log(`📨 Количество сообщений: ${messageCount}`);
    } catch (err) {
      // Игнорируем если таблица не существует
    }
    
    console.log('\n✅ База данных работает корректно!');
    
  } catch (error) {
    console.error('\n❌ Ошибка при проверке базы данных:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
