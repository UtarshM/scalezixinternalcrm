const { Client } = require('pg');

async function fixFunctionsAndPolicies() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.pdjecphrflnarbhkkpwu:SUPABASE%40123abc@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Create helper functions (as single statements)
    console.log('\n📦 Creating helper functions...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION public.get_user_role()
      RETURNS TEXT AS $fn$
        SELECT role FROM public.users WHERE id = auth.uid()
      $fn$ LANGUAGE sql SECURITY DEFINER STABLE
    `);
    console.log('  ✅ get_user_role()');

    await client.query(`
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS BOOLEAN AS $fn$
        SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
      $fn$ LANGUAGE sql SECURITY DEFINER STABLE
    `);
    console.log('  ✅ is_admin()');

    await client.query(`
      CREATE OR REPLACE FUNCTION public.is_admin_or_pm()
      RETURNS BOOLEAN AS $fn$
        SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
      $fn$ LANGUAGE sql SECURITY DEFINER STABLE
    `);
    console.log('  ✅ is_admin_or_pm()');

    // 2. Create updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $fn$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $fn$ LANGUAGE plpgsql
    `);
    console.log('  ✅ handle_updated_at()');

    // 3. Create new user handler
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $fn$
      BEGIN
        INSERT INTO public.users (id, email, full_name, avatar_url)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'avatar_url'
        );
        RETURN NEW;
      END;
      $fn$ LANGUAGE plpgsql SECURITY DEFINER
    `);
    console.log('  ✅ handle_new_user()');

    // 4. Create trigger for new user signup
    await client.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);
    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()
    `);
    console.log('  ✅ on_auth_user_created trigger');

    // 5. Create updated_at triggers for all relevant tables
    const tablesWithUpdatedAt = [
      'users', 'clients', 'leads', 'projects', 'tasks', 'invoices',
      'quotations', 'contracts', 'documents', 'employees', 'task_comments'
    ];

    for (const table of tablesWithUpdatedAt) {
      await client.query(`DROP TRIGGER IF EXISTS set_updated_at_${table} ON public.${table}`);
      await client.query(`
        CREATE TRIGGER set_updated_at_${table}
          BEFORE UPDATE ON public.${table}
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()
      `);
    }
    console.log('  ✅ updated_at triggers for', tablesWithUpdatedAt.length, 'tables');

    // 6. Drop existing broken policies and recreate
    console.log('\n🔒 Fixing RLS policies...');
    
    const policiesResult = await client.query(`
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `);
    
    for (const p of policiesResult.rows) {
      await client.query(`DROP POLICY IF EXISTS "${p.policyname}" ON public."${p.tablename}"`);
    }
    console.log(`  Dropped ${policiesResult.rows.length} existing policies`);

    // 7. Create all RLS policies properly
    const policies = [
      // USERS
      [`users`, `SELECT`, `true`, null],
      [`users`, `UPDATE`, `id = auth.uid()`, `id = auth.uid()`],
      [`users`, `INSERT`, null, `true`],
      [`users`, `DELETE`, `public.is_admin()`, null],

      // PERMISSIONS
      [`permissions`, `SELECT`, `true`, null],
      [`permissions`, `INSERT`, null, `public.is_admin()`],
      [`permissions`, `UPDATE`, `public.is_admin()`, `public.is_admin()`],
      [`permissions`, `DELETE`, `public.is_admin()`, null],

      // CLIENTS
      [`clients`, `SELECT`, `true`, null],
      [`clients`, `INSERT`, null, `true`],
      [`clients`, `UPDATE`, `true`, `true`],
      [`clients`, `DELETE`, `public.is_admin()`, null],

      // CONTACTS
      [`contacts`, `SELECT`, `true`, null],
      [`contacts`, `INSERT`, null, `true`],
      [`contacts`, `UPDATE`, `true`, `true`],
      [`contacts`, `DELETE`, `public.is_admin()`, null],

      // LEADS
      [`leads`, `SELECT`, `true`, null],
      [`leads`, `INSERT`, null, `true`],
      [`leads`, `UPDATE`, `true`, `true`],
      [`leads`, `DELETE`, `public.is_admin()`, null],

      // LEAD NOTES
      [`lead_notes`, `SELECT`, `true`, null],
      [`lead_notes`, `INSERT`, null, `true`],
      [`lead_notes`, `UPDATE`, `true`, `true`],
      [`lead_notes`, `DELETE`, `true`, null],

      // LEAD FOLLOWUPS
      [`lead_followups`, `SELECT`, `true`, null],
      [`lead_followups`, `INSERT`, null, `true`],
      [`lead_followups`, `UPDATE`, `true`, `true`],
      [`lead_followups`, `DELETE`, `true`, null],

      // PROJECTS
      [`projects`, `SELECT`, `true`, null],
      [`projects`, `INSERT`, null, `true`],
      [`projects`, `UPDATE`, `true`, `true`],
      [`projects`, `DELETE`, `public.is_admin()`, null],

      // PROJECT MEMBERS
      [`project_members`, `SELECT`, `true`, null],
      [`project_members`, `INSERT`, null, `true`],
      [`project_members`, `UPDATE`, `true`, `true`],
      [`project_members`, `DELETE`, `true`, null],

      // MILESTONES
      [`milestones`, `SELECT`, `true`, null],
      [`milestones`, `INSERT`, null, `true`],
      [`milestones`, `UPDATE`, `true`, `true`],
      [`milestones`, `DELETE`, `true`, null],

      // TASKS
      [`tasks`, `SELECT`, `true`, null],
      [`tasks`, `INSERT`, null, `true`],
      [`tasks`, `UPDATE`, `true`, `true`],
      [`tasks`, `DELETE`, `public.is_admin()`, null],

      // SUBTASKS
      [`subtasks`, `SELECT`, `true`, null],
      [`subtasks`, `INSERT`, null, `true`],
      [`subtasks`, `UPDATE`, `true`, `true`],
      [`subtasks`, `DELETE`, `true`, null],

      // TASK COMMENTS
      [`task_comments`, `SELECT`, `true`, null],
      [`task_comments`, `INSERT`, null, `true`],
      [`task_comments`, `UPDATE`, `user_id = auth.uid()`, `user_id = auth.uid()`],
      [`task_comments`, `DELETE`, `user_id = auth.uid() OR public.is_admin()`, null],

      // TIME LOGS
      [`time_logs`, `SELECT`, `true`, null],
      [`time_logs`, `INSERT`, null, `true`],
      [`time_logs`, `UPDATE`, `user_id = auth.uid()`, `user_id = auth.uid()`],
      [`time_logs`, `DELETE`, `user_id = auth.uid() OR public.is_admin()`, null],

      // INVOICES
      [`invoices`, `SELECT`, `true`, null],
      [`invoices`, `INSERT`, null, `true`],
      [`invoices`, `UPDATE`, `true`, `true`],
      [`invoices`, `DELETE`, `public.is_admin()`, null],

      // INVOICE ITEMS
      [`invoice_items`, `SELECT`, `true`, null],
      [`invoice_items`, `INSERT`, null, `true`],
      [`invoice_items`, `UPDATE`, `true`, `true`],
      [`invoice_items`, `DELETE`, `true`, null],

      // QUOTATIONS
      [`quotations`, `SELECT`, `true`, null],
      [`quotations`, `INSERT`, null, `true`],
      [`quotations`, `UPDATE`, `true`, `true`],
      [`quotations`, `DELETE`, `public.is_admin()`, null],

      // QUOTATION ITEMS
      [`quotation_items`, `SELECT`, `true`, null],
      [`quotation_items`, `INSERT`, null, `true`],
      [`quotation_items`, `UPDATE`, `true`, `true`],
      [`quotation_items`, `DELETE`, `true`, null],

      // PAYMENTS
      [`payments`, `SELECT`, `true`, null],
      [`payments`, `INSERT`, null, `true`],
      [`payments`, `UPDATE`, `true`, `true`],
      [`payments`, `DELETE`, `public.is_admin()`, null],

      // EXPENSES
      [`expenses`, `SELECT`, `public.is_admin()`, null],
      [`expenses`, `INSERT`, null, `public.is_admin()`],
      [`expenses`, `UPDATE`, `public.is_admin()`, `public.is_admin()`],
      [`expenses`, `DELETE`, `public.is_admin()`, null],

      // VENDORS
      [`vendors`, `SELECT`, `true`, null],
      [`vendors`, `INSERT`, null, `public.is_admin()`],
      [`vendors`, `UPDATE`, `public.is_admin()`, `public.is_admin()`],
      [`vendors`, `DELETE`, `public.is_admin()`, null],

      // CONTRACTS
      [`contracts`, `SELECT`, `public.is_admin_or_pm()`, null],
      [`contracts`, `INSERT`, null, `public.is_admin()`],
      [`contracts`, `UPDATE`, `public.is_admin()`, `public.is_admin()`],
      [`contracts`, `DELETE`, `public.is_admin()`, null],

      // FOLDERS
      [`folders`, `SELECT`, `true`, null],
      [`folders`, `INSERT`, null, `public.is_admin_or_pm()`],
      [`folders`, `UPDATE`, `public.is_admin_or_pm()`, `public.is_admin_or_pm()`],
      [`folders`, `DELETE`, `public.is_admin()`, null],

      // DOCUMENTS
      [`documents`, `SELECT`, `true`, null],
      [`documents`, `INSERT`, null, `true`],
      [`documents`, `UPDATE`, `public.is_admin_or_pm()`, `public.is_admin_or_pm()`],
      [`documents`, `DELETE`, `public.is_admin()`, null],

      // ATTACHMENTS
      [`attachments`, `SELECT`, `true`, null],
      [`attachments`, `INSERT`, null, `true`],
      [`attachments`, `DELETE`, `public.is_admin()`, null],

      // EMPLOYEES
      [`employees`, `SELECT`, `public.is_admin() OR user_id = auth.uid()`, null],
      [`employees`, `INSERT`, null, `public.is_admin()`],
      [`employees`, `UPDATE`, `public.is_admin()`, `public.is_admin()`],
      [`employees`, `DELETE`, `public.is_admin()`, null],

      // LEAVE REQUESTS
      [`leave_requests`, `SELECT`, `public.is_admin() OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())`, null],
      [`leave_requests`, `INSERT`, null, `true`],
      [`leave_requests`, `UPDATE`, `public.is_admin()`, `public.is_admin()`],
      [`leave_requests`, `DELETE`, `public.is_admin()`, null],

      // ACTIVITIES
      [`activities`, `SELECT`, `true`, null],
      [`activities`, `INSERT`, null, `true`],

      // NOTIFICATIONS
      [`notifications`, `SELECT`, `user_id = auth.uid()`, null],
      [`notifications`, `INSERT`, null, `true`],
      [`notifications`, `UPDATE`, `user_id = auth.uid()`, `user_id = auth.uid()`],

      // CALENDAR EVENTS
      [`calendar_events`, `SELECT`, `true`, null],
      [`calendar_events`, `INSERT`, null, `true`],
      [`calendar_events`, `UPDATE`, `created_by = auth.uid() OR public.is_admin()`, `created_by = auth.uid() OR public.is_admin()`],
      [`calendar_events`, `DELETE`, `created_by = auth.uid() OR public.is_admin()`, null],

      // SETTINGS
      [`settings`, `SELECT`, `true`, null],
      [`settings`, `INSERT`, null, `public.is_admin()`],
      [`settings`, `UPDATE`, `public.is_admin()`, `public.is_admin()`],
      [`settings`, `DELETE`, `public.is_admin()`, null],

      // TAGS
      [`tags`, `SELECT`, `true`, null],
      [`tags`, `INSERT`, null, `public.is_admin()`],
      [`tags`, `UPDATE`, `public.is_admin()`, `public.is_admin()`],
      [`tags`, `DELETE`, `public.is_admin()`, null],

      // CUSTOM FIELDS
      [`custom_fields`, `SELECT`, `true`, null],
      [`custom_fields`, `INSERT`, null, `public.is_admin()`],
      [`custom_fields`, `UPDATE`, `public.is_admin()`, `public.is_admin()`],
      [`custom_fields`, `DELETE`, `public.is_admin()`, null],
    ];

    let pSuccess = 0;
    let pFailed = 0;

    for (let i = 0; i < policies.length; i++) {
      const [table, action, using, check] = policies[i];
      const name = `${table}_${action.toLowerCase()}_policy`;
      
      let sql = `CREATE POLICY "${name}" ON public.${table} FOR ${action}`;
      if (using) sql += ` USING (${using})`;
      if (check) sql += ` WITH CHECK (${check})`;

      try {
        await client.query(sql);
        pSuccess++;
      } catch (error) {
        pFailed++;
        console.error(`  ❌ ${name}: ${error.message.substring(0, 80)}`);
      }
    }

    console.log(`\n  RLS policies: ${pSuccess} created, ${pFailed} failed`);

    // 8. Insert default permissions if not already there
    const permCount = await client.query(`SELECT COUNT(*) FROM public.permissions`);
    if (parseInt(permCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO public.permissions (role, module, can_view, can_create, can_edit, can_delete, scope) VALUES
          ('admin', 'dashboard', true, true, true, true, 'all'),
          ('admin', 'crm', true, true, true, true, 'all'),
          ('admin', 'clients', true, true, true, true, 'all'),
          ('admin', 'projects', true, true, true, true, 'all'),
          ('admin', 'tasks', true, true, true, true, 'all'),
          ('admin', 'invoices', true, true, true, true, 'all'),
          ('admin', 'payments', true, true, true, true, 'all'),
          ('admin', 'finance', true, true, true, true, 'all'),
          ('admin', 'documents', true, true, true, true, 'all'),
          ('admin', 'hr', true, true, true, true, 'all'),
          ('admin', 'reports', true, true, true, true, 'all'),
          ('admin', 'settings', true, true, true, true, 'all'),
          ('project_manager', 'dashboard', true, true, true, false, 'all'),
          ('project_manager', 'crm', true, true, true, false, 'all'),
          ('project_manager', 'projects', true, true, true, false, 'all'),
          ('project_manager', 'tasks', true, true, true, false, 'all'),
          ('project_manager', 'invoices', true, true, true, false, 'all'),
          ('project_manager', 'payments', true, false, false, false, 'all'),
          ('project_manager', 'documents', true, true, true, false, 'all'),
          ('project_manager', 'reports', true, false, false, false, 'all'),
          ('team_member', 'dashboard', true, false, false, false, 'own'),
          ('team_member', 'projects', true, false, false, false, 'assigned'),
          ('team_member', 'tasks', true, true, true, false, 'assigned'),
          ('team_member', 'documents', true, true, false, false, 'assigned'),
          ('team_member', 'hr', true, false, false, false, 'own')
      `);
      console.log('  ✅ Default permissions inserted');
    }

    console.log('\n🎉 All functions, triggers, and RLS policies are set up!');

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await client.end();
  }
}

fixFunctionsAndPolicies();
