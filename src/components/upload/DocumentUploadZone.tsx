'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { processDocument, ProcessingProgress, ParseResult } from '@/lib/parsers';

interface DocumentUploadZoneProps {
  onProcessed: (result: ParseResult) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['.pdf', '.csv'];

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
      // Validate file type
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_TYPES.includes(ext)) {
        setError(`Unsupported file type: ${ext}. Please upload PDF or CSV files.`);
        continue;
      }

      // Validate file size
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

    // Reset the input so the same file can be re-selected
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
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !processing && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center
          rounded-xl border-2 border-dashed p-8 cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
            : 'border-slate-600 bg-slate-900/50 hover:border-blue-500/50 hover:bg-slate-800/50'
          }
          ${processing ? 'pointer-events-none opacity-80' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {processing ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-sm text-slate-300 font-medium">{fileName}</p>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress?.percent || 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">{progress?.message || 'Processing...'}</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-base font-medium text-slate-200 mb-1">
              Drop financial statements here
            </p>
            <p className="text-sm text-slate-400 mb-3">
              or <span className="text-blue-400 hover:underline">click to browse</span>
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> PDF, CSV
              </span>
              <span>Max 10MB</span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Shield className="w-3.5 h-3.5 text-emerald-500" />
        <span>Your documents are processed locally and never uploaded to any server</span>
      </div>
    </div>
  );
}
