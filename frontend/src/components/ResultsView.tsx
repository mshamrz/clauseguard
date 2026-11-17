import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  FileDown,
  Link2,
  Loader2,
} from 'lucide-react';
import { downloadExecutivePdf } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { AuditExtractionRecord, RiskLevel } from '../types';
import { RiskBadge } from './RiskBadge';

interface ResultsViewProps {
  record: AuditExtractionRecord;
  onReset: () => void;
  onOpenDonate: () => void;
}

type FilterOption = 'ALL' | RiskLevel;

const BORDER_ACCENTS: Record<RiskLevel, string> = {
  HIGH: 'border-risk-highBorder',
  MEDIUM: 'border-risk-medBorder',
  LOW: 'border-risk-lowBorder',
};

export const ResultsView: React.FC<ResultsViewProps> = ({
  record,
  onReset,
  onOpenDonate,
}) => {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showRawClauses, setShowRawClauses] = useState(false);
  const [showDownloadPage, setShowDownloadPage] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const analysis = record.analysis;
  const counts = record.analysisMeta?.riskCounts ?? { high: 0, medium: 0, low: 0 };
  const sizeKb = (record.fileSizeBytes / 1024).toFixed(1);

  const flaggedClauses = analysis?.flaggedClauses ?? [];
  const filteredClauses = useMemo(() => {
    if (filter === 'ALL') return flaggedClauses;
    return flaggedClauses.filter((c) => c.riskLevel === filter);
  }, [flaggedClauses, filter]);

  const flaggedClauseNumberSet = useMemo(
    () => new Set(flaggedClauses.map((c) => c.clauseNumber)),
    [flaggedClauses],
  );

  const copyWithFeedback = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard fallback ignored if blocked by browser policy
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/?audit=${encodeURIComponent(record.auditId)}`;
    void copyWithFeedback('share-link', shareUrl);
  };

  const handleCopyAllCounterClauses = () => {
    const redlinePack = flaggedClauses
      .map(
        (flag) =>
          `--- Clause ${flag.clauseNumber} (${t.extraction.categories[flag.category]}) [${flag.riskLevel}] ---\n${flag.counterClause}`,
      )
      .join('\n\n');
    void copyWithFeedback('copy-all', redlinePack);
  };

  const handleDownloadPdf = async () => {
    setPdfError(null);
    setDownloadingPdf(true);
    try {
      await downloadExecutivePdf(record.auditId, record.fileName, lang);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'PDF download failed.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const score = analysis?.overallRiskScore ?? 0;
  const scoreColor =
    score >= 60
      ? 'text-risk-highText'
      : score >= 30
        ? 'text-risk-medText'
        : 'text-risk-lowText';
  const scoreBarColor =
    score >= 60 ? 'bg-risk-highText' : score >= 30 ? 'bg-risk-medText' : 'bg-risk-lowText';
  const scoreRatingText =
    score >= 60
      ? t.extraction.riskRatingHigh
      : score >= 30
        ? t.extraction.riskRatingMed
        : t.extraction.riskRatingLow;

  const filterTabs: { id: FilterOption; label: string; count: number }[] = [
    { id: 'ALL', label: t.extraction.filterAll, count: flaggedClauses.length },
    { id: 'HIGH', label: t.extraction.highRisks, count: counts.high },
    { id: 'MEDIUM', label: t.extraction.mediumRisks, count: counts.medium },
    { id: 'LOW', label: t.extraction.lowRisks, count: counts.low },
  ];

  // Dedicated 1-Page Executive Summary Download Page View
  if (showDownloadPage && analysis) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-4">
          <div>
            <h1 className="font-sans text-2xl font-semibold text-ink-primary">
              {t.extraction.downloadPageTitle}
            </h1>
            <p className="mt-1 text-sm text-ink-secondary">{t.extraction.downloadPageSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDownloadPage(false)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-surface-border bg-surface-card shadow-sm px-3.5 py-2 text-xs font-medium text-ink-primary transition-colors hover:bg-surface-subtle"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.extraction.backToResultsBtn}</span>
            </button>
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={() => void handleDownloadPdf()}
              className="inline-flex items-center gap-1.5 border border-brand bg-brand px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {downloadingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {downloadingPdf ? t.extraction.downloadingPdfBtn : t.extraction.downloadPdfBtn}
              </span>
            </button>
          </div>
        </div>

        {pdfError && (
          <div
            role="alert"
            className="border border-risk-highBorder bg-risk-highBg px-4 py-3 text-xs text-risk-highText"
          >
            {pdfError}
          </div>
        )}

        {/* Simulated 1-Page Sheet Preview */}
        <article className="mx-auto max-w-3xl rounded-2xl border border-surface-border bg-surface-card shadow-sm p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-brand pb-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-brand">
              CLAUSEGUARD · EXECUTIVE SUMMARY
            </span>
            <span className="font-mono text-[11px] text-ink-muted">{t.disclaimerBadge}</span>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-4 border border-surface-border bg-surface-bg p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-ink-primary">{record.fileName}</p>
              <p className="mt-0.5 font-mono text-xs text-ink-muted">
                {record.pageCount}p · {record.wordCount}w · {analysis.contractLanguage.toUpperCase()}
              </p>
              <p className="mt-2 font-mono text-xs font-semibold text-ink-primary">
                {t.extraction.highRisks}: {counts.high} · {t.extraction.mediumRisks}: {counts.medium} ·{' '}
                {t.extraction.lowRisks}: {counts.low}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                {t.extraction.riskScoreLabel}
              </span>
              <div className={`font-mono text-3xl font-semibold ${scoreColor}`}>
                {score}/100
              </div>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-ink-secondary">
            {analysis.executiveSummary}
          </p>

          <div className="mt-5 border-t border-surface-border pt-4">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-brand">
              {t.extraction.checklistTitle}
            </h2>
            <ul className="mt-2.5 space-y-1.5">
              {analysis.negotiationChecklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-ink-primary">
                  <span className="font-mono font-semibold text-brand">{idx + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 border-t border-surface-border pt-4">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-brand">
              {t.extraction.flaggedTitle} ({flaggedClauses.length})
            </h2>
            <div className="mt-2.5 divide-y divide-surface-border border border-surface-border">
              {flaggedClauses.map((flag, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-ink-primary">
                      § {flag.clauseNumber} · {t.extraction.categories[flag.category]}
                    </p>
                    <p className="mt-1 text-xs text-ink-secondary">{flag.plainLanguageSummary}</p>
                  </div>
                  <RiskBadge level={flag.riskLevel} />
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Status, Title, Shareable UUID & Action Buttons */}
      <div className="flex flex-col justify-between gap-4 border-b border-surface-border pb-5 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border border-brand bg-brand-subtle px-2.5 py-0.5 font-mono text-[11px] font-semibold text-brand">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.extraction.phaseBadge}</span>
            </span>
            <span className="font-mono text-[11px] text-ink-muted">
              {t.extraction.expiresNote}
            </span>
          </div>
          <h1 className="mt-2.5 font-sans text-2xl font-semibold tracking-tight text-ink-primary sm:text-3xl">
            {record.fileName}
          </h1>
          {analysis && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-secondary">
              {analysis.executiveSummary}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {analysis && (
            <button
              type="button"
              onClick={() => setShowDownloadPage(true)}
              className="inline-flex items-center gap-1.5 border border-brand bg-brand px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-hover"
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.extraction.openDownloadPageBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-1.5 border border-surface-border bg-surface-card px-3 py-2 text-xs font-medium text-ink-primary transition-colors hover:border-surface-strong"
          >
            {copiedKey === 'share-link' ? (
              <>
                <Check className="h-3.5 w-3.5 text-risk-lowText" aria-hidden="true" />
                <span>{t.extraction.copiedShareLink}</span>
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.extraction.copyShareLink}</span>
              </>
            )}
          </button>

          {flaggedClauses.length > 0 && (
            <button
              type="button"
              onClick={handleCopyAllCounterClauses}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-surface-border bg-surface-card shadow-sm px-3 py-2 text-xs font-medium text-ink-primary transition-colors hover:bg-surface-subtle"
            >
              {copiedKey === 'copy-all' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-risk-lowText" aria-hidden="true" />
                  <span>{t.extraction.copiedAllCounterClauses}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.extraction.copyAllCounterClauses}</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-surface-border bg-surface-card shadow-sm px-3 py-2 text-xs font-medium text-ink-primary transition-colors hover:bg-surface-subtle"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.extraction.newUpload}</span>
          </button>
        </div>
      </div>

      {/* Risk Score & Contract Metadata Grid */}
      <dl className="grid grid-cols-2 divide-x divide-y divide-surface-border rounded-2xl border border-surface-border bg-surface-card shadow-sm lg:grid-cols-5 lg:divide-y-0">
        {analysis && (
          <div className="col-span-2 p-4 lg:col-span-2">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              {t.extraction.riskScoreLabel}
            </dt>
            <dd className="mt-1 flex items-baseline gap-3">
              <span className={`font-mono text-3xl font-semibold ${scoreColor}`}>
                {score}/100
              </span>
              <span className="text-xs font-medium text-ink-secondary">{scoreRatingText}</span>
            </dd>
            <div className="mt-2.5 h-1.5 w-full bg-surface-subtle" aria-hidden="true">
              <div
                className={`h-full ${scoreBarColor}`}
                style={{ width: `${Math.min(100, Math.max(4, score))}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-4">
          <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            {t.extraction.highRisks} / {t.extraction.mediumRisks} / {t.extraction.lowRisks}
          </dt>
          <dd className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-xs font-semibold">
            <span className="border border-risk-highBorder bg-risk-highBg px-2 py-0.5 text-risk-highText">
              H: {counts.high}
            </span>
            <span className="border border-risk-medBorder bg-risk-medBg px-2 py-0.5 text-risk-medText">
              M: {counts.medium}
            </span>
            <span className="border border-risk-lowBorder bg-risk-lowBg px-2 py-0.5 text-risk-lowText">
              L: {counts.low}
            </span>
          </dd>
        </div>

        <div className="p-4">
          <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            {t.extraction.pages} / {t.extraction.words}
          </dt>
          <dd className="mt-2 font-mono text-sm font-semibold text-ink-primary">
            {record.pageCount}p · {record.wordCount}w ({sizeKb} KB)
          </dd>
        </div>

        <div className="col-span-2 p-4 lg:col-span-1">
          <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            {t.extraction.language}
          </dt>
          <dd className="mt-2 text-sm font-semibold text-ink-primary">
            {t.extraction.langLabels[analysis?.contractLanguage ?? record.language]}
          </dd>
        </div>
      </dl>

      {/* Negotiation Checklist */}
      {analysis && analysis.negotiationChecklist.length > 0 && (
        <section className="rounded-2xl border border-surface-border bg-surface-card shadow-sm p-5">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-primary">
            {t.extraction.checklistTitle}
          </h2>
          <ul className="mt-3 space-y-2">
            {analysis.negotiationChecklist.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                <span className="mt-0.5 font-mono text-xs font-semibold text-brand">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Side-by-Side Flagged Clauses with Severity Filter Tabs */}
      {analysis && (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="font-sans text-xl font-semibold text-ink-primary">
              {t.extraction.flaggedTitle} ({flaggedClauses.length})
            </h2>

            <div
              className="inline-flex rounded-2xl border border-surface-border bg-surface-card shadow-sm"
              role="tablist"
              aria-label="Filter flagged clauses by severity"
            >
              {filterTabs.map((tab) => {
                const isSelected = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setFilter(tab.id)}
                    className={`border-r border-surface-border px-3 py-1.5 font-mono text-xs font-medium transition-colors last:border-r-0 ${
                      isSelected
                        ? 'bg-surface-strong text-white'
                        : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink-primary'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                );
              })}
            </div>
          </div>

          {flaggedClauses.length === 0 ? (
            <div className="border border-risk-lowBorder bg-risk-lowBg p-5 text-sm text-risk-lowText">
              {t.extraction.noRisksFound}
            </div>
          ) : filteredClauses.length === 0 ? (
            <div className="border border-surface-border bg-surface-card p-5 text-sm text-ink-muted">
              {t.extraction.filterEmpty}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClauses.map((flag, idx) => {
                const key = `flag-${idx}-${flag.clauseNumber}-${flag.category}`;
                const categoryName = t.extraction.categories[flag.category] ?? flag.category;

                return (
                  <article key={key} className="rounded-2xl border border-surface-border bg-surface-card shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border bg-surface-subtle px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-2xl border border-surface-border bg-surface-card shadow-sm px-2 py-0.5 font-mono text-xs font-semibold text-ink-primary">
                          § {flag.clauseNumber}
                        </span>
                        <span className="text-xs font-semibold text-ink-primary">
                          {categoryName}
                        </span>
                      </div>
                      <RiskBadge level={flag.riskLevel} />
                    </div>

                    {/* 3 columns on desktop, stacked vertically on mobile */}
                    <div className="grid grid-cols-1 divide-y divide-surface-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                      <div className="p-4">
                        <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                          {t.extraction.col1Title}
                        </span>
                        <blockquote
                          className={`mt-2 border-l-2 ${BORDER_ACCENTS[flag.riskLevel]} bg-surface-bg p-3 font-sans text-[13px] leading-relaxed text-ink-primary`}
                        >
                          “{flag.originalExcerpt}”
                        </blockquote>
                      </div>

                      <div className="p-4">
                        <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                          {t.extraction.col2Title}
                        </span>
                        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                          {flag.plainLanguageSummary}
                        </p>
                      </div>

                      <div className="flex flex-col bg-brand-subtle/40 p-4">
                        <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-brand">
                          {t.extraction.col3Title}
                        </span>
                        <p className="mt-2 flex-1 border border-surface-border bg-surface-card p-3 text-[13px] leading-relaxed text-ink-primary">
                          {flag.counterClause}
                        </p>
                        <button
                          type="button"
                          onClick={() => void copyWithFeedback(key, flag.counterClause)}
                          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 border border-brand bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-hover"
                        >
                          {copiedKey === key ? (
                            <>
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{t.extraction.copiedBtn}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{t.extraction.copyBtn}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Optional Donation Prompt Strip */}
      <div className="flex flex-col justify-between gap-3 border border-surface-border bg-surface-card px-5 py-4 sm:flex-row sm:items-center">
        <p className="text-xs leading-relaxed text-ink-secondary">
          {t.donation.description}
        </p>
        <button
          type="button"
          onClick={onOpenDonate}
          className="shrink-0 rounded-xl border border-surface-border bg-surface-subtle px-3.5 py-2 text-xs font-semibold text-ink-primary transition-colors hover:bg-brand hover:text-white"
        >
          {t.nav.donate}
        </button>
      </div>

      {/* Collapsible Full Contract Clauses Ledger */}
      <div className="border border-surface-border bg-surface-card">
        <button
          type="button"
          onClick={() => setShowRawClauses((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-left font-mono text-xs font-semibold text-ink-secondary transition-colors hover:bg-surface-subtle"
        >
          <span>
            {showRawClauses ? t.extraction.hideRawClausesToggle : t.extraction.rawClausesToggle} (
            {record.clauses.length})
          </span>
          {showRawClauses ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {showRawClauses && (
          <div className="divide-y divide-surface-border border-t border-surface-border">
            {record.clauses.map((clause) => {
              const isFlagged = flaggedClauseNumberSet.has(clause.clauseNumber);
              return (
                <article key={clause.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="border border-surface-border bg-surface-subtle px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-primary">
                        {t.extraction.clausePrefix} {clause.clauseNumber}
                      </span>
                      <h3 className="text-xs font-semibold text-ink-primary">{clause.title}</h3>
                    </div>
                    <span
                      className={`border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                        isFlagged
                          ? 'border-risk-highBorder bg-risk-highBg text-risk-highText'
                          : 'border-risk-lowBorder bg-risk-lowBg text-risk-lowText'
                      }`}
                    >
                      {isFlagged ? t.extraction.flaggedClauseTag : t.extraction.cleanClauseTag}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-ink-secondary">
                    {clause.text}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
