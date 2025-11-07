const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiDirect() {
  try {
    console.log('🔑 Testing Gemini API directly...');
    
    // Test with the first API key
    const genAI = new GoogleGenerativeAI('AIzaSyAQLAg0KRZAG_-oK74908fOkS-nrke5Zw0');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = "Hello, this is a test message. Please respond in French.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API Response:', text);
    return { success: true, response: text };
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    return { success: false, error: error.message };
  }
}

testGeminiDirect();
