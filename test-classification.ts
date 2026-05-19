import { deriveFinalType } from './src/lib/importPipeline/deriveFinalType';

const testCases = [
  { description: "Main job salary", amount: 3200, expect: 'income' },
  { description: "Apartment rent", amount: 1200, expect: 'expense' },
  { description: "Weekly groceries", amount: 180, expect: 'expense' },
  { description: "Monthly savings transfer", amount: 400, expect: 'transfer' },
  { description: "Electricity and internet", amount: 140, expect: 'expense' },
  { description: "VAS/VGS investment", amount: 300, expect: 'investment' },
  { description: "Health insurance payment", amount: 240, expect: 'expense' },
  { description: "Random unknown string", amount: 50, expect: 'needs_review' }
];

let passed = 0;

console.log("Starting Keyword Classification Fallback Tests...");
testCases.forEach((tc, idx) => {
  const result = deriveFinalType({
    merchant_name: tc.description,
    amount: tc.amount
  });

  if (result.final_type === tc.expect) {
    console.log(`[PASS] Case ${idx + 1}: ${tc.description} -> ${result.final_type}`);
    passed++;
  } else {
    console.error(`[FAIL] Case ${idx + 1}: ${tc.description}`);
    console.error(`  Expected: ${tc.expect}`);
    console.error(`  Got: ${result.final_type} (Reason: ${result.reason})`);
  }
});

console.log(`\nResults: ${passed}/${testCases.length} passing`);
if (passed !== testCases.length) {
  process.exit(1);
}
