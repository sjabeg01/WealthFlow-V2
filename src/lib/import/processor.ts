// ============================================================
// Rakam v2 — Import Processor
// Ties together CSV parsing, column mapping, and normalization.
// Generates the ImportPreview state.
// ============================================================

import { extractDataGrid } from './csvParser';
import { detectColumns } from './columnMapper';
import { parseDate, parseAmount, cleanMerchant, detectCategory, classifyFinalType } from '../normalization';
import type { ImportPreview, ParsedRow, ColumnMapping } from '@/types';

export function processDataGrid(grid: string[][], fileName: string, fileType: 'csv' | 'xlsx'): ImportPreview {
  const { headers, data: rawRows } = extractDataGrid(grid);
  const { mapping, confidence } = detectColumns(headers);

  // Scan date column to detect dominant date format (US vs AU)
  let formatPreference: 'US' | 'AU' = 'AU';
  if (mapping.dateColumn) {
    let auCount = 0;
    let usCount = 0;
    rawRows.forEach((rawRow) => {
      const dateStr = rawRow[mapping.dateColumn!];
      if (dateStr) {
        const match = dateStr.trim().match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2,4})$/);
        if (match) {
          const n1 = parseInt(match[1]);
          const n2 = parseInt(match[2]);
          if (n1 > 12 && n2 <= 12) {
            auCount++;
          } else if (n2 > 12 && n1 <= 12) {
            usCount++;
          }
        }
      }
    });
    if (usCount > auCount) {
      formatPreference = 'US';
    }
  }

  const acceptedRows: ParsedRow[] = [];
  const skippedRows: Array<ParsedRow & { reason: string }> = [];
  const warnings: string[] = [];

  // Multi-account check
  if (mapping.accountColumn) {
    const distinctAccounts = new Set<string>();
    rawRows.forEach((r) => {
      const acc = r[mapping.accountColumn!];
      if (acc && acc.trim()) {
        distinctAccounts.add(acc.trim());
      }
    });
    if (distinctAccounts.size > 1) {
      warnings.push(
        `This file contains rows for multiple accounts: ${Array.from(distinctAccounts).join(', ')}. All accepted transactions will be imported into the selected target account.`
      );
    }
  }

  const hasLowConfidence = 
    confidence.dateColumn === 'low' ||
    confidence.descriptionColumn === 'low' ||
    confidence.amountColumn === 'low';
  if (hasLowConfidence) {
    warnings.push("Confidence in the auto-detected column mapping is low. Please review and correct the column selection if needed.");
  }

  rawRows.forEach((rawRow, index) => {
    const displayIndex = index + 2; 

    const dateStr = mapping.dateColumn ? rawRow[mapping.dateColumn] : null;
    const descStr = mapping.descriptionColumn ? rawRow[mapping.descriptionColumn] : null;
    
    let amount: number | null = null;

    if (mapping.amountColumn) {
      amount = parseAmount(rawRow[mapping.amountColumn]);
    } else if (mapping.debitColumn || mapping.creditColumn) {
      const debitStr = mapping.debitColumn ? rawRow[mapping.debitColumn] : '';
      const creditStr = mapping.creditColumn ? rawRow[mapping.creditColumn] : '';
      
      const debitAmt = parseAmount(debitStr, true);
      const creditAmt = parseAmount(creditStr);

      amount = (creditAmt !== null ? creditAmt : 0) + (debitAmt !== null ? debitAmt : 0);
      
      if (creditAmt === null && debitAmt === null) {
        amount = null;
      }
    }

    const parsedDate = dateStr ? parseDate(dateStr, formatPreference) : null;

    // Classification Rules: Category Auto-detect & Inferred type
    let inferredCategoryName = 'Uncategorized';
    let inferredCategoryType = 'expense';

    if (amount !== null && descStr) {
      const merchant = cleanMerchant(descStr);
      if (mapping.categoryColumn && rawRow[mapping.categoryColumn]) {
        inferredCategoryName = rawRow[mapping.categoryColumn].trim();
      } else {
        const { categoryName } = detectCategory(descStr, merchant);
        inferredCategoryName = categoryName || 'Uncategorized';
      }

      const { finalType } = classifyFinalType(amount, descStr, merchant);
      inferredCategoryType = finalType;
    }

    const rowData: ParsedRow = {
      rowIndex: displayIndex,
      date: parsedDate,
      description: descStr ? descStr.trim() : null,
      amount,
      rawData: rawRow,
      inferredCategoryName,
      inferredCategoryType,
    };

    if (!parsedDate) {
      skippedRows.push({ ...rowData, reason: 'Invalid or missing date' });
    } else if (amount === null || isNaN(amount)) {
      skippedRows.push({ ...rowData, reason: 'Invalid or missing amount' });
    } else if (!descStr) {
      skippedRows.push({ ...rowData, reason: 'Missing description' });
    } else {
      acceptedRows.push(rowData);
    }
  });

  return {
    fileName,
    fileType,
    headers,
    columnMapping: mapping,
    columnMappingConfidence: confidence,
    acceptedRows,
    skippedRows,
    duplicateCount: 0,
    transferCount: 0,
    warnings,
  };
}

