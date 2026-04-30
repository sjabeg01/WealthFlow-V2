// ============================================================
// WealthFlow v2 — QA Data Cleanup Script
// Cleans app data for approved test accounts ONLY.
// Does NOT create any new auth users.
//
// Approved accounts:
//   testuser1@test.com (password: admin)
//   tester_final_1@example.com (password: admin)
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser (no dotenv dependency)
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const APPROVED_EMAILS = [
  'testuser1@test.com',
  'tester_final_1@example.com',
];

async function cleanAppData() {
  // Only clean the email passed as argument, or both if none specified
  const targetEmail = process.argv[2];
  const emails = targetEmail ? [targetEmail] : APPROVED_EMAILS;

  for (const email of emails) {
    if (!APPROVED_EMAILS.includes(email)) {
      console.error(`BLOCKED: ${email} is not an approved QA account.`);
      continue;
    }

    console.log(`\n--- Cleaning app data for: ${email} ---`);

    // Find user ID
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) { console.error('Failed to list users:', error.message); continue; }

    const user = users?.find(u => u.email === email);
    if (!user) {
      console.log(`  User ${email} not found in auth. Skipping.`);
      continue;
    }

    const userId = user.id;
    console.log(`  Found user: ${userId}`);

    // Confirm email if not confirmed
    if (!user.email_confirmed_at) {
      console.log('  Confirming email...');
      await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
    }

    // Clean app data in dependency order
    const tables = ['transactions', 'import_rows', 'import_batches', 'investments', 'goals', 'accounts'];
    for (const table of tables) {
      const col = table === 'import_rows' ? 'batch_id' : 'user_id';
      if (table === 'import_rows') {
        // import_rows references import_batches, clean via batch
        const { data: batches } = await supabase.from('import_batches').select('id').eq('user_id', userId);
        if (batches && batches.length > 0) {
          const batchIds = batches.map(b => b.id);
          const { error: delErr } = await supabase.from('import_rows').delete().in('batch_id', batchIds);
          console.log(`  import_rows: ${delErr ? 'ERROR - ' + delErr.message : 'cleaned'}`);
        } else {
          console.log(`  import_rows: nothing to clean`);
        }
      } else {
        const { error: delErr } = await supabase.from(table).delete().eq('user_id', userId);
        console.log(`  ${table}: ${delErr ? 'ERROR - ' + delErr.message : 'cleaned'}`);
      }
    }

    console.log(`  Done: ${email} is now a clean slate.`);
  }
}

cleanAppData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
