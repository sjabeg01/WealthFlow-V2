import { deriveFinalType, type ClassificationContext, type FinalType } from './deriveFinalType';
import { normalizeAmount } from './normalizeAmount';

interface TestCase {
  id: number;
  description: string;
  context: ClassificationContext;
  expectedType: FinalType;
  expectedAmount: number;
}

const testCases: TestCase[] = [
  {
    id: 1,
    description: "Standard Expense: Negative amount only",
    context: { amount: -45.00 },
    expectedType: 'expense',
    expectedAmount: -45.00
  },
  {
    id: 2,
    description: "Standard Income: Positive amount only",
    context: { amount: 1500.00 },
    expectedType: 'income',
    expectedAmount: 1500.00
  },
  {
    id: 3,
    description: "Salary keyword matching (Signal 5) with positive amount",
    context: { amount: 3000.00, merchant_name: "Salary payout from ACME Corp" },
    expectedType: 'income',
    expectedAmount: 3000.00
  },
  {
    id: 4,
    description: "Refund keyword matching (Signal 5) with positive amount",
    context: { amount: 50.00, merchant_name: "Woolworths Refund" },
    expectedType: 'refund',
    expectedAmount: 50.00
  },
  {
    id: 5,
    description: "Transfer keyword matching (Signal 5) with negative amount",
    context: { amount: -100.00, merchant_name: "Transfer to Savings Account" },
    expectedType: 'transfer',
    expectedAmount: 100.00
  },
  {
    id: 6,
    description: "Transfer keyword matching (Signal 5) with positive amount",
    context: { amount: 100.00, merchant_name: "Transfer from Everyday Checking" },
    expectedType: 'transfer',
    expectedAmount: 100.00
  },
  {
    id: 7,
    description: "Investment keyword matching (Signal 5) with negative amount",
    context: { amount: -250.00, merchant_name: "VANGUARD ETF PURCHASE" },
    expectedType: 'investment',
    expectedAmount: -250.00
  },
  {
    id: 8,
    description: "Direction Column: Debit direction with positive raw amount",
    context: { amount: 45.00, transaction_direction: "debit" },
    expectedType: 'expense',
    expectedAmount: -45.00
  },
  {
    id: 9,
    description: "Direction Column: Credit direction with positive raw amount",
    context: { amount: 100.00, transaction_direction: "credit" },
    expectedType: 'income',
    expectedAmount: 100.00
  },
  {
    id: 10,
    description: "Separate Column: Debit Amount positive",
    context: { debit_amount: 30.00 },
    expectedType: 'expense',
    expectedAmount: -30.00
  },
  {
    id: 11,
    description: "Separate Column: Credit Amount positive",
    context: { credit_amount: 2500.00 },
    expectedType: 'income',
    expectedAmount: 2500.00
  },
  {
    id: 12,
    description: "Category Type Enforcement: expense_only overrides positive amount",
    context: { amount: 100.00, user_category_type: 'expense_only' },
    expectedType: 'expense',
    expectedAmount: -100.00
  },
  {
    id: 13,
    description: "Category Type Enforcement: income_only overrides negative amount",
    context: { amount: -50.00, user_category_type: 'income_only' },
    expectedType: 'income',
    expectedAmount: 50.00
  },
  {
    id: 14,
    description: "Category Type Enforcement overrides Direction Column (Signal 1 beats Signal 2)",
    context: { amount: 100.00, transaction_direction: 'credit', user_category_type: 'expense_only' },
    expectedType: 'expense',
    expectedAmount: -100.00
  },
  {
    id: 15,
    description: "Direction Column overrides Keyword Matching (Signal 2 beats Signal 5)",
    context: { amount: 100.00, transaction_direction: 'credit', merchant_name: 'Transfer to Savings' },
    expectedType: 'income',
    expectedAmount: 100.00
  },
  {
    id: 16,
    description: "No signals default: Low confidence review trigger",
    context: { merchant_name: 'Unknown Merchant String' },
    expectedType: 'needs_review',
    expectedAmount: 0.00
  }
];

function runTests() {
  console.log("=== Transaction Classification Engine Audit Suite ===\n");
  console.log("| ID | Case Description | Input Context | Expected Type | Actual Type | Expected Sign | Actual Sign | Status |");
  console.log("|---|---|---|---|---|---|---|---|");

  let allPassed = true;

  for (const tc of testCases) {
    const res = deriveFinalType(tc.context);
    const rawAmt = tc.context.amount ?? tc.context.debit_amount ?? tc.context.credit_amount ?? 0;
    const signedAmt = normalizeAmount(rawAmt, res.final_type);

    const typePass = res.final_type === tc.expectedType;
    const amtPass = signedAmt === tc.expectedAmount;
    const passed = typePass && amtPass;

    if (!passed) {
      allPassed = false;
    }

    const inputDesc = JSON.stringify(tc.context);
    const statusText = passed ? "✅ PASS" : "❌ FAIL";

    console.log(
      `| ${tc.id} | ${tc.description} | \`${inputDesc}\` | \`${tc.expectedType}\` | \`${res.final_type}\` | \`${tc.expectedAmount}\` | \`${signedAmt}\` | ${statusText} |`
    );
  }

  console.log("\nVerdict:");
  if (allPassed) {
    console.log("✅ ALL 16 CLASSIFICATION TEST CASES PASSED PERFECTLY!");
    process.exit(0);
  } else {
    console.log("❌ SOME TEST CASES FAILED! PLEASE AUDIT ENGINE LOGIC.");
    process.exit(1);
  }
}

runTests();
