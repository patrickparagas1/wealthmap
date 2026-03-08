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
import { extractZipFiles, extractFileByName, getFileExtension } from './zip-reader';

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
        return await processLegacyDoc(file, fileName, onProgress);
      case 'docx':
        return await processDocx(file, fileName, onProgress);
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

// ============================================================================
// PDF Processor
// ============================================================================

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

// ============================================================================
// CSV Processor
// ============================================================================

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

// ============================================================================
// Plain Text Processor
// ============================================================================

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

// ============================================================================
// JSON Processor
// ============================================================================

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

// ============================================================================
// XLSX / XLS Processor — Uses real ZIP extraction for XLSX
// ============================================================================

async function processSpreadsheet(
  file: File,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: 'Reading spreadsheet...', percent: 10 });

  try {
    const buffer = await file.arrayBuffer();

    onProgress?.({ stage: 'extracting', message: 'Extracting spreadsheet data...', percent: 30 });

    // XLSX files are ZIP archives containing XML
    const text = await extractXlsxText(buffer);

    if (!text || text.length < 10) {
      return {
        fileName,
        fileType: 'xlsx',
        documentType: 'unknown',
        items: [],
        error: 'Could not extract data from spreadsheet. Try exporting as CSV for best results.',
      };
    }

    onProgress?.({ stage: 'extracting', message: 'Detecting document type...', percent: 50 });
    const docType = detectDocumentType(text);

    onProgress?.({ stage: 'matching', message: 'Extracting financial data...', percent: 70 });
    const extracted = extractFromText(text);

    onProgress?.({ stage: 'matching', message: 'Mapping to financial fields...', percent: 85 });
    const items = mapExtractedFields(extracted.fields, docType);

    onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });

    return { fileName, fileType: 'xlsx', documentType: docType, items, rawText: text.substring(0, 2000) };
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

/**
 * Extract text from XLSX by parsing the ZIP archive structure.
 * XLSX = ZIP containing xl/sharedStrings.xml + xl/worksheets/sheet*.xml
 */
async function extractXlsxText(buffer: ArrayBuffer): Promise<string> {
  try {
    // Extract shared strings (all text values are stored here)
    const sharedStringsXml = await extractFileByName(buffer, 'xl/sharedStrings.xml');
    const sheet1Xml = await extractFileByName(buffer, 'xl/worksheets/sheet1.xml');

    const decoder = new TextDecoder('utf-8');
    const strings: string[] = [];

    // Parse shared strings: <si><t>value</t></si>
    if (sharedStringsXml) {
      const ssText = decoder.decode(sharedStringsXml);
      // Match <t> tags within <si> elements — handles both <t>text</t> and <t xml:space="preserve">text</t>
      const siMatches = ssText.match(/<si>[\s\S]*?<\/si>/g) || [];
      for (const si of siMatches) {
        const tMatches = si.match(/<t[^>]*>([^<]*)<\/t>/g) || [];
        const cellText = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
        strings.push(cellText);
      }
    }

    const textParts: string[] = [];

    // Parse sheet1: cells reference shared strings by index
    if (sheet1Xml) {
      const sheetText = decoder.decode(sheet1Xml);
      // Find all <c> (cell) elements
      const cellMatches = sheetText.match(/<c[^>]*>[\s\S]*?<\/c>/g) || [];

      let currentRow = '';
      const rowValues: string[] = [];

      for (const cell of cellMatches) {
        // Get cell reference (e.g., "A1", "B2")
        const refMatch = cell.match(/r="([A-Z]+)(\d+)"/);
        const row = refMatch ? refMatch[2] : '';

        // If we've moved to a new row, flush the previous one
        if (row !== currentRow && currentRow !== '') {
          textParts.push(rowValues.join('\t'));
          rowValues.length = 0;
        }
        currentRow = row;

        // Get cell value
        const vMatch = cell.match(/<v>([^<]*)<\/v>/);
        if (vMatch) {
          // Check if this is a shared string reference (t="s") or inline string (t="inlineStr")
          const isSharedString = /\bt="s"/.test(cell);
          if (isSharedString) {
            const idx = parseInt(vMatch[1], 10);
            rowValues.push(strings[idx] || vMatch[1]);
          } else {
            rowValues.push(vMatch[1]);
          }
        }
      }

      // Flush last row
      if (rowValues.length > 0) {
        textParts.push(rowValues.join('\t'));
      }
    }

    // If we got structured data from the sheet, return it
    if (textParts.length > 0) {
      return textParts.join('\n');
    }

    // Fallback: just return all shared strings as text
    if (strings.length > 0) {
      return strings.join(' ');
    }

    // Last resort: extract all XML files and concatenate readable text
    const allFiles = await extractZipFiles(buffer);
    const xmlTexts: string[] = [];
    for (const f of allFiles) {
      if (f.name.endsWith('.xml')) {
        const xml = decoder.decode(f.data);
        // Strip XML tags and get text content
        const stripped = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (stripped.length > 5) xmlTexts.push(stripped);
      }
    }

    return xmlTexts.join('\n');
  } catch {
    // If ZIP extraction fails entirely, try raw text extraction as last resort
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = decoder.decode(bytes);
    return rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

// ============================================================================
// DOCX Processor — Uses real ZIP extraction for DOCX
// ============================================================================

async function processDocx(
  file: File,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: 'Reading DOCX file...', percent: 10 });

  try {
    const buffer = await file.arrayBuffer();

    onProgress?.({ stage: 'extracting', message: 'Extracting document text...', percent: 30 });

    // DOCX files are ZIP archives containing word/document.xml
    const text = await extractDocxText(buffer);

    if (!text || text.length < 10) {
      return {
        fileName,
        fileType: 'docx',
        documentType: 'unknown',
        items: [],
        error: 'Could not extract text from DOCX file. Try saving as PDF or TXT.',
      };
    }

    onProgress?.({ stage: 'extracting', message: 'Detecting document type...', percent: 50 });
    const docType = detectDocumentType(text);

    onProgress?.({ stage: 'matching', message: 'Extracting financial data...', percent: 70 });
    const extracted = extractFromText(text);

    onProgress?.({ stage: 'matching', message: 'Mapping to financial fields...', percent: 85 });
    const items = mapExtractedFields(extracted.fields, docType);

    onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });

    return { fileName, fileType: 'docx', documentType: docType, items, rawText: text.substring(0, 2000) };
  } catch {
    return {
      fileName,
      fileType: 'docx',
      documentType: 'unknown',
      items: [],
      error: 'Could not read DOCX file. Try saving as PDF or TXT.',
    };
  }
}

