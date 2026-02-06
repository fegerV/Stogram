/**
 * Run Prisma migrations with retry logic
 * This script handles advisory lock timeouts gracefully
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMigrations() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Migration attempt ${attempt}/${MAX_RETRIES}...`);
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
        env: process.env,
      });
      
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('No pending migrations')) {
        console.error(stderr);
      }
      
      console.log('✅ Migrations applied successfully');
      return;
    } catch (error: any) {
      const errorMessage = error.message || error.stderr || error.toString();
      
      // Check if it's an advisory lock timeout
      if (errorMessage.includes('advisory lock') || errorMessage.includes('P1002') || errorMessage.includes('timed out')) {
        if (attempt < MAX_RETRIES) {
          console.log(`⚠️ Advisory lock timeout, retrying in ${RETRY_DELAY / 1000}s...`);
          await sleep(RETRY_DELAY);
          continue;
        } else {
          console.error('❌ Failed to acquire advisory lock after', MAX_RETRIES, 'attempts');
          console.error('This usually means another migration is running. Continuing anyway...');
          // Don't exit - let the server start even if migrations fail
          // The migrations will be applied on the next deploy
          return;
        }
      } else if (errorMessage.includes('No pending migrations')) {
        // This is not an error - migrations are already applied
        console.log('✅ No pending migrations');
        return;
      } else {
        // Other errors - log but don't fail (migrations might already be applied)
        console.error('⚠️ Migration error:', errorMessage);
        console.log('Continuing with server start...');
        return;
      }
    }
  }
}

runMigrations().catch((error) => {
  console.error('Fatal error:', error);
  // Don't exit - let the server start
  process.exit(0);
});
