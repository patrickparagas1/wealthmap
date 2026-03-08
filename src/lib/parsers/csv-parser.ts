// ============================================================================
// CSV Parser — Papa Parse wrapper for bank/investment CSV imports
// All processing happens in the browser — no data leaves the device
// ============================================================================

import Papa from 'papaparse';

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string | number>[];
  rowCount: number;
}

/**
 * Parse a CSV file with auto-delimiter detection and dynamic typing.
 * Uses Web Worker when available for non-blocking parsing.
 */
export function parseCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string | number>[];
        resolve({
          headers,
          rows,
          rowCount: rows.length,
        });
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

// Common bank CSV column name mappings
const COLUMN_ALIASES: Record<string, string[]> = {
  date: ['date', 'transaction date', 'post date', 'posting date', 'trans date', 'effective date'],
  description: ['description', 'memo', 'narrative', 'details', 'transaction', 'payee', 'name'],
  amount: ['amount', 'transaction amount', 'debit/credit', 'net amount'],
  debit: ['debit', 'withdrawal', 'withdrawals', 'debit amount', 'money out'],
  credit: ['credit', 'deposit', 'deposits', 'credit amount', 'money in'],
  balance: ['balance', 'running balance', 'available balance', 'current balance', 'ending balance'],
  category: ['category', 'type', 'transaction type', 'trans type'],
};

/**
 * Map CSV headers to standardized field names using common bank aliases.
 */
export function mapCSVHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const [standard, aliases] of Object.entries(COLUMN_ALIASES)) {
    const matchIndex = lowerHeaders.findIndex((h) => aliases.includes(h));
    if (matchIndex !== -1) {
      mapping[standard] = headers[matchIndex];
    }
  }

  return mapping;
}

export interface NormalizedTransaction {
  date: string;
  description: string;
  amount: number;
  balance?: number;
  category?: string;
}

/**
 * Normalize CSV rows into standard transaction format using column mapping.
 */
export function normalizeTransactions(
  rows: Record<string, string | number>[],
  headerMap: Record<string, string>
): NormalizedTransaction[] {
  const results: NormalizedTransaction[] = [];

  for (const row of rows) {
    let amount = 0;
    if (headerMap.amount) {
      amount = parseFloat(String(row[headerMap.amount] || 0));
    } else if (headerMap.debit || headerMap.credit) {
      const debit = parseFloat(String(row[headerMap.debit] || 0)) || 0;
      const credit = parseFloat(String(row[headerMap.credit] || 0)) || 0;
      amount = credit - debit;
    }

    if (isNaN(amount)) continue;

    results.push({
      date: String(row[headerMap.date] || ''),
      description: String(row[headerMap.description] || ''),
      amount,
      balance: headerMap.balance ? parseFloat(String(row[headerMap.balance] || 0)) || undefined : undefined,
      category: headerMap.category ? String(row[headerMap.category] || '') : undefined,
    });
  }

  return results;
}
