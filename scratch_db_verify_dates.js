const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: batches } = await supabase.from('import_batches').select('*').order('imported_at', { ascending: false }).limit(1);
  if (batches && batches.length > 0) {
    const { data: rows } = await supabase.from('import_rows').select('raw_data').eq('batch_id', batches[0].id).limit(5);
    console.log("Sample raw CSV rows:");
    rows.forEach((r, i) => console.log(i, r.raw_data));
    
    // Also get the row with the max date
    const { data: latestTxs } = await supabase.from('transactions').select('date, amount, description').eq('import_batch_id', batches[0].id).order('date', { ascending: false }).limit(5);
    console.log("Latest transaction dates parsed:");
    console.log(latestTxs);
  }
}
run();
