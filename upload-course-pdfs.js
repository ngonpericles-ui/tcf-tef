const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001/api';

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@tcftef.com',
  password: 'Admin123!'
};

let authToken = '';

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null, isFormData = false) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...(isFormData ? {} : { 'Content-Type': 'application/json' })
      }
    };

    if (data) {
      if (isFormData) {
        config.data = data;
        config.headers = { ...config.headers, ...data.getHeaders() };
      } else {
        config.data = data;
      }
    }

    const response = await axios(config);
    return response;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} failed:`, error.response?.data?.message || error.message);
    throw error;
  }
};

// Create sample PDF content
const createSamplePDF = (filename, content) => {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${content}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;

  fs.writeFileSync(filename, pdfContent);
  console.log(`📄 Created sample PDF: ${filename}`);
};

const adminLogin = async () => {
  console.log('\n🔐 Admin Login...');
  try {
    const response = await apiRequest('POST', '/auth/login', ADMIN_CREDENTIALS);
    authToken = response.data.data?.tokens?.accessToken || 
                response.data.tokens?.accessToken || 
                response.data.token ||
                response.data.accessToken;
    
    console.log('✅ Admin login successful');
    console.log(`   Token: ${authToken ? 'Received' : 'Missing'}`);
    return true;
  } catch (error) {
    console.log('❌ Admin login failed');
    return false;
  }
};

const uploadCoursePDF = async (filename, title, description) => {
  console.log(`\n📤 Uploading ${title}...`);
  try {
    // Try different endpoints based on backend routes
    const endpoints = ['/files/document', '/files/upload', '/admin/files/upload'];

    for (const endpoint of endpoints) {
      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filename));
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', 'course-material');

        const response = await apiRequest('POST', endpoint, formData, true);
        console.log(`✅ Successfully uploaded: ${title} via ${endpoint}`);
        console.log(`   File ID: ${response.data.data?.id || 'Unknown'}`);
        return response.data;
      } catch (endpointError) {
        console.log(`   ⚠️ ${endpoint} failed: ${endpointError.response?.data?.message || endpointError.message}`);
        continue;
      }
    }

    console.log(`❌ All endpoints failed for: ${title}`);
    return null;
  } catch (error) {
    console.log(`❌ Failed to upload: ${title}`);
    return null;
  }
};

const main = async () => {
  console.log('🚀 Starting Course PDF Upload');
  console.log('================================');

  // Step 1: Login as admin
  const loginSuccess = await adminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  // Step 2: Create sample PDFs
  console.log('\n📄 Creating Sample PDFs...');
  createSamplePDF('tcf-guide.pdf', 'Guide Complet TCF - Test de Connaissance du Francais');
  createSamplePDF('tef-preparation.pdf', 'Preparation TEF - Test d\'Evaluation de Francais');

  // Step 3: Upload PDFs
  await uploadCoursePDF(
    'tcf-guide.pdf',
    'Guide Complet TCF',
    'Guide complet pour la préparation au Test de Connaissance du Français (TCF). Contient des exercices pratiques, des conseils et des stratégies pour réussir.'
  );

  await uploadCoursePDF(
    'tef-preparation.pdf',
    'Préparation TEF',
    'Manuel de préparation pour le Test d\'Évaluation de Français (TEF). Inclut des exemples d\'examens et des techniques de réussite.'
  );

  // Step 4: Clean up temporary files
  console.log('\n🧹 Cleaning up...');
  try {
    fs.unlinkSync('tcf-guide.pdf');
    fs.unlinkSync('tef-preparation.pdf');
    console.log('✅ Temporary files cleaned up');
  } catch (error) {
    console.log('⚠️ Could not clean up temporary files');
  }

  console.log('\n🎉 Course PDF Upload Completed!');
  console.log('================================');
};

// Run the script
main().catch(console.error);
