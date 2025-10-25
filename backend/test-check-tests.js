const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTests() {
  try {
    console.log('🔍 Checking tests in database...\n');
    
    // Get all tests
    const allTests = await prisma.test.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        isPublished: true,
        level: true,
        category: true,
        requiredTier: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Total tests in database: ${allTests.length}\n`);
    
    if (allTests.length > 0) {
      console.log('📋 Tests:');
      allTests.forEach((test, index) => {
        console.log(`\n${index + 1}. ${test.title}`);
        console.log(`   ID: ${test.id}`);
        console.log(`   Status: ${test.status}`);
        console.log(`   Published: ${test.isPublished}`);
        console.log(`   Level: ${test.level}`);
        console.log(`   Category: ${test.category}`);
        console.log(`   Tier: ${test.requiredTier}`);
        console.log(`   Created: ${test.createdAt}`);
      });
    } else {
      console.log('❌ No tests found in database');
    }
    
    // Check published tests
    const publishedTests = await prisma.test.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        status: true
      }
    });
    
    console.log(`\n✅ Published tests: ${publishedTests.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTests();

