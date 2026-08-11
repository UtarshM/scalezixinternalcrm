const fs = require('fs');
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.pdjecphrflnarbhkkpwu:SUPABASE%40123abc@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the full SQL file
    const fullSql = fs.readFileSync('supabase/migrations/001_complete_schema.sql', 'utf8');
    
    // Split by semicolons and execute statement by statement
    // But first, let's extract just the CREATE TABLE + INDEX + TRIGGER + FUNCTION parts (skip RLS policies)
    const statements = fullSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const stmt of statements) {
      // Skip RLS policy creation - we'll handle separately
      if (stmt.toUpperCase().includes('CREATE POLICY') || 
          stmt.toUpperCase().includes('DROP POLICY')) {
        skipped++;
        continue;
      }

      try {
        await client.query(stmt + ';');
        success++;
        
        // Log significant operations
        if (stmt.toUpperCase().includes('CREATE TABLE')) {
          const match = stmt.match(/CREATE TABLE IF NOT EXISTS public\.(\w+)/i);
          if (match) console.log('  ✅ Created table:', match[1]);
        } else if (stmt.toUpperCase().includes('CREATE INDEX')) {
          // silently count
        } else if (stmt.toUpperCase().includes('CREATE OR REPLACE FUNCTION')) {
          const match = stmt.match(/FUNCTION public\.(\w+)/i);
          if (match) console.log('  ✅ Created function:', match[1]);
        } else if (stmt.toUpperCase().includes('CREATE TRIGGER') || stmt.toUpperCase().includes('CREATE OR REPLACE TRIGGER')) {
          const match = stmt.match(/TRIGGER (\w+)/i);
          if (match) console.log('  ✅ Created trigger:', match[1]);
        } else if (stmt.toUpperCase().includes('ALTER TABLE')) {
          // RLS enable - silent
        } else if (stmt.toUpperCase().includes('INSERT INTO')) {
          console.log('  ✅ Inserted default data');
        }
      } catch (error) {
        failed++;
        if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
          console.error('  ❌ Error:', error.message.substring(0, 100));
        }
      }
    }

    console.log(`\nSchema: ${success} statements succeeded, ${failed} failed, ${skipped} policy statements skipped`);

    // Verify tables
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\n📋 Tables created:', tablesResult.rows.map(r => r.table_name).join(', '));

    console.log('\n✅ Schema creation complete! Now creating RLS policies...\n');

    // Now create RLS policies with correct syntax
    const policies = [
      // USERS
      `CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true)`,
      `CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid())`,
      `CREATE POLICY "users_admin_insert" ON public.users FOR INSERT WITH CHECK (public.is_admin() OR NOT EXISTS (SELECT 1 FROM public.users LIMIT 1))`,
      `CREATE POLICY "users_admin_delete" ON public.users FOR DELETE USING (public.is_admin())`,

      // PERMISSIONS
      `CREATE POLICY "permissions_select" ON public.permissions FOR SELECT USING (true)`,
      `CREATE POLICY "permissions_admin_insert" ON public.permissions FOR INSERT WITH CHECK (public.is_admin())`,
      `CREATE POLICY "permissions_admin_update" ON public.permissions FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())`,
      `CREATE POLICY "permissions_admin_delete" ON public.permissions FOR DELETE USING (public.is_admin())`,

      // CLIENTS
      `CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (true)`,
      `CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (public.is_admin())`,

      // CONTACTS
      `CREATE POLICY "contacts_select" ON public.contacts FOR SELECT USING (true)`,
      `CREATE POLICY "contacts_insert" ON public.contacts FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "contacts_update" ON public.contacts FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "contacts_delete" ON public.contacts FOR DELETE USING (public.is_admin())`,

      // LEADS
      `CREATE POLICY "leads_select" ON public.leads FOR SELECT USING (public.is_admin_or_pm() OR owner_id = auth.uid())`,
      `CREATE POLICY "leads_insert" ON public.leads FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "leads_update" ON public.leads FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "leads_delete" ON public.leads FOR DELETE USING (public.is_admin())`,

      // LEAD NOTES
      `CREATE POLICY "lead_notes_select" ON public.lead_notes FOR SELECT USING (true)`,
      `CREATE POLICY "lead_notes_insert" ON public.lead_notes FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "lead_notes_update" ON public.lead_notes FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "lead_notes_delete" ON public.lead_notes FOR DELETE USING (public.is_admin_or_pm())`,

      // LEAD FOLLOWUPS
      `CREATE POLICY "lead_followups_select" ON public.lead_followups FOR SELECT USING (true)`,
      `CREATE POLICY "lead_followups_insert" ON public.lead_followups FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "lead_followups_update" ON public.lead_followups FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "lead_followups_delete" ON public.lead_followups FOR DELETE USING (public.is_admin_or_pm())`,

      // PROJECTS
      `CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (public.is_admin_or_pm() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid()))`,
      `CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (public.is_admin())`,

      // PROJECT MEMBERS
      `CREATE POLICY "project_members_select" ON public.project_members FOR SELECT USING (true)`,
      `CREATE POLICY "project_members_insert" ON public.project_members FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "project_members_update" ON public.project_members FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "project_members_delete" ON public.project_members FOR DELETE USING (public.is_admin_or_pm())`,

      // MILESTONES
      `CREATE POLICY "milestones_select" ON public.milestones FOR SELECT USING (true)`,
      `CREATE POLICY "milestones_insert" ON public.milestones FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "milestones_update" ON public.milestones FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "milestones_delete" ON public.milestones FOR DELETE USING (public.is_admin_or_pm())`,

      // TASKS
      `CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (public.is_admin_or_pm() OR assigned_to = auth.uid())`,
      `CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (assigned_to = auth.uid() OR public.is_admin_or_pm()) WITH CHECK (assigned_to = auth.uid() OR public.is_admin_or_pm())`,
      `CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE USING (public.is_admin())`,

      // SUBTASKS
      `CREATE POLICY "subtasks_select" ON public.subtasks FOR SELECT USING (true)`,
      `CREATE POLICY "subtasks_insert" ON public.subtasks FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "subtasks_update" ON public.subtasks FOR UPDATE USING (true) WITH CHECK (true)`,
      `CREATE POLICY "subtasks_delete" ON public.subtasks FOR DELETE USING (true)`,

      // TASK COMMENTS
      `CREATE POLICY "task_comments_select" ON public.task_comments FOR SELECT USING (true)`,
      `CREATE POLICY "task_comments_insert" ON public.task_comments FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "task_comments_update" ON public.task_comments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`,
      `CREATE POLICY "task_comments_delete" ON public.task_comments FOR DELETE USING (user_id = auth.uid() OR public.is_admin())`,

      // TIME LOGS
      `CREATE POLICY "time_logs_select" ON public.time_logs FOR SELECT USING (true)`,
      `CREATE POLICY "time_logs_insert" ON public.time_logs FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "time_logs_update" ON public.time_logs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`,
      `CREATE POLICY "time_logs_delete" ON public.time_logs FOR DELETE USING (user_id = auth.uid() OR public.is_admin())`,

      // INVOICES
      `CREATE POLICY "invoices_select" ON public.invoices FOR SELECT USING (public.is_admin_or_pm())`,
      `CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE USING (public.is_admin())`,

      // INVOICE ITEMS
      `CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT USING (true)`,
      `CREATE POLICY "invoice_items_insert" ON public.invoice_items FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "invoice_items_update" ON public.invoice_items FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "invoice_items_delete" ON public.invoice_items FOR DELETE USING (public.is_admin_or_pm())`,

      // QUOTATIONS
      `CREATE POLICY "quotations_select" ON public.quotations FOR SELECT USING (public.is_admin_or_pm())`,
      `CREATE POLICY "quotations_insert" ON public.quotations FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "quotations_update" ON public.quotations FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "quotations_delete" ON public.quotations FOR DELETE USING (public.is_admin())`,

      // QUOTATION ITEMS
      `CREATE POLICY "quotation_items_select" ON public.quotation_items FOR SELECT USING (true)`,
      `CREATE POLICY "quotation_items_insert" ON public.quotation_items FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "quotation_items_update" ON public.quotation_items FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "quotation_items_delete" ON public.quotation_items FOR DELETE USING (public.is_admin_or_pm())`,

      // PAYMENTS
      `CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (public.is_admin_or_pm())`,
      `CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "payments_delete" ON public.payments FOR DELETE USING (public.is_admin())`,

      // EXPENSES
      `CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (public.is_admin())`,
      `CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT WITH CHECK (public.is_admin())`,
      `CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())`,
      `CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (public.is_admin())`,

      // VENDORS
      `CREATE POLICY "vendors_select" ON public.vendors FOR SELECT USING (true)`,
      `CREATE POLICY "vendors_insert" ON public.vendors FOR INSERT WITH CHECK (public.is_admin())`,
      `CREATE POLICY "vendors_update" ON public.vendors FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())`,
      `CREATE POLICY "vendors_delete" ON public.vendors FOR DELETE USING (public.is_admin())`,

      // CONTRACTS
      `CREATE POLICY "contracts_select" ON public.contracts FOR SELECT USING (public.is_admin_or_pm())`,
      `CREATE POLICY "contracts_insert" ON public.contracts FOR INSERT WITH CHECK (public.is_admin())`,
      `CREATE POLICY "contracts_update" ON public.contracts FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())`,
      `CREATE POLICY "contracts_delete" ON public.contracts FOR DELETE USING (public.is_admin())`,

      // FOLDERS
      `CREATE POLICY "folders_select" ON public.folders FOR SELECT USING (true)`,
      `CREATE POLICY "folders_insert" ON public.folders FOR INSERT WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "folders_update" ON public.folders FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "folders_delete" ON public.folders FOR DELETE USING (public.is_admin())`,

      // DOCUMENTS
      `CREATE POLICY "documents_select" ON public.documents FOR SELECT USING (true)`,
      `CREATE POLICY "documents_insert" ON public.documents FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "documents_update" ON public.documents FOR UPDATE USING (public.is_admin_or_pm()) WITH CHECK (public.is_admin_or_pm())`,
      `CREATE POLICY "documents_delete" ON public.documents FOR DELETE USING (public.is_admin())`,

      // ATTACHMENTS
      `CREATE POLICY "attachments_select" ON public.attachments FOR SELECT USING (true)`,
      `CREATE POLICY "attachments_insert" ON public.attachments FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "attachments_delete" ON public.attachments FOR DELETE USING (public.is_admin())`,

      // EMPLOYEES
      `CREATE POLICY "employees_select" ON public.employees FOR SELECT USING (public.is_admin() OR user_id = auth.uid())`,
      `CREATE POLICY "employees_insert" ON public.employees FOR INSERT WITH CHECK (public.is_admin())`,
      `CREATE POLICY "employees_update" ON public.employees FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())`,
      `CREATE POLICY "employees_delete" ON public.employees FOR DELETE USING (public.is_admin())`,

      // LEAVE REQUESTS
      `CREATE POLICY "leave_requests_select" ON public.leave_requests FOR SELECT USING (public.is_admin() OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))`,
      `CREATE POLICY "leave_requests_insert" ON public.leave_requests FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "leave_requests_update" ON public.leave_requests FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())`,
      `CREATE POLICY "leave_requests_delete" ON public.leave_requests FOR DELETE USING (public.is_admin())`,

      // ACTIVITIES
      `CREATE POLICY "activities_select" ON public.activities FOR SELECT USING (true)`,
      `CREATE POLICY "activities_insert" ON public.activities FOR INSERT WITH CHECK (true)`,

      // NOTIFICATIONS
      `CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid())`,
      `CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`,

      // CALENDAR EVENTS
      `CREATE POLICY "calendar_events_select" ON public.calendar_events FOR SELECT USING (true)`,
      `CREATE POLICY "calendar_events_insert" ON public.calendar_events FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "calendar_events_update" ON public.calendar_events FOR UPDATE USING (created_by = auth.uid() OR public.is_admin()) WITH CHECK (created_by = auth.uid() OR public.is_admin())`,
      `CREATE POLICY "calendar_events_delete" ON public.calendar_events FOR DELETE USING (created_by = auth.uid() OR public.is_admin())`,

      // SETTINGS
      `CREATE POLICY "settings_select" ON public.settings FOR SELECT USING (true)`,
      `CREATE POLICY "settings_insert" ON public.settings FOR INSERT WITH CHECK (public.is_admin())`,
      `CREATE POLICY "settings_update" ON public.settings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())`,
      `CREATE POLICY "settings_delete" ON public.settings FOR DELETE USING (public.is_admin())`,

      // TAGS
      `CREATE POLICY "tags_select" ON public.tags FOR SELECT USING (true)`,
      `CREATE POLICY "tags_insert" ON public.tags FOR INSERT WITH CHECK (public.is_admin())`,
      `CREATE POLICY "tags_update" ON public.tags FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())`,
      `CREATE POLICY "tags_delete" ON public.tags FOR DELETE USING (public.is_admin())`,

      // CUSTOM FIELDS
      `CREATE POLICY "custom_fields_select" ON public.custom_fields FOR SELECT USING (true)`,
      `CREATE POLICY "custom_fields_insert" ON public.custom_fields FOR INSERT WITH CHECK (public.is_admin())`,
      `CREATE POLICY "custom_fields_update" ON public.custom_fields FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())`,
      `CREATE POLICY "custom_fields_delete" ON public.custom_fields FOR DELETE USING (public.is_admin())`,
    ];

    let pSuccess = 0;
    let pFailed = 0;
    for (const policy of policies) {
      try {
        await client.query(policy);
        pSuccess++;
      } catch (error) {
        pFailed++;
        if (!error.message.includes('already exists')) {
          console.error('  ❌ Policy error:', error.message.substring(0, 100));
        }
      }
    }
    console.log(`\nRLS policies: ${pSuccess} created, ${pFailed} failed`);
    console.log('\n✅ Full migration complete!');

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
