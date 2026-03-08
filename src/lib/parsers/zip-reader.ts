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
  if (offset + 1 >= bytes.length) return 0;
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  if (offset + 3 >= bytes.length) return 0;
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
    // Skip __MACOSX metadata
    if (entry.fileName.startsWith('__MACOSX/')) continue;
    if (entry.fileName.includes('/__MACOSX/')) continue;
    // Skip hidden files (but not files in hidden directories like .git)
    const baseName = entry.fileName.split('/').pop() || '';
    if (baseName.startsWith('.') && baseName !== '') continue;
    // Skip truly empty files (stored, 0 bytes)
    if (entry.compressionMethod === 0 && entry.compressedSize === 0 && entry.uncompressedSize === 0) continue;

    try {
      const data = await extractEntry(bytes, entry);
      if (data.length > 0) {
        files.push({ name: entry.fileName, data });
      }
    } catch {
      // Skip files we can't extract — don't fail the whole archive
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

  // Try exact match, then case-insensitive, then partial path match
  let entry = entries.find((e) => e.fileName === targetName);
  if (!entry) {
    entry = entries.find((e) => e.fileName.toLowerCase() === targetName.toLowerCase());
  }
  if (!entry) {
    entry = entries.find((e) => e.fileName.toLowerCase().endsWith(targetName.toLowerCase()));
  }

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
    return readLocalFileHeaders(bytes);
  }

  const cdEntryCount = readUint16LE(bytes, eocdOffset + 10);
  const cdOffset = readUint32LE(bytes, eocdOffset + 16);

  if (cdOffset >= bytes.length || cdOffset === 0xFFFFFFFF) {
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
    if (pos + 46 + fileNameLength > bytes.length) break;
    const fileNameBytes = bytes.slice(pos + 46, pos + 46 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);

    // Calculate actual data offset from the local file header
    let dataOffset = localHeaderOffset + 30;
    if (localHeaderOffset + 30 <= bytes.length) {
      // Verify local header signature
      if (readUint32LE(bytes, localHeaderOffset) === 0x04034b50) {
        const localFileNameLen = readUint16LE(bytes, localHeaderOffset + 26);
        const localExtraLen = readUint16LE(bytes, localHeaderOffset + 28);
        dataOffset = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
      }
    }

    // Validate data offset
    if (dataOffset < bytes.length) {
      entries.push({
        fileName,
        compressedSize,
        uncompressedSize,
        compressionMethod,
        dataOffset,
      });
    }

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
  let scanAttempts = 0;
  const maxScanAttempts = bytes.length; // prevent infinite loops

  while (pos + 30 < bytes.length && scanAttempts < maxScanAttempts) {
    scanAttempts++;

    // Local file header signature: 0x04034b50
    if (readUint32LE(bytes, pos) !== 0x04034b50) {
      if (entries.length === 0 && pos < 1024) {
        pos++;
        continue;
      }
      break;
    }

    const flags = readUint16LE(bytes, pos + 6);
    const compressionMethod = readUint16LE(bytes, pos + 8);
    let compressedSize = readUint32LE(bytes, pos + 18);
    let uncompressedSize = readUint32LE(bytes, pos + 22);
    const fileNameLength = readUint16LE(bytes, pos + 26);
    const extraFieldLength = readUint16LE(bytes, pos + 28);

    if (pos + 30 + fileNameLength > bytes.length) break;

    const fileNameBytes = bytes.slice(pos + 30, pos + 30 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    const dataOffset = pos + 30 + fileNameLength + extraFieldLength;

    // Handle data descriptor flag (bit 3) — sizes may be in descriptor after data
    const hasDataDescriptor = (flags & 0x08) !== 0;

    if (hasDataDescriptor && compressedSize === 0) {
      // Sizes are in the data descriptor after the compressed data
      // We need to scan for the next local file header or the data descriptor signature
      let scanPos = dataOffset;
      let foundSize = false;

      // Scan for either the data descriptor signature or next local file header
      while (scanPos + 4 < bytes.length) {
        const sig = readUint32LE(bytes, scanPos);
        if (sig === 0x08074b50) {
          // Data descriptor with signature
          compressedSize = readUint32LE(bytes, scanPos + 8);
          uncompressedSize = readUint32LE(bytes, scanPos + 12);
          foundSize = true;
          break;
        }
        if (sig === 0x04034b50) {
          // Next local file header — compressed data is everything between
          compressedSize = scanPos - dataOffset;
          uncompressedSize = compressedSize; // approximate
          foundSize = true;
          break;
        }
        scanPos++;
      }

      if (!foundSize) {
        // Assume rest of file is data (minus potential EOCD)
        compressedSize = Math.max(0, bytes.length - dataOffset - 100);
      }
    }

    // Include entry even if compressedSize is 0 for stored files with uncompressedSize > 0
    if (compressedSize > 0 || uncompressedSize > 0) {
      // Use the larger of the two for stored files
      if (compressionMethod === 0 && compressedSize === 0) {
        compressedSize = uncompressedSize;
      }

      entries.push({
        fileName,
        compressedSize,
        uncompressedSize,
        compressionMethod,
        dataOffset,
      });
    }

    // Move past this entry
    let nextPos = dataOffset + compressedSize;

    if (hasDataDescriptor) {
      // Skip data descriptor
      if (nextPos + 4 <= bytes.length && readUint32LE(bytes, nextPos) === 0x08074b50) {
        nextPos += 16; // with signature: sig(4) + crc(4) + compSize(4) + uncompSize(4)
      } else if (nextPos + 12 <= bytes.length) {
        nextPos += 12; // without signature: crc(4) + compSize(4) + uncompSize(4)
      }
    }

    // Safety: ensure we're making forward progress
    if (nextPos <= pos) break;
    pos = nextPos;
  }

  return entries;
}

// --- File Extraction & Decompression ---

async function extractEntry(bytes: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  // Bounds check
  const endOffset = entry.dataOffset + entry.compressedSize;
  if (endOffset > bytes.length) {
    // Try with available data instead of failing
    const availableSize = bytes.length - entry.dataOffset;
    if (availableSize <= 0) {
      throw new Error(`Entry data offset beyond file bounds: ${entry.fileName}`);
    }
    const compressedData = bytes.slice(entry.dataOffset, bytes.length);

    if (entry.compressionMethod === 0) return compressedData;
    if (entry.compressionMethod === 8) {
      try {
        return await decompressDeflateRaw(compressedData);
      } catch {
        throw new Error(`Decompression failed for truncated entry: ${entry.fileName}`);
      }
    }
    throw new Error(`Unsupported compression method: ${entry.compressionMethod}`);
  }

  const compressedData = bytes.slice(entry.dataOffset, endOffset);

  if (entry.compressionMethod === 0) {
    return compressedData;
  }

  if (entry.compressionMethod === 8) {
    return await decompressDeflateRaw(compressedData);
  }

  throw new Error(`Unsupported compression method: ${entry.compressionMethod}`);
}

async function decompressDeflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    // Fallback: try to extract readable text from raw data
    // This won't decompress but at least won't crash
    throw new Error('DecompressionStream API not available');
  }

  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();

  // Copy to a fresh ArrayBuffer to satisfy strict TypeScript types
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(data);
  writer.write(copy).catch(() => {});
  writer.close().catch(() => {});

  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }
  } catch {
    // If we got some data before failure, return what we have
    if (totalLength > 0) {
      const partial = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        partial.set(chunk, offset);
        offset += chunk.length;
      }
      return partial;
    }
    throw new Error('Decompression failed');
  }

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
