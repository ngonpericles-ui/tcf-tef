#!/usr/bin/env node

/**
 * Simple Prisma Connection Fix Script
 * 
 * This script updates all services to use the shared database connection
 * without TypeScript validation (which can be done later).
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BACKUP_DIR = './prisma-fix-backups';
const SERVICES_DIR = './backend/src/services';

// List of all services that need fixing
const SERVICES_TO_FIX = [
  'marketplaceService.ts',
  'voiceSimulationService.ts', 
  'immigrationSimulationService.js',
  'vapiService.ts',
  'temporaryTokenService.ts',
  'aiTeacherFeedbackService.ts',
  'levelAssessmentService.ts',
  'moderationService.ts',
  'likeService.ts',
  'questionBankService.ts',
  'levelDeterminationService.ts',
  'commentService.ts',
  'enhancedFileManagementService.ts',
  'certificateService.ts',
  'paymentService.ts',
  'eventEmailService.ts',
  'searchService.ts',
  'testManagementService.js',
  'courseProgressService.js',
  'tcfTefSimulationService.js',
  'speechService.ts',
  'simulationService.ts'
];

// Track progress
let processedCount = 0;
let successCount = 0;
let errorCount = 0;
const errors = [];

/**
 * Create backup directory
 */
function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Backup original file
 */
function backupFile(filePath) {
  const fileName = path.basename(filePath);
  const backupPath = path.join(BACKUP_DIR, fileName);
  
  try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`📁 Backed up: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to backup ${fileName}:`, error.message);
    return false;
  }
}

/**
 * Apply Prisma connection fix
 */
function applyPrismaFix(content) {
  let modifiedContent = content;
  let changesApplied = 0;

  // Check if already using shared connection
  if (modifiedContent.includes('@/database/connection')) {
    return { content: modifiedContent, changesApplied: 0, alreadyFixed: true };
  }

  // Pattern 1: Import PrismaClient and create new instance in one go
  const pattern1 = /import\s*{\s*PrismaClient[^}]*}\s*from\s*['"]@prisma\/client['"];?\s*\n\s*const\s+prisma\s*=\s*new\s+PrismaClient\(\);?/g;
  if (pattern1.test(modifiedContent)) {
    modifiedContent = modifiedContent.replace(pattern1, 'import { prisma } from \'@/database/connection\';');
    changesApplied++;
    console.log(`  🔧 Applied pattern 1: Import + new PrismaClient() → shared connection`);
  }

  // Pattern 2: Just the import line (if new PrismaClient is on separate line)
  const pattern2 = /import\s*{\s*PrismaClient[^}]*}\s*from\s*['"]@prisma\/client['"];?/g;
  if (pattern2.test(modifiedContent) && !modifiedContent.includes('@/database/connection')) {
    modifiedContent = modifiedContent.replace(pattern2, 'import { prisma } from \'@/database/connection\';');
    changesApplied++;
    console.log(`  🔧 Applied pattern 2: Import line only`);
  }

  // Pattern 3: Remove standalone "const prisma = new PrismaClient();" lines
  const pattern3 = /^\s*const\s+prisma\s*=\s*new\s+PrismaClient\(\);?\s*$/gm;
  if (pattern3.test(modifiedContent)) {
    modifiedContent = modifiedContent.replace(pattern3, '');
    changesApplied++;
    console.log(`  🔧 Applied pattern 3: Removed standalone new PrismaClient()`);
  }

  // Pattern 4: Handle cases where PrismaClient is imported with other types
  const pattern4 = /import\s*{\s*([^}]*PrismaClient[^}]*)\s*}\s*from\s*['"]@prisma\/client['"];?/g;
  if (pattern4.test(modifiedContent) && !modifiedContent.includes('@/database/connection')) {
    modifiedContent = modifiedContent.replace(pattern4, (match, imports) => {
      // Remove PrismaClient from imports and add separate prisma import
      const cleanImports = imports.replace(/PrismaClient,?\s*/, '').replace(/,\s*PrismaClient/, '').trim();
      if (cleanImports) {
        return `import { ${cleanImports} } from '@prisma/client';\nimport { prisma } from '@/database/connection';`;
      } else {
        return `import { prisma } from '@/database/connection';`;
      }
    });
    changesApplied++;
    console.log(`  🔧 Applied pattern 4: Cleaned mixed imports`);
  }

  return { content: modifiedContent, changesApplied, alreadyFixed: false };
}

/**
 * Process a single file
 */
function processFile(fileName) {
  const filePath = path.join(SERVICES_DIR, fileName);
  
  console.log(`\n📄 Processing: ${fileName}`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ File not found: ${fileName}`);
    errorCount++;
    errors.push({ file: fileName, error: 'File not found' });
    return false;
  }

  try {
    // Step 1: Backup original file
    if (!backupFile(filePath)) {
      throw new Error('Failed to create backup');
    }

    // Step 2: Read file content
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Step 3: Apply fixes
    const { content: modifiedContent, changesApplied, alreadyFixed } = applyPrismaFix(originalContent);
    
    if (alreadyFixed) {
      console.log(`   ✅ Already using shared connection`);
      successCount++;
      return true;
    }

    if (changesApplied === 0) {
      console.log(`   ⚠️  No changes needed (no PrismaClient patterns found)`);
      successCount++;
      return true;
    }

    console.log(`   📝 Applied ${changesApplied} changes`);

    // Step 4: Write modified content
    fs.writeFileSync(filePath, modifiedContent, 'utf8');

    console.log(`   ✅ Successfully fixed: ${fileName}`);
    successCount++;
    return true;

  } catch (error) {
    console.log(`   ❌ Error processing ${fileName}: ${error.message}`);
    errorCount++;
    errors.push({ file: fileName, error: error.message });
    return false;
  }
}

/**
 * Main execution function
 */
function main() {
  console.log('🚀 Starting Simple Prisma Connection Fix Script');
  console.log('==============================================');
  console.log(`📋 Services to fix: ${SERVICES_TO_FIX.length}`);
  console.log(`📁 Backup directory: ${BACKUP_DIR}`);
  console.log('');

  // Create backup directory
  createBackupDir();

  // Process each service
  for (const fileName of SERVICES_TO_FIX) {
    processedCount++;
    processFile(fileName);
  }

  // Print summary
  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`✅ Successfully processed: ${successCount}/${processedCount}`);
  console.log(`❌ Errors: ${errorCount}/${processedCount}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(({ file, error }) => {
      console.log(`   • ${file}: ${error}`);
    });
  }

  console.log(`\n📁 Backups saved in: ${BACKUP_DIR}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All services fixed successfully!');
    console.log('💡 You can now test your application.');
  } else {
    console.log('\n⚠️  Some services had errors. Check the logs above.');
  }

  // Exit with appropriate code
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, applyPrismaFix };
