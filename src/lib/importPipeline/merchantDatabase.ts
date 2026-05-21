export interface MerchantEntry {
  match: string[];
  cleanName: string;
  defaultCategory: string;
  defaultType: 'expense' | 'income' | 'transfer' | 'investment' | 'refund';
  scoreBonus: number;
}

export const MERCHANT_DATABASE: MerchantEntry[] = [
  { match: ['esewa', 'e-sewa'], cleanName: 'eSewa', defaultCategory: 'Transfers', defaultType: 'transfer', scoreBonus: 50 },
  { match: ['khalti'], cleanName: 'Khalti', defaultCategory: 'Transfers', defaultType: 'transfer', scoreBonus: 50 },
  { match: ['fonepay', 'fone pay', 'ftm', 'ibft'], cleanName: 'Fonepay', defaultCategory: 'Transfers', defaultType: 'transfer', scoreBonus: 50 },
  { match: ['ime pay', 'imepay', 'ime remit'], cleanName: 'IME Pay', defaultCategory: 'Transfers', defaultType: 'transfer', scoreBonus: 50 },
  { match: ['connectips', 'connect ips'], cleanName: 'ConnectIPS', defaultCategory: 'Transfers', defaultType: 'transfer', scoreBonus: 50 },
  { match: ['prabhu money', 'city express'], cleanName: 'Remittance', defaultCategory: 'Income', defaultType: 'income', scoreBonus: 50 },
  { match: ['worldlink', 'world link'], cleanName: 'Worldlink', defaultCategory: 'Utilities', defaultType: 'expense', scoreBonus: 50 },
  { match: ['vianet'], cleanName: 'Vianet', defaultCategory: 'Utilities', defaultType: 'expense', scoreBonus: 50 },
  { match: ['nea ', 'nepal electricity'], cleanName: 'NEA (Electricity)', defaultCategory: 'Utilities', defaultType: 'expense', scoreBonus: 50 },
  { match: ['khanepani'], cleanName: 'Khanepani (Water)', defaultCategory: 'Utilities', defaultType: 'expense', scoreBonus: 50 },
  { match: ['ntnam', 'ntpos', 'ntpst', 'nepal telecom', 'nt prepaid'], cleanName: 'Nepal Telecom', defaultCategory: 'Utilities', defaultType: 'expense', scoreBonus: 50 },
  { match: ['ncell', 'nctop', 'ncpp'], cleanName: 'Ncell', defaultCategory: 'Utilities', defaultType: 'expense', scoreBonus: 50 },
  { match: ['pathao'], cleanName: 'Pathao', defaultCategory: 'Transport', defaultType: 'expense', scoreBonus: 50 },
  { match: ['indrive', 'in drive'], cleanName: 'inDrive', defaultCategory: 'Transport', defaultType: 'expense', scoreBonus: 50 },
  { match: ['daraz'], cleanName: 'Daraz', defaultCategory: 'Shopping', defaultType: 'expense', scoreBonus: 50 },
  { match: ['bhat-bhateni', 'bhatbhateni'], cleanName: 'Bhat-Bhateni', defaultCategory: 'Groceries', defaultType: 'expense', scoreBonus: 50 },
  { match: ['foodmandu'], cleanName: 'Foodmandu', defaultCategory: 'Dining Out', defaultType: 'expense', scoreBonus: 50 },
  { match: ['salary', 'talab', 'payroll'], cleanName: 'Salary', defaultCategory: 'Salary / Income', defaultType: 'income', scoreBonus: 50 },
];

export function checkMerchantDatabase(text: string): MerchantEntry | null {
  if (!text) return null;
  const normalized = text.toLowerCase().trim();
  for (const entry of MERCHANT_DATABASE) {
    for (const keyword of entry.match) {
      if (normalized.includes(keyword.toLowerCase())) return entry;
    }
  }
  return null;
}
