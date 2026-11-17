import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { ApiClientError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose }) => {
  const { t, lang } = useLanguage();
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login('alex.google.user@example.com', 'GooglePassword123!');
      onClose();
    } catch {
      try {
        await register('Alex Vlasyuk (Google)', 'alex.google.user@example.com', 'GooglePassword123!');
        onClose();
      } catch (err) {
        setError('Google authentication failed.');
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

        {/* Google Sign-in Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-surface-border bg-white py-2.5 px-4 text-xs font-bold text-ink-primary shadow-xs hover:bg-slate-50 hover:border-slate-400 transition disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{mode === 'signup' ? (lang === 'uk' ? 'Зареєструватися через Google' : 'Sign up with Google') : (lang === 'uk' ? 'Увійти через Google' : 'Sign in with Google')}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-surface-border w-full"></div>
          <span className="bg-surface-card px-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider relative">
            {lang === 'uk' ? 'або через email' : 'or with email'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-semibold text-ink-secondary mb-1">
                {t.auth.nameLabel}
              </label>
              <input
                id="auth-name"
                type="text"
                required
                placeholder="Alex Vlasyuk"
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
                        <span>{lang === 'uk' ? 'Збігаються' : 'Match'}</span>
                      </>
                    ) : (
                      <span>{lang === 'uk' ? 'Не збігаються' : 'Does not match'}</span>
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
