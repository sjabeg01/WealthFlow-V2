import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runTest() {
  console.log('--- STARTING BACKEND SMOKE TEST ---');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const testEmail = `testwealthflow${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';

  console.log('1. Testing Signup...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.error('Signup failed:', authError.message);
    return;
  }
  console.log('Signup success:', authData.user?.id);

  console.log('2. Testing Login...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (loginError) {
    console.error('Login failed:', loginError.message);
    return;
  }
  console.log('Login success, access token received.');

  console.log('3. Testing RLS / Insert Transaction...');
  const { data: txData, error: txError } = await supabase.from('transactions').insert([
    {
      user_id: loginData.user.id,
      date: '2026-04-25',
      amount: -50.00,
      description: 'Test Smoke Transaction',
      direction: 'debit',
      category_id: null
    }
  ]).select();

  if (txError) {
    console.error('Transaction insert failed:', txError.message);
  } else {
    console.log('Transaction insert success, row count:', txData?.length);
  }

  console.log('4. Cleaning up test user...');
  await adminClient.auth.admin.deleteUser(loginData.user.id);
  console.log('Cleanup success.');
  
  console.log('--- TEST COMPLETE ---');
}

runTest();
