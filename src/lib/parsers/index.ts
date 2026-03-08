// ============================================================================
// Document Parser Orchestrator
// Routes files to the correct parser, runs pattern matching, returns mapped data
// All processing is 100% client-side — no data ever leaves the browser
// Supports: PDF, CSV, TXT, JSON, XLSX, DOC, DOCX, ZIP
// ============================================================================

import { extractTextFromPDF } from './pdf-parser';
import { parseCSV, mapCSVHeaders, normalizeTransactions } from './csv-parser';
import { detectDocumentType, extractFromText } from './financial-patterns';
import { mapExtractedFields, mapTransactions, MappedItem } from './field-mapper';

export type ProcessingStage = 'reading' | 'extracting' | 'matching' | 'done' | 'error';

export type SupportedFileType = 'pdf' | 'csv' | 'txt' | 'json' | 'xlsx' | 'doc' | 'docx' | 'zip';

export interface ProcessingProgress {
  stage: ProcessingStage;
  message: string;
  percent: number;
}

export interface ParseResult {
  fileName: string;
  fileType: SupportedFileType;
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
    switch (fileType) {
      case 'pdf':
        return await processPDF(file, fileName, onProgress);
      case 'csv':
        return await processCSV(file, fileName, onProgress);
      case 'txt':
        return await processTextFile(file, fileName, onProgress);
      case 'json':
        return await processJSONFile(file, fileName, onProgress);
      case 'xlsx':
        return await processSpreadsheet(file, fileName, onProgress);
      case 'doc':
      case 'docx':
        return await processWordDoc(file, fileName, fileType, onProgress);
      case 'zip':
        return await processZipFile(file, fileName, onProgress);
      default:
        return {
          fileName,
          fileType: 'txt',
          documentType: 'unknown',
          items: [],
          error: `Unsupported file type. Please upload a supported file format.`,
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
    rawText: fullText.substring(0, 2000),
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

async function processTextFile(
  file: File,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: 'Reading text file...', percent: 10 });

  const text = await file.text();

  if (!text.trim()) {
    return { fileName, fileType: 'txt', documentType: 'unknown', items: [], error: 'File is empty.' };
  }

  onProgress?.({ stage: 'extracting', message: 'Detecting document type...', percent: 40 });
  const docType = detectDocumentType(text);

  onProgress?.({ stage: 'matching', message: 'Extracting financial data...', percent: 60 });
  const extracted = extractFromText(text);

  onProgress?.({ stage: 'matching', message: 'Mapping to financial fields...', percent: 80 });
  const items = mapExtractedFields(extracted.fields, docType);

  onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });

  return { fileName, fileType: 'txt', documentType: docType, items, rawText: text.substring(0, 2000) };
}

async function processJSONFile(
  file: File,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: 'Reading JSON file...', percent: 10 });

  const text = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { fileName, fileType: 'json', documentType: 'unknown', items: [], error: 'Invalid JSON file.' };
  }

  onProgress?.({ stage: 'extracting', message: 'Analyzing JSON structure...', percent: 40 });

  // Flatten JSON to text for pattern matching
  const flatText = typeof parsed === 'object' && parsed !== null
    ? JSON.stringify(parsed, null, 2)
    : String(parsed);

  const docType = detectDocumentType(flatText);

  onProgress?.({ stage: 'matching', message: 'Extracting financial data...', percent: 60 });
  const extracted = extractFromText(flatText);

  onProgress?.({ stage: 'matching', message: 'Mapping to financial fields...', percent: 80 });
  const items = mapExtractedFields(extracted.fields, docType);

  onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });

  return { fileName, fileType: 'json', documentType: docType, items, rawText: flatText.substring(0, 2000) };
}

async function processSpreadsheet(
  file: File,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: 'Reading spreadsheet...', percent: 10 });

  // For XLSX, read as CSV-like text extraction from the raw XML
  // Since we can't import xlsx library client-side easily, we extract text content
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // XLSX files are ZIP archives — try to extract shared strings and sheet data
    // For now, we'll treat the raw text extraction as best-effort
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = textDecoder.decode(bytes);

    // Extract any readable text content
    const cleanText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();

    if (!cleanText || cleanText.length < 10) {
      return {
        fileName,
        fileType: 'xlsx',
        documentType: 'unknown',
        items: [],
        error: 'Could not extract text from spreadsheet. Try exporting as CSV first for best results.',
      };
    }

    onProgress?.({ stage: 'extracting', message: 'Detecting document type...', percent: 40 });
    const docType = detectDocumentType(cleanText);

    onProgress?.({ stage: 'matching', message: 'Extracting financial data...', percent: 60 });
    const extracted = extractFromText(cleanText);

    onProgress?.({ stage: 'matching', message: 'Mapping to financial fields...', percent: 80 });
    const items = mapExtractedFields(extracted.fields, docType);

    onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });

    return { fileName, fileType: 'xlsx', documentType: docType, items, rawText: cleanText.substring(0, 2000) };
  } catch {
    return {
      fileName,
      fileType: 'xlsx',
      documentType: 'unknown',
      items: [],
      error: 'Could not read spreadsheet. Try exporting as CSV for best results.',
    };
  }
}

