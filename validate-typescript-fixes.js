#!/usr/bin/env node

/**
 * TypeScript Validation Script for Prisma Fixes
 * 
 * This script validates that all the Prisma connection fixes are working
 * by running TypeScript compilation on the entire project.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_DIR = './backend';
const SERVICES_DIR = './backend/src/services';

// List of services that were fixed
const FIXED_SERVICES = [
  'marketplaceService.ts',
  'voiceSimulationService.ts', 
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
  'speechService.ts',
  'simulationService.ts'
];

/**
 * Check if we're in the right directory
 */
function checkDirectory() {
  if (!fs.existsSync(BACKEND_DIR)) {
    console.error('❌ Backend directory not found. Please run from project root.');
    process.exit(1);
  }
  
  if (!fs.existsSync(path.join(BACKEND_DIR, 'tsconfig.json'))) {
    console.error('❌ TypeScript config not found in backend directory.');
    process.exit(1);
  }
  
  console.log('✅ Backend directory and TypeScript config found');
}

/**
 * Validate TypeScript compilation
 */
function validateTypeScript() {
  console.log('\n🔍 Validating TypeScript compilation...');
  
  try {
    // Change to backend directory and run TypeScript compilation
    const result = execSync('npx tsc --noEmit --skipLibCheck', {
      cwd: BACKEND_DIR,
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    console.log('✅ TypeScript compilation successful!');
    console.log('   All type checks passed');
    return true;
    
  } catch (error) {
    console.log('❌ TypeScript compilation failed:');
    console.log(error.stdout || error.message);
    
    // Try to provide helpful error analysis
    analyzeTypeScriptErrors(error.stdout || error.message);
    return false;
  }
}

/**
 * Analyze TypeScript errors and provide helpful suggestions
 */
function analyzeTypeScriptErrors(errorOutput) {
  console.log('\n🔍 Error Analysis:');
  
  const errors = errorOutput.split('\n').filter(line => line.includes('error TS'));
  
  if (errors.length === 0) {
    console.log('   No specific TypeScript errors found in output');
    return;
  }
  
  console.log(`   Found ${errors.length} TypeScript errors:`);
  
  errors.slice(0, 5).forEach((error, index) => {
    console.log(`   ${index + 1}. ${error.trim()}`);
  });
  
  if (errors.length > 5) {
    console.log(`   ... and ${errors.length - 5} more errors`);
  }
  
  // Check for common issues
  const hasImportErrors = errors.some(error => error.includes('Cannot find module'));
  const hasTypeErrors = errors.some(error => error.includes('Type') && error.includes('is not assignable'));
  
  if (hasImportErrors) {
    console.log('\n💡 Suggestion: Check if @/database/connection path is correctly configured');
  }
  
  if (hasTypeErrors) {
    console.log('\n💡 Suggestion: Some type mismatches detected - may need manual review');
  }
}

/**
 * Check if services are using the correct import
 */
function validateServiceImports() {
  console.log('\n🔍 Validating service imports...');
  
  let allCorrect = true;
  
  for (const service of FIXED_SERVICES) {
    const filePath = path.join(SERVICES_DIR, service);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  Service not found: ${service}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if using shared connection
    if (content.includes('@/database/connection')) {
      console.log(`   ✅ ${service}: Using shared connection`);
    } else if (content.includes('new PrismaClient()')) {
      console.log(`   ❌ ${service}: Still using new PrismaClient()`);
      allCorrect = false;
    } else {
      console.log(`   ⚠️  ${service}: No Prisma usage found`);
    }
  }
  
  return allCorrect;
}

/**
 * Check for any remaining new PrismaClient instances
 */
function checkForRemainingPrismaInstances() {
  console.log('\n🔍 Checking for remaining new PrismaClient instances...');
  
  let foundInstances = 0;
  
  for (const service of FIXED_SERVICES) {
    const filePath = path.join(SERVICES_DIR, service);
    
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('new PrismaClient()')) {
      console.log(`   ❌ Found in ${service}: new PrismaClient()`);
      foundInstances++;
    }
  }
  
  if (foundInstances === 0) {
    console.log('   ✅ No remaining new PrismaClient() instances found');
  } else {
    console.log(`   ⚠️  Found ${foundInstances} services still using new PrismaClient()`);
  }
  
  return foundInstances === 0;
}

/**
 * Test database connection by checking a simple service
 */
function testDatabaseConnection() {
  console.log('\n🔍 Testing database connection...');
  
  try {
    // Try to require the database connection
    const connectionPath = path.join(BACKEND_DIR, 'src/database/connection.ts');
    
    if (!fs.existsSync(connectionPath)) {
      console.log('   ⚠️  Database connection file not found');
      return false;
    }
    
    console.log('   ✅ Database connection file exists');
    console.log('   💡 To fully test, you would need to run the backend server');
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Database connection test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main validation function
 */
function main() {
  console.log('🚀 TypeScript Validation for Prisma Fixes');
  console.log('==========================================');
  
  // Step 1: Check directory structure
  checkDirectory();
  
  // Step 2: Validate service imports
  const importsValid = validateServiceImports();
  
  // Step 3: Check for remaining PrismaClient instances
  const noRemainingInstances = checkForRemainingPrismaInstances();
  
  // Step 4: Test database connection file
  const connectionValid = testDatabaseConnection();
  
  // Step 5: Run TypeScript compilation
  const compilationValid = validateTypeScript();
  
  // Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('=====================');
  console.log(`✅ Service imports correct: ${importsValid ? 'Yes' : 'No'}`);
  console.log(`✅ No remaining PrismaClient instances: ${noRemainingInstances ? 'Yes' : 'No'}`);
  console.log(`✅ Database connection file: ${connectionValid ? 'Found' : 'Missing'}`);
  console.log(`✅ TypeScript compilation: ${compilationValid ? 'Passed' : 'Failed'}`);
  
  const allValid = importsValid && noRemainingInstances && connectionValid && compilationValid;
  
  if (allValid) {
    console.log('\n🎉 All validations passed!');
    console.log('💡 Your Prisma connection fixes are working correctly.');
    console.log('🚀 You can now test your application.');
  } else {
    console.log('\n⚠️  Some validations failed.');
    console.log('💡 Check the errors above and fix them manually.');
  }
  
  process.exit(allValid ? 0 : 1);
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = { 
  validateTypeScript, 
  validateServiceImports, 
  checkForRemainingPrismaInstances 
};
