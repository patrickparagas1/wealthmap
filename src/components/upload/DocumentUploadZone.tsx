'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, Loader2, Shield, FileSpreadsheet, FileArchive, FileCode, CheckCircle2, XCircle } from 'lucide-react';
import { processDocument, ProcessingProgress, ParseResult } from '@/lib/parsers';
import type { MappedItem } from '@/lib/parsers';

interface DocumentUploadZoneProps {
  onProcessed: (result: ParseResult) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_EXTENSIONS = ['.pdf', '.csv', '.txt', '.json', '.xlsx', '.xls', '.doc', '.docx', '.zip', '.tsv', '.xlsm'];
const ACCEPTED_MIME = '.pdf,.csv,.txt,.json,.xlsx,.xls,.doc,.docx,.zip,.tsv,.xlsm';

const FILE_CATEGORIES = [
  { icon: FileText, label: 'PDF', extensions: '.pdf' },
  { icon: FileSpreadsheet, label: 'CSV / Excel', extensions: '.csv, .xlsx, .xls' },
  { icon: FileText, label: 'Word', extensions: '.doc, .docx' },
  { icon: FileCode, label: 'TXT / JSON', extensions: '.txt, .json' },
  { icon: FileArchive, label: 'ZIP', extensions: '.zip' },
];

interface FileStatus {
  name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  itemCount: number;
  error?: string;
}

export default function DocumentUploadZone({ onProcessed }: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);

    // Validate all files first
    const validFiles: File[] = [];
    const initialStatuses: FileStatus[] = [];

