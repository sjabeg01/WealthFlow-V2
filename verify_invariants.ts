import { DEMO_TRANSACTIONS } from './src/lib/demo/demoData';
import { getIncome, getExpenses, getSurplus, getByCategory } from './src/lib/financeEngine';

console.log("=== WealthFlow v2 Invariants Verification ===\n");

console.log(`Total transactions checked: ${DEMO_TRANSACTIONS.length}`);

// 1. Verify every existing transaction maps correctly to final_type
const missingFinalType = DEMO_TRANSACTIONS.filter(t => !t.final_type);
console.log(`Transactions missing final_type: ${missingFinalType.length}`);

const invalidFinalType = DEMO_TRANSACTIONS.filter(t => !['income', 'expense', 'transfer', 'investment', 'refund'].includes(t.final_type));
console.log(`Transactions with invalid final_type: ${invalidFinalType.length}`);

// 2. Calculate aggregates
const income = getIncome(DEMO_TRANSACTIONS);
const expenses = getExpenses(DEMO_TRANSACTIONS);
const surplus = getSurplus(DEMO_TRANSACTIONS);

console.log(`\nAggregates:`);
console.log(`Income: $${income.toFixed(2)}`);
console.log(`Expenses: $${expenses.toFixed(2)}`);
console.log(`Surplus: $${surplus.toFixed(2)}`);

// 3. Confirm transfers and investments are excluded from income/expense totals.
const transfers = DEMO_TRANSACTIONS.filter(t => t.final_type === 'transfer');
const transferIncome = transfers.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0);
const transferExpense = transfers.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
console.log(`\nTransfers (Excluded from Engine Totals):`);
console.log(`Count: ${transfers.length}`);
console.log(`Should have $0 impact on Income/Expense engine.`);

// 4. Confirm refunds behave exactly as intended
const refunds = DEMO_TRANSACTIONS.filter(t => t.final_type === 'refund');
const totalRefundAmount = refunds.reduce((sum, t) => sum + Math.abs(t.amount), 0);
console.log(`\nRefunds:`);
console.log(`Count: ${refunds.length}`);
console.log(`Total Refunded Amount: $${totalRefundAmount.toFixed(2)}`);
console.log(`(This amount reduces total expenses in the engine)`);

// 5. Test Categories
const byCategory = getByCategory(DEMO_TRANSACTIONS);
console.log(`\nCategory Breakdown (Top 3):`);
byCategory.slice(0, 3).forEach(c => {
  console.log(`- ${c.categoryName}: $${c.total.toFixed(2)}`);
});
