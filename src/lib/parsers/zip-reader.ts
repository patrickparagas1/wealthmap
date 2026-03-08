// ============================================================================
// Client-Side ZIP File Parser
// Extracts files from ZIP archives using browser-native DecompressionStream
// No external dependencies — works entirely in the browser
// ============================================================================

export interface ZipEntry {
  fileName: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number; // 0 = stored, 8 = deflate
  dataOffset: number;
}

export interface ExtractedFile {
  name: string;
  data: Uint8Array;
}

// --- Binary Readers ---

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

// --- Main API ---

/**
 * Extract all files from a ZIP archive.
 * Returns an array of { name, data } objects for each file in the archive.
 * Skips directories and files that can't be decompressed.
 */
export async function extractZipFiles(buffer: ArrayBuffer): Promise<ExtractedFile[]> {
  const bytes = new Uint8Array(buffer);
  const entries = readCentralDirectory(bytes);
  const files: ExtractedFile[] = [];

  for (const entry of entries) {
    // Skip directories
    if (entry.fileName.endsWith('/')) continue;
    // Skip empty files
    if (entry.uncompressedSize === 0 && entry.compressedSize === 0) continue;
    // Skip __MACOSX metadata
    if (entry.fileName.startsWith('__MACOSX/')) continue;
    // Skip hidden files
    if (entry.fileName.split('/').some(part => part.startsWith('.'))) continue;

    try {
      const data = await extractEntry(bytes, entry);
      if (data.length > 0) {
        files.push({ name: entry.fileName, data });
      }
    } catch {
      // Skip files we can't extract — don't fail the whole archive
      console.warn(`[ZIP] Could not extract: ${entry.fileName}`);
    }
  }

  return files;
}

/**
 * Extract a single file from a ZIP archive by name.
 * Returns the file data or null if not found.
 */
export async function extractFileByName(
  buffer: ArrayBuffer,
  targetName: string
): Promise<Uint8Array | null> {
  const bytes = new Uint8Array(buffer);
  const entries = readCentralDirectory(bytes);

  const entry = entries.find(
    (e) => e.fileName === targetName || e.fileName.toLowerCase() === targetName.toLowerCase()
  );

  if (!entry) return null;

  try {
    return await extractEntry(bytes, entry);
  } catch {
    return null;
  }
}

/**
 * List all file names in a ZIP archive (without extracting data).
 */
export function listZipFiles(buffer: ArrayBuffer): string[] {
  const bytes = new Uint8Array(buffer);
  return readCentralDirectory(bytes)
    .filter((e) => !e.fileName.endsWith('/'))
    .map((e) => e.fileName);
}

// --- Central Directory Parsing ---

function readCentralDirectory(bytes: Uint8Array): ZipEntry[] {
  // Find End of Central Directory record (EOCD)
  // Signature: 0x06054b50 — scan backwards from end of file
  // EOCD is at least 22 bytes, and the comment can be up to 65535 bytes
  let eocdOffset = -1;
  const searchStart = Math.max(0, bytes.length - 65557);

  for (let i = bytes.length - 22; i >= searchStart; i--) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    // Fallback: scan for local file headers directly
    return readLocalFileHeaders(bytes);
  }

  const cdEntryCount = readUint16LE(bytes, eocdOffset + 10);
  const cdOffset = readUint32LE(bytes, eocdOffset + 16);

  // Validate central directory offset
  if (cdOffset >= bytes.length) {
    return readLocalFileHeaders(bytes);
  }

  const entries: ZipEntry[] = [];
  let pos = cdOffset;

  for (let i = 0; i < cdEntryCount && pos + 46 <= bytes.length; i++) {
    // Central directory file header signature: 0x02014b50
    if (readUint32LE(bytes, pos) !== 0x02014b50) break;

    const compressionMethod = readUint16LE(bytes, pos + 10);
    const compressedSize = readUint32LE(bytes, pos + 20);
    const uncompressedSize = readUint32LE(bytes, pos + 24);
    const fileNameLength = readUint16LE(bytes, pos + 28);
    const extraFieldLength = readUint16LE(bytes, pos + 30);
    const commentLength = readUint16LE(bytes, pos + 32);
    const localHeaderOffset = readUint32LE(bytes, pos + 42);

    // Read file name
    const fileNameBytes = bytes.slice(pos + 46, pos + 46 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);

    // Calculate actual data offset from the local file header
    let dataOffset = localHeaderOffset + 30;
    if (localHeaderOffset + 30 <= bytes.length) {
      const localFileNameLen = readUint16LE(bytes, localHeaderOffset + 26);
      const localExtraLen = readUint16LE(bytes, localHeaderOffset + 28);
      dataOffset = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
    }

    entries.push({
      fileName,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      dataOffset,
    });

    pos += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
}

