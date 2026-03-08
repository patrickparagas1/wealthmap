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

  // Configure worker from CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = await pdf.getMetadata().catch(() => null) as any;
  const pages: string[] = [];

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
