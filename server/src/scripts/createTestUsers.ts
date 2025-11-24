import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

interface TestUser {
  email: string;
  username: string;
  password: string;
  displayName: string;
  bio?: string;
  avatar?: string;
}

const testUsers: TestUser[] = [
  {
    email: 'john.doe@test.com',
    username: 'johndoe',
    password: 'password123',
    displayName: 'John Doe',
    bio: 'Software developer and tech enthusiast',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
  },
  {
    email: 'jane.smith@test.com',
    username: 'janesmith',
    password: 'password123',
    displayName: 'Jane Smith',
    bio: 'Product designer passionate about UX',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane'
  },
  {
    email: 'mike.johnson@test.com',
    username: 'mikejohnson',
    password: 'password123',
    displayName: 'Mike Johnson',
    bio: 'Full-stack engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike'
  },
  {
    email: 'sarah.williams@test.com',
    username: 'sarahwilliams',
    password: 'password123',
    displayName: 'Sarah Williams',
    bio: 'Marketing specialist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'
  },
  {
    email: 'david.brown@test.com',
    username: 'davidbrown',
    password: 'password123',
    displayName: 'David Brown',
    bio: 'DevOps engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david'
  },
  {
    email: 'emily.davis@test.com',
    username: 'emilydavis',
    password: 'password123',
    displayName: 'Emily Davis',
    bio: 'Content creator and writer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily'
  },
  {
    email: 'chris.wilson@test.com',
    username: 'chriswilson',
    password: 'password123',
    displayName: 'Chris Wilson',
    bio: 'Mobile app developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chris'
  },
  {
    email: 'lisa.martinez@test.com',
    username: 'lisamartinez',
    password: 'password123',
    displayName: 'Lisa Martinez',
    bio: 'Data scientist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa'
  },
  {
    email: 'alex.taylor@test.com',
    username: 'alextaylor',
    password: 'password123',
    displayName: 'Alex Taylor',
    bio: 'UI/UX designer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex'
  },
  {
    email: 'rachel.anderson@test.com',
    username: 'rachelanderson',
    password: 'password123',
    displayName: 'Rachel Anderson',
    bio: 'Project manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rachel'
  }
];

async function createTestUsers() {
  try {
    console.log('Starting to create test users...');

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

    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');

    for (const user of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: user.email }, { username: user.username }],
        },
      });

      if (existingUser) {
        console.log(`User ${user.username} (${user.email}) already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, bcryptRounds);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email: user.email,
          username: user.username,
          password: hashedPassword,
          displayName: user.displayName,
          bio: user.bio,
          avatar: user.avatar,
          emailVerified: true, // Auto-verify test users
          status: 'ONLINE',
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatar: true,
          status: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      console.log(`✓ Created user: ${newUser.username} (${newUser.email})`);
    }

    console.log('\n✅ Test users creation completed!');
    
    // Display summary
    const totalUsers = await prisma.user.count();
    console.log(`\nTotal users in database: ${totalUsers}`);

    // Display created users summary
    console.log('\nTest users created:');
    for (const user of testUsers) {
      console.log(`  - ${user.username} | ${user.email} | Password: ${user.password}`);
    }

  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createTestUsers();
}

export default createTestUsers;