const axios = require('axios');

async function testLogin() {
  try {
    console.log('Попытка входа...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      login: 'alice@test.com',
      password: 'password123'
    }, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Успешный вход!');
      console.log('User:', response.data.user?.username);
    } else {
      console.log('❌ Ошибка входа');
    }
  } catch (error) {
    console.log('❌ Ошибка входа:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('Request error:', error.message);
      console.log('Server not responding?');
    } else {
      console.log('Error:', error.message);
    }
  }
}

testLogin();
