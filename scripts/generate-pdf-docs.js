#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if pandoc is installed
function checkPandoc() {
  try {
    execSync('pandoc --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Generate PDF from markdown file
function generatePDF(inputFile, outputFile, title) {
  const command = `pandoc "${inputFile}" \
    -o "${outputFile}" \
    --pdf-engine=xelatex \
    --variable=geometry:margin=1in \
    --variable=fontsize:11pt \
    --variable=mainfont:"DejaVu Sans" \
    --variable=monofont:"DejaVu Sans Mono" \
    --variable=colorlinks:true \
    --variable=linkcolor:blue \
    --variable=urlcolor:blue \
    --variable=toccolor:gray \
    --toc \
    --number-sections \
    --metadata title="${title}" \
    --metadata author="TCF/TEF Platform Team" \
    --metadata date="$(date +%Y-%m-%d)"`;

  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Generated: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Error generating ${outputFile}:`, error.message);
  }
}

// Main function
function main() {
  console.log('📚 Generating PDF Documentation for TCF/TEF Platform\n');

  // Check if pandoc is installed
  if (!checkPandoc()) {
    console.error('❌ Pandoc is not installed. Please install it first:');
    console.error('   Ubuntu/Debian: sudo apt-get install pandoc texlive-xetex');
    console.error('   macOS: brew install pandoc');
    console.error('   Windows: Download from https://pandoc.org/installing.html');
    process.exit(1);
  }

  // Create output directory
  const outputDir = path.join(__dirname, '..', 'docs', 'pdf');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Documentation files to convert
  const docs = [
    {
      input: 'docs/README.md',
      output: 'docs/pdf/TCF-TEF-Platform-Overview.pdf',
      title: 'TCF/TEF Platform - Overview'
    },
    {
      input: 'docs/user-section/README.md',
      output: 'docs/pdf/User-Section-Documentation.pdf',
      title: 'TCF/TEF Platform - User Section Documentation'
    },
    {
      input: 'docs/manager-section/README.md',
      output: 'docs/pdf/Manager-Section-Documentation.pdf',
      title: 'TCF/TEF Platform - Manager Section Documentation'
    },
    {
      input: 'docs/admin-section/README.md',
      output: 'docs/pdf/Admin-Section-Documentation.pdf',
      title: 'TCF/TEF Platform - Admin Section Documentation'
    },
    {
      input: 'docs/technical/README.md',
      output: 'docs/pdf/Technical-Documentation.pdf',
      title: 'TCF/TEF Platform - Technical Documentation'
    },
    {
      input: 'docs/development/README.md',
      output: 'docs/pdf/Development-Guide.pdf',
      title: 'TCF/TEF Platform - Development Guide'
    }
  ];

  // Generate PDFs
  docs.forEach(doc => {
    const inputPath = path.join(__dirname, '..', doc.input);
    const outputPath = path.join(__dirname, '..', doc.output);

    if (fs.existsSync(inputPath)) {
      console.log(`📄 Converting: ${doc.input}`);
      generatePDF(inputPath, outputPath, doc.title);
    } else {
      console.error(`❌ File not found: ${doc.input}`);
    }
  });

  console.log('\n🎉 PDF generation complete!');
  console.log(`📁 PDFs saved to: ${outputDir}`);
  console.log('\n📋 Generated files:');
  docs.forEach(doc => {
    const outputPath = path.join(__dirname, '..', doc.output);
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   • ${path.basename(doc.output)} (${sizeInMB} MB)`);
    }
  });
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generatePDF, checkPandoc };
