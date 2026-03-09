// ============================================================================
// PDF Parser — Client-side PDF text extraction using Mozilla PDF.js
// All processing happens in the browser — no data leaves the device
// Uses dynamic import to avoid SSR issues with DOMMatrix
// ============================================================================

export interface PDFParseResult {
  pages: string[];
  totalPages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

/**
 * Extract text content from a PDF file — runs entirely client-side.
 * Works on digitally-generated statements (Chase, BofA, Fidelity, Schwab, Vanguard).
 * Scanned/image-only PDFs will return empty text.
 */
export async function extractTextFromPDF(file: File): Promise<PDFParseResult> {
  // Dynamic import to avoid SSR issues — pdfjs-dist requires browser APIs
  const pdfjsLib = await import('pdfjs-dist');

  // Use local worker file (CDN doesn't have v5.x builds)
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  // Extract text from each page first (metadata can hang with fake worker)
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push(pageText);
  }

  // Get metadata with timeout — getMetadata() can hang with fake worker
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let metadata: any = null;
  try {
    metadata = await Promise.race([
      pdf.getMetadata(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ]);
  } catch {
    // Metadata is optional — ignore timeout or errors
  }

  return {
    pages,
    totalPages: pdf.numPages,
    metadata: {
      title: metadata?.info?.Title || undefined,
      author: metadata?.info?.Author || undefined,
      subject: metadata?.info?.Subject || undefined,
    },
  };
}
