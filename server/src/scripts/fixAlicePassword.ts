import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

async function fixAlicePassword() {
  try {
    await prisma.$connect();
    console.log('✓ Database connection established');

    const user = await prisma.user.findFirst({
      where: { email: 'alice@test.com' }
    });

    if (!user) {
      console.log('❌ User alice@test.com not found');
      return;
    }

    console.log(`✓ Found user: ${user.username} (${user.email})`);

    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log(`Current password valid: ${isValid}`);

    if (!isValid) {
      console.log('Updating password...');
      const hashed = await bcrypt.hash(testPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed }
      });
      console.log('✅ Password updated successfully!');
    } else {
      console.log('✅ Password is already correct');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAlicePassword();
