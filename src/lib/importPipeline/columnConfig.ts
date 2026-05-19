// src/lib/importPipeline/columnConfig.ts

export interface MappableColumn {
  key: string;
  label: string;
  required: boolean;
  hint: string;
  examples?: string[];
}

export const MAPPABLE_COLUMNS: MappableColumn[] = [
  {
    key: 'date',
    label: 'Transaction Date',
    required: true,
    hint: 'The date the transaction occurred.',
    examples: ['2024-01-15', '15/01/2024', 'Jan 15 2024']
  },
  {
    key: 'merchant_name',
    label: 'Merchant / Description',
    required: true,
    hint: 'Who the transaction was with.',
    examples: ['Family Dinner', 'Salary Deposit', 'Apartment Rent']
  },
  {
    key: 'amount',
    label: 'Amount (Single Column)',
    required: false,
    hint: 'Use this if your bank provides one column. Negative = expense, Positive = income.',
    examples: ['-145.00', '3600.00', '-1300.00']
  },
  {
    key: 'debit_amount',
    label: 'Debit Amount (Money Out)',
    required: false,
    hint: 'Use this if your bank provides separate debit and credit columns.',
    examples: ['145.00', '1300.00']
  },
  {
    key: 'credit_amount',
    label: 'Credit Amount (Money In)',
    required: false,
    hint: 'Use this if your bank provides separate debit and credit columns.',
    examples: ['3600.00', '50000.00']
  },
  {
    key: 'transaction_direction',
    label: 'Transaction Type / Direction',
    required: false,
    hint: 'A column that says Debit, Credit, Withdrawal, Deposit, etc.',
    examples: ['Debit', 'Credit', 'Withdrawal', 'Deposit', 'Transfer', 'DR', 'CR']
  },
  {
    key: 'category_hint',
    label: 'Category (Bank-Provided, Optional)',
    required: false,
    hint: 'If your bank exports a category column, map it here to improve auto-classification.',
    examples: ['Dining Out', 'Salary', 'Rent']
  }
];
