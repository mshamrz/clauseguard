import React from 'react';
import { ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentStep?: 1 | 2 | 3;
  onSelectStep?: (step: 1 | 2 | 3) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenDonate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep = 3,
  onSelectStep,
  onOpenAuth,
  onOpenDonate,
}) => {
  const { lang, setLang, t } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectStep?.(user ? 3 : 1)}
            className="flex items-center gap-2.5 text-ink-primary transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white shadow-md shadow-brand/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="text-lg font-extrabold tracking-tight text-ink-primary">{t.brand}</span>
            </div>
          </button>
        </div>

        {/* 3-Step Navigation Stepper */}
        {onSelectStep && (
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-surface-subtle p-1 border border-surface-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => onSelectStep(1)}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                currentStep === 1
                  ? 'bg-white text-brand shadow-sm font-bold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {t.stepper.step1}
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={() => onSelectStep(2)}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                currentStep === 2
                  ? 'bg-white text-brand shadow-sm font-bold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {t.stepper.step2}
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={() => onSelectStep(3)}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                currentStep === 3
                  ? 'bg-white text-brand shadow-sm font-bold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {t.stepper.step3}
            </button>
          </nav>
        )}

        {/* Right Actions: Lang + Donate + Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Switcher */}
          <div
            className="inline-flex rounded-xl border border-surface-border bg-surface-subtle p-0.5 text-xs font-bold"
            role="group"
            aria-label="Language switcher"
          >
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                lang === 'en'
                  ? 'bg-white text-brand shadow-sm font-extrabold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('uk')}
              className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                lang === 'uk'
                  ? 'bg-white text-brand shadow-sm font-extrabold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              UA
            </button>
          </div>

          {/* Donation Button */}
          <button
            type="button"
            onClick={onOpenDonate}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100 shadow-sm"
          >
            <span>{t.nav.donate}</span>
          </button>

          {/* User Auth Info */}
          {user ? (
            <div className="flex items-center gap-2 border-l border-surface-border pl-2 sm:pl-3">
              <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-ink-secondary">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-brand">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="truncate max-w-[120px]">{user.name || user.email}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-surface-border bg-surface-subtle px-3 py-1.5 text-xs font-bold text-ink-primary transition-colors hover:bg-slate-200"
              >
                {t.nav.signOut}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 border-l border-surface-border pl-2 sm:pl-3">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-ink-secondary transition-colors hover:text-ink-primary hover:bg-surface-subtle"
              >
                {t.nav.signIn}
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-brand/20 transition-colors hover:bg-brand-hover"
              >
                {t.nav.signUp}
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
