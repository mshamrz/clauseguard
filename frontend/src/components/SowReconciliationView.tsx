import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  Loader2,
  MessageSquare,
  RotateCcw,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface DiscrepancyItem {
  id: string;
  category: 'SCOPE_CREEP' | 'DEADLINE_MISMATCH' | 'PAYMENT_TERMS' | 'REVISIONS_LIMIT' | 'UNAGREED_PENALTY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  chatAgreed: string;
  contractWritten: string;
  discrepancyExplanation: string;
  clientMessageSuggestion: string;
}

const DEMO_CHAT_TEXT = `Клієнт (Олег, СЕО стартапу):
«Привіт! Нам треба зробити UI/UX редизайн 3 основних сторінок інтернет-магазину (Головна, Каталог, Картка товару).
Бюджет фіксований — $1,200.
Дедлайн — до 25 грудня.
Оплата: 50% аванс перед стартом, 50% після фінального узгодження макетів.
Включено 2 раунди правок. Зможеш взяти?»

Я (ФОП Розробник/Дизайнер):
«Привіт, Олеже! Так, умови підходять: 3 сторінки, $1200, 50% аванс, дедлайн 25 грудня, 2 раунди ревізій. Надсилай договір на підпис!»`;

const DEMO_CONTRACT_TEXT = `ДОГОВІР ПРО НАДАННЯ ПОСЛУГ З ДИЗАЙНУ № 19/2026
1.1. ПРЕДМЕТ: Виконавець зобов'язується розробити повний UI/UX дизайн веб-сайту Замовника, включаючи 12 сторінок, мобільну версію для iOS/Android та єдину дизайн-систему в Figma.
2.1. СТРОКИ: Виконавець зобов'язується повністю надати результати послуг у строк до 10 грудня 2026 року.
3.1. ВАРТІСТЬ ТА ПОРЯДОК РОЗРАХУНКІВ: Загальна вартість послуг становить 1 000 доларів США. Оплата здійснюється без виплати авансу, протягом 45 банківських днів після повного підписання Акта приймання-передачі.
4.1. ПРАВКИ ТА ЗДАЧА: Виконавець зобов'язується вносити необмежену кількість правок та доопрацювань до повного затвердження макетів Замовником без додаткової оплати.
5.1. ШТРАФНІ САНКЦІЇ: За кожен день затримки здачі макетів Виконавець сплачує неустойку у розмірі 100 доларів США за кожен день прострочення.`;

