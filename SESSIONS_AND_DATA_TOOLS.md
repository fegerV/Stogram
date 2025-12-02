# Sessions & Data Tools Implementation

This document describes the implementation of active session control and storage/export utilities for Stogram.

## Features Implemented

### 1. Database Schema

Added `UserSession` model to track user authentication sessions:
- `userId`: Reference to the user
- `refreshTokenHash`: SHA-256 hash of the refresh token
- `device`: Device type (extracted from User-Agent)
- `ipAddress`: IP address of the session
- `userAgent`: Full User-Agent string
- `lastActive`: Timestamp of last activity
- `createdAt`: Session creation timestamp

### 2. Authentication Updates

**Enhanced Auth Controller** (`server/src/controllers/authController.ts`):
- Issues refresh tokens on login and registration
- Stores hashed refresh tokens in `UserSession` table
- Provides token refresh endpoint (`POST /auth/refresh`)
- Logout endpoints:
  - `POST /auth/logout` - Revoke current session
  - `POST /auth/logout-all` - Revoke all sessions

**Enhanced Auth Middleware** (`server/src/middleware/auth.ts`):
- Updates `lastActive` timestamp on each authenticated request
- Tracks session activity automatically

### 3. Session Management

**Session Controller** (`server/src/controllers/sessionController.ts`):
- `GET /users/sessions` - List all active sessions for the current user
- `DELETE /users/sessions/:id` - Revoke a specific session
- `DELETE /users/sessions` - Revoke all sessions except current one

### 4. Storage & Export Tools

**Account Controller** (`server/src/controllers/accountController.ts`):

#### Storage Information
- `GET /users/storage` - Returns aggregate counts and estimated bytes:
  - Messages count and estimated size
  - Media files count and total size
  - Contacts count
  - Chats count
  - Cache entries count
  - Total estimated storage usage

#### Cache Management
- `POST /users/storage/clear-cache` - Clears:
  - Message cache entries for user's chats
  - Temporary uploaded files in user's temp directory

#### Data Export/Import
- `GET /users/export` - Downloads JSON snapshot containing:
  - User profile information
  - Contacts list
  - Chat memberships
  - Messages (limited to last 1000)
  - Folders
  - Chat settings
  
- `POST /users/import` - Imports data from JSON file:
  - Updates user profile settings
  - Restores folders
  - Restores chat settings
  - Schema validation before import

### 5. Frontend UI

**Updated UserSettings Component** (`client/src/components/UserSettings.tsx`):

#### Active Sessions Tab
- Displays list of all active sessions
- Shows device type, IP address, and last active time
- Marks current session with a badge
- Allows revoking individual sessions
- Option to "Log out from all other devices"

#### Data & Storage Tab
- Visual display of storage usage breakdown
- Statistics cards for messages, media, contacts, and chats
- Actions:
  - **Clear Cache** - Remove cached data with confirmation
  - **Export Data** - Download data as JSON file
  - **Import Data** - Upload and restore from JSON file
- Uses optimistic UI updates with toast notifications

## API Endpoints Summary

### Authentication
- `POST /auth/register` - Register new user (creates session)
- `POST /auth/login` - Login (creates session)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout from current session
- `POST /auth/logout-all` - Logout from all sessions

### Session Management
- `GET /users/sessions` - List sessions
- `DELETE /users/sessions/:id` - Revoke specific session
- `DELETE /users/sessions` - Revoke all other sessions

### Storage & Export
- `GET /users/storage` - Get storage information
- `POST /users/storage/clear-cache` - Clear cache
- `GET /users/export` - Export user data
- `POST /users/import` - Import user data

## Security Considerations

1. **Token Hashing**: Refresh tokens are hashed using SHA-256 before storage
2. **Session Tracking**: Each session is independently trackable and revocable
3. **Device Fingerprinting**: Basic device identification from User-Agent
4. **IP Logging**: IP addresses logged for security auditing
5. **Data Validation**: Import data validated with Zod schema

## Testing

To test the implementation:

1. **Session Management**:
   - Login from multiple devices/browsers
   - Check the "Active Sessions" tab in settings
   - Revoke a session and verify it's no longer valid
   - Test "logout all" functionality

2. **Storage Tools**:
   - View storage statistics
   - Clear cache and verify reduced usage
   - Export data and check JSON contents
   - Import data and verify settings are restored

3. **Token Refresh**:
   - Use refresh token to get new access token
   - Verify lastActive is updated

## Notes

- Refresh tokens are returned in login/register responses
- Frontend should store refresh token securely (HttpOnly cookies recommended for production)
- Storage estimates are approximate calculations
- Export is limited to last 1000 messages to prevent large downloads
- Import validates data structure before applying changes