/**
 * Extract text from DOCX by parsing the ZIP archive.
 * DOCX = ZIP containing word/document.xml with <w:t> tags for text.
 */
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  try {
    const documentXml = await extractFileByName(buffer, 'word/document.xml');

    if (!documentXml) {
      // Some DOCX files have different paths — try alternatives
      const files = await extractZipFiles(buffer);
      const docFile = files.find(
        (f) => f.name.endsWith('document.xml') || f.name.includes('word/document')
      );
      if (!docFile) return '';
      return extractTextFromDocumentXml(new TextDecoder('utf-8').decode(docFile.data));
    }

    const xml = new TextDecoder('utf-8').decode(documentXml);
    return extractTextFromDocumentXml(xml);
  } catch {
    return '';
  }
}

/**
 * Parse Word document.xml and extract text content.
 * Preserves paragraph structure by joining <w:t> within <w:p> with spaces
 * and separating paragraphs with newlines.
 */
function extractTextFromDocumentXml(xml: string): string {
  const paragraphs: string[] = [];

  // Split by paragraph tags <w:p ...>...</w:p>
  const paraMatches = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];

  for (const para of paraMatches) {
    // Extract all <w:t> text within this paragraph
    const textMatches = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const paraText = textMatches
      .map((m) => m.replace(/<[^>]+>/g, ''))
      .join('');

    if (paraText.trim()) {
      paragraphs.push(paraText.trim());
    }
  }

  return paragraphs.join('\n');
}

// ============================================================================
// Legacy DOC Processor — Binary format, best-effort text extraction
// ============================================================================

async function processLegacyDoc(
  file: File,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: 'Reading DOC file...', percent: 10 });

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = textDecoder.decode(bytes);

    // DOC is a binary format — extract readable ASCII text
    const cleanText = rawText
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText || cleanText.length < 10) {
      return {
        fileName,
        fileType: 'doc',
        documentType: 'unknown',
        items: [],
        error: 'Could not extract text from DOC file. Try saving as DOCX, PDF, or TXT.',
      };
    }

    onProgress?.({ stage: 'extracting', message: 'Detecting document type...', percent: 40 });
    const docType = detectDocumentType(cleanText);

    onProgress?.({ stage: 'matching', message: 'Extracting financial data...', percent: 60 });
    const extracted = extractFromText(cleanText);

    onProgress?.({ stage: 'matching', message: 'Mapping to financial fields...', percent: 80 });
    const items = mapExtractedFields(extracted.fields, docType);

    onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });

    return { fileName, fileType: 'doc', documentType: docType, items, rawText: cleanText.substring(0, 2000) };
  } catch {
    return {
      fileName,
      fileType: 'doc',
      documentType: 'unknown',
      items: [],
      error: 'Could not read DOC file. Try saving as DOCX, PDF, or TXT.',
    };
  }
}

