const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add response interceptor like the frontend does
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${error.response?.status}`);
    return Promise.reject(error);
  }
);

async function testAPI() {
  try {
    console.log('🔄 Testing API call from frontend perspective...');
    console.log('📍 API URL: http://localhost:3001/api/content-management/courses');
    
    const response = await apiClient.get('/content-management/courses');
    
    console.log('\n📡 Full Response Object:');
    console.log('  - Status:', response.status);
    console.log('  - Status Text:', response.statusText);
    console.log('  - Headers:', response.headers);
    console.log('  - Data type:', typeof response.data);
    console.log('  - Data keys:', Object.keys(response.data || {}));
    
    console.log('\n📊 Response Data:');
    console.log('  - success:', response.data.success);
    console.log('  - data:', response.data.data ? 'exists' : 'missing');
    console.log('  - data.content length:', response.data.data?.content?.length || 0);
    console.log('  - data.total:', response.data.data?.total);
    console.log('  - data.pages:', response.data.data?.pages);
    
    if (response.data.success && response.data.data?.content) {
      console.log(`\n✅ Got ${response.data.data.content.length} courses from API`);
      console.log('\n📚 First course:');
      console.log(JSON.stringify(response.data.data.content[0], null, 2));
    } else {
      console.log('\n❌ API response not successful or no content');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();

