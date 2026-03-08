'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, Loader2, Shield, FileSpreadsheet, FileArchive, FileCode } from 'lucide-react';
import { processDocument, ProcessingProgress, ParseResult } from '@/lib/parsers';

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

export default function DocumentUploadZone({ onProcessed }: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const queue = Array.from(files);

    for (const file of queue) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setError(`Unsupported file type: ${ext}. Supported formats: PDF, CSV, Excel, Word, TXT, JSON, ZIP.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
        continue;
      }

      setFileName(file.name);
      setProcessing(true);
      setProgress({ stage: 'reading', message: 'Starting...', percent: 0 });

      try {
        const result = await processDocument(file, setProgress);
        if (result.error) {
          setError(result.error);
        } else {
          onProcessed(result);
        }
      } catch {
        setError('Failed to process file. Please try a different document.');
      } finally {
        setProcessing(false);
        setProgress(null);
        setFileName(null);
      }
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
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <Loader2 className="w-10 h-10 text-[#0071e3] animate-spin" />
            <p className="text-sm text-[#1d1d1f] font-medium">{fileName}</p>
            <div className="w-full bg-[#e8e8ed] rounded-full h-2.5">
              <div
                className="bg-[#0071e3] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress?.percent || 0}%` }}
              />
            </div>
            <p className="text-xs text-[#6e6e73]">{progress?.message || 'Processing...'}</p>
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
              or <span className="text-[#0071e3] font-medium hover:underline">click to browse</span>
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
            <p className="text-xs text-[#86868b] mt-4">Maximum file size: 10MB</p>
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
