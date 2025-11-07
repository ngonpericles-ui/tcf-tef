const http = require('http');

console.log('🎯 FINAL TEST: ALL 6 UPLOAD CARDS VERIFICATION');
console.log('='.repeat(50));

async function testAllUploadCards() {
  try {
    // Get admin token
    console.log('\n🔐 Getting Admin Token...');
    const adminToken = await login('test-admin@aura.ca', 'test123');
    
    if (!adminToken) {
      console.log('❌ Admin login failed');
      return;
    }
    console.log('✅ Admin authentication successful');

    // Test all 6 upload cards
    console.log('\n📤 Testing All 6 Upload Cards...');
    
    const uploadCards = [
      {
        name: '1. Course Material',
        contentType: 'NOTE',
        category: 'GRAMMAR'
      },
      {
        name: '2. Video Content',
        contentType: 'VIDEO', 
        category: 'LISTENING'
      },
      {
        name: '3. Test/Assessment',
        contentType: 'TEST',
        category: 'READING'
      },
      {
        name: '4. TCF/TEF Simulation',
        contentType: 'SIMULATION',
        category: 'TCF_TEF'
      },
      {
        name: '5. Note/Document',
        contentType: 'NOTE',
        category: 'VOCABULARY'
      },
      {
        name: '6. TCF/TEF Corrections',
        contentType: 'CORRIGER_TCF',
        category: 'TCF_TEF'
      }
    ];

    let successCount = 0;
    let totalCards = uploadCards.length;

    for (const card of uploadCards) {
      const uploadData = {
        title: `${card.name} Test`,
        description: `Test upload for ${card.name}`,
        level: 'B1',
        category: card.category,
        subscriptionTier: 'FREE',
        contentType: card.contentType,
        language: 'fr',
        tags: JSON.stringify(['test', 'final'])
      };
      
      const success = await testUploadCard(adminToken, card.name, uploadData);
      if (success) successCount++;
    }

    console.log('\n📊 FINAL RESULTS:');
    console.log(`✅ Successful Upload Cards: ${successCount}/${totalCards}`);
    console.log(`📈 Success Rate: ${Math.round((successCount/totalCards) * 100)}%`);
    
    if (successCount === totalCards) {
      console.log('🎉 ALL 6 UPLOAD CARDS WORKING PERFECTLY!');
    } else {
      console.log(`⚠️ ${totalCards - successCount} upload card(s) need attention`);
    }

    // Test content visibility
    console.log('\n👁️ Testing Content Visibility...');
    const contentData = await getEndpointData('/api/content-management/management', adminToken);
    if (contentData && contentData.content) {
      console.log(`📋 Total Content Items: ${contentData.content.length}`);
      
      // Count by content type
      const typeCounts = {};
      contentData.content.forEach(item => {
        const type = item.contentType || 'Unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      console.log('📊 Content by Type:');
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} items`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function login(email, password) {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({ email, password });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.success) {
            resolve(response.data.tokens.accessToken);
          } else {
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(loginData);
    req.end();
  });
}

async function testUploadCard(token, cardName, uploadData) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(uploadData);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/content-management/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      
      res.on('end', () => {
        const success = res.statusCode < 400;
        const icon = success ? '✅' : '❌';
        console.log(`   ${icon} ${cardName}: ${res.statusCode}`);
        
        if (!success) {
          try {
            const errorResponse = JSON.parse(responseData);
            console.log(`      Error: ${errorResponse.error?.message || errorResponse.message || 'Unknown'}`);
          } catch (err) {
            console.log(`      Raw: ${responseData.substring(0, 100)}`);
          }
        } else {
          try {
            const response = JSON.parse(responseData);
            if (response.success && response.data && response.data.content) {
              console.log(`      Success: Content ID ${response.data.content.id}`);
            } else {
              console.log(`      Success: Upload completed`);
            }
          } catch (err) {
            console.log(`      Success: Response received`);
          }
        }
        
        resolve(success);
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ ${cardName}: Request failed - ${err.message}`);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function getEndpointData(path, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (res.statusCode === 200 && response.success) {
            resolve(response.data);
          } else {
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.end();
  });
}

testAllUploadCards();
