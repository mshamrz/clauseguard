import React, { useState } from 'react';
import { AlertOctagon, Check, Copy, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LiveClauseSpecimen: React.FC = () => {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const items = t.specimen.items;
  const active = items[activeIndex] ?? items[0];

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard API may be blocked on non-HTTPS origins
    }
  };

  return (
    <section
      aria-labelledby="specimen-title"
      className="rounded-2xl border border-surface-border bg-surface-card shadow-sm overflow-hidden"
    >
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border bg-surface-subtle px-5 py-3.5">
        <h2 id="specimen-title" className="text-xs font-bold uppercase tracking-wider text-ink-primary flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-brand" />
          <span>{t.specimen.panelTitle}</span>
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-[11px] font-bold text-rose-700">
          <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{active.riskLabel}</span>
        </span>
      </div>

      {/* Clause switch tabs */}
      <div
        className="flex flex-wrap gap-1 p-2 border-b border-surface-border bg-slate-50/60"
        role="tablist"
        aria-label="Sample flagged clauses"
      >
        {items.map((item, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveIndex(idx)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-ink-secondary hover:bg-slate-200 hover:text-ink-primary'
              }`}
            >
              {item.tabLabel}
            </button>
          );
        })}
      </div>

      {/* Clear 3-Column Comparison Grid */}
      <div className="grid grid-cols-1 divide-y divide-surface-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Column 1: Original Clause */}
        <div className="flex flex-col p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              {t.specimen.col1Title}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-ink-secondary">
              {active.clauseRef}
            </span>
          </div>
          <blockquote className="rounded-xl border-l-4 border-rose-500 bg-rose-50/40 p-4 font-mono text-xs leading-relaxed text-ink-primary">
            "{active.originalExcerpt}"
          </blockquote>
        </div>

        {/* Column 2: Plain-Language Meaning */}
        <div className="flex flex-col p-6 space-y-3">
          <div className="border-b border-surface-border pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              {t.specimen.col2Title}
            </span>
          </div>
          <div className="rounded-xl bg-amber-50/40 border border-amber-200/60 p-4">
            <p className="text-xs leading-relaxed text-amber-950 font-medium">
              {active.plainLanguageSummary}
            </p>
          </div>
        </div>

        {/* Column 3: Counter-Clause */}
        <div className="flex flex-col justify-between p-6 space-y-3 bg-teal-50/30">
          <div className="space-y-3">
            <div className="border-b border-teal-200 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                {t.specimen.col3Title}
              </span>
            </div>
            <div className="rounded-xl border border-teal-200 bg-white p-4 font-mono text-xs leading-relaxed text-teal-950 shadow-xs">
              "{active.counterClause}"
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleCopy(active.id, active.counterClause)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-hover"
          >
            {copiedId === active.id ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>{t.specimen.copiedBtn}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                <span>{t.specimen.copyBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
