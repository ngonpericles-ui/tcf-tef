#!/usr/bin/env node

/**
 * Prisma Connection Fix Script
 * 
 * This script safely updates all services to use the shared database connection
 * instead of creating new PrismaClient instances.
 * 
 * Features:
 * - Backup original files before modification
 * - Validate TypeScript syntax after changes
 * - Rollback on errors
 * - Progress tracking
 * - Safe error handling
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
 * Read and parse file content
 */
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * Write file content
 */
function writeFileContent(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
}

/**
 * Apply Prisma connection fix
 */
function applyPrismaFix(content, fileName) {
  let modifiedContent = content;
  let changesApplied = 0;

  // Pattern 1: Import PrismaClient and create new instance
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

  return { content: modifiedContent, changesApplied };
}

/**
 * Validate TypeScript syntax
 */
function validateTypeScript(filePath) {
  try {
    // Check if it's a TypeScript file
    if (!filePath.endsWith('.ts')) {
      return true; // Skip validation for JS files
    }

    // Try to compile with TypeScript (dry run)
    execSync(`npx tsc --noEmit --skipLibCheck "${filePath}"`, { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    return true;
  } catch (error) {
    console.log(`  ⚠️  TypeScript validation failed: ${error.message.split('\n')[0]}`);
    return false;
  }
}

/**
 * Rollback file to backup
 */
function rollbackFile(filePath, fileName) {
  const backupPath = path.join(BACKUP_DIR, fileName);
  try {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
      console.log(`  🔄 Rolled back: ${fileName}`);
      return true;
    }
  } catch (error) {
    console.error(`  ❌ Failed to rollback ${fileName}:`, error.message);
  }
  return false;
}

/**
 * Process a single file
 */
function processFile(fileName) {
  const filePath = path.join(SERVICES_DIR, fileName);
  
  console.log(`\n📄 Processing: ${fileName}`);
  console.log(`   Path: ${filePath}`);

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
    const originalContent = readFileContent(filePath);
    
    // Step 3: Check if file already uses shared connection
    if (originalContent.includes('@/database/connection')) {
      console.log(`   ✅ Already using shared connection`);
      successCount++;
      return true;
    }

    // Step 4: Apply fixes
    const { content: modifiedContent, changesApplied } = applyPrismaFix(originalContent, fileName);
    
    if (changesApplied === 0) {
      console.log(`   ⚠️  No changes needed (no PrismaClient patterns found)`);
      successCount++;
      return true;
    }

    console.log(`   📝 Applied ${changesApplied} changes`);

    // Step 5: Write modified content
    writeFileContent(filePath, modifiedContent);

    // Step 6: Validate TypeScript syntax
    if (!validateTypeScript(filePath)) {
      console.log(`   🔄 Rolling back due to TypeScript errors...`);
      rollbackFile(filePath, fileName);
      throw new Error('TypeScript validation failed');
    }

    console.log(`   ✅ Successfully fixed: ${fileName}`);
    successCount++;
    return true;

  } catch (error) {
    console.log(`   ❌ Error processing ${fileName}: ${error.message}`);
    errorCount++;
    errors.push({ file: fileName, error: error.message });
    
    // Try to rollback
    rollbackFile(filePath, fileName);
    return false;
  }
}

/**
 * Main execution function
 */
function main() {
  console.log('🚀 Starting Prisma Connection Fix Script');
  console.log('=====================================');
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
    console.log('💡 You can manually fix the remaining services or run the script again.');
  }

  // Exit with appropriate code
  process.exit(errorCount > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n💥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, applyPrismaFix, validateTypeScript };
