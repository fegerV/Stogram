# Test Data Setup

This directory contains scripts to help you set up test data for development and testing purposes.

## Available Scripts

### 1. Create Test Users
Creates 10 test users with predefined credentials and profiles.

**Command:**
```bash
npm run create-test-users
```

**Test Users Created:**
| Username | Email | Password | Display Name |
|----------|-------|----------|--------------|
| johndoe | john.doe@test.com | password123 | John Doe |
| janesmith | jane.smith@test.com | password123 | Jane Smith |
| mikejohnson | mike.johnson@test.com | password123 | Mike Johnson |
| sarahwilliams | sarah.williams@test.com | password123 | Sarah Williams |
| davidbrown | david.brown@test.com | password123 | David Brown |
| emilydavis | emily.davis@test.com | password123 | Emily Davis |
| chriswilson | chris.wilson@test.com | password123 | Chris Wilson |
| lisamartinez | lisa.martinez@test.com | password123 | Lisa Martinez |
| alextaylor | alex.taylor@test.com | password123 | Alex Taylor |
| rachelanderson | rachel.anderson@test.com | password123 | Rachel Anderson |

**Features:**
- All users have verified emails
- All users start with ONLINE status
- Each user has a unique avatar (generated using DiceBear API)
- Each user has a bio/profile description
- Passwords are hashed using the same bcrypt configuration as the main application

### 2. Create Test Chats
Creates test chats and relationships between the test users.

**Command:**
```bash
npm run create-test-chats
```

**Creates:**
- **Private Chats:** 5 private chats between pairs of users
- **Group Chats:** 3 group chats for different teams
- **Channel:** 1 public channel for tech discussions
- **Contacts:** 7 contact relationships between users

**Chat Structure:**
- Development Team (johndoe, janesmith, mikejohnson, chriswilson)
- Design Discussions (janesmith, sarahwilliams, lisamartinez, alextaylor)
- Project Management (rachelanderson, davidbrown, emilydavis)
- Tech Talk Channel (johndoe, mikejohnson, davidbrown, chriswilson, alextaylor)

### 3. List Test Users
Lists all test users currently in the database with their details and status.

**Command:**
```bash
npm run list-test-users
```

**Displays:**
- User table with username, email, display name, status, email verification, and creation date
- Login credentials reminder
- Summary statistics (total users, online users, etc.)
- Related data counts (chats, contacts)

### 4. Setup All Test Data
Runs both user and chat creation scripts in sequence.

**Command:**
```bash
npm run setup-test-data
```

## Usage Instructions

### Prerequisites
1. Make sure your database is running and accessible
2. Ensure your environment variables are properly configured (especially DATABASE_URL)
3. Run database migrations if needed: `npm run prisma:migrate`

### Quick Start (Recommended)
Use the interactive setup script:
```bash
./setup-test-data.sh
```
This script will:
- Check prerequisites and install dependencies if needed
- Test database connection
- Guide you through the setup options
- Provide helpful error messages and next steps

### Manual Setup
If you prefer to run scripts manually:

1. Navigate to the server directory: `cd server`
2. Install dependencies if you haven't: `npm install`
3. Run the desired script:
   ```bash
   # Create only users
   npm run create-test-users
   
   # Create only chats (requires users to exist first)
   npm run create-test-chats
   
   # Create both users and chats
   npm run setup-test-data
   ```

### Resetting Test Data
If you want to completely reset the test data:
1. Delete all test users from the database (users with @test.com email)
2. Run the setup script again

## Notes
- These scripts are designed for development and testing environments only
- Test users have simple passwords (password123) - never use these in production
- All test users have emailVerified set to true to skip email verification
- The scripts check for existing data and skip creation if duplicates are found
- Avatar URLs use DiceBear API which generates consistent avatars based on seeds

## Customization
You can modify the test data by editing the arrays in:
- `createTestUsers.ts` - for user data
- `createTestChats.ts` - for chat and relationship data

Make sure to follow the existing patterns and maintain data consistency when making changes.

## Troubleshooting

### Database Connection Issues
If you see database connection errors:
1. Ensure your PostgreSQL server is running
2. Check that your `.env` file exists with correct `DATABASE_URL`
3. Run database migrations: `npm run prisma:migrate`
4. Verify database exists and is accessible

### Common Issues
- **"No test users found"**: Run `npm run create-test-users` first
- **"Not enough participants"**: Check that usernames in `createTestChats.ts` match the users created
- **Permission errors**: Ensure your database user has CREATE, INSERT, SELECT permissions

### Environment Setup
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
# Edit .env with your database configuration
```