const axios = require('axios');

async function testPostCreation() {
  try {
    console.log('Testing admin login and post creation...');
    
    // First login as admin
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@tcftef.com',
      password: 'AdminTest123!'
    });

    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data);
      return;
    }

    console.log('✅ Admin login successful');
    const token = loginResponse.data.data.tokens.accessToken;
    
    // Test creating a post
    const postData = {
      title: 'Test Post from Admin',
      content: 'This is a test post created by the admin to verify the post creation functionality is working properly.',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      level: 'A1',
      targetTier: 'FREE'
    };

    const postResponse = await axios.post('http://localhost:3001/api/posts', postData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (postResponse.data.success) {
      console.log('✅ Post created successfully');
      console.log('Post ID:', postResponse.data.data.post.id);
      console.log('Post Title:', postResponse.data.data.post.title);
      
      // Test getting all posts
      const postsResponse = await axios.get('http://localhost:3001/api/posts');
      console.log('✅ Posts retrieved:', postsResponse.data.data.posts.length, 'posts found');
      
      // Test getting the specific post
      const specificPostResponse = await axios.get(`http://localhost:3001/api/posts/${postResponse.data.data.post.id}`);
      console.log('✅ Specific post retrieved:', specificPostResponse.data.data.post.title);
      
    } else {
      console.error('❌ Post creation failed:', postResponse.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testPostCreation();