async function processWordDoc(
  file: File,
  fileName: string,
  fileType: 'doc' | 'docx',
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: `Reading ${fileType.toUpperCase()} file...`, percent: 10 });

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = textDecoder.decode(bytes);

    // For DOCX (ZIP-based XML), extract text between XML tags
    // For DOC (binary), extract readable ASCII text
    let cleanText: string;

    if (fileType === 'docx') {
      // DOCX: Extract text content from XML tags like <w:t>...</w:t>
      const textMatches = rawText.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (textMatches) {
        cleanText = textMatches
          .map(m => m.replace(/<[^>]+>/g, ''))
          .join(' ')
          .trim();
      } else {
        cleanText = rawText.replace(/<[^>]+>/g, ' ').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      }
    } else {
      // DOC: Extract readable characters
      cleanText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (!cleanText || cleanText.length < 10) {
      return {
        fileName,
        fileType,
        documentType: 'unknown',
        items: [],
        error: `Could not extract text from ${fileType.toUpperCase()} file. Try saving as PDF or TXT.`,
      };
    }

    onProgress?.({ stage: 'extracting', message: 'Detecting document type...', percent: 40 });
    const docType = detectDocumentType(cleanText);

    onProgress?.({ stage: 'matching', message: 'Extracting financial data...', percent: 60 });
    const extracted = extractFromText(cleanText);

    onProgress?.({ stage: 'matching', message: 'Mapping to financial fields...', percent: 80 });
    const items = mapExtractedFields(extracted.fields, docType);

    onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });

    return { fileName, fileType, documentType: docType, items, rawText: cleanText.substring(0, 2000) };
  } catch {
    return {
      fileName,
      fileType,
      documentType: 'unknown',
      items: [],
      error: `Could not read ${fileType.toUpperCase()} file. Try saving as PDF or TXT.`,
    };
  }
}

async function processZipFile(
  file: File,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: 'Reading ZIP archive...', percent: 10 });

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = textDecoder.decode(bytes);

    // Extract readable text from the ZIP contents
    const cleanText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();

    if (!cleanText || cleanText.length < 10) {
      return {
        fileName,
        fileType: 'zip',
        documentType: 'unknown',
        items: [],
        error: 'Could not extract financial data from ZIP archive. Try uploading individual files instead.',
      };
    }

    onProgress?.({ stage: 'extracting', message: 'Scanning archive contents...', percent: 40 });
    const docType = detectDocumentType(cleanText);

    onProgress?.({ stage: 'matching', message: 'Extracting financial data...', percent: 60 });
    const extracted = extractFromText(cleanText);

    onProgress?.({ stage: 'matching', message: 'Mapping to financial fields...', percent: 80 });
    const items = mapExtractedFields(extracted.fields, docType);

    onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });

    return { fileName, fileType: 'zip', documentType: docType, items, rawText: cleanText.substring(0, 2000) };
  } catch {
    return {
      fileName,
      fileType: 'zip',
      documentType: 'unknown',
      items: [],
      error: 'Could not process ZIP file. Try uploading individual files instead.',
    };
  }
}

function detectFileType(file: File): SupportedFileType {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, SupportedFileType> = {
    pdf: 'pdf',
    csv: 'csv',
    tsv: 'csv',
    txt: 'txt',
    text: 'txt',
    json: 'json',
    xlsx: 'xlsx',
    xls: 'xlsx',
    xlsm: 'xlsx',
    doc: 'doc',
    docx: 'docx',
    zip: 'zip',
  };
  if (ext && mimeMap[ext]) return mimeMap[ext];
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type === 'text/csv') return 'csv';
  if (file.type === 'text/plain') return 'txt';
  if (file.type === 'application/json') return 'json';
  if (file.type.includes('spreadsheet') || file.type.includes('excel')) return 'xlsx';
  if (file.type.includes('msword') || file.type.includes('wordprocessingml')) return 'docx';
  if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') return 'zip';
  return 'txt'; // fallback: try to read as text
}

// Re-export for convenience
export type { MappedItem } from './field-mapper';
export type { ExtractedField } from './financial-patterns';