// ============================================================================
// ZIP Processor — Extracts and processes each file in the archive
// ============================================================================

async function processZipFile(
  file: File,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  onProgress?.({ stage: 'reading', message: 'Reading ZIP archive...', percent: 5 });

  try {
    const buffer = await file.arrayBuffer();

    onProgress?.({ stage: 'extracting', message: 'Extracting archive contents...', percent: 15 });

    const extractedFiles = await extractZipFiles(buffer);

    if (extractedFiles.length === 0) {
      return {
        fileName,
        fileType: 'zip',
        documentType: 'unknown',
        items: [],
        error: 'No files found in ZIP archive. The archive may be empty or corrupted.',
      };
    }

    onProgress?.({
      stage: 'extracting',
      message: `Found ${extractedFiles.length} file(s) — processing...`,
      percent: 25,
    });

    // Process each extracted file
    const allItems: MappedItem[] = [];
    const allRawTexts: string[] = [];
    let documentType = 'unknown';
    let processedCount = 0;
    const supportedExts = ['.pdf', '.csv', '.tsv', '.txt', '.json', '.xlsx', '.xls', '.docx', '.doc'];

    for (const extracted of extractedFiles) {
      const ext = getFileExtension(extracted.name);

      // Skip unsupported file types
      if (!supportedExts.includes(ext) && ext !== '') {
        // Try as text if no extension or unknown extension
        if (ext !== '') continue;
      }

      processedCount++;
      const progressPercent = 25 + Math.round((processedCount / extractedFiles.length) * 60);

      onProgress?.({
        stage: 'matching',
        message: `Processing: ${getShortName(extracted.name)} (${processedCount}/${extractedFiles.length})`,
        percent: progressPercent,
      });

      try {
        const result = await processExtractedFile(extracted.name, extracted.data, ext);
        if (result.items.length > 0) {
          // Tag items with source file name
          const taggedItems = result.items.map((item) => ({
            ...item,
            source: `${item.source} (from ${getShortName(extracted.name)})`,
          }));
          allItems.push(...taggedItems);

          if (result.documentType !== 'unknown') {
            documentType = result.documentType;
          }
        }
        if (result.rawText) {
          allRawTexts.push(`--- ${extracted.name} ---\n${result.rawText}`);
        }
      } catch {
        // Skip individual files that fail — continue with the rest
        console.warn(`[ZIP] Failed to process: ${extracted.name}`);
      }
    }

    if (allItems.length === 0) {
      // Last resort: try concatenating all text content and running pattern matching
      const fallbackText = await extractAllTextFromZip(extractedFiles);

      if (fallbackText.length > 10) {
        const docType = detectDocumentType(fallbackText);
        const extracted = extractFromText(fallbackText);
        const items = mapExtractedFields(extracted.fields, docType);

        if (items.length > 0) {
          onProgress?.({ stage: 'done', message: 'Processing complete', percent: 100 });
          return {
            fileName,
            fileType: 'zip',
            documentType: docType,
            items,
            rawText: fallbackText.substring(0, 2000),
          };
        }
      }

      return {
        fileName,
        fileType: 'zip',
        documentType: 'unknown',
        items: [],
        error: `Extracted ${extractedFiles.length} file(s) from ZIP but couldn't find financial data. Try uploading individual files or use PDF/CSV format.`,
      };
    }

    onProgress?.({ stage: 'done', message: `Extracted data from ${processedCount} file(s)`, percent: 100 });

    return {
      fileName,
      fileType: 'zip',
      documentType,
      items: allItems,
      rawText: allRawTexts.join('\n\n').substring(0, 2000),
    };
  } catch (err) {
    return {
      fileName,
      fileType: 'zip',
      documentType: 'unknown',
      items: [],
      error: `Could not process ZIP file: ${err instanceof Error ? err.message : 'Unknown error'}. Try uploading individual files instead.`,
    };
  }
}

