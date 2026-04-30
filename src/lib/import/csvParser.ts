// ============================================================
// WealthFlow v2 — CSV Parser
// Handles finding the actual data table inside a messy bank CSV.
// ============================================================

import Papa from 'papaparse';

/**
 * Takes a raw 2D string array, finds the header row (skipping title noise),
 * and returns the headers and data rows.
 */
export function extractDataGrid(rows: string[][]): { headers: string[]; data: Record<string, string>[] } {
  if (!rows || rows.length === 0) {
    throw new Error('File appears to be empty.');
  }

  // 1. Find the header row
  // We assume the header row is the first row that has a 'Date' column 
  // or looks like it has standard column names.
  let headerRowIndex = 0;
  let bestScore = -1;

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;
    
    let score = 0;
    const rowString = row.join(' ').toLowerCase();
    
    if (rowString.includes('date')) score += 3;
    if (rowString.includes('amount') || rowString.includes('debit') || rowString.includes('credit')) score += 3;
    if (rowString.includes('description') || rowString.includes('details')) score += 3;
    if (rowString.includes('balance')) score += 1;

    // Reject rows that are too short (e.g., just "Account Name", "Value")
    if (row.length < 2) score = -1;

    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = i;
    }
  }

  // If no good header found, fallback to first row that has > 2 columns
  if (bestScore <= 0) {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].length > 2) {
        headerRowIndex = i;
        break;
      }
    }
  }

  const rawHeaders = rows[headerRowIndex] || [];
  
  // Clean headers (trim, handle duplicates)
  const headers: string[] = [];
  rawHeaders.forEach((h, index) => {
    let cleanHeader = h ? h.trim() : `Column ${index + 1}`;
    if (headers.includes(cleanHeader)) {
      cleanHeader = `${cleanHeader} (${index})`;
    }
    headers.push(cleanHeader);
  });

  // 2. Extract data rows mapped to headers
  const dataRows: Record<string, string>[] = [];
  
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty or summary rows at the bottom
    if (!row || row.length < headers.length - 1) continue;
    
    const rowData: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      rowData[headers[j]] = row[j] ? row[j].trim() : '';
    }
    
    // Validate that it has at least some data
    const hasData = Object.values(rowData).some(val => val.length > 0);
    if (hasData) {
      dataRows.push(rowData);
    }
  }

  return { headers, data: dataRows };
}
