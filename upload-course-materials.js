const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001/api';

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@tcftef.com',
  password: 'admin123'
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
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error.response?.data?.message || error.message);
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
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
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

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000369 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
466
%%EOF`;

  fs.writeFileSync(filename, pdfContent);
  console.log(`📄 Created sample PDF: ${filename}`);
};

const testAdminLogin = async () => {
  console.log('\n🔐 Testing Admin Login...');
  try {
    const response = await apiRequest('POST', '/auth/login', ADMIN_CREDENTIALS);
    authToken = response.data.token;
    console.log('✅ Admin login successful');
    console.log(`   User: ${response.data.user.firstName} ${response.data.user.lastName}`);
    console.log(`   Role: ${response.data.user.role}`);
    return true;
  } catch (error) {
    console.log('❌ Admin login failed');
    return false;
  }
};

const getCourses = async () => {
  console.log('\n📚 Getting Available Courses...');
  try {
    const response = await apiRequest('GET', '/courses');
    console.log(`✅ Retrieved ${response.data.length} courses`);
    return response.data;
  } catch (error) {
    console.log('❌ Failed to get courses');
    return [];
  }
};

const uploadCourseMaterial = async (courseId, filename, title, description) => {
  console.log(`\n📤 Uploading course material: ${filename}...`);
  try {
    // Check if file exists
    if (!fs.existsSync(filename)) {
      console.log(`❌ File ${filename} does not exist`);
      return false;
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filename));
    formData.append('courseId', courseId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', 'DOCUMENT');

    const config = {
      method: 'POST',
      url: `${API_BASE_URL}/files/course-material`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      },
      data: formData
    };

    const response = await axios(config);
    console.log('✅ Course material uploaded successfully');
    console.log(`   File ID: ${response.data.data.id}`);
    console.log(`   URL: ${response.data.data.url}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to upload ${filename}:`, error.response?.data?.message || error.message);
    return false;
  }
};

const uploadDocumentFile = async (filename, title, description) => {
  console.log(`\n📤 Uploading document: ${filename}...`);
  try {
    // Check if file exists
    if (!fs.existsSync(filename)) {
      console.log(`❌ File ${filename} does not exist`);
      return false;
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filename));
    formData.append('title', title);
    formData.append('description', description);

    const config = {
      method: 'POST',
      url: `${API_BASE_URL}/files/document`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      },
      data: formData
    };

    const response = await axios(config);
    console.log('✅ Document uploaded successfully');
    console.log(`   File ID: ${response.data.data.id}`);
    console.log(`   URL: ${response.data.data.url}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to upload ${filename}:`, error.response?.data?.message || error.message);
    return false;
  }
};

// Main upload function
const uploadCourseMaterials = async () => {
  console.log('🚀 Starting Course Materials Upload');
  console.log('===================================');

  // Step 1: Login as admin
  const loginSuccess = await testAdminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  // Step 2: Create sample PDF files
  console.log('\n📄 Creating Sample PDF Files...');
  createSamplePDF('tcf-guide.pdf', 'Guide de Preparation TCF - Niveau Debutant');
  createSamplePDF('tef-exercises.pdf', 'Exercices TEF - Niveau Intermediaire');

  // Step 3: Get available courses
  const courses = await getCourses();
  
  if (courses.length === 0) {
    console.log('\n❌ No courses available for material upload');
    return;
  }

  // Step 4: Upload materials to courses
  for (let i = 0; i < Math.min(courses.length, 2); i++) {
    const course = courses[i];
    const filename = i === 0 ? 'tcf-guide.pdf' : 'tef-exercises.pdf';
    const title = i === 0 ? 'Guide de Préparation TCF' : 'Exercices TEF Pratiques';
    const description = i === 0 ? 
      'Guide complet pour la préparation au TCF avec conseils et stratégies' :
      'Exercices pratiques pour améliorer vos compétences TEF';

    await uploadCourseMaterial(course.id, filename, title, description);
  }

  // Step 5: Upload general documents
  await uploadDocumentFile('tcf-guide.pdf', 'Guide TCF Général', 'Guide général pour tous les étudiants TCF');
  await uploadDocumentFile('tef-exercises.pdf', 'Exercices TEF Généraux', 'Exercices TEF pour tous les niveaux');

  // Step 6: Cleanup
  console.log('\n🧹 Cleaning up temporary files...');
  try {
    fs.unlinkSync('tcf-guide.pdf');
    fs.unlinkSync('tef-exercises.pdf');
    console.log('✅ Temporary files cleaned up');
  } catch (error) {
    console.log('⚠️ Could not clean up temporary files');
  }

  console.log('\n🎉 Course Materials Upload Completed!');
  console.log('====================================');
};

// Run the upload
uploadCourseMaterials().catch(console.error);
