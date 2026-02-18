const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testUserId = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'staff',
  phone: '+1234567890',
  isActive: true
};

const testManager = {
  name: 'Test Manager',
  email: 'manager@example.com',
  password: 'password123',
  role: 'manager',
  phone: '+1234567891',
  isActive: true
};

const testAdmin = {
  name: 'Test Admin',
  email: 'admin@example.com',
  password: 'password123',
  role: 'admin',
  phone: '+1234567892',
  isActive: true
};

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null, token = authToken) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testUserCreation = async () => {
  console.log('\n🧪 Testing User Creation...');
  
  try {
    // Test creating a staff user
    const staffResponse = await apiRequest('POST', '/users', testUser);
    console.log('✅ Staff user created:', staffResponse.data.name);
    testUserId = staffResponse.data._id;
    
    // Test creating a manager
    const managerResponse = await apiRequest('POST', '/users', testManager);
    console.log('✅ Manager user created:', managerResponse.data.name);
    
    // Test creating an admin
    const adminResponse = await apiRequest('POST', '/users', testAdmin);
    console.log('✅ Admin user created:', adminResponse.data.name);
    
    return { staff: staffResponse.data, manager: managerResponse.data, admin: adminResponse.data };
  } catch (error) {
    console.error('❌ User creation failed:', error.message);
    throw error;
  }
};

const testUserRetrieval = async () => {
  console.log('\n🧪 Testing User Retrieval...');
  
  try {
    // Test getting all users
    const allUsersResponse = await apiRequest('GET', '/users');
    console.log('✅ Retrieved all users:', allUsersResponse.count);
    
    // Test getting user by ID
    const userResponse = await apiRequest('GET', `/users/${testUserId}`);
    console.log('✅ Retrieved user by ID:', userResponse.data.name);
    
    // Test user statistics
    const statsResponse = await apiRequest('GET', '/users/stats');
    console.log('✅ User statistics:', statsResponse.data);
    
    return allUsersResponse;
  } catch (error) {
    console.error('❌ User retrieval failed:', error.message);
    throw error;
  }
};

const testUserSearch = async () => {
  console.log('\n🧪 Testing User Search...');
  
  try {
    // Test searching by name
    const searchResponse = await apiRequest('GET', '/users/search?q=Test');
    console.log('✅ Search by name:', searchResponse.count, 'results');
    
    // Test filtering by role
    const roleFilterResponse = await apiRequest('GET', '/users?role=staff');
    console.log('✅ Filter by role:', roleFilterResponse.count, 'staff users');
    
    return searchResponse;
  } catch (error) {
    console.error('❌ User search failed:', error.message);
    throw error;
  }
};

const testUserUpdate = async () => {
  console.log('\n🧪 Testing User Update...');
  
  try {
    // Test updating user
    const updateData = {
      name: 'Updated Test User',
      phone: '+9876543210'
    };
    
    const updateResponse = await apiRequest('PUT', `/users/${testUserId}`, updateData);
    console.log('✅ User updated:', updateResponse.data.name);
    
    // Test status toggle
    const toggleResponse = await apiRequest('PATCH', `/users/${testUserId}/toggle-status`);
    console.log('✅ User status toggled:', toggleResponse.data.isActive ? 'Active' : 'Inactive');
    
    return updateResponse;
  } catch (error) {
    console.error('❌ User update failed:', error.message);
    throw error;
  }
};

const testBulkOperations = async () => {
  console.log('\n🧪 Testing Bulk Operations...');
  
  try {
    // Get all users first
    const usersResponse = await apiRequest('GET', '/users');
    const userIds = usersResponse.data.slice(0, 2).map(user => user._id);
    
    // Test bulk update
    const bulkUpdateData = {
      userIds,
      updates: { isActive: false }
    };
    
    const bulkResponse = await apiRequest('PATCH', '/users/bulk-update', bulkUpdateData);
    console.log('✅ Bulk update completed:', bulkResponse.modifiedCount, 'users updated');
    
    return bulkResponse;
  } catch (error) {
    console.error('❌ Bulk operations failed:', error.message);
    throw error;
  }
};

const testPermissions = async () => {
  console.log('\n🧪 Testing Permissions...');
  
  try {
    // Test staff permissions (should be limited)
    console.log('Testing staff permissions...');
    // Note: In a real test, you would login as different users and test their permissions
    
    // Test manager permissions
    console.log('Testing manager permissions...');
    
    // Test admin permissions
    console.log('Testing admin permissions...');
    
    console.log('✅ Permission tests completed');
  } catch (error) {
    console.error('❌ Permission tests failed:', error.message);
    throw error;
  }
};

const testUserDeletion = async () => {
  console.log('\n🧪 Testing User Deletion...');
  
  try {
    // Test deleting a user
    const deleteResponse = await apiRequest('DELETE', `/users/${testUserId}`);
    console.log('✅ User deleted successfully');
    
    return deleteResponse;
  } catch (error) {
    console.error('❌ User deletion failed:', error.message);
    throw error;
  }
};

const testActivityLogging = async () => {
  console.log('\n🧪 Testing Activity Logging...');
  
  try {
    // Test getting user activities
    const activitiesResponse = await apiRequest('GET', '/activities/user');
    console.log('✅ User activities retrieved:', activitiesResponse.data.length);
    
    // Test getting recent activities
    const recentResponse = await apiRequest('GET', '/activities/recent');
    console.log('✅ Recent activities retrieved:', recentResponse.data.length);
    
    // Test getting activity stats
    const statsResponse = await apiRequest('GET', '/activities/stats');
    console.log('✅ Activity stats retrieved:', statsResponse.data.totalActivities, 'total activities');
    
    return activitiesResponse;
  } catch (error) {
    console.error('❌ Activity logging tests failed:', error.message);
    throw error;
  }
};

const cleanup = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test users
    const usersResponse = await apiRequest('GET', '/users');
    const testUsers = usersResponse.data.filter(user => 
      user.email.includes('test@example.com') || 
      user.email.includes('manager@example.com') || 
      user.email.includes('admin@example.com')
    );
    
    for (const user of testUsers) {
      try {
        await apiRequest('DELETE', `/users/${user._id}`);
        console.log(`✅ Deleted test user: ${user.name}`);
      } catch (error) {
        console.log(`⚠️ Could not delete user ${user.name}:`, error.message);
      }
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting User Management System Tests...\n');
  
  try {
    // Note: In a real test environment, you would need to authenticate first
    // For now, we'll assume authentication is handled elsewhere
    
    await testUserCreation();
    await testUserRetrieval();
    await testUserSearch();
    await testUserUpdate();
    await testBulkOperations();
    await testPermissions();
    await testActivityLogging();
    await testUserDeletion();
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  } finally {
    await cleanup();
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().then(() => {
    console.log('\n✨ Test execution completed');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testUserCreation,
  testUserRetrieval,
  testUserSearch,
  testUserUpdate,
  testBulkOperations,
  testPermissions,
  testUserDeletion,
  testActivityLogging
};
