import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Reads a File (CSV or XLSX) and returns the raw 2D array of strings.
 */
export async function parseFileToGrid(file: File): Promise<{ grid: string[][], fileType: 'csv' | 'xlsx' }> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv' || file.type.includes('csv')) {
    const text = await file.text();
    const result = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: 'greedy',
    });
    
    if (result.errors.length > 0 && result.data.length === 0) {
      throw new Error('Failed to parse CSV file.');
    }
    
    return { grid: result.data, fileType: 'csv' };
  } else if (
    extension === 'xlsx' || 
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    
    if (workbook.SheetNames.length === 0) {
      throw new Error('No worksheet data found in this Excel file.');
    }
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to 2D array
    // raw: true combined with cellDates: true outputs native JS Date objects for date cells
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { 
      header: 1, 
      raw: true,
      defval: '' // fill empty cells with empty string
    });
    
    // Ensure all values are strings, handling JS Dates gracefully
    const stringGrid = data.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) return '';
        if (cell instanceof Date) {
          // JS Date from XLSX is in UTC. Output as YYYY-MM-DD
          return cell.toISOString().split('T')[0];
        }
        return String(cell).trim();
      })
    );
    
    if (stringGrid.length === 0) {
      throw new Error('The Excel file is empty.');
    }
    
    return { grid: stringGrid, fileType: 'xlsx' };
  } else {
    throw new Error('Unsupported file type. Please upload a CSV or XLSX file.');
  }
}
