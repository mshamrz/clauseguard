import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { ApiClientError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose }) => {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setConfirmPassword('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const showMatchStatus = mode === 'signup' && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError(t.auth.passwordMismatch);
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Authentication failed. Verify your email and password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login('testuser123@example.com', 'Password123!');
      onClose();
    } catch {
      // Fallback if testuser123 not available
      try {
        await register('Alex Vlasyuk (FOP Dev)', `alex.fop.${Date.now()}@example.com`, 'Password123!');
        onClose();
      } catch (err) {
        setError('Demo sign in failed. Please try manual registration.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/50 backdrop-blur-sm p-4 transition-all"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start justify-between border-b border-surface-border pb-4">
          <div>
            <h2 id="auth-modal-title" className="text-xl font-bold tracking-tight text-ink-primary">
              {mode === 'signup' ? t.auth.signUpTitle : t.auth.signInTitle}
            </h2>
            <p className="mt-1 text-xs text-ink-muted">{t.auth.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.auth.close}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/70 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand shrink-0" />
            <span className="text-xs font-semibold text-teal-900">Module 11 Evaluator</span>
          </div>
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={submitting}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-hover transition-colors disabled:opacity-50"
          >
            {t.auth.demoLoginBtn}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-semibold text-ink-secondary mb-1">
                {t.auth.nameLabel}
              </label>
              <input
                id="auth-name"
                type="text"
                required
                placeholder="e.g. Alex Vlasyuk"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface-bg px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-ink-secondary mb-1">
              {t.auth.emailLabel}
            </label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-surface-bg px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-ink-secondary mb-1">
              {t.auth.passwordLabel}
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-surface-bg px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="auth-confirm-password" className="block text-xs font-semibold text-ink-secondary">
                  {t.auth.confirmPasswordLabel}
                </label>
                {showMatchStatus && (
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Match</span>
                      </>
                    ) : (
                      <span>Does not match</span>
                    )}
                  </span>
                )}
              </div>
              <input
                id="auth-confirm-password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-xl border bg-surface-bg px-3.5 py-2.5 text-sm text-ink-primary outline-none transition ${
                  showMatchStatus && !passwordsMatch
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
                    : 'border-surface-border focus:border-brand focus:ring-1 focus:ring-brand'
                }`}
              />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || (mode === 'signup' && (!passwordsMatch || password.length < 6))}
            className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/20 transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {submitting
              ? '...'
              : mode === 'signup'
                ? t.auth.signUpBtn
                : t.auth.signInBtn}
          </button>
        </form>

        <div className="mt-5 border-t border-surface-border pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signup' ? 'login' : 'signup');
              setError(null);
            }}
            className="text-xs font-semibold text-brand hover:underline"
          >
            {mode === 'signup' ? t.auth.switchToSignIn : t.auth.switchToSignUp}
          </button>
        </div>
      </div>
    </div>
  );
};
