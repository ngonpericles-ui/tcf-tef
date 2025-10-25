#!/usr/bin/env node

/**
 * Script to fix ChunkLoadError issues
 * This script helps resolve common chunk loading problems
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 Fixing ChunkLoadError issues...')

// Step 1: Clean build artifacts
console.log('🧹 Cleaning build artifacts...')
try {
  execSync('rm -rf .next', { stdio: 'inherit' })
  execSync('rm -rf node_modules/.cache', { stdio: 'inherit' })
  console.log('✅ Build artifacts cleaned')
} catch (error) {
  console.warn('⚠️  Warning: Could not clean some artifacts')
}

// Step 2: Clear browser cache instructions
console.log('🌐 Browser cache clearing instructions:')
console.log('   1. Open Developer Tools (F12)')
console.log('   2. Right-click on refresh button')
console.log('   3. Select "Empty Cache and Hard Reload"')
console.log('   4. Or use Ctrl+Shift+R (Cmd+Shift+R on Mac)')

// Step 3: Check for common issues
console.log('🔍 Checking for common issues...')

// Check if components exist
const components = [
  'components/snapshot.tsx',
  'components/course-explorer.tsx',
  'components/tests-panel.tsx',
  'components/live-sessions.tsx',
  'components/upsell.tsx',
  'components/ai-assistant.tsx'
]

let missingComponents = []
components.forEach(component => {
  if (!fs.existsSync(component)) {
    missingComponents.push(component)
  }
})

if (missingComponents.length > 0) {
  console.log('❌ Missing components:')
  missingComponents.forEach(comp => console.log(`   - ${comp}`))
} else {
  console.log('✅ All components exist')
}

// Step 4: Reinstall dependencies if needed
console.log('📦 Checking dependencies...')
try {
  execSync('npm install', { stdio: 'inherit' })
  console.log('✅ Dependencies updated')
} catch (error) {
  console.error('❌ Failed to update dependencies:', error.message)
}

// Step 5: Build the project
console.log('🏗️  Building project...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ Build successful')
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}

console.log('🎉 ChunkLoadError fix completed!')
console.log('💡 If issues persist, try:')
console.log('   1. Clear browser cache completely')
console.log('   2. Disable browser extensions')
console.log('   3. Try incognito/private mode')
console.log('   4. Check network connectivity')
