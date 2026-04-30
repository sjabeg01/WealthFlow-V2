import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format, parse, isValid } from 'date-fns';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

/**
 * Parses URL search parameters to safely extract a valid DateRange.
 * Falls back to Current Month if parameters are missing or invalid.
 */
export function parseDateParams(searchParams: { [key: string]: string | string[] | undefined }): DateRange {
  const fromParam = searchParams.from as string;
  const toParam = searchParams.to as string;

  const now = new Date();
  const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const currentMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  // Fast fallback if neither exists
  if (!fromParam || !toParam) {
    return { from: '2000-01-01', to: '2100-12-31' };
  }

  // Validate format YYYY-MM-DD
  const fromDate = parse(fromParam, 'yyyy-MM-dd', new Date());
  const toDate = parse(toParam, 'yyyy-MM-dd', new Date());

  if (isValid(fromDate) && isValid(toDate)) {
    // Ensure from is before or equal to to
    if (fromDate <= toDate) {
      return { from: fromParam, to: toParam };
    }
    // If from > to, swap them
    return { from: toParam, to: fromParam };
  }

  return { from: '2000-01-01', to: '2100-12-31' };
}

/**
 * Generates common preset ranges for the Period Selector
 */
export function getPresetRanges(): { label: string; range: DateRange }[] {
  const now = new Date();
  
  return [
    {
      label: 'This Month',
      range: {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    },
    {
      label: 'Last Month',
      range: {
        from: format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
        to: format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
      }
    },
    {
      label: 'All Time',
      range: {
        from: '2000-01-01',
        to: '2100-12-31',
      }
    }
  ];
}
