// ============================================================
// WealthFlow v2 — Import Processor
// Ties together CSV parsing, column mapping, and normalization.
// Generates the ImportPreview state.
// ============================================================

import { extractDataGrid } from './csvParser';
import { detectColumns } from './columnMapper';
import { parseDate, parseAmount, cleanMerchant } from '../normalization';
import type { ImportPreview, ParsedRow, ColumnMapping } from '@/types';

export function processDataGrid(grid: string[][], fileName: string, fileType: 'csv' | 'xlsx'): ImportPreview {
  const { headers, data: rawRows } = extractDataGrid(grid);
  const { mapping, confidence } = detectColumns(headers);

  const acceptedRows: ParsedRow[] = [];
  const skippedRows: Array<ParsedRow & { reason: string }> = [];

  rawRows.forEach((rawRow, index) => {
    // 1-indexed for display, offset by header row roughly
    const displayIndex = index + 2; 

    const dateStr = mapping.dateColumn ? rawRow[mapping.dateColumn] : null;
    const descStr = mapping.descriptionColumn ? rawRow[mapping.descriptionColumn] : null;
    
    let amount: number | null = null;

    if (mapping.amountColumn) {
      amount = parseAmount(rawRow[mapping.amountColumn]);
    } else if (mapping.debitColumn || mapping.creditColumn) {
      const debitStr = mapping.debitColumn ? rawRow[mapping.debitColumn] : '';
      const creditStr = mapping.creditColumn ? rawRow[mapping.creditColumn] : '';
      
      const debitAmt = parseAmount(debitStr, true); // true = force negative
      const creditAmt = parseAmount(creditStr);

      // Usually only one is present. If both, we could sum, but normally one is empty.
      amount = (creditAmt !== null ? creditAmt : 0) + (debitAmt !== null ? debitAmt : 0);
      
      // If both were null, reset to null
      if (creditAmt === null && debitAmt === null) {
        amount = null;
      }
    }

    const parsedDate = dateStr ? parseDate(dateStr) : null;

    const rowData: ParsedRow = {
      rowIndex: displayIndex,
      date: parsedDate,
      description: descStr ? descStr.trim() : null,
      amount,
      rawData: rawRow,
    };

    if (!parsedDate) {
      skippedRows.push({ ...rowData, reason: 'Invalid or missing date' });
    } else if (amount === null) {
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
    duplicateCount: 0, // Computed later via DB check
    transferCount: 0,  // Computed later
    warnings: [],
  };
}

export function reprocessWithMapping(rawRows: Record<string, string>[], mapping: ColumnMapping): {
  acceptedRows: ParsedRow[];
  skippedRows: Array<ParsedRow & { reason: string }>;
} {
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
 
     const parsedDate = dateStr ? parseDate(dateStr) : null;
 
     const rowData: ParsedRow = {
       rowIndex: displayIndex,
       date: parsedDate,
       description: descStr ? descStr.trim() : null,
       amount,
       rawData: rawRow,
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
