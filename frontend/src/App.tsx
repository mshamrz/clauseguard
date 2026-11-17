import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { fetchAuditById, fetchMyAudits } from './api/client';
import { AuthModal } from './components/AuthModal';
import { DonationModal } from './components/DonationModal';
import { Navbar } from './components/Navbar';
import { ResultsView } from './components/ResultsView';
import { SubscriptionPlanView } from './components/SubscriptionPlanView';
import { UploadZone } from './components/UploadZone';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuditExtractionRecord, AuditSummaryItem } from './types';

function readAuditIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const queryId = params.get('audit');
  if (queryId) return queryId;

  const pathMatch = window.location.pathname.match(/^\/audits\/([^/]+)$/);
  return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
}

const MainShell: React.FC = () => {
  const { t, lang } = useLanguage();
  const { user, token, login, register } = useAuth();
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup' }>({
    open: false,
    mode: 'login',
  });
  const [donateOpen, setDonateOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<AuditExtractionRecord | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditLoadError, setAuditLoadError] = useState(false);
  const [recentAudits, setRecentAudits] = useState<AuditSummaryItem[]>([]);

  // 3-Step Flow: 1. Account -> 2. Plan & Promo Code -> 3. Contract Audit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(() => {
    if (readAuditIdFromUrl()) return 3;
    const hasToken = localStorage.getItem('clauseguard_token');
    const planActive = localStorage.getItem('clauseguard_plan_active') === 'true';
    if (!hasToken) return 1;
    if (!planActive) return 2;
    return 3;
  });

  // Step 1 In-Page Auth State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const loadAuditFromId = async (auditId: string) => {
    setLoadingAudit(true);
    setAuditLoadError(false);
    try {
      const record = await fetchAuditById(auditId);
      setActiveRecord(record);
      setCurrentStep(3);
    } catch {
      setActiveRecord(null);
      setAuditLoadError(true);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Load audit directly when user opens a shared ?audit=<uuid> or /audits/<uuid> link
  useEffect(() => {
    const urlAuditId = readAuditIdFromUrl();
    if (urlAuditId) {
      void loadAuditFromId(urlAuditId);
    }

    const onPopState = () => {
      const nextId = readAuditIdFromUrl();
      if (nextId) {
        void loadAuditFromId(nextId);
      } else {
        setActiveRecord(null);
        setAuditLoadError(false);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Load signed-in user's recent 24h audits
  useEffect(() => {
    if (!token || !user) {
      setRecentAudits([]);
      return;
    }
    fetchMyAudits(token)
      .then(setRecentAudits)
      .catch(() => setRecentAudits([]));
  }, [token, user, activeRecord]);

  // Advance step when user logs in
  useEffect(() => {
    if (user && currentStep === 1) {
      const planActive = localStorage.getItem('clauseguard_plan_active') === 'true';
      setCurrentStep(planActive ? 3 : 2);
    }
  }, [user]);

  const openRecord = (record: AuditExtractionRecord) => {
    setActiveRecord(record);
    setAuditLoadError(false);
    setCurrentStep(3);
    const targetUrl = `/?audit=${encodeURIComponent(record.auditId)}`;
    if (window.location.search !== `?audit=${encodeURIComponent(record.auditId)}`) {
      window.history.pushState({}, '', targetUrl);
    }
  };

  const resetToUpload = () => {
    setActiveRecord(null);
    setAuditLoadError(false);
    setCurrentStep(3);
    if (window.location.search || window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleInPageAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === 'signup' && authPassword !== authConfirmPassword) {
      setAuthError(t.auth.passwordMismatch);
      return;
    }

    setAuthSubmitting(true);
    try {
      if (authMode === 'signup') {
        await register(authName, authEmail, authPassword);
      } else {
        await login(authEmail, authPassword);
      }
      setCurrentStep(2);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      await login('alex.google.user@example.com', 'GooglePassword123!');
      setCurrentStep(2);
    } catch {
      try {
        await register('Alex Vlasyuk (Google)', 'alex.google.user@example.com', 'GooglePassword123!');
        setCurrentStep(2);
      } catch (err: any) {
        setAuthError('Google authentication failed.');
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const passwordsMatch = authPassword.length > 0 && authPassword === authConfirmPassword;
  const showMatchStatus = authMode === 'signup' && authConfirmPassword.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-surface-bg text-ink-primary font-sans">
      <Navbar
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onOpenDonate={() => setDonateOpen(true)}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {loadingAudit ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-surface-border bg-surface-card p-16 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden="true" />
            <span className="mt-3 text-sm font-semibold text-ink-primary">{t.auditNotFound.loading}</span>
          </div>
        ) : auditLoadError ? (
          <div className="rounded-2xl border border-rose-200 bg-surface-card p-8 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" aria-hidden="true" />
              <div>
                <h1 className="text-xl font-bold text-ink-primary">
                  {t.auditNotFound.title}
                </h1>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-secondary">
                  {t.auditNotFound.description}
                </p>
                <button
                  type="button"
                  onClick={resetToUpload}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-hover transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.auditNotFound.backBtn}</span>
                </button>
              </div>
            </div>
          </div>
        ) : activeRecord ? (
          <ResultsView
            record={activeRecord}
            onReset={resetToUpload}
            onOpenDonate={() => setDonateOpen(true)}
          />
        ) : currentStep === 1 && !user ? (
          /* STEP 1: Account & Authentication Screen */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto py-4">
            
            {/* Left Col: Pitch & Value Proposition */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-brand text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{lang === 'uk' ? 'Крок 1 з 3: Вхід або Реєстрація' : 'Step 1 of 3: Account & Sign In'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-primary leading-tight">
                {lang === 'uk'
                  ? 'Перевірте B2B-договір перед тим, як підписати.'
                  : 'Audit your client contract before signing.'}
              </h1>

              <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
                {lang === 'uk'
                  ? 'ШІ знаходить небезпечні пастки (необмежену відповідальність, Net 60/90, крадіжку коду), пояснює їх простою мовою та готує збалансовані правки для клієнта.'
                  : 'ClauseGuard flags hidden commercial risks (uncapped liability, 60-day payout traps, IP grabs) and generates balanced counter-clauses to copy.'}
              </p>

              {/* 2 Key Value Pillars */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-brand">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-primary">
                      {lang === 'uk' ? 'Повний захист від юридичних пасток' : 'Protection against predatory clauses'}
                    </h4>
                    <p className="text-[12px] text-ink-secondary mt-0.5">
                      {lang === 'uk'
                        ? 'Перевірка необмеженої відповідальності, штрафів, строків оплат та прав інтелектуальної власності.'
                        : 'Audit uncapped liability, penalty traps, payment delays, and IP transfer clauses.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-brand">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-primary">
                      {lang === 'uk' ? 'Миттєвий аудит та готові правки' : 'Instant AI analysis & counter-clauses'}
                    </h4>
                    <p className="text-[12px] text-ink-secondary mt-0.5">
                      {lang === 'uk'
                        ? 'Завантажуйте PDF або DOCX та отримуйте збалансовані формулювання для клієнта.'
                        : 'Upload PDF or DOCX contracts and copy lawyer-grade counter-proposals.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest shortcut */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                >
                  <span>{lang === 'uk' ? 'Перейти до вибору тарифу / промокоду →' : 'Continue to Plan & Promo Code →'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Col: Clean Auth Card */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-surface-border bg-surface-card p-6 sm:p-8 shadow-xl space-y-5">
                
                {/* Tabs */}
                <div className="flex rounded-xl bg-surface-subtle p-1 border border-surface-border text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                    }}
                    className={`flex-1 rounded-lg py-2 transition-all ${
                      authMode === 'login'
                        ? 'bg-white text-brand shadow-sm font-extrabold'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    {t.auth.signInBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError(null);
                    }}
                    className={`flex-1 rounded-lg py-2 transition-all ${
                      authMode === 'signup'
                        ? 'bg-white text-brand shadow-sm font-extrabold'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    {t.auth.signUpBtn}
                  </button>
                </div>

                {/* Google Sign-in Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authSubmitting}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-surface-border bg-white py-2.5 px-4 text-xs font-bold text-ink-primary shadow-xs hover:bg-slate-50 hover:border-slate-400 transition disabled:opacity-50"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>
                    {authMode === 'signup'
                      ? (lang === 'uk' ? 'Зареєструватися через Google' : 'Sign up with Google')
                      : (lang === 'uk' ? 'Увійти через Google' : 'Sign in with Google')}
                  </span>
                </button>

                {/* Divider */}
                <div className="relative my-1 flex items-center justify-center">
                  <div className="border-t border-surface-border w-full"></div>
                  <span className="bg-surface-card px-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider relative">
                    {lang === 'uk' ? 'або через email' : 'or with email'}
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleInPageAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-ink-secondary mb-1">
                        {t.auth.nameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Alex Vlasyuk (FOP Dev)"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full rounded-xl border border-surface-border bg-surface-bg px-3.5 py-2.5 text-sm text-ink-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1">
                      {t.auth.emailLabel}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@fop.ua"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full rounded-xl border border-surface-border bg-surface-bg px-3.5 py-2.5 text-sm text-ink-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1">
                      {t.auth.passwordLabel}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full rounded-xl border border-surface-border bg-surface-bg px-3.5 py-2.5 text-sm text-ink-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-ink-secondary">
                          {t.auth.confirmPasswordLabel}
                        </label>
                        {showMatchStatus && (
                          <span className={`text-[11px] font-semibold flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {passwordsMatch ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{lang === 'uk' ? 'Збігаються' : 'Match'}</span>
                              </>
                            ) : (
                              <span>{lang === 'uk' ? 'Не збігаються' : 'Does not match'}</span>
                            )}
                          </span>
                        )}
                      </div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        className={`w-full rounded-xl border bg-surface-bg px-3.5 py-2.5 text-sm text-ink-primary outline-none transition ${
                          showMatchStatus && !passwordsMatch
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
                            : 'border-surface-border focus:border-brand focus:ring-1 focus:ring-brand'
                        }`}
                      />
                    </div>
                  )}

                  {authError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authSubmitting || (authMode === 'signup' && (!passwordsMatch || authPassword.length < 6))}
                    className="w-full rounded-xl bg-brand py-3 text-xs font-extrabold text-white shadow-md shadow-brand/20 hover:bg-brand-hover transition-colors disabled:opacity-50"
                  >
                    {authSubmitting ? '...' : authMode === 'signup' ? t.auth.signUpBtn : t.auth.signInBtn}
                  </button>
                </form>

              </div>
            </div>

          </div>
        ) : currentStep === 2 ? (
          /* STEP 2: Subscription & Promo Code Screen */
          <SubscriptionPlanView
            onContinue={() => setCurrentStep(3)}
            onOpenDonate={() => setDonateOpen(true)}
          />
        ) : (
          /* STEP 3: Contract Upload & Ingestion Screen */
          <div className="space-y-8">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-0.5 text-xs font-bold text-brand">
                    Step 3: AI Contract Audit
                  </span>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Access Unlocked</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
                  {t.workspace.title}
                </h1>
                <p className="text-xs sm:text-sm text-ink-secondary max-w-3xl leading-relaxed">
                  {t.workspace.subtitle}
                </p>
              </div>

              {/* Plan switch shortcut */}
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="shrink-0 rounded-xl border border-surface-border bg-white px-3.5 py-2 text-xs font-bold text-ink-secondary hover:text-ink-primary hover:border-slate-400 transition"
              >
                Change Plan / Promo Code
              </button>
            </div>

            {/* Signed-in User's Recent Audits (24h TTL) */}
            {user && recentAudits.length > 0 && (
              <section className="rounded-2xl border border-surface-border bg-surface-card shadow-sm overflow-hidden">
                <div className="border-b border-surface-border bg-surface-subtle px-5 py-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-primary">
                    {t.recentAudits.title}
                  </h2>
                </div>
                <div className="divide-y divide-surface-border">
                  {recentAudits.slice(0, 5).map((item) => (
                    <div
                      key={item.auditId}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-bold text-ink-primary">
                          {item.fileName}
                        </span>
                        {item.overallRiskScore !== null && (
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-ink-secondary">
                            {t.recentAudits.scorePrefix}: {item.overallRiskScore}/100
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void loadAuditFromId(item.auditId)}
                        className="rounded-xl border border-surface-border bg-white px-3.5 py-1.5 text-xs font-bold text-ink-primary shadow-xs hover:bg-surface-subtle transition-colors"
                      >
                        {t.recentAudits.openBtn}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Primary Action: Clean Upload Box */}
            <UploadZone onExtracted={openRecord} />
          </div>
        )}
      </main>

      <footer className="border-t border-surface-border bg-white mt-12">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-muted text-center sm:px-6">
          {t.disclaimerBanner}
        </div>
      </footer>

      <AuthModal
        isOpen={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
      />

      <DonationModal isOpen={donateOpen} onClose={() => setDonateOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainShell />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
