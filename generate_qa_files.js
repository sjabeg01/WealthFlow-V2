const fs = require('fs');
const XLSX = require('xlsx');

const data = [
  ['Date', 'Description', 'Amount', 'Category'],
  ['2026-05-01', 'Salary Payment', '5000.00', 'Income'],
  ['2026-05-02', 'Grocery Store', '-150.25', 'Groceries'],
  ['2026-05-03', 'Rent Payment', '-2000.00', 'Housing'],
  ['2026-05-04', 'Internet Bill', '-80.00', 'Utilities'],
  ['2026-05-05', 'Bonus Check', '500.00', 'Income']
];

// Generate CSV
const csvContent = data.map(row => row.join(',')).join('\n');
fs.writeFileSync('qa-test.csv', csvContent);

// Generate XLSX
const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'qa-test.xlsx');

console.log('Generated qa-test.csv and qa-test.xlsx');
