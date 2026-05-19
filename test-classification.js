"use strict";

// src/lib/importPipeline/deriveFinalType.ts
function toNumber(value) {
  if (value === null || value === void 0 || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}
function normalizeText(parts) {
  return ` ${parts.filter(Boolean).join(" ").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()} `;
}
function hasAny(text, phrases) {
  for (const phrase of phrases) {
    const normalized = ` ${phrase.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
    if (text.includes(normalized)) return phrase;
  }
  return null;
}
var TRANSFER_KEYWORDS = [
  "transfer",
  "savings transfer",
  "monthly savings",
  "internal transfer",
  "account transfer",
  "between accounts",
  "tfr"
];
var INVESTMENT_KEYWORDS = [
  "investment",
  "invest",
  "etf",
  "vgs",
  "vas",
  "shares",
  "stocks",
  "fund",
  "portfolio",
  "brokerage",
  "crypto",
  "bitcoin"
];
var REFUND_KEYWORDS = [
  "refund",
  "reimbursement",
  "cashback",
  "cash back"
];
var INCOME_HIGH_KEYWORDS = [
  "salary",
  "wage",
  "wages",
  "payroll",
  "revenue",
  "bonus",
  "commission",
  "dividend",
  "interest",
  "payment received",
  "deposit received",
  "grant",
  "stipend",
  "pension",
  "benefit",
  "allowance"
];
var INCOME_MEDIUM_KEYWORDS = [
  "income",
  "earning",
  "earnings",
  "profit",
  "freelance",
  "invoice",
  "client",
  "deposit"
];
var EXPENSE_HIGH_KEYWORDS = [
  "rent",
  "groceries",
  "grocery",
  "electricity",
  "internet",
  "fuel",
  "transport",
  "restaurant",
  "takeaway",
  "insurance",
  "health insurance",
  "medical",
  "doctor",
  "dentist",
  "hospital",
  "pharmacy",
  "utility",
  "utilities",
  "bill",
  "mortgage",
  "loan",
  "supermarket",
  "petrol",
  "gas",
  "parking",
  "toll",
  "subscription",
  "netflix",
  "spotify",
  "amazon"
];
var EXPENSE_MEDIUM_KEYWORDS = [
  "food",
  "coffee",
  "dining",
  "shopping",
  "clothes",
  "accessories",
  "gym",
  "tax",
  "fee",
  "charge",
  "repair",
  "maintenance",
  "hardware",
  "furniture",
  "equipment",
  "supplies",
  "printing",
  "postage",
  "courier",
  "education",
  "school",
  "tuition",
  "childcare",
  "pet",
  "vet",
  "cleaning",
  "laundry",
  "haircut",
  "beauty",
  "travel",
  "hotel",
  "accommodation",
  "airfare",
  "flight",
  "ticket",
  "entertainment",
  "cinema",
  "dinner",
  "trip"
];
function deriveFinalType(context) {
  if (context.user_category_type === "expense_only") {
    return {
      final_type: "expense",
      confidence: "high",
      reason: "Category type override: expense_only"
    };
  }
  if (context.user_category_type === "income_only") {
    return {
      final_type: "income",
      confidence: "high",
      reason: "Category type override: income_only"
    };
  }
  if (context.transaction_direction) {
    const dir = String(context.transaction_direction).toLowerCase().trim();
    if (["debit", "dr", "withdrawal", "withdraw", "expense", "out", "purchase"].some(
      (v) => dir.includes(v)
    )) {
      return {
        final_type: "expense",
        confidence: "high",
        reason: `Direction classified as expense: ${context.transaction_direction}`
      };
    }
    if (["credit", "cr", "deposit", "income", "received"].some(
      (v) => dir.includes(v)
    )) {
      return {
        final_type: "income",
        confidence: "high",
        reason: `Direction classified as income: ${context.transaction_direction}`
      };
    }
    if (["transfer", "internal", "xfer", "inter account"].some(
      (v) => dir.includes(v)
    )) {
      return {
        final_type: "transfer",
        confidence: "high",
        reason: `Direction classified as transfer: ${context.transaction_direction}`
      };
    }
  }
  const debitAmount = toNumber(context.debit_amount);
  if (debitAmount !== null && debitAmount > 0) {
    return {
      final_type: "expense",
      confidence: "high",
      reason: "Positive debit_amount signal"
    };
  }
  const creditAmount = toNumber(context.credit_amount);
  if (creditAmount !== null && creditAmount > 0) {
    return {
      final_type: "income",
      confidence: "high",
      reason: "Positive credit_amount signal"
    };
  }
  const amount = toNumber(context.amount);
  if (amount !== null && amount < 0) {
    return {
      final_type: "expense",
      confidence: "high",
      reason: "Negative amount signal"
    };
  }
  const text = normalizeText([
    context.description,
    context.merchant_name,
    context.category_hint
  ]);
  const transferMatch = hasAny(text, TRANSFER_KEYWORDS);
  if (transferMatch) {
    return {
      final_type: "transfer",
      confidence: "high",
      reason: `Transfer keyword match: ${transferMatch}`
    };
  }
  const investmentMatch = hasAny(text, INVESTMENT_KEYWORDS);
  if (investmentMatch) {
    return {
      final_type: "investment",
      confidence: "high",
      reason: `Investment keyword match: ${investmentMatch}`
    };
  }
  const refundMatch = hasAny(text, REFUND_KEYWORDS);
  if (refundMatch) {
    return {
      final_type: "refund",
      confidence: "high",
      reason: `Refund keyword match: ${refundMatch}`
    };
  }
  const incomeHighMatch = hasAny(text, INCOME_HIGH_KEYWORDS);
  if (incomeHighMatch) {
    return {
      final_type: "income",
      confidence: "high",
      reason: `Income keyword match: ${incomeHighMatch}`
    };
  }
  const expenseHighMatch = hasAny(text, EXPENSE_HIGH_KEYWORDS);
  if (expenseHighMatch) {
    return {
      final_type: "expense",
      confidence: "high",
      reason: `Expense keyword match: ${expenseHighMatch}`
    };
  }
  const incomeMediumMatch = hasAny(text, INCOME_MEDIUM_KEYWORDS);
  if (incomeMediumMatch) {
    return {
      final_type: "income",
      confidence: "medium",
      reason: `Income keyword match: ${incomeMediumMatch}`
    };
  }
  const expenseMediumMatch = hasAny(text, EXPENSE_MEDIUM_KEYWORDS);
  if (expenseMediumMatch) {
    return {
      final_type: "expense",
      confidence: "medium",
      reason: `Expense keyword match: ${expenseMediumMatch}`
    };
  }
  return {
    final_type: "needs_review",
    confidence: "low",
    reason: "No reliable classification signal found"
  };
}

// test-classification.ts
var testCases = [
  { description: "Main job salary", amount: 3200, expect: "income" },
  { description: "Apartment rent", amount: 1200, expect: "expense" },
  { description: "Weekly groceries", amount: 180, expect: "expense" },
  { description: "Monthly savings transfer", amount: 400, expect: "transfer" },
  { description: "Electricity and internet", amount: 140, expect: "expense" },
  { description: "VAS/VGS investment", amount: 300, expect: "investment" },
  { description: "Health insurance payment", amount: 240, expect: "expense" },
  { description: "Random unknown string", amount: 50, expect: "needs_review" }
];
var passed = 0;
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
console.log(`
Results: ${passed}/${testCases.length} passing`);
if (passed !== testCases.length) {
  process.exit(1);
}
