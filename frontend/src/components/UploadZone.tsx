import React, { useRef, useState } from 'react';
import { AlertTriangle, FileUp, Loader2, ShieldCheck, Upload } from 'lucide-react';
import {
  analyzeAudit,
  ApiClientError,
  extractContractFile,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AuditExtractionRecord } from '../types';

interface UploadZoneProps {
  onExtracted: (record: AuditExtractionRecord) => void;
}

const MAX_BYTES = 10 * 1024 * 1024;

export const UploadZone: React.FC<UploadZoneProps> = ({ onExtracted }) => {
  const { t, lang } = useLanguage();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mapErrorMessage = (err: unknown): string => {
    if (err instanceof ApiClientError) {
      const knownMap = t.upload.errors as Record<string, string>;
      return knownMap[err.code] || err.message || t.upload.errors.GENERIC;
    }
    return t.upload.errors.GENERIC;
  };

  const runExtractAndAnalyze = async (extractPromise: Promise<AuditExtractionRecord>) => {
    setLoadingStage(t.upload.processingReading);
    const extracted = await extractPromise;

    setLoadingStage(t.upload.processingAnalyzing);
    const timer = window.setTimeout(() => {
      setLoadingStage(t.upload.processingCounterClauses);
    }, 650);

    try {
      const analyzed = await analyzeAudit(extracted.auditId, token);
      onExtracted(analyzed);
    } finally {
      window.clearTimeout(timer);
    }
  };

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.docx')) {
      setErrorMessage(t.upload.errors.UNSUPPORTED_FILE_TYPE);
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMessage(t.upload.errors.FILE_TOO_LARGE);
      return;
    }

    try {
      await runExtractAndAnalyze(extractContractFile(file, token));
    } catch (err) {
      setErrorMessage(mapErrorMessage(err));
    } finally {
      setLoadingStage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-3xl border border-surface-border bg-surface-card shadow-sm p-6 sm:p-10">
        <div
          role="button"
          tabIndex={0}
          aria-label={t.upload.dropzoneTitle}
          onClick={() => !loadingStage && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !loadingStage) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all ${
            isDragging
              ? 'border-brand bg-teal-50 scale-[0.99]'
              : 'border-slate-300 bg-slate-50/50 hover:border-brand hover:bg-teal-50/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          {loadingStage ? (
            <div className="flex flex-col items-center gap-3 text-sm font-semibold text-brand">
              <Loader2 className="h-10 w-10 animate-spin" aria-hidden="true" />
              <span className="animate-pulse text-base">{loadingStage}</span>
            </div>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-brand shadow-sm mb-2">
                <FileUp className="h-8 w-8" aria-hidden="true" />
              </div>
              <p className="mt-2 text-base font-bold text-ink-primary">
                {t.upload.dropzoneTitle}
              </p>
              <p className="mt-1 text-xs text-ink-muted max-w-sm">
                {t.upload.dropzoneHint}
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-brand-hover transition">
                <Upload className="h-3.5 w-3.5" />
                <span>{lang === 'uk' ? 'Обрати файл з пристрою' : 'Choose file to audit'}</span>
              </div>
            </>
          )}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-surface-border flex flex-wrap items-center justify-between text-xs text-ink-muted gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <span>{lang === 'uk' ? 'Конфіденційність: файли автоматично видаляються' : 'Privacy: files are encrypted and automatically deleted'}</span>
          </div>
          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">PDF, DOCX (max 10MB)</span>
        </div>
      </div>
    </div>
  );
};
