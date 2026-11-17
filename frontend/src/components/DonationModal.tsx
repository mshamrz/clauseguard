import React, { useState } from 'react';
import { CheckCircle2, ExternalLink, Heart, Loader2, X } from 'lucide-react';
import { DonationReceipt, submitDonation } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [50, 100, 200];

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  const { t, lang } = useLanguage();
  const [selectedUah, setSelectedUah] = useState<number>(100);
  const [openedJar, setOpenedJar] = useState(false);
  const [submittingMock, setSubmittingMock] = useState(false);
  const [receipt, setReceipt] = useState<DonationReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const jarUrl =
    (import.meta.env.VITE_MONOBANK_JAR_URL as string | undefined) ||
    'https://send.monobank.ua/jar/9WvSg8yH4Q';

  const handleMockDonate = async () => {
    setError(null);
    setSubmittingMock(true);
    try {
      const res = await submitDonation(selectedUah, 'mock');
      setReceipt(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Donation test failed.');
    } finally {
      setSubmittingMock(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/50 backdrop-blur-sm p-4 transition-all"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donate-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-6 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <Heart className="h-4 w-4 fill-rose-500" />
            </div>
            <h2 id="donate-modal-title" className="text-lg font-bold text-ink-primary">
              {t.donation.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.donation.close}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-secondary">{t.donation.description}</p>

        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            {t.donation.suggested}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  setSelectedUah(amount);
                  setOpenedJar(false);
                  setReceipt(null);
                }}
                className={`rounded-xl border px-3 py-2.5 font-mono text-xs font-bold transition-all ${
                  selectedUah === amount
                    ? 'border-brand bg-teal-50 text-brand ring-1 ring-brand'
                    : 'border-surface-border bg-surface-bg text-ink-primary hover:border-slate-300'
                }`}
              >
                {amount} UAH
              </button>
            ))}
          </div>
        </div>

        {openedJar && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              {lang === 'uk'
                ? `Відкрито посилання на Монобанку (${selectedUah} грн). Дякуємо за підтримку.`
                : `Opened Monobank Jar (${selectedUah} UAH). Thank you for your support.`}
            </span>
          </div>
        )}

        {receipt && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              {t.donation.donationSuccess} {receipt.amountUah} {receipt.currency} (ID: {receipt.donationId.slice(0, 8)})
            </span>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={jarUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpenedJar(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand/20 transition-colors hover:bg-brand-hover"
          >
            <span>{t.donation.openJar}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            disabled={submittingMock}
            onClick={handleMockDonate}
            className="rounded-xl border border-surface-border bg-surface-subtle px-4 py-2 text-xs font-semibold text-ink-primary transition-colors hover:bg-slate-200 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submittingMock ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            <span>{t.donation.testDonateBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