    for (const file of Array.from(files)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        initialStatuses.push({ name: file.name, status: 'error', itemCount: 0, error: `Unsupported format: ${ext}` });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        initialStatuses.push({ name: file.name, status: 'error', itemCount: 0, error: `Too large (${(file.size / 1024 / 1024).toFixed(1)}MB)` });
        continue;
      }
      validFiles.push(file);
      initialStatuses.push({ name: file.name, status: 'pending', itemCount: 0 });
    }

    if (validFiles.length === 0) {
      if (initialStatuses.length > 0) {
        setError(initialStatuses.map(s => s.error).filter(Boolean).join('. '));
      }
      return;
    }

    setFileStatuses(initialStatuses);
    setTotalFiles(validFiles.length);
    setProcessing(true);

    // Process ALL files, accumulate results
    const allItems: MappedItem[] = [];
    const allRawTexts: string[] = [];
    let combinedDocType = 'unknown';
    let hasAnySuccess = false;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setCurrentFileIndex(i);

      // Update status for this file
      setFileStatuses(prev => prev.map(s =>
        s.name === file.name && s.status === 'pending'
          ? { ...s, status: 'processing' }
          : s
      ));

      setProgress({
        stage: 'reading',
        message: validFiles.length > 1
          ? `Processing ${file.name} (${i + 1} of ${validFiles.length})...`
          : `Processing ${file.name}...`,
        percent: Math.round((i / validFiles.length) * 100),
      });

      try {
        const result = await processDocument(file, (p) => {
          // Scale progress within this file's portion of the total
          const fileProgressBase = (i / validFiles.length) * 100;
          const fileProgressRange = (1 / validFiles.length) * 100;
          setProgress({
            stage: p.stage,
            message: validFiles.length > 1
              ? `${file.name}: ${p.message}`
              : p.message,
            percent: Math.round(fileProgressBase + (p.percent / 100) * fileProgressRange),
          });
        });

        if (result.error) {
          setFileStatuses(prev => prev.map(s =>
            s.name === file.name && s.status === 'processing'
              ? { ...s, status: 'error', error: result.error }
              : s
          ));
        } else {
          hasAnySuccess = true;
          allItems.push(...result.items);
          if (result.rawText) allRawTexts.push(`--- ${file.name} ---\n${result.rawText}`);
          if (result.documentType !== 'unknown') combinedDocType = result.documentType;

          setFileStatuses(prev => prev.map(s =>
            s.name === file.name && s.status === 'processing'
              ? { ...s, status: 'done', itemCount: result.items.length }
              : s
          ));
        }
      } catch {
        setFileStatuses(prev => prev.map(s =>
          s.name === file.name && s.status === 'processing'
            ? { ...s, status: 'error', error: 'Processing failed' }
            : s
        ));
      }
    }

    // All files processed — send combined result
    setProcessing(false);
    setProgress(null);

    if (hasAnySuccess && allItems.length > 0) {
      const combinedResult: ParseResult = {
        fileName: validFiles.length === 1
          ? validFiles[0].name
          : `${validFiles.length} files`,
        fileType: validFiles.length === 1
          ? (validFiles[0].name.split('.').pop()?.toLowerCase() as ParseResult['fileType']) || 'txt'
          : 'zip',
        documentType: combinedDocType,
        items: allItems,
        rawText: allRawTexts.join('\n\n').substring(0, 2000),
      };

      // Small delay so user can see the completed statuses
      await new Promise(resolve => setTimeout(resolve, 600));

      setFileStatuses([]);
      setTotalFiles(0);
      onProcessed(combinedResult);
    } else {
      // All files failed
      const errorMessages = fileStatuses
        .filter(s => s.status === 'error')
        .map(s => `${s.name}: ${s.error}`)
        .join('; ');
      setError(errorMessages || 'Could not extract financial data from any file.');
      setFileStatuses([]);
      setTotalFiles(0);
    }

    if (inputRef.current) inputRef.current.value = '';
  }, [onProcessed]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !processing && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center
          rounded-2xl border-2 border-dashed p-10 cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-[#0071e3] bg-[#0071e3]/5 scale-[1.01]'
            : 'border-[#d2d2d7] bg-[#f5f5f7]/50 hover:border-[#0071e3]/50 hover:bg-[#f5f5f7]'
          }
          ${processing ? 'pointer-events-none opacity-80' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_MIME}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {processing ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <Loader2 className="w-10 h-10 text-[#0071e3] animate-spin" />

            {/* Multi-file progress */}
            {totalFiles > 1 && (
              <p className="text-sm font-semibold text-[#1d1d1f]">
                Processing file {currentFileIndex + 1} of {totalFiles}
              </p>
            )}

            {/* Overall progress bar */}
            <div className="w-full bg-[#e8e8ed] rounded-full h-2.5">
              <div
                className="bg-[#0071e3] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress?.percent || 0}%` }}
              />
            </div>
            <p className="text-xs text-[#6e6e73]">{progress?.message || 'Processing...'}</p>

            {/* Per-file status list */}
            {totalFiles > 1 && fileStatuses.length > 0 && (
              <div className="w-full mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                {fileStatuses.map((fs, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-white/80">
                    {fs.status === 'pending' && (
                      <div className="w-3 h-3 rounded-full border border-[#d2d2d7]" />
                    )}
                    {fs.status === 'processing' && (
                      <Loader2 className="w-3 h-3 text-[#0071e3] animate-spin flex-shrink-0" />
                    )}
                    {fs.status === 'done' && (
                      <CheckCircle2 className="w-3 h-3 text-[#34c759] flex-shrink-0" />
                    )}
                    {fs.status === 'error' && (
                      <XCircle className="w-3 h-3 text-[#ff3b30] flex-shrink-0" />
                    )}
                    <span className={`truncate flex-1 ${fs.status === 'error' ? 'text-[#ff3b30]' : 'text-[#1d1d1f]'}`}>
                      {fs.name}
                    </span>
                    {fs.status === 'done' && fs.itemCount > 0 && (
                      <span className="text-[#34c759] font-medium">{fs.itemCount} items</span>
                    )}
                    {fs.status === 'error' && fs.error && (
                      <span className="text-[#ff3b30] truncate max-w-[140px]">{fs.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-[#0071e3]/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-[#0071e3]" />
            </div>
            <p className="text-lg font-semibold text-[#1d1d1f] mb-1">
              Drop your financial documents here
            </p>
            <p className="text-sm text-[#6e6e73] mb-5">
              or <span className="text-[#0071e3] font-medium hover:underline">click to browse</span> — select one or multiple files
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {FILE_CATEGORIES.map(({ icon: Icon, label, extensions }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e8e8ed] text-xs text-[#6e6e73]">
                  <Icon className="w-3.5 h-3.5 text-[#86868b]" />
                  <span className="font-medium text-[#1d1d1f]">{label}</span>
                  <span className="text-[#86868b]">{extensions}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#86868b] mt-4">Maximum file size: 10MB per file</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 text-sm text-[#ff3b30] bg-[#ff3b30]/5 border border-[#ff3b30]/15 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-[#6e6e73] bg-[#34c759]/5 border border-[#34c759]/15 rounded-xl px-4 py-3">
        <Shield className="w-4 h-4 text-[#34c759]" />
        <span>Your documents are processed locally and never uploaded to any server</span>
      </div>
    </div>
  );
}
