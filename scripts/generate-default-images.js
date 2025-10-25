const fs = require('fs');
const path = require('path');

// Create default images using simple HTML/CSS placeholders
// This is a temporary solution - in production, you'd use proper image generation

const categories = {
  courses: {
    GRAMMAR: { color: '#8B5CF6', icon: '📚' },
    LISTENING: { color: '#06B6D4', icon: '🎧' },
    SPEAKING: { color: '#10B981', icon: '🎤' },
    READING: { color: '#F59E0B', icon: '📖' },
    WRITING: { color: '#EF4444', icon: '✍️' },
    VOCABULARY: { color: '#8B5CF6', icon: '📝' },
  },
  tests: {
    TCF: { color: '#3B82F6', icon: '🇫🇷' },
    TEF: { color: '#10B981', icon: '💼' },
    DELF: { color: '#F59E0B', icon: '🎓' },
    DALF: { color: '#8B5CF6', icon: '🎓' },
    GRAMMAR: { color: '#8B5CF6', icon: '📚' },
    LISTENING: { color: '#06B6D4', icon: '🎧' },
    SPEAKING: { color: '#10B981', icon: '🎤' },
    READING: { color: '#F59E0B', icon: '📖' },
    WRITING: { color: '#EF4444', icon: '✍️' },
    VOCABULARY: { color: '#8B5CF6', icon: '📝' },
  }
};

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function generateImageHTML(category, level, type, config) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${type} ${category} ${level}</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .container {
      width: 400px;
      height: 300px;
      background: linear-gradient(135deg, ${config.color} 0%, ${config.color}CC 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    .category { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
    .level { font-size: 18px; opacity: 0.9; }
    .type { font-size: 14px; opacity: 0.8; position: absolute; top: 16px; left: 16px; }
    .pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="pattern"></div>
    <div class="type">${type.toUpperCase()}</div>
    <div class="icon">${config.icon}</div>
    <div class="category">${category}</div>
    <div class="level">Level ${level}</div>
  </div>
</body>
</html>`;
}

// Generate course images
Object.entries(categories.courses).forEach(([category, config]) => {
  levels.forEach(level => {
    const html = generateImageHTML(category, level, 'Course', config);
    const filePath = path.join(__dirname, '..', 'public', 'images', 'defaults', 'courses', `${category.toLowerCase()}-${level.toLowerCase()}.html`);
    fs.writeFileSync(filePath, html);
  });
});

// Generate test images
Object.entries(categories.tests).forEach(([category, config]) => {
  levels.forEach(level => {
    const html = generateImageHTML(category, level, 'Test', config);
    const filePath = path.join(__dirname, '..', 'public', 'images', 'defaults', 'tests', `${category.toLowerCase()}-${level.toLowerCase()}.html`);
    fs.writeFileSync(filePath, html);
  });
});

// Generate fallback images
const fallbackCourse = generateImageHTML('Course', 'Default', 'Course', { color: '#6B7280', icon: '📚' });
const fallbackTest = generateImageHTML('Test', 'Default', 'Test', { color: '#6B7280', icon: '📝' });
const platformDefault = generateImageHTML('Platform', 'Default', 'Platform', { color: '#3B82F6', icon: '🎓' });

fs.writeFileSync(path.join(__dirname, '..', 'public', 'images', 'defaults', 'courses', 'default.html'), fallbackCourse);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'images', 'defaults', 'tests', 'default.html'), fallbackTest);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'images', 'defaults', 'platform-default.html'), platformDefault);

console.log('✅ Default images generated successfully!');
console.log('📁 Generated files in public/images/defaults/');
console.log('🔧 Note: These are HTML files. In production, convert them to actual images.');