/**
 * Process a single extracted file from a ZIP archive.
 * Routes to the correct parser based on file extension.
 */
async function processExtractedFile(
  name: string,
  data: Uint8Array,
  ext: string
): Promise<{ items: MappedItem[]; documentType: string; rawText?: string }> {
  const decoder = new TextDecoder('utf-8', { fatal: false });

  switch (ext) {
    case '.csv':
    case '.tsv': {
      const text = decoder.decode(data);
      // Use the text-based extraction as we can't create a File object easily
      const docType = detectDocumentType(text);
      const extracted = extractFromText(text);
      const items = mapExtractedFields(extracted.fields, docType);
      return { items, documentType: docType, rawText: text.substring(0, 1000) };
    }

    case '.txt': {
      const text = decoder.decode(data);
      const docType = detectDocumentType(text);
      const extracted = extractFromText(text);
      const items = mapExtractedFields(extracted.fields, docType);
      return { items, documentType: docType, rawText: text.substring(0, 1000) };
    }

    case '.json': {
      const text = decoder.decode(data);
      try {
        const parsed = JSON.parse(text);
        const flatText = JSON.stringify(parsed, null, 2);
        const docType = detectDocumentType(flatText);
        const extracted = extractFromText(flatText);
        const items = mapExtractedFields(extracted.fields, docType);
        return { items, documentType: docType, rawText: flatText.substring(0, 1000) };
      } catch {
        return { items: [], documentType: 'unknown' };
      }
    }

    case '.docx': {
      // DOCX is also a ZIP — extract word/document.xml
      const text = await extractDocxText(data.buffer as ArrayBuffer);
      if (text.length < 10) return { items: [], documentType: 'unknown' };
      const docType = detectDocumentType(text);
      const extracted = extractFromText(text);
      const items = mapExtractedFields(extracted.fields, docType);
      return { items, documentType: docType, rawText: text.substring(0, 1000) };
    }

    case '.xlsx':
    case '.xls': {
      // XLSX is also a ZIP — extract spreadsheet data
      const text = await extractXlsxText(data.buffer as ArrayBuffer);
      if (text.length < 10) return { items: [], documentType: 'unknown' };
      const docType = detectDocumentType(text);
      const extracted = extractFromText(text);
      const items = mapExtractedFields(extracted.fields, docType);
      return { items, documentType: docType, rawText: text.substring(0, 1000) };
    }

    case '.doc': {
      // Legacy DOC — best-effort binary text extraction
      const rawText = decoder.decode(data);
      const cleanText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanText.length < 10) return { items: [], documentType: 'unknown' };
      const docType = detectDocumentType(cleanText);
      const extracted = extractFromText(cleanText);
      const items = mapExtractedFields(extracted.fields, docType);
      return { items, documentType: docType, rawText: cleanText.substring(0, 1000) };
    }

    default: {
      // Try as plain text
      const text = decoder.decode(data);
      const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanText.length < 10) return { items: [], documentType: 'unknown' };
      const docType = detectDocumentType(cleanText);
      const extracted = extractFromText(cleanText);
      const items = mapExtractedFields(extracted.fields, docType);
      return { items, documentType: docType };
    }
  }
}

/**
 * Fallback: Extract all readable text from ZIP entries for pattern matching.
 */
async function extractAllTextFromZip(files: { name: string; data: Uint8Array }[]): Promise<string> {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const textParts: string[] = [];

  for (const file of files) {
    const ext = getFileExtension(file.name);

    // Try text-based files
    if (['.txt', '.csv', '.tsv', '.json', '.xml', '.html', '.md', ''].includes(ext)) {
      const text = decoder.decode(file.data);
      const clean = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (clean.length > 10) {
        textParts.push(clean);
      }
    }

    // Try DOCX XML extraction
    if (ext === '.docx') {
      try {
        const docText = await extractDocxText(file.data.buffer as ArrayBuffer);
        if (docText.length > 10) textParts.push(docText);
      } catch { /* skip */ }
    }
  }

  return textParts.join('\n');
}

/**
 * Get the short name (last part of path) for display
 */
function getShortName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

// ============================================================================
// File Type Detection
// ============================================================================

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
  if (file.type.includes('msword')) return 'doc';
  if (file.type.includes('wordprocessingml')) return 'docx';
  if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') return 'zip';
  return 'txt'; // fallback: try to read as text
}

// Re-export for convenience
export type { MappedItem } from './field-mapper';
export type { ExtractedField } from './financial-patterns';
