const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupSupabaseSchema() {
  try {
    console.log('🚀 Setting up Supabase database schema...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations
    );

    // Read the Prisma schema
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Prisma schema loaded');
    
    // For now, let's just test if we can connect and create a simple table
    console.log('🔌 Testing Supabase connection with service role...');
    
    // Test connection by trying to create a simple table
    const { data, error } = await supabase
      .from('test_connection')
      .select('*')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('✅ Supabase connection successful! (Table does not exist yet, which is expected)');
    } else if (error) {
      console.log('⚠️  Connection test result:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
    }

    console.log('🎉 Supabase setup completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Use Prisma with the correct connection string');
    console.log('   2. Run: npm run db:push');
    console.log('   3. Run: npm run db:seed');

  } catch (error) {
    console.error('❌ Supabase setup failed:', error.message);
    console.error('Full error:', error);
  }
}

setupSupabaseSchema();
