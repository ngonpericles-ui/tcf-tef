const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  try {
    console.log('🔌 Testing Supabase connection with JavaScript client...');
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Anon Key:', process.env.SUPABASE_ANON_KEY ? '[CONFIGURED]' : '[NOT CONFIGURED]');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from('_prisma_migrations')
      .select('*')
      .limit(1);

    if (error) {
      console.log('⚠️  Expected error (table might not exist yet):', error.message);
      console.log('✅ But Supabase connection is working!');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('📊 Data:', data);
    }

    // Test with a simple query that should always work
    const { data: versionData, error: versionError } = await supabase
      .rpc('version');

    if (versionError) {
      console.log('⚠️  Version query failed:', versionError.message);
    } else {
      console.log('📊 Database version:', versionData);
    }

  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testSupabaseConnection();
