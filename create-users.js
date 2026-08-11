const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pdjecphrflnarbhkkpwu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function createDefaultUsers() {
  const usersToCreate = [
    {
      email: 'admin@scalezix.co',
      password: 'SUPABASE@123abc',
      full_name: 'Scalezix Admin',
      role: 'admin',
    },
    {
      email: 'jiya@scalezix.co',
      password: 'SUPABASE@123abc',
      full_name: 'Jiya Patel',
      role: 'team_member',
    },
  ];

  for (const u of usersToCreate) {
    try {
      console.log(`Creating user: ${u.email}...`);
      // 1. Create user in auth schema
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
        },
      });

      if (error) {
        if (error.message.includes('already exists') || error.message.includes('already registered')) {
          console.log(`  User ${u.email} already registered in Auth.`);
          
          // Let's fetch the existing user
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existingUser = listData.users.find(usr => usr.email === u.email);
          if (existingUser) {
            // Update role in public.users just to be sure
            await supabase
              .from('users')
              .update({ role: u.role, full_name: u.full_name })
              .eq('id', existingUser.id);
            console.log(`  Updated role to "${u.role}" for ${u.email}`);
          }
          continue;
        }
        throw error;
      }

      console.log(`  Auth user created: ${data.user.id}`);

      // 2. Wait a moment for trigger to run and update role in public.users table
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error: dbError } = await supabase
        .from('users')
        .update({ role: u.role })
        .eq('id', data.user.id);

      if (dbError) {
        // Trigger might not have run or returned error, let's insert manually if not present
        const { error: insError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: u.email,
            full_name: u.full_name,
            role: u.role,
            is_active: true,
          });
        if (insError) console.error(`  Error setting role in DB:`, insError.message);
      } else {
        console.log(`  Successfully mapped role "${u.role}" in database.`);
      }

    } catch (e) {
      console.error(`  Error creating ${u.email}:`, e.message);
    }
  }

  console.log('\nDone creating default users!');
}

createDefaultUsers();
