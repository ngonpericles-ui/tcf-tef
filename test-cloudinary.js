const { CloudinaryService } = require('./src/services/cloudinaryService.ts');

console.log('🌤️ Testing Cloudinary Connection');
console.log('='.repeat(40));

async function testCloudinary() {
  try {
    console.log('📡 Testing Cloudinary connection...');
    const isConnected = await CloudinaryService.testConnection();
    
    if (isConnected) {
      console.log('✅ Cloudinary connection successful!');
    } else {
      console.log('❌ Cloudinary connection failed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing Cloudinary:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCloudinary();
