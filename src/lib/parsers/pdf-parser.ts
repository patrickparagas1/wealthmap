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

// ---------------------------------------------------------------------------
// Cached PDF.js library and shared Web Worker
// Worker is created once and reused for all files — avoids the overhead of
// spinning up a new Worker per file, and bypasses PDF.js's broken Node.js
// detection (Turbopack polyfills `process`, tricking PDF.js into using a
// synchronous fake worker on the main thread).
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedPdfjsLib: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedPdfWorker: any = null;

async function getPdfjsLib() {
  if (cachedPdfjsLib) return cachedPdfjsLib;
  cachedPdfjsLib = await import('pdfjs-dist');
  return cachedPdfjsLib;
}

async function getSharedPdfWorker() {
  const pdfjsLib = await getPdfjsLib();
  if (cachedPdfWorker && !cachedPdfWorker.destroyed) return cachedPdfWorker;

  // Create a real Web Worker ourselves — bypasses PDF.js thinking it's Node.js
  const worker = new Worker('/pdf.worker.min.mjs', { type: 'module' });
  cachedPdfWorker = new pdfjsLib.PDFWorker({ port: worker });
  return cachedPdfWorker;
}

/**
 * Warm up PDF.js by pre-loading the library and creating the Web Worker.
 * Call this early (e.g. when the upload zone mounts) so the first file
 * processes instantly instead of waiting for the ~200ms import + worker init.
 */
export async function warmUpPdfParser(): Promise<void> {
  if (typeof window === 'undefined') return; // SSR guard
  try {
    await getSharedPdfWorker();
  } catch {
    // Non-critical — will retry on first real extraction
  }
}

/**
 * Extract text content from a PDF file — runs entirely client-side.
 * Uses a shared Web Worker (off main thread) for fast, non-blocking parsing.
 * Works on digitally-generated statements (Chase, BofA, Fidelity, Schwab, Vanguard).
 * Scanned/image-only PDFs will return empty text.
 */
export async function extractTextFromPDF(file: File): Promise<PDFParseResult> {
  const pdfjsLib = await getPdfjsLib();
  const worker = await getSharedPdfWorker();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, worker }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: { str?: string }) => item.str ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push(pageText);
  }

  // Metadata is optional — skip if it hangs (happens with some workers)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let metadata: any = null;
  try {
    metadata = await Promise.race([
      pdf.getMetadata(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
    ]);
  } catch {
    // Ignore — title/author/subject are nice-to-have
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
