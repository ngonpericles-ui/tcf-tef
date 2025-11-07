const http = require('http');

console.log('🎯 PHASE 2: FRONTEND PAGES INTEGRATION TEST');
console.log('='.repeat(50));

async function testFrontendPages() {
  try {
    console.log('\n🌐 Testing Frontend Pages Accessibility...');
    
    // Test frontend server is running
    await testFrontendEndpoint('GET', '/', 'Frontend Home Page');
    
    // Test admin content pages
    console.log('\n👨‍💼 Testing Admin Content Pages...');
    await testFrontendEndpoint('GET', '/admin/content', 'Admin Content Management');
    await testFrontendEndpoint('GET', '/admin/content/upload', 'Admin Content Upload');
    await testFrontendEndpoint('GET', '/admin/content/create', 'Admin Content Create');
    
    // Test manager content pages
    console.log('\n👨‍🏫 Testing Manager Content Pages...');
    await testFrontendEndpoint('GET', '/manager/content', 'Manager Content Management');
    await testFrontendEndpoint('GET', '/manager/content/upload', 'Manager Content Upload');
    await testFrontendEndpoint('GET', '/manager/content/create', 'Manager Content Create');
    
    // Test student content pages
    console.log('\n👨‍🎓 Testing Student Content Pages...');
    await testFrontendEndpoint('GET', '/cours', 'Student Courses Page');
    await testFrontendEndpoint('GET', '/expertise', 'Student Expertise Page');
    
    // Test authentication pages
    console.log('\n🔐 Testing Authentication Pages...');
    await testFrontendEndpoint('GET', '/admin/login', 'Admin Login Page');
    await testFrontendEndpoint('GET', '/manager', 'Manager Login Page');
    await testFrontendEndpoint('GET', '/connexion', 'Student Login Page');

    console.log('\n🎉 FRONTEND PAGES TEST COMPLETE!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testFrontendEndpoint(method, path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000, // Frontend port
      path: path,
      method: method,
      headers: {
        'User-Agent': 'Test-Agent/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      
      res.on('end', () => {
        const icon = res.statusCode < 400 ? '✅' : '❌';
        console.log(`   ${icon} ${name}: ${res.statusCode}`);
        
        if (res.statusCode >= 400) {
          console.log(`      Error: HTTP ${res.statusCode}`);
        } else {
          // Check if it's HTML content
          if (responseData.includes('<html') || responseData.includes('<!DOCTYPE')) {
            console.log(`      Success: HTML page loaded (${Math.round(responseData.length / 1024)}KB)`);
          } else {
            console.log(`      Success: Content loaded (${responseData.length} bytes)`);
          }
        }
        
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ ${name}: Request failed - ${err.message}`);
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log(`   ⏰ ${name}: Request timeout`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Also test if frontend server is running
async function checkFrontendServer() {
  console.log('\n🔍 Checking Frontend Server Status...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      console.log('✅ Frontend server is running on port 3000');
      resolve(true);
    });

    req.on('error', (err) => {
      console.log('❌ Frontend server is not running on port 3000');
      console.log('   Please start the frontend server with: npm run dev');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⏰ Frontend server connection timeout');
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  const frontendRunning = await checkFrontendServer();
  
  if (frontendRunning) {
    await testFrontendPages();
  } else {
    console.log('\n📝 To test frontend integration:');
    console.log('1. Open a new terminal');
    console.log('2. Navigate to frontend directory');
    console.log('3. Run: npm run dev');
    console.log('4. Wait for server to start on port 3000');
    console.log('5. Re-run this test');
  }
}

main();
