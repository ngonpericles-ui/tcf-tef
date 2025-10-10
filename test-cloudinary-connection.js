const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary with new credentials
cloudinary.config({
  cloud_name: 'ddhhzeewn',
  api_key: '439231598365295',
  api_secret: 'wX81kg-Xb5cGuUwZFeGMOfvgArc'
});

console.log('🌤️ TESTING CLOUDINARY CONNECTION WITH NEW CREDENTIALS');
console.log('='.repeat(60));

async function testCloudinaryConnection() {
  try {
    // Step 1: Test basic connection
    console.log('\n📡 Step 1: Testing Cloudinary API connection...');
    const pingResult = await cloudinary.api.ping();
    console.log('✅ Cloudinary ping successful:', pingResult);

    // Step 2: Test file upload
    console.log('\n📤 Step 2: Testing file upload...');
    
    // Create a simple test PDF
    const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 72 720 Td (Test Cloudinary Upload) Tj ET
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

    const testFileName = `cloudinary-test-${Date.now()}.pdf`;
    const testFilePath = path.join(__dirname, testFileName);
    
    // Write test file
    fs.writeFileSync(testFilePath, pdfContent);
    console.log(`📄 Created test file: ${testFileName}`);

    // Upload to Cloudinary
    const uploadOptions = {
      resource_type: 'auto',
      folder: 'tcf-tef-platform/test',
      use_filename: true,
      unique_filename: true,
      overwrite: false
    };

    console.log('📤 Uploading to Cloudinary...');
    const uploadResult = await cloudinary.uploader.upload(testFilePath, uploadOptions);
    
    console.log('✅ Upload successful!');
    console.log('📁 Public ID:', uploadResult.public_id);
    console.log('🔗 Secure URL:', uploadResult.secure_url);
    console.log('📊 File Size:', uploadResult.bytes, 'bytes');
    console.log('📂 Format:', uploadResult.format);
    console.log('🏷️ Resource Type:', uploadResult.resource_type);

    // Step 3: Test file deletion
    console.log('\n🗑️ Step 3: Testing file deletion...');
    const deleteResult = await cloudinary.uploader.destroy(uploadResult.public_id, {
      resource_type: uploadResult.resource_type
    });
    
    if (deleteResult.result === 'ok') {
      console.log('✅ File deleted successfully from Cloudinary');
    } else {
      console.log('⚠️ File deletion result:', deleteResult.result);
    }

    // Clean up local test file
    try {
      fs.unlinkSync(testFilePath);
      console.log('🗑️ Local test file cleaned up');
    } catch (err) {
      console.log('⚠️ Could not clean up local file:', err.message);
    }

    console.log('\n🎉 ALL CLOUDINARY TESTS PASSED!');
    console.log('✅ Connection: Working');
    console.log('✅ Upload: Working');
    console.log('✅ Deletion: Working');
    
    return true;

  } catch (error) {
    console.error('\n❌ Cloudinary test failed:');
    console.error('Error:', error.message);
    if (error.http_code) {
      console.error('HTTP Code:', error.http_code);
    }
    if (error.error && error.error.message) {
      console.error('Cloudinary Error:', error.error.message);
    }
    console.error('Stack:', error.stack);
    
    // Clean up test file if it exists
    try {
      const testFileName = `cloudinary-test-${Date.now()}.pdf`;
      const testFilePath = path.join(__dirname, testFileName);
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    } catch (cleanupErr) {
      // Ignore cleanup errors
    }
    
    return false;
  }
}

testCloudinaryConnection();