/**
 * Fallback: scan for local file headers when EOCD can't be found
 */
function readLocalFileHeaders(bytes: Uint8Array): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let pos = 0;

  while (pos + 30 < bytes.length) {
    // Local file header signature: 0x04034b50
    if (readUint32LE(bytes, pos) !== 0x04034b50) {
      // Try next byte (might be misaligned)
      if (entries.length === 0) {
        pos++;
        continue;
      }
      break;
    }

    const compressionMethod = readUint16LE(bytes, pos + 8);
    const compressedSize = readUint32LE(bytes, pos + 18);
    const uncompressedSize = readUint32LE(bytes, pos + 22);
    const fileNameLength = readUint16LE(bytes, pos + 26);
    const extraFieldLength = readUint16LE(bytes, pos + 28);

    const fileNameBytes = bytes.slice(pos + 30, pos + 30 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    const dataOffset = pos + 30 + fileNameLength + extraFieldLength;

    if (compressedSize > 0) {
      entries.push({
        fileName,
        compressedSize,
        uncompressedSize,
        compressionMethod,
        dataOffset,
      });
    }

    // Move past this entry
    const flags = readUint16LE(bytes, pos + 6);
    let nextPos = dataOffset + compressedSize;

    // Handle data descriptor (bit 3 of general purpose flags)
    if (flags & 0x08) {
      // Data descriptor: optional signature (4 bytes) + CRC-32 (4) + compressed size (4) + uncompressed size (4)
      if (nextPos + 4 <= bytes.length && readUint32LE(bytes, nextPos) === 0x08074b50) {
        nextPos += 16; // with signature
      } else {
        nextPos += 12; // without signature
      }
    }

    pos = nextPos;
  }

  return entries;
}

// --- File Extraction & Decompression ---

async function extractEntry(bytes: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  // Bounds check
  if (entry.dataOffset + entry.compressedSize > bytes.length) {
    throw new Error(`Entry data extends beyond file bounds: ${entry.fileName}`);
  }

  const compressedData = bytes.slice(
    entry.dataOffset,
    entry.dataOffset + entry.compressedSize
  );

  if (entry.compressionMethod === 0) {
    // Stored (no compression) — return as-is
    return compressedData;
  }

  if (entry.compressionMethod === 8) {
    // DEFLATE — use browser's DecompressionStream
    return await decompressDeflateRaw(compressedData);
  }

  // Unsupported compression method
  throw new Error(`Unsupported compression method: ${entry.compressionMethod}`);
}

async function decompressDeflateRaw(data: Uint8Array): Promise<Uint8Array> {
  // Check if DecompressionStream is available (Chrome 80+, Firefox 103+, Safari 16.4+)
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream API not available in this browser');
  }

  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();

  // Write data and close — copy to a fresh ArrayBuffer to satisfy strict TypeScript types
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(data);
  writer.write(copy).catch(() => {});
  writer.close().catch(() => {});

  // Collect decompressed chunks
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }

  // Concatenate chunks
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// --- Utility: Get file extension ---

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? '.' + parts.pop()!.toLowerCase() : '';
}