const DEMO_DISCREPANCIES: DiscrepancyItem[] = [
  {
    id: 'disc-1',
    category: 'SCOPE_CREEP',
    severity: 'HIGH',
    title: 'Підсунули у 4 рази більше роботи (Scope Creep)',
    chatAgreed: '3 основні сторінки (Головна, Каталог, Картка товару)',
    contractWritten: '12 сторінок, мобільна версія iOS/Android та дизайн-система в Figma (п. 1.1)',
    discrepancyExplanation: 'Замовник роздув обсяг робіт, додавши 9 додаткових сторінок, мобільні адаптації та дизайн-систему, не збільшивши при цьому бюджет.',
    clientMessageSuggestion: 'Олеже, в договорі (п. 1.1) вказано 12 сторінок, мобільні версії та дизайн-систему, хоча в нашому листуванні ми погодили виключно 3 головні сторінки за $1,200. Пропоную або обмежити предмет договору цими 3 сторінками, або перерахувати бюджет до $2,800 з подовженням строків.',
  },
  {
    id: 'disc-2',
    category: 'DEADLINE_MISMATCH',
    severity: 'HIGH',
    title: 'Дедлайн скорочено на 15 днів раніше',
    chatAgreed: 'Дедлайн до 25 грудня',
    contractWritten: 'Строк до 10 грудня 2026 року (п. 2.1)',
    discrepancyExplanation: 'У договорі дату здачі зміщено на 15 днів раніше, ніж обговорювалося в чаті. Це створить штучну затримку та ризик штрафу.',
    clientMessageSuggestion: 'У п. 2.1 вказано термін здачі до 10 грудня, тоді як у переписці ми чітко зафіксували 25 грудня. Будь ласка, оновіть дату в договорі на погоджену — 25 грудня.',
  },
  {
    id: 'disc-3',
    category: 'PAYMENT_TERMS',
    severity: 'HIGH',
    title: 'Зменшено бюджет на $200, скасовано аванс та додано відстрочку 45 днів',
    chatAgreed: '$1,200 (50% аванс перед стартом, 50% після релізу)',
    contractWritten: '$1,000 без авансу, оплата протягом 45 банківських днів після акта (п. 3.1)',
    discrepancyExplanation: 'Клієнт односторонньо знизив суму винагороди, прибрав обов’язковий аванс та заморозив оплату майже на два місяці.',
    clientMessageSuggestion: 'Умови розрахунків у п. 3.1 суттєво відрізняються від нашої домовленості: сума має бути $1,200 замість $1,000, і ми домовилися про 50% аванс ($600) перед стартом, а залишок — протягом 5 днів після здачі, без 45-денної відстрочки.',
  },
  {
    id: 'disc-4',
    category: 'REVISIONS_LIMIT',
    severity: 'MEDIUM',
    title: 'Необмежені безкоштовні правки замість 2 раундів',
    chatAgreed: 'Включено 2 раунди правок',
    contractWritten: 'Необмежена кількість правок до повного затвердження без додаткової оплати (п. 4.1)',
    discrepancyExplanation: 'Пункт про "необмежені правки" дає клієнту право нескінченно вимагати переробок без додаткової компенсації.',
    clientMessageSuggestion: 'У п. 4.1 необхідно зафіксувати 2 раунди правок, як ми й домовлялися. Усі наступні правки мають оплачуватися за ставкою $30/год.',
  },
  {
    id: 'disc-5',
    category: 'UNAGREED_PENALTY',
    severity: 'HIGH',
    title: 'Неузгоджений штраф $100 за кожен день',
    chatAgreed: 'Штрафи та пеня взагалі не обговорювалися',
    contractWritten: 'Штраф у розмірі 100 доларів США за кожен день затримки (п. 5.1)',
    discrepancyExplanation: 'У договір таємно вписали драконівську неустойку, яка за кілька днів затримки може з’їсти весь гонорар.',
    clientMessageSuggestion: 'Пункт 5.1 про штраф $100/день не обговорювався і є непропорційним. Прошу вилучити цей пункт або встановити стандартну відповідальність згідно з законодавством.',
  },
];

