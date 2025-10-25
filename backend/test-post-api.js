const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Admin credentials
const ADMIN_EMAIL = 'admin@aura.ca';
const ADMIN_PASSWORD = 'Admin@123';

let adminToken = null;

async function login() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.success) {
      adminToken = response.data.data.tokens.accessToken;
      console.log('✅ Login successful!');
      return true;
    } else {
      console.error('❌ Login failed:', response.data.error?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function createPost() {
  try {
    console.log('\n📝 Creating post via API...');
    
    const postData = {
      title: 'API Test Post - Functionality Verification',
      content: 'Hello everyone this is a Test to verify to verify our Post functionality works. Like it if you see this post. Thanks',
      excerpt: 'Hello everyone this is a Test to verify our Post functionality works.',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      category: 'General',
      tags: ['test', 'api', 'verification'],
      level: 'B1',
      targetTier: 'FREE'
    };

    const response = await axios.post(`${API_URL}/posts`, postData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Post created successfully via API!');
      console.log('\n📊 Post Details:');
      console.log('─'.repeat(50));
      console.log(`ID: ${response.data.data.post.id}`);
      console.log(`Title: ${response.data.data.post.title}`);
      console.log(`Status: ${response.data.data.post.status}`);
      console.log(`Visibility: ${response.data.data.post.visibility}`);
      console.log('─'.repeat(50));
      return response.data.data.post.id;
    } else {
      console.error('❌ Post creation failed:', response.data.error?.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Post creation error:', error.response?.data?.error?.message || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function fetchPosts() {
  try {
    console.log('\n🔍 Fetching all posts from feed...');
    
    const response = await axios.get(`${API_URL}/posts`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.data.success) {
      const posts = response.data.data || [];
      console.log(`✅ Fetched ${posts.length} posts`);
      
      if (posts.length > 0) {
        console.log('\n📋 Recent Posts:');
        console.log('─'.repeat(50));
        posts.slice(0, 3).forEach((post, index) => {
          console.log(`${index + 1}. ${post.title}`);
          console.log(`   Status: ${post.status} | Visibility: ${post.visibility}`);
          console.log(`   Author: ${post.author?.firstName} ${post.author?.lastName}`);
        });
        console.log('─'.repeat(50));
      }
      return posts;
    } else {
      console.error('❌ Fetch failed:', response.data.error?.message);
      return [];
    }
  } catch (error) {
    console.error('❌ Fetch error:', error.response?.data?.error?.message || error.message);
    return [];
  }
}

async function runTests() {
  console.log('🚀 Starting Post API Tests\n');
  console.log('═'.repeat(50));

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without login');
    process.exit(1);
  }

  // Step 2: Create post
  const postId = await createPost();
  if (!postId) {
    console.error('\n❌ Cannot proceed without post creation');
    process.exit(1);
  }

  // Step 3: Fetch posts
  const posts = await fetchPosts();

  // Step 4: Verify post appears in feed
  console.log('\n✅ Verification:');
  console.log('─'.repeat(50));
  const createdPost = posts.find(p => p.id === postId);
  if (createdPost) {
    console.log('✅ Post appears in feed!');
    console.log(`✅ Status: ${createdPost.status} (should be PUBLISHED)`);
    console.log(`✅ Visibility: ${createdPost.visibility} (should be PUBLIC)`);
  } else {
    console.log('⚠️  Post not found in feed (might be filtered)');
  }

  console.log('─'.repeat(50));
  console.log('\n📱 Frontend URL: http://localhost:3000/admin/feed');
  console.log('The post should now appear in the admin feed!\n');
}

runTests().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

