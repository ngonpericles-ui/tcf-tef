const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test data
let testToken = null;
let userId = null;
let courseId = null;
let testId = null;
let postId = null;

const api = axios.create({
  baseURL: API_BASE,
  validateStatus: () => true // Don't throw on any status
});

// Add token to requests
api.interceptors.request.use(config => {
  if (testToken) {
    config.headers.Authorization = `Bearer ${testToken}`;
  }
  return config;
});

async function test(name, fn) {
  try {
    console.log(`\n📝 Testing: ${name}`);
    await fn();
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    console.error(`❌ ${name} - FAILED:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests\n');

  // 1. Test Health Check
  await test('Health Check', async () => {
    const res = await api.get('/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 2. Test Get Courses
  await test('GET /content-management/courses', async () => {
    const res = await api.get('/content-management/courses');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.success) throw new Error('Response not successful');
    if (!Array.isArray(res.data.data.content)) throw new Error('Content is not an array');
    if (res.data.data.content.length > 0) {
      courseId = res.data.data.content[0].id;
      console.log(`   Found ${res.data.data.content.length} courses`);
      console.log(`   Sample course has lessons_data: ${!!res.data.data.content[0].lessons_data}`);
    }
  });

  // 3. Test Get Tests
  await test('GET /content-management/tests', async () => {
    const res = await api.get('/content-management/tests');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.success) throw new Error('Response not successful');
    if (!Array.isArray(res.data.data.content)) throw new Error('Content is not an array');
    if (res.data.data.content.length > 0) {
      testId = res.data.data.content[0].id;
      console.log(`   Found ${res.data.data.content.length} tests`);
    }
  });

  // 4. Test Get Posts
  await test('GET /posts', async () => {
    const res = await api.get('/posts?page=1&limit=10');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.success) throw new Error('Response not successful');
    if (Array.isArray(res.data.data)) {
      console.log(`   Found ${res.data.data.length} posts`);
      if (res.data.data.length > 0) {
        postId = res.data.data[0].id;
        const post = res.data.data[0];
        console.log(`   Post has _count: ${!!post._count}`);
        console.log(`   Post _count.likes: ${post._count?.likes}`);
        console.log(`   Post _count.comments: ${post._count?.comments}`);
        console.log(`   Post _count.shares: ${post._count?.shares}`);
        console.log(`   Post viewCount: ${post.viewCount}`);
      }
    }
  });

  // 5. Test Get Favorites
  await test('GET /favorites', async () => {
    const res = await api.get('/favorites');
    if (res.status === 401) {
      console.log('   (Skipped - requires authentication)');
      return;
    }
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.success) throw new Error('Response not successful');
    console.log(`   Found ${res.data.data?.favorites?.length || 0} favorites`);
  });

  // 6. Test Check Favorite
  if (courseId) {
    await test('GET /favorites/check?contentId=X&contentType=COURSE', async () => {
      const res = await api.get(`/favorites/check?contentId=${courseId}&contentType=COURSE`);
      if (res.status === 401) {
        console.log('   (Skipped - requires authentication)');
        return;
      }
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.data.success) throw new Error('Response not successful');
      console.log(`   isFavorited: ${res.data.data?.isFavorited}`);
    });
  }

  // 7. Test Get Manager Content
  await test('GET /manager/content', async () => {
    const res = await api.get('/manager/content');
    if (res.status === 401) {
      console.log('   (Skipped - requires authentication)');
      return;
    }
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    console.log(`   Found ${Array.isArray(res.data.data) ? res.data.data.length : 0} manager content items`);
  });

  console.log('\n✨ All tests completed!\n');
}

runTests().catch(console.error);

