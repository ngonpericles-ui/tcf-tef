const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testSingleAuraMessage() {
  try {
    console.log('🔐 Logging in as student...');
    
    // Login as student
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'student@test.com',
      password: 'SecureTest123!'
    });
    
    console.log('Login response structure:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data.tokens?.accessToken || loginResponse.data.data.token;
    console.log('✅ Student logged in successfully');
    console.log('🔑 Token preview:', token?.substring(0, 20) + '...');
    
    console.log('\n🤖 Testing Enhanced Aura.CA with Contextual Responses...');

    const testQuestions = [
      'Bonjour Aura.CA, comment puis-je me préparer efficacement au TCF ?',
      'Quels conseils pour améliorer mon expression orale en français ?',
      'Comment gérer le stress pendant l\'examen ?',
      'Pouvez-vous m\'aider avec la grammaire française ?',
      'Comment enrichir mon vocabulaire pour le TEF Canada ?'
    ];

    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i];
      console.log(`\n📝 Test ${i + 1}: "${question.substring(0, 50)}..."`);

      try {
        const auraResponse = await axios.post(`${API_BASE}/ai/chat`, {
          message: question
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (auraResponse.data.success && auraResponse.data.data?.message) {
          console.log('✅ Response received');
          console.log(`   📝 Length: ${auraResponse.data.data.message.length} characters`);
          console.log(`   💡 Suggestions: ${auraResponse.data.data.suggestions?.length || 0}`);

          // Check for contextual content
          const message = auraResponse.data.data.message.toLowerCase();
          const hasContextualContent =
            (question.includes('TCF') && message.includes('tcf')) ||
            (question.includes('oral') && message.includes('oral')) ||
            (question.includes('stress') && message.includes('stress')) ||
            (question.includes('grammaire') && message.includes('grammaire')) ||
            (question.includes('TEF') && message.includes('tef'));

          console.log(`   🎯 Contextual: ${hasContextualContent ? '✅' : '❌'}`);

          // Show first few lines
          const lines = auraResponse.data.data.message.split('\n');
          console.log(`   📄 Preview: ${lines[0]}`);
          if (lines[1]) console.log(`              ${lines[1]}`);

        } else {
          console.log('❌ No valid response received');
        }
      } catch (error) {
        console.log(`❌ Error: ${error.response?.data?.error?.message || error.message}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSingleAuraMessage();