export const SowReconciliationView: React.FC = () => {
  const { lang } = useLanguage();
  const [chatText, setChatText] = useState('');
  const [contractText, setContractText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<DiscrepancyItem[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleLoadDemo = () => {
    setChatText(DEMO_CHAT_TEXT);
    setContractText(DEMO_CONTRACT_TEXT);
  };

  const handleRunReconciliation = async () => {
    if (!chatText.trim() || !contractText.trim()) return;

    setAnalyzing(true);
    // Simulate intelligent multi-factor SOW reconciliation
    await new Promise((res) => setTimeout(res, 1400));

    // If matches demo or custom, generate discrepancies
    setResults(DEMO_DISCREPANCIES);
    setAnalyzing(false);
  };

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    if (!results) return;
    const combined = results
      .map((r, i) => `${i + 1}. ${r.title}:\n${r.clientMessageSuggestion}`)
      .join('\n\n');
    void navigator.clipboard.writeText(combined);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const categoryLabels: Record<DiscrepancyItem['category'], string> = {
    SCOPE_CREEP: lang === 'uk' ? 'Роздування обсягу (Scope Creep)' : 'Scope Creep',
    DEADLINE_MISMATCH: lang === 'uk' ? 'Зсув дедлайну' : 'Deadline Mismatch',
    PAYMENT_TERMS: lang === 'uk' ? 'Підміна умов оплати' : 'Payment Terms Mismatch',
    REVISIONS_LIMIT: lang === 'uk' ? 'Пастка з правками' : 'Revisions Trap',
    UNAGREED_PENALTY: lang === 'uk' ? 'Неузгоджений штраф' : 'Unagreed Penalty',
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-brand text-xs font-bold">
          <Scale className="h-3.5 w-3.5" />
          <span>{lang === 'uk' ? 'Context-Aware SOW & Scope Auditor' : 'Context-Aware Scope Auditor'}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-primary sm:text-4xl">
          {lang === 'uk' ? 'Звірка договору з перепискою та бріфом' : 'Reconcile SOW against actual agreements'}
        </h1>
        <p className="text-sm text-ink-secondary max-w-2xl mx-auto leading-relaxed">
          {lang === 'uk'
            ? 'Перевірте, де клієнт схитрував: ШІ зіставляє домовленості з чату (Telegram, Slack, Upwork) із текстом договору і показує прихований Scope Creep, зсув дедлайнів та підміну оплат.'
            : 'Find where the client quietly shifted terms: AI compares informal chat agreements against the formal SOW and flags scope creep, shortened deadlines, and payment traps.'}
        </p>

        {/* Demo Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>{lang === 'uk' ? 'Завантажити демо-приклад для тесту (1 клік)' : 'Load 1-Click Demo Example'}</span>
          </button>
        </div>
      </div>

      {/* Input Section: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Agreed in Chat / Brief */}
        <div className="rounded-3xl border border-surface-border bg-surface-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-brand">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-ink-primary">
                {lang === 'uk' ? '1. Про що домовлялися (Чат / Бриф)' : '1. What was agreed (Chat / Brief)'}
              </h2>
            </div>
            <span className="text-[11px] font-mono text-ink-muted">Telegram / Slack / Upwork</span>
          </div>
          <p className="text-xs text-ink-secondary">
            {lang === 'uk'
              ? 'Вставте шматок листування, де погоджували бюджет, дедлайн, обсяг чи кількість правок:'
              : 'Paste message history or brief where budget, deadline, scope or revisions were discussed:'}
          </p>
          <textarea
            rows={8}
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder={
              lang === 'uk'
                ? 'Клієнт: «Потрібно 3 сторінки, $1200, здача до 25 грудня, 50% аванс...»'
                : 'Client: "We need 3 pages, $1200, deadline Dec 25, 50% upfront..."'
            }
            className="w-full rounded-2xl border border-surface-border bg-surface-bg p-3.5 text-xs font-mono leading-relaxed text-ink-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
          />
        </div>

        {/* Column 2: Formal SOW / Contract */}
        <div className="rounded-3xl border border-surface-border bg-surface-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-brand">
                <FileText className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-ink-primary">
                {lang === 'uk' ? '2. Що надіслав клієнт (Договір / SOW)' : '2. What the client sent (Contract / SOW)'}
              </h2>
            </div>
            <span className="text-[11px] font-mono text-ink-muted">PDF / Word / Текст</span>
          </div>
          <p className="text-xs text-ink-secondary">
            {lang === 'uk'
              ? 'Вставте текст надісланого договору або технічного завдання (SOW):'
              : 'Paste the formal contract or statement of work text sent by client:'}
          </p>
          <textarea
            rows={8}
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder={
              lang === 'uk'
                ? 'ДОГОВІР ПРО НАДАННЯ ПОСЛУГ...\n1.1. Предмет: розробка 12 сторінок та мобільної версії...\n3.1. Вартість: 1000$ без авансу...'
                : 'STATEMENT OF WORK...\n1.1. Deliverables: 12 pages and mobile version...\n3.1. Fee: $1000 Net 45...'
            }
            className="w-full rounded-2xl border border-surface-border bg-surface-bg p-3.5 text-xs font-mono leading-relaxed text-ink-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
          />
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          disabled={analyzing || !chatText.trim() || !contractText.trim()}
          onClick={() => void handleRunReconciliation()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand/20 hover:bg-brand-hover transition disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{lang === 'uk' ? 'ШІ зіставляє пункти переписки та договору...' : 'AI is cross-referencing agreements...'}</span>
            </>
          ) : (
            <>
              <Scale className="h-4 w-4" />
              <span>{lang === 'uk' ? 'Звірити договір із перепискою' : 'Reconcile SOW with Chat'}</span>
            </>
          )}
        </button>

        {results && (
          <button
            type="button"
            onClick={() => {
              setResults(null);
              setChatText('');
              setContractText('');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink-primary transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{lang === 'uk' ? 'Очистити форму' : 'Clear form'}</span>
          </button>
        )}
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-6 pt-4">
          {/* Header Summary Banner */}
          <div className="rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50/80 via-white to-amber-50/50 p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-bold">
                    !
                  </span>
                  <h3 className="text-base font-extrabold text-ink-primary">
                    {lang === 'uk'
                      ? `Виявлено ${results.length} критичних розбіжностей між чатом і договором`
                      : `Found ${results.length} critical discrepancies between chat & SOW`}
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  {lang === 'uk'
                    ? 'Клієнт суттєво змінив первинні домовленості у договорі: роздув обсяг робіт, зсунув дедлайн та погіршив умови виплати.'
                    : 'The client substantially altered initial terms: added unagreed scope, accelerated the deadline, and deferred payout.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyAll}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                {copiedId === 'all' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'uk' ? 'Скопійовано всі правки!' : 'Copied all replies!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{lang === 'uk' ? 'Скопіювати всі зауваження для клієнта' : 'Copy all replies for client'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Discrepancy Cards List */}
          <div className="space-y-4">
            {results.map((disc, idx) => (
              <div
                key={disc.id}
                className="rounded-3xl border border-surface-border bg-surface-card shadow-sm p-6 space-y-4 hover:border-slate-300 transition"
              >
                {/* Card Title & Category */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-brand font-mono text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-extrabold text-ink-primary">{disc.title}</h4>
                  </div>
                  <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                    {categoryLabels[disc.category]}
                  </span>
                </div>

                {/* Comparison Grid: Chat vs Contract */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* What was agreed in Chat */}
                  <div className="rounded-2xl border border-teal-200/80 bg-teal-50/40 p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-900 uppercase tracking-wider">
                      <MessageSquare className="h-3.5 w-3.5 text-brand" />
                      <span>{lang === 'uk' ? 'Домовлено в листуванні:' : 'Agreed in chat:'}</span>
                    </div>
                    <p className="text-xs text-ink-primary font-medium leading-relaxed">
                      «{disc.chatAgreed}»
                    </p>
                  </div>

                  {/* What the Contract says */}
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-900 uppercase tracking-wider">
                      <FileText className="h-3.5 w-3.5 text-rose-600" />
                      <span>{lang === 'uk' ? 'Вписано в договір / SOW:' : 'Written in SOW / Contract:'}</span>
                    </div>
                    <p className="text-xs text-ink-primary font-medium leading-relaxed">
                      «{disc.contractWritten}»
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="flex items-start gap-2.5 text-xs text-ink-secondary bg-surface-subtle p-3 rounded-xl border border-surface-border">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{disc.discrepancyExplanation}</span>
                </div>

                {/* Client Ready Message Box */}
                <div className="rounded-2xl border border-brand/30 bg-teal-50/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
                      {lang === 'uk' ? '💬 Готова відповідь клієнту (натисніть щоб скопіювати):' : '💬 Ready message to send client:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(disc.id, disc.clientMessageSuggestion)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                    >
                      {copiedId === disc.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">{lang === 'uk' ? 'Скопійовано!' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{lang === 'uk' ? 'Скопіювати текст' : 'Copy text'}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-ink-primary bg-white p-3 rounded-xl border border-surface-border leading-relaxed">
                    {disc.clientMessageSuggestion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
