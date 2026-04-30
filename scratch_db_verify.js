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
  console.log("=== DB VERIFICATION ===");
  
  // Get latest import batch
  const { data: batches, error: batchError } = await supabase
    .from('import_batches')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(5);
    
  if (batches && batches.length > 0) {
    const latestBatch = batches[0];
    console.log("Latest Batch Account ID:", latestBatch.account_id);
    console.log("Latest Batch User ID:", latestBatch.user_id);
    
    // Check transactions for this user and account
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', latestBatch.user_id)
      .eq('account_id', latestBatch.account_id);
      
    if (txError) console.error("Tx error:", txError);
    console.log(`Found ${txs?.length || 0} transactions for this user/account combination.`);
    
    if (txs && txs.length > 0) {
      console.log("Sample Transaction Keys:", Object.keys(txs[0]));
      // Analyze transaction dates (assuming it's 'date')
      const dates = txs.map(t => new Date(t.date).getTime());
      const minDate = new Date(Math.min(...dates)).toISOString();
      const maxDate = new Date(Math.max(...dates)).toISOString();
      console.log(`Transaction Date Range: ${minDate} to ${maxDate}`);
      
      const sample = txs[0];
      console.log("Sample tx:", sample);
    } else {
      // Check if there are any transactions AT ALL in the DB
      const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
      console.log("Total transactions in entire DB:", count);
      
      // Let's get one transaction just to see columns
      const { data: oneTx } = await supabase.from('transactions').select('*').limit(1);
      if (oneTx && oneTx.length > 0) {
         console.log("Random Transaction Keys:", Object.keys(oneTx[0]));
      }
    }
  }
}

run();
