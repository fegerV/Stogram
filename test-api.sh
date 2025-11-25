#!/bin/bash

echo "🚀 Testing user login and settings API..."

# Test authentication
echo "🔐 Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"test@test.com","password":"password123"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed - no token received"
  exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:20}..."

# Test user data endpoint
echo "📋 Testing user data endpoint..."
USER_RESPONSE=$(curl -s -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer $TOKEN")

echo "User data: $USER_RESPONSE"

# Test privacy settings endpoint
echo "🔒 Testing privacy settings endpoint..."
PRIVACY_RESPONSE=$(curl -s -X GET http://localhost:3001/api/users/privacy \
  -H "Authorization: Bearer $TOKEN")

echo "Privacy settings: $PRIVACY_RESPONSE"

# Test updating privacy settings
echo "🔄 Testing privacy settings update..."
UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:3001/api/users/privacy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"showOnlineStatus": false, "showProfilePhoto": true, "showLastSeen": false}')

echo "Privacy update response: $UPDATE_RESPONSE"

# Test getting updated settings
echo "📋 Testing updated privacy settings..."
UPDATED_PRIVACY_RESPONSE=$(curl -s -X GET http://localhost:3001/api/users/privacy \
  -H "Authorization: Bearer $TOKEN")

echo "Updated privacy settings: $UPDATED_PRIVACY_RESPONSE"

echo "✅ API testing completed!"

# Now let's test the web interface manually
echo ""
echo "🌐 To test the web interface manually:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Login with:"
echo "   Email: test@test.com"
echo "   Password: password123"
echo "3. After login, check if you're redirected to the chat page"
echo "4. Click the menu button (☰) in the top-right corner"
echo "5. Click 'Settings' to open the settings modal"
echo "6. Test different settings tabs and privacy toggles"