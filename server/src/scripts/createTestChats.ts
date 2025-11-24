import prisma from '../utils/prisma';

interface TestChat {
  name: string;
  type: 'PRIVATE' | 'GROUP' | 'CHANNEL';
  description?: string;
  participantUsernames: string[];
}

const testChats: TestChat[] = [
  {
    name: 'Development Team',
    type: 'GROUP',
    description: 'Main development team chat',
    participantUsernames: ['johndoe', 'janesmith', 'mikejohnson', 'chriswilson']
  },
  {
    name: 'Design Discussions',
    type: 'GROUP', 
    description: 'UI/UX design team discussions',
    participantUsernames: ['janesmith', 'sarahwilliams', 'lisamartinez', 'alextaylor']
  },
  {
    name: 'Project Management',
    type: 'GROUP',
    description: 'Project coordination and updates',
    participantUsernames: ['rachelanderson', 'davidbrown', 'emilydavis']
  },
  {
    name: 'Tech Talk',
    type: 'CHANNEL',
    description: 'General technology discussions',
    participantUsernames: ['johndoe', 'mikejohnson', 'davidbrown', 'chriswilson', 'alextaylor']
  }
];

async function createTestChats() {
  try {
    console.log('Creating test chats and relationships...');

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

    // Get all test users
    const users = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@test.com'
        }
      }
    });

    if (users.length === 0) {
      console.log('❌ No test users found. Please run "npm run create-test-users" first.');
      return;
    }

    console.log(`Found ${users.length} test users`);

    // Create private chats between some users
    const privateChats = [
      ['johndoe', 'janesmith'],
      ['mikejohnson', 'sarahwilliams'],
      ['davidbrown', 'emilydavis'],
      ['chriswilson', 'lisamartinez'],
      ['alextaylor', 'rachelanderson']
    ];

    for (const [username1, username2] of privateChats) {
      const user1 = users.find(u => u.username === username1);
      const user2 = users.find(u => u.username === username2);

      if (user1 && user2) {
        // Check if private chat already exists
        const existingChat = await prisma.chat.findFirst({
          where: {
            type: 'PRIVATE',
            members: {
              every: {
                userId: {
                  in: [user1.id, user2.id]
                }
              }
            }
          }
        });

        if (!existingChat) {
          const chat = await prisma.chat.create({
            data: {
              type: 'PRIVATE',
              members: {
                create: [
                  { userId: user1.id, role: 'MEMBER' },
                  { userId: user2.id, role: 'MEMBER' }
                ]
              }
            }
          });
          console.log(`✓ Created private chat between ${username1} and ${username2}`);
        } else {
          console.log(`Private chat between ${username1} and ${username2} already exists`);
        }
      }
    }

    // Create group chats
    for (const chatConfig of testChats) {
      const participants = users.filter(u => 
        chatConfig.participantUsernames.includes(u.username)
      );

      if (participants.length < 2) {
        console.log(`❌ Not enough participants for chat "${chatConfig.name}"`);
        continue;
      }

      // Check if chat already exists
      const existingChat = await prisma.chat.findFirst({
        where: {
          name: chatConfig.name,
          type: chatConfig.type
        }
      });

      if (!existingChat) {
        const chat = await prisma.chat.create({
          data: {
            name: chatConfig.name,
            type: chatConfig.type,
            description: chatConfig.description,
            members: {
              create: participants.map((user, index) => ({
                userId: user.id,
                role: index === 0 ? 'OWNER' : 'MEMBER'
              }))
            }
          }
        });
        console.log(`✓ Created ${chatConfig.type.toLowerCase()} chat: ${chatConfig.name}`);
      } else {
        console.log(`Chat "${chatConfig.name}" already exists`);
      }
    }

    // Create some contacts between users
    const contactPairs = [
      ['johndoe', 'mikejohnson'],
      ['janesmith', 'sarahwilliams'],
      ['davidbrown', 'chriswilson'],
      ['emilydavis', 'lisamartinez'],
      ['alextaylor', 'rachelanderson'],
      ['johndoe', 'janesmith'],
      ['mikejohnson', 'davidbrown']
    ];

    for (const [username1, username2] of contactPairs) {
      const user1 = users.find(u => u.username === username1);
      const user2 = users.find(u => u.username === username2);

      if (user1 && user2) {
        // Check if contact already exists
        const existingContact = await prisma.contact.findFirst({
          where: {
            userId: user1.id,
            contactId: user2.id
          }
        });

        if (!existingContact) {
          await prisma.contact.create({
            data: {
              userId: user1.id,
              contactId: user2.id
            }
          });
          console.log(`✓ ${username1} added ${username2} as contact`);
        }
      }
    }

    console.log('\n✅ Test chats and relationships created successfully!');

    // Display summary
    const totalChats = await prisma.chat.count();
    const totalContacts = await prisma.contact.count();
    
    console.log(`\nSummary:`);
    console.log(`- Total users: ${users.length}`);
    console.log(`- Total chats: ${totalChats}`);
    console.log(`- Total contacts: ${totalContacts}`);

  } catch (error) {
    console.error('Error creating test chats:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createTestChats();
}

export default createTestChats;