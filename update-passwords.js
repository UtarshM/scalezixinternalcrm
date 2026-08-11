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

async function updatePasswords() {
  const accounts = ['admin@scalezix.co', 'jiya@scalezix.co'];
  const newPassword = '123456';

  try {
    // List all users to find their user IDs
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    for (const email of accounts) {
      const user = listData.users.find(u => u.email === email);
      if (user) {
        console.log(`Updating password for ${email} (ID: ${user.id})...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        );

        if (updateError) {
          console.error(`  Error updating ${email}:`, updateError.message);
        } else {
          console.log(`  Password updated successfully.`);
        }
      } else {
        console.log(`User ${email} not found in Supabase Auth.`);
      }
    }
  } catch (e) {
    console.error('Failed to update passwords:', e.message);
  }
}

updatePasswords();
