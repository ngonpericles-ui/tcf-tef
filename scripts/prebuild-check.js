#!/usr/bin/env node

/**
 * Prebuild validation script
 * Scans for illegal next/document imports that are incompatible with Next.js App Router
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔍 Running prebuild validation checks...\n')

let hasErrors = false

// Check 1: Scan for next/document imports
console.log('📝 Checking for illegal next/document imports...')
try {
  const result = execSync(
    'grep -r "from [\'\\"]next/document" app/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null || true',
    { encoding: 'utf-8', cwd: __dirname + '/..' }
  )
  
  if (result.trim()) {
    console.error('❌ ERROR: Found illegal next/document imports:')
    console.error(result)
    console.error('\n⚠️  next/document and its components (Html, Head, Main, NextScript) are only valid in pages/_document.tsx')
    console.error('   In App Router, use app/layout.tsx instead.\n')
    hasErrors = true
  } else {
    console.log('✅ No illegal next/document imports found')
  }
} catch (error) {
  // grep returns non-zero exit code when no matches, which is what we want
  console.log('✅ No illegal next/document imports found')
}

// Check 2: Verify NODE_ENV is set correctly
console.log('\n🌍 Checking environment configuration...')
const nodeEnv = process.env.NODE_ENV
if (!nodeEnv) {
  console.warn('⚠️  WARNING: NODE_ENV is not set. It should be "production" for builds.')
} else if (nodeEnv !== 'production' && nodeEnv !== 'development') {
  console.warn(`⚠️  WARNING: NODE_ENV is set to "${nodeEnv}". Expected "production" or "development".`)
} else {
  console.log(`✅ NODE_ENV is set to "${nodeEnv}"`)
}

// Check 3: Verify critical files exist
console.log('\n📁 Checking critical App Router files...')
const criticalFiles = [
  'app/layout.tsx',
  'app/not-found.tsx',
  'app/error.tsx',
  'next.config.mjs'
]

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`)
  } else {
    console.error(`❌ ERROR: Missing critical file: ${file}`)
    hasErrors = true
  }
})

// Summary
console.log('\n' + '='.repeat(50))
if (hasErrors) {
  console.error('❌ PREBUILD VALIDATION FAILED')
  console.error('Please fix the errors above before deploying.\n')
  process.exit(1)
} else {
  console.log('✅ PREBUILD VALIDATION PASSED')
  console.log('All checks completed successfully.\n')
  process.exit(0)
}
