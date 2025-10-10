const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

console.log('🎯 TESTING SINGLE CONTENT UPLOAD');
console.log('='.repeat(40));

async function testSingleUpload() {
  try {
    // Step 1: Login as admin
    console.log('\n🔐 Step 1: Admin Login');
    const adminToken = await loginAsAdmin();
    
    if (!adminToken) {
      console.log('❌ Admin login failed');
      return;
    }

    // Step 2: Test single upload
    console.log('\n📤 Step 2: Testing PDF Upload');
    await testPdfUpload(adminToken);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function loginAsAdmin() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      email: 'test-admin@aura.ca',
      password: 'test123'
    });

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
            console.log('✅ Admin login successful!');
            resolve(response.data.tokens.accessToken);
          } else {
            console.log('❌ Admin login failed!');
            console.log('Response:', response);
            resolve(null);
          }
        } catch (err) {
          console.log('❌ Error parsing response:', err.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Request failed:', err.message);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

async function testPdfUpload(adminToken) {
  return new Promise((resolve) => {
    // Create a simple PDF file
    const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 72 720 Td (Test PDF Content) Tj ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref 300
%%EOF`;

    const fileName = `test-upload-${Date.now()}.pdf`;
    const filePath = path.join(__dirname, fileName);
    
    // Write PDF file
    fs.writeFileSync(filePath, pdfContent);
    console.log(`📄 Created test PDF: ${fileName}`);

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('title', 'Test Course Upload');
    form.append('description', 'Test description for course upload');
    form.append('level', 'B1');
    form.append('category', 'GRAMMAR');
    form.append('subscriptionTier', 'FREE');
    form.append('language', 'fr');
    form.append('contentType', 'NOTE');
    form.append('tags', JSON.stringify(['test', 'course']));
    form.append('duration', '60');

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/content-management/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...form.getHeaders()
      }
    };

    console.log('📤 Uploading to /api/content-management/upload...');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        // Clean up test file
        try {
          fs.unlinkSync(filePath);
          console.log('🗑️ Cleaned up test file');
        } catch (err) {
          // Ignore cleanup errors
        }

        const icon = res.statusCode < 400 ? '✅' : '❌';
        console.log(`${icon} Upload Status: ${res.statusCode}`);
        
        try {
          const response = JSON.parse(data);
          console.log('📋 Response:');
          console.log(JSON.stringify(response, null, 2));
          
          if (response.success) {
            console.log('🎉 Upload successful!');
            if (response.data.content) {
              console.log(`📁 Content ID: ${response.data.content.id}`);
              console.log(`📂 Content Type: ${response.data.content.contentType}`);
              console.log(`🔗 File URL: ${response.data.content.fileUrl || 'Not generated'}`);
            }
          } else {
            console.log('❌ Upload failed');
            if (response.error) {
              console.log(`🔍 Error: ${response.error.message || JSON.stringify(response.error)}`);
            }
          }
        } catch (err) {
          console.log('❌ Response parsing error:', err.message);
          console.log('📄 Raw response:', data.substring(0, 1000));
        }
        
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log('❌ Upload request failed:', err.message);
      // Clean up test file
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        // Ignore cleanup errors
      }
      resolve();
    });

    form.pipe(req);
  });
}

testSingleUpload().catch(console.error);