export function reprocessWithMapping(rawRows: Record<string, string>[], mapping: ColumnMapping): {
  acceptedRows: ParsedRow[];
  skippedRows: Array<ParsedRow & { reason: string }>;
} {
  let formatPreference: 'US' | 'AU' = 'AU';
  if (mapping.dateColumn) {
    let auCount = 0;
    let usCount = 0;
    rawRows.forEach((rawRow) => {
      const dateStr = rawRow[mapping.dateColumn!];
      if (dateStr) {
        const match = dateStr.trim().match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2,4})$/);
        if (match) {
          const n1 = parseInt(match[1]);
          const n2 = parseInt(match[2]);
          if (n1 > 12 && n2 <= 12) {
            auCount++;
          } else if (n2 > 12 && n1 <= 12) {
            usCount++;
          }
        }
      }
    });
    if (usCount > auCount) {
      formatPreference = 'US';
    }
  }

  const acceptedRows: ParsedRow[] = [];
  const skippedRows: Array<ParsedRow & { reason: string }> = [];

  rawRows.forEach((rawRow, index) => {
    const displayIndex = index + 2; 

    const dateStr = mapping.dateColumn ? rawRow[mapping.dateColumn] : null;
    const descStr = mapping.descriptionColumn ? rawRow[mapping.descriptionColumn] : null;
    
    let amount: number | null = null;

    if (mapping.amountColumn) {
      amount = parseAmount(rawRow[mapping.amountColumn]);
    } else if (mapping.debitColumn || mapping.creditColumn) {
      const debitStr = mapping.debitColumn ? rawRow[mapping.debitColumn] : '';
      const creditStr = mapping.creditColumn ? rawRow[mapping.creditColumn] : '';
      
      const debitAmt = parseAmount(debitStr, true);
      const creditAmt = parseAmount(creditStr);

      amount = (creditAmt !== null ? creditAmt : 0) + (debitAmt !== null ? debitAmt : 0);
      
      if (creditAmt === null && debitAmt === null) {
        amount = null;
      }
    }

    const parsedDate = dateStr ? parseDate(dateStr, formatPreference) : null;

    // Classification Rules: Category Auto-detect & Inferred type
    let inferredCategoryName = 'Uncategorized';
    let inferredCategoryType = 'expense';

    if (amount !== null && descStr) {
      const merchant = cleanMerchant(descStr);
      if (mapping.categoryColumn && rawRow[mapping.categoryColumn]) {
        inferredCategoryName = rawRow[mapping.categoryColumn].trim();
      } else {
        const { categoryName } = detectCategory(descStr, merchant);
        inferredCategoryName = categoryName || 'Uncategorized';
      }

      const { finalType } = classifyFinalType(amount, descStr, merchant);
      inferredCategoryType = finalType;
    }

    const rowData: ParsedRow = {
      rowIndex: displayIndex,
      date: parsedDate,
      description: descStr ? descStr.trim() : null,
      amount,
      rawData: rawRow,
      inferredCategoryName,
      inferredCategoryType,
    };

    if (!parsedDate) {
      skippedRows.push({ ...rowData, reason: 'Invalid or missing date' });
    } else if (amount === null || isNaN(amount)) {
      skippedRows.push({ ...rowData, reason: 'Invalid or missing amount' });
    } else if (!descStr) {
      skippedRows.push({ ...rowData, reason: 'Missing description' });
    } else {
      acceptedRows.push(rowData);
    }
  });

  return { acceptedRows, skippedRows };
}
