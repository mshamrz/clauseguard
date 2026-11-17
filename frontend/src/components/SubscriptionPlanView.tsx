import React, { useState } from 'react';
import { Check, CheckCircle2, Heart, Shield, Sparkles, Tag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SubscriptionPlanViewProps {
  onContinue: () => void;
  onOpenDonate: () => void;
}

const VALID_PROMO_CODES = ['DEMO2026', 'MODULE11', 'FREELANCER', 'STUDENT', 'VIP', 'PROMO', 'CLAUSEFREE'];

export const SubscriptionPlanView: React.FC<SubscriptionPlanViewProps> = ({
  onContinue,
  onOpenDonate,
}) => {
  const { t, lang } = useLanguage();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(() => {
    return localStorage.getItem('clauseguard_plan_active') === 'true';
  });
  const [promoError, setPromoError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('free');

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoCode.trim().toUpperCase();

    if (VALID_PROMO_CODES.includes(code)) {
      setPromoApplied(true);
      localStorage.setItem('clauseguard_plan_active', 'true');
      localStorage.setItem('clauseguard_promo_code', code);
    } else {
      setPromoError(t.subscription.promoInvalidMsg);
    }
  };

  const handleSelectPlan = (plan: 'free' | 'pro' | 'agency') => {
    setSelectedPlan(plan);
    if (plan === 'free') {
      if (!promoApplied) {
        // prompt user to enter promo code
        setPromoError(lang === 'uk' ? 'Будь ласка, введіть промокод для активації цього тарифу.' : 'Please enter a promo code to activate this plan.');
        return;
      }
      localStorage.setItem('clauseguard_plan_active', 'true');
    } else if (plan === 'pro') {
      onOpenDonate();
      setPromoApplied(true);
      localStorage.setItem('clauseguard_plan_active', 'true');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-brand text-xs font-bold tracking-wide">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t.subscription.stepLabel}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
          {t.subscription.title}
        </h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          {t.subscription.subtitle}
        </p>
      </div>

      {/* Promo Code Input Card */}
      <div className="rounded-2xl border border-surface-border bg-white p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-ink-primary">
                {t.subscription.promoTitle}
              </h3>
            </div>
            <p className="text-xs text-ink-secondary">
              {lang === 'uk'
                ? 'Введіть ваш партнерський або персональний промокод для активації доступу.'
                : 'Enter your partner or personal promo code to activate access.'}
            </p>
          </div>

          <form onSubmit={handleApplyPromo} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoError(null);
              }}
              placeholder={t.subscription.promoPlaceholder}
              className="w-full sm:w-64 rounded-xl border border-surface-border bg-surface-bg px-3.5 py-2.5 text-xs font-mono font-semibold uppercase text-ink-primary placeholder:normal-case placeholder:font-sans outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-hover transition-colors"
            >
              {t.subscription.applyPromoBtn}
            </button>
          </form>
        </div>

        {promoApplied && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{t.subscription.promoSuccessMsg}</span>
            </div>
            <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              ACTIVE
            </span>
          </div>
        )}

        {promoError && (
          <div className="mt-3 text-xs font-medium text-rose-600">
            {promoError}
          </div>
        )}
      </div>

      {/* Claude-style 3 Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tier 1: Free Evaluation */}
        <div
          className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
            selectedPlan === 'free' && promoApplied
              ? 'border-brand bg-teal-50/20 ring-2 ring-brand shadow-md'
              : 'border-surface-border bg-surface-card hover:border-slate-300'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                {t.subscription.freeTierTitle}
              </span>
              {promoApplied && selectedPlan === 'free' && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  {t.subscription.planActiveBadge}
                </span>
              )}
            </div>

            <div>
              <div className="text-2xl font-black text-ink-primary">
                0 UAH
              </div>
              <div className="text-xs text-ink-secondary mt-0.5">
                {t.subscription.freeTierPrice}
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              {t.subscription.freeTierDesc}
            </p>

            <ul className="space-y-2 text-xs text-ink-secondary pt-2 border-t border-surface-border">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Unlimited clause risk detection</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Plain-language liability summaries</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>1-Click Copy Counter-Clauses</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Downloadable 1-page PDF summary</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={() => handleSelectPlan('free')}
              className={`w-full rounded-xl py-2.5 text-xs font-bold transition ${
                promoApplied && selectedPlan === 'free'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-subtle text-ink-primary hover:bg-slate-200'
              }`}
            >
              {promoApplied && selectedPlan === 'free'
                ? t.subscription.planActiveBadge
                : t.subscription.activateFreeBtn}
            </button>
          </div>
        </div>

        {/* Tier 2: Pro Freelancer (Most Popular) */}
        <div className="rounded-2xl border-2 border-brand bg-surface-card p-6 flex flex-col justify-between relative shadow-lg shadow-brand/5">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Recommended · FOP Group 3
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                {t.subscription.proTierTitle}
              </span>
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
            </div>

            <div>
              <div className="text-2xl font-black text-ink-primary">
                200 UAH
              </div>
              <div className="text-xs text-ink-secondary mt-0.5">
                {t.subscription.proTierPrice}
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              {t.subscription.proTierDesc}
            </p>

            <ul className="space-y-2 text-xs text-ink-secondary pt-2 border-t border-surface-border">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Everything in Free Evaluation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Supports Armed Forces of Ukraine</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Monobank Jar instant verification</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Priority Bedrock AI engine</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={() => handleSelectPlan('pro')}
              className="w-full rounded-xl bg-brand py-2.5 text-xs font-bold text-white shadow-md shadow-brand/20 hover:bg-brand-hover transition"
            >
              {t.subscription.selectTierBtn} (200 UAH)
            </button>
          </div>
        </div>

        {/* Tier 3: Agency Studio */}
        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                {t.subscription.agencyTierTitle}
              </span>
              <Shield className="h-4 w-4 text-slate-400" />
            </div>

            <div>
              <div className="text-2xl font-black text-ink-primary">
                800 UAH
              </div>
              <div className="text-xs text-ink-secondary mt-0.5">
                {t.subscription.agencyTierPrice}
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              {t.subscription.agencyTierDesc}
            </p>

            <ul className="space-y-2 text-xs text-ink-secondary pt-2 border-t border-surface-border">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Up to 15 agency team members</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Custom client counter-templates</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Shared team audit repository</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                <span>Dedicated contract export formats</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={() => handleSelectPlan('agency')}
              className="w-full rounded-xl bg-surface-subtle py-2.5 text-xs font-bold text-ink-primary hover:bg-slate-200 transition"
            >
              {t.subscription.selectTierBtn}
            </button>
          </div>
        </div>

      </div>

      {/* Main Continue Button to Proceed to Audit */}
      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand/25 hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>{t.subscription.continueToAuditBtn}</span>
        </button>
      </div>
    </div>
  );
};
