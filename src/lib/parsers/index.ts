// ============================================================================
// Document Parser Orchestrator
// Routes files to the correct parser, runs pattern matching, returns mapped data
// All processing is 100% client-side — no data ever leaves the browser
// ============================================================================

import { extractTextFromPDF } from './pdf-parser';
import { parseCSV, mapCSVHeaders, normalizeTransactions } from './csv-parser';
import { detectDocumentType, extractFromText } from './financial-patterns';
import { mapExtractedFields, mapTransactions, MappedItem } from './field-mapper';

export type ProcessingStage = 'reading' | 'extracting' | 'matching' | 'done' | 'error';

export interface ProcessingProgress {
  stage: ProcessingStage;
  message: string;
  percent: number;
}

export interface ParseResult {
  fileName: string;
  fileType: 'pdf' | 'csv';
  documentType: string;
  items: MappedItem[];
  rawText?: string;
  error?: string;
}

type ProgressCallback = (progress: ProcessingProgress) => void;

/**
 * Main entry point: detect file type, parse, extract, and map financial data.
 */
export async function processDocument(
  file: File,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  const fileType = detectFileType(file);
  const fileName = file.name;

  try {
    if (fileType === 'pdf') {
      return await processPDF(file, fileName, onProgress);
    } else if (fileType === 'csv') {
      return await processCSV(file, fileName, onProgress);
    } else {
      return {
        fileName,
        fileType: 'csv',
        documentType: 'unknown',
        items: [],
        error: 'Unsupported file type. Please upload a PDF or CSV file.',
      };
    }
  } catch (err) {
    return {
      fileName,
      fileType,
      documentType: 'unknown',
      items: [],
      error: err instanceof Error ? err.message : 'An unknown error occurred.',
    };
  }
}

async function processPDF(
  file: File,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: 'Reading PDF file...', percent: 10 });

  const pdfResult = await extractTextFromPDF(file);
  const fullText = pdfResult.pages.join('\n');

  if (!fullText.trim()) {
    return {
      fileName,
      fileType: 'pdf',
      documentType: 'unknown',
      items: [],
      rawText: '',
      error: 'No text found in PDF. This may be a scanned document — only digitally-generated PDFs are supported.',
    };
  }

  onProgress?.({ stage: 'extracting', message: 'Detecting document type...', percent: 40 });

  const docType = detectDocumentType(fullText);

  onProgress?.({ stage: 'matching', message: 'Extracting financial data...', percent: 60 });

  const extracted = extractFromText(fullText);

  onProgress?.({ stage: 'matching', message: 'Mapping to financial fields...', percent: 80 });

  const items = mapExtractedFields(extracted.fields, docType);

  onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });

  return {
    fileName,
    fileType: 'pdf',
    documentType: docType,
    items,
    rawText: fullText.substring(0, 2000), // keep first 2000 chars for debug
  };
}

async function processCSV(
  file: File,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: 'Reading CSV file...', percent: 10 });

  const csvResult = await parseCSV(file);

  onProgress?.({ stage: 'extracting', message: 'Mapping columns...', percent: 40 });

  const headerMap = mapCSVHeaders(csvResult.headers);
  const hasTransactionColumns = headerMap.date && headerMap.description && (headerMap.amount || headerMap.debit || headerMap.credit);

  let items: MappedItem[] = [];

  if (hasTransactionColumns) {
    onProgress?.({ stage: 'matching', message: 'Categorizing transactions...', percent: 60 });

    const transactions = normalizeTransactions(csvResult.rows, headerMap);

    onProgress?.({ stage: 'matching', message: 'Mapping to financial fields...', percent: 80 });

    items = mapTransactions(transactions);
  } else {
    // Try to extract financial data from raw CSV content
    const rawText = csvResult.rows
      .map((row) => Object.values(row).join(' '))
      .join('\n');
    const extracted = extractFromText(rawText);
    items = mapExtractedFields(extracted.fields, 'bank_statement');
  }

  onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });

  return {
    fileName,
    fileType: 'csv',
    documentType: 'bank_statement',
    items,
  };
}

function detectFileType(file: File): 'pdf' | 'csv' {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf';
  return 'csv';
}

// Re-export for convenience
export type { MappedItem } from './field-mapper';
export type { ExtractedField } from './financial-patterns';
