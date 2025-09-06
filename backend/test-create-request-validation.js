const axios = require('axios');

async function testCreateRequestValidation() {
  console.log('🧪 Test Create Request Validation...\n');

  const baseURL = 'http://localhost:5002';
  
  // Test data - sử dụng container đã tồn tại
  const testData = {
    type: 'IMPORT',
    container_no: 'ISO 1234', // Container đã tồn tại
    eta: new Date().toISOString()
  };

  try {
    console.log('1. Test tạo request với container đã tồn tại:');
    console.log(`   Container: ${testData.container_no}`);
    console.log(`   Type: ${testData.type}`);
    
    const response = await axios.post(`${baseURL}/requests`, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Cần token thực tế
      }
    });
    
    console.log('   ❌ Không nên thành công!');
    console.log('   Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('   ✅ Validation hoạt động đúng!');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.log('   ❌ Network error:', error.message);
    }
  }

  // Test với container mới
  console.log('\n2. Test tạo request với container mới:');
  const newTestData = {
    type: 'IMPORT',
    container_no: 'NEW123456', // Container mới
    eta: new Date().toISOString()
  };

  try {
    console.log(`   Container: ${newTestData.container_no}`);
    
    const response = await axios.post(`${baseURL}/requests`, newTestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('   ✅ Request được tạo thành công!');
    console.log('   Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('   ❌ Lỗi không mong muốn:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.log('   ❌ Network error:', error.message);
    }
  }

  console.log('\n✅ Test hoàn thành!');
}

// Chạy test
testCreateRequestValidation();
