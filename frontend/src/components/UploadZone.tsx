import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, FileText, Loader2, Upload } from 'lucide-react';
import {
  analyzeAudit,
  ApiClientError,
  extractContractFile,
  extractSampleContract,
  fetchSamples,
  getSampleDownloadUrl,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AuditExtractionRecord, SampleMetadata } from '../types';

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
  const [samples, setSamples] = useState<SampleMetadata[]>([]);

  useEffect(() => {
    fetchSamples()
      .then(setSamples)
      .catch(() => {
        // Non-blocking when backend is offline
      });
  }, []);

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

  const handleSampleTest = async (filename: string) => {
    setErrorMessage(null);
    try {
      await runExtractAndAnalyze(extractSampleContract(filename, token));
    } catch (err) {
      setErrorMessage(mapErrorMessage(err));
    } finally {
      setLoadingStage(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left 6 cols: Primary Drag-and-Drop Box */}
      <div className="flex flex-col rounded-2xl border border-surface-border bg-surface-card shadow-sm overflow-hidden lg:col-span-6">
        <div className="border-b border-surface-border bg-surface-subtle px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-primary flex items-center gap-2">
            <Upload className="h-4 w-4 text-brand" />
            <span>{t.upload.sectionTitle}</span>
          </h2>
          <span className="text-[11px] font-semibold text-brand bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
            PDF / DOCX
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
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
            className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all ${
              isDragging
                ? 'border-brand bg-brand-subtle scale-[0.99]'
                : 'border-slate-300 bg-slate-50/60 hover:border-brand hover:bg-teal-50/40'
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
                <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
                <span className="animate-pulse">{loadingStage}</span>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-brand shadow-sm">
                  <Upload className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm font-bold text-ink-primary">
                  {t.upload.dropzoneTitle}
                </p>
                <p className="mt-1 text-xs text-ink-muted max-w-xs">
                  {t.upload.dropzoneHint}
                </p>
              </>
            )}
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right 6 cols: Human-Friendly Sample Contracts */}
      <div className="flex flex-col rounded-2xl border border-surface-border bg-surface-card shadow-sm overflow-hidden lg:col-span-6">
        <div className="border-b border-surface-border bg-surface-subtle px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-primary flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand" />
            <span>{t.upload.samplesHeading}</span>
          </h2>
          <span className="text-[11px] font-semibold text-ink-muted">
            1-Click Test
          </span>
        </div>

        <div className="flex-1 divide-y divide-surface-border">
          {samples.map((sample) => {
            const isScannedTest = sample.expectedOutcome === 'scanned_error';
            return (
              <div
                key={sample.filename}
                className="flex flex-col justify-between gap-3 p-4 hover:bg-slate-50/80 transition-colors sm:flex-row sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink-primary">
                      {lang === 'uk' ? sample.labelUk : sample.labelEn}
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-secondary">
                      {sample.filename.endsWith('.pdf') ? 'PDF' : 'DOCX'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {lang === 'uk' ? sample.descriptionUk : sample.descriptionEn}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={Boolean(loadingStage)}
                    onClick={() => void handleSampleTest(sample.filename)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition-all disabled:opacity-50 ${
                      isScannedTest
                        ? 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'bg-brand text-white hover:bg-brand-hover shadow-brand/20'
                    }`}
                  >
                    {isScannedTest ? t.upload.runTestError : t.upload.runTest}
                  </button>
                  <a
                    href={getSampleDownloadUrl(sample.filename)}
                    download={sample.filename}
                    title={t.upload.downloadSample}
                    aria-label={`${t.upload.downloadSample} ${sample.filename}`}
                    className="inline-flex items-center rounded-xl border border-surface-border bg-white p-2 text-ink-secondary transition-colors hover:border-slate-400 hover:text-ink-primary"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
