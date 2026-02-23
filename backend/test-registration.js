const axios = require('axios');

async function testRegistration() {
  try {
    console.log('🧪 Testing registration with different roles...');
    
    const testUsers = [
      { name: 'Test Admin', email: 'admin@test.com', password: 'password123', role: 'admin' },
      { name: 'Test Manager', email: 'manager@test.com', password: 'password123', role: 'manager' },
      { name: 'Test Staff', email: 'staff@test.com', password: 'password123', role: 'staff' }
    ];
    
    for (const user of testUsers) {
      try {
        console.log(`\n🔍 Testing registration for ${user.role}...`);
        console.log('Sending data:', JSON.stringify(user, null, 2));
        
        const response = await axios.post('http://localhost:5000/api/auth/register', user);
        console.log('✅ Registration successful!');
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.data && response.data.data.user) {
          console.log(`✅ User role in response: ${response.data.data.user.role}`);
        }
      } catch (error) {
        console.error(`❌ Registration failed for ${user.role}:`, error.response?.data || error.message);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRegistration();
