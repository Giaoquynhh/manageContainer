// Test script cho Gate API
const axios = require('axios');

const BASE_URL = 'http://localhost:3001'; // Thay đổi port nếu cần
const TEST_TOKEN = 'your-test-token-here'; // Thay bằng token thật

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testGateAPI() {
  console.log('🧪 Testing Gate API...\n');

  try {
    // Test 1: Search requests
    console.log('1️⃣ Testing GET /gate/requests/search...');
    const searchResponse = await api.get('/gate/requests/search?status=FORWARDED&limit=5');
    console.log('✅ Search Response:', searchResponse.data);
    console.log('');

    // Test 2: Get request details
    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      const firstRequest = searchResponse.data.data[0];
      console.log('2️⃣ Testing GET /gate/requests/:id...');
      const detailsResponse = await api.get(`/gate/requests/${firstRequest.id}`);
      console.log('✅ Details Response:', detailsResponse.data);
      console.log('');
    }

    // Test 3: Forward request (nếu có request SCHEDULED)
    console.log('3️⃣ Testing PATCH /gate/requests/:id/forward...');
    try {
      const forwardResponse = await api.patch('/gate/requests/test-id/forward', {});
      console.log('✅ Forward Response:', forwardResponse.data);
    } catch (error) {
      console.log('❌ Forward Error (expected):', error.response?.data?.message || error.message);
    }
    console.log('');

    console.log('🎉 Gate API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Chạy test
testGateAPI();
