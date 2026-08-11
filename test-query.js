const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pdjecphrflnarbhkkpwu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkamVjcGhyZmxuYXJiaGtrcHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMDYxODQsImV4cCI6Mj99.mockkey-to-replace'
);

async function testAsUser() {
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkamVjcGhyZmxuYXJiaGtrcHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMDYxODQsImV4cCI6MjA5OTU4MjE4NH0.Ynd29U19aUuaPQLBZ8y2WN5ZPB90U9dPmAqBkCY8Bto';
  const client = createClient(
    'https://pdjecphrflnarbhkkpwu.supabase.co',
    anonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );

  console.log('Signing in as Jiya Patel...');
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: 'jiya@scalezix.co',
    password: '123456'
  });

  if (authError) {
    console.error('Sign in failed:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`Signed in successfully! User ID: ${userId}`);

  // Fetch leads
  console.log('Querying leads as authenticated user...');
  const { data: leads, error: leadsError } = await client
    .from('leads')
    .select('*, owner:users!leads_owner_id_fkey(*)');

  if (leadsError) {
    console.error('Leads query failed:', leadsError.message);
  } else {
    console.log(`Leads count returned: ${leads.length}`);
    console.log(JSON.stringify(leads, null, 2));
  }
}

testAsUser();
