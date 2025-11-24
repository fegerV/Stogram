import prisma from '../utils/prisma';

interface UserInfo {
  id: string;
  username: string;
  email: string;
  displayName: string;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
  lastSeen: Date | null;
}

async function listTestUsers() {
  try {
    console.log('Fetching test users...\n');

    // Test database connection
    try {
      await prisma.$connect();
      console.log('✓ Database connection established');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      console.error('Please ensure:');
      console.error('1. Your database server is running');
      console.error('2. DATABASE_URL is correctly configured in .env file');
      console.error('3. Database migrations have been run (npm run prisma:migrate)');
      process.exit(1);
    }

    const users = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@test.com'
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastSeen: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (users.length === 0) {
      console.log('❌ No test users found.');
      console.log('Run "npm run create-test-users" to create test users.');
      return;
    }

    console.log(`Found ${users.length} test users:\n`);

    // Display users in a formatted table
    console.log('┌─────────────────────┬─────────────────────┬─────────────────┬──────────┬──────────────┬────────────────────────┐');
    console.log('│ Username            │ Email               │ Display Name    │ Status   │ Email Verif. │ Created At             │');
    console.log('├─────────────────────┼─────────────────────┼─────────────────┼──────────┼──────────────┼────────────────────────┤');

    users.forEach((user: UserInfo) => {
      const username = user.username.padEnd(19);
      const email = user.email.padEnd(19);
      const displayName = user.displayName.padEnd(15);
      const status = user.status.padEnd(8);
      const emailVerified = user.emailVerified ? '✓' : '✗'.padEnd(8);
      const createdAt = user.createdAt.toISOString().split('T')[0].padEnd(22);
      
      console.log(`│ ${username} │ ${email} │ ${displayName} │ ${status} │ ${emailVerified} │ ${createdAt} │`);
    });

    console.log('└─────────────────────┴─────────────────────┴─────────────────┴──────────┴──────────────┴────────────────────────┘');

    // Display login credentials
    console.log('\n📋 Login Credentials:');
    console.log('   Password for all users: password123\n');

    // Display summary statistics
    const onlineUsers = users.filter(u => u.status === 'ONLINE').length;
    const verifiedUsers = users.filter(u => u.emailVerified).length;
    
    console.log('📊 Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Online users: ${onlineUsers}`);
    console.log(`   Verified emails: ${verifiedUsers}`);
    console.log(`   Offline users: ${users.length - onlineUsers}`);

    // Check for chats
    const totalChats = await prisma.chat.count();
    const totalContacts = await prisma.contact.count();
    
    console.log(`\n💬 Related Data:`);
    console.log(`   Total chats: ${totalChats}`);
    console.log(`   Total contacts: ${totalContacts}`);

  } catch (error) {
    console.error('Error listing test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  listTestUsers();
}

export default listTestUsers;