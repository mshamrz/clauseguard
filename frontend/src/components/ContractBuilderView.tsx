import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  FileDown,
  Printer,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { useLanguage } from '../context/LanguageContext';

export interface ContractConfig {
  contractType: 'DEV' | 'DESIGN' | 'DEVOPS' | 'NDA';
  clientName: string;
  contractorName: string;
  currency: string;
  amount: string;
  paymentScheme: '50_50' | '100_POST' | 'HOURLY';
  deadlineDays: string;
  revisionsCount: string;
  language: 'uk' | 'en';
  customScope?: string;
}

export const ContractBuilderView: React.FC = () => {
  const { lang } = useLanguage();

  const [config, setConfig] = useState<ContractConfig>({
    contractType: 'DEV',
    clientName: 'ТОВ «Діджитал Партнерс» (Замовник)',
    contractorName: 'ФОП Сидоренко Олексій Ігорович (Виконавець)',
    currency: 'USD',
    amount: '2500',
    paymentScheme: '50_50',
    deadlineDays: '30',
    revisionsCount: '2',
    language: 'uk',
  });

  const [promptText, setPromptText] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  // Apply prompt shortcut
  const handleApplyPrompt = () => {
    if (!promptText.trim()) return;
    const lower = promptText.toLowerCase();
    const updated = { ...config };

    // Extract numbers and currency
    const amountMatch = promptText.match(/(?:[$€₴]|usd|eur|uah|грн|євро|доларів)?\s*(\d{2,6})\s*(?:[$€₴]|usd|eur|uah|грн|євро|доларів)?/i);
    if (amountMatch) {
      updated.amount = amountMatch[1];
    }
    if (/eur|євро|€/i.test(promptText)) updated.currency = 'EUR';
    else if (/uah|грн|грив/i.test(promptText)) updated.currency = 'UAH';
    else if (/usd|долар|\$/i.test(promptText)) updated.currency = 'USD';

    // Extract days
    const daysMatch = promptText.match(/(\d{1,3})\s*(?:дн|днів|days)/i);
    if (daysMatch) {
      updated.deadlineDays = daysMatch[1];
    }

    // Extract revisions
    const revMatch = promptText.match(/(\d)\s*(?:раунд|прав|revision)/i);
    if (revMatch) {
      updated.revisionsCount = revMatch[1];
    }

    // Extract custom service/role
    if (lower.includes('telegram') || lower.includes('телеграм') || lower.includes('бот') || lower.includes('bot')) {
      updated.contractType = 'DEV';
      updated.customScope = 'розробка Telegram-бота та інтеграція платіжного API';
    } else if (lower.includes('flutter') || lower.includes('мобільн') || lower.includes('ios') || lower.includes('android')) {
      updated.contractType = 'DEV';
      updated.customScope = 'розробка мобільного додатку (iOS / Android)';
    } else if (lower.includes('seo') || lower.includes('маркетинг') || lower.includes('копірайт')) {
      updated.contractType = 'DEV';
      updated.customScope = 'SEO-оптимізація сайту та копірайтинг контенту';
    } else if (lower.includes('qa') || lower.includes('тестуван')) {
      updated.contractType = 'DEV';
      updated.customScope = 'тестування програмного забезпечення та написання автотестів (QA)';
    } else if (lower.includes('дизайн') || lower.includes('design') || lower.includes('figma')) {
      updated.contractType = 'DESIGN';
      updated.customScope = 'розробка UI/UX дизайну та створення дизайн-системи в Figma';
    } else if (lower.includes('devops') || lower.includes('хмар') || lower.includes('aws')) {
      updated.contractType = 'DEVOPS';
      updated.customScope = 'налаштування хмарної інфраструктури AWS та CI/CD пайплайнів';
    } else if (lower.includes('nda') || lower.includes('конфіденційн')) {
      updated.contractType = 'NDA';
    }

    if (lower.includes('погодин') || lower.includes('hourly') || lower.includes('/год')) {
      updated.paymentScheme = 'HOURLY';
    } else if (lower.includes('аванс') || lower.includes('50/50') || lower.includes('передоплат')) {
      updated.paymentScheme = '50_50';
    } else if (lower.includes('постоплат') || lower.includes('після здачі') || lower.includes('100%')) {
      updated.paymentScheme = '100_POST';
    }

    setConfig(updated);
  };

  // Generate contract text dynamically from vetted clauses
  const generateContractSections = () => {
    const isUk = config.language === 'uk';
    const num = '28/2026';
    const date = '«17» листопада 2026 р.';

    const title =
      config.contractType === 'DESIGN'
        ? (isUk ? `ДОГОВІР ПРО НАДАННЯ ДИЗАЙН-ПОСЛУГ № ${num}` : `DESIGN SERVICES AGREEMENT NO. ${num}`)
        : config.contractType === 'DEVOPS'
        ? (isUk ? `ДОГОВІР ПРО НАДАННЯ DEVOPS ТА ХМАРНИХ ПОСЛУГ № ${num}` : `DEVOPS & CLOUD INFRASTRUCTURE AGREEMENT NO. ${num}`)
        : config.contractType === 'NDA'
        ? (isUk ? `УГОДА ПРО НЕРОЗГОЛОШЕННЯ КОНФІДЕНЦІЙНОЇ ІНФОРМАЦІЇ (NDA) № ${num}` : `NON-DISCLOSURE AGREEMENT (NDA) NO. ${num}`)
        : (isUk ? `ДОГОВІР ПРО НАДАННЯ ІТ-ПОСЛУГ З РОЗРОБКИ ПРОГРАМНОГО ЗАБЕЗПЕЧЕННЯ № ${num}` : `SOFTWARE DEVELOPMENT SERVICES AGREEMENT NO. ${num}`);

    const preamble = isUk
      ? `м. Київ                                                                        ${date}\n\n` +
        `${config.clientName}, з однієї сторони, та ${config.contractorName}, з іншої сторони, разом іменовані «Сторони», а кожна окремо — «Сторона», уклали цей Договір про наступне:`
      : `Kyiv, Ukraine                                                                 November 17, 2026\n\n` +
        `${config.clientName} ("Client") and ${config.contractorName} ("Contractor"), collectively referred to as "Parties", entered into this Agreement as follows:`;

    const s1 = isUk
      ? `1.1. Виконавець зобов’язується надати Замовнику послуги з ${config.customScope || 'розробки програмного забезпечення, проєктування баз даних та технічної підтримки систем'} відповідно до затверджених Технічних завдань, а Замовник — прийняти та своєчасно оплатити належним чином надані послуги.\n1.2. Обсяг послуг суворо обмежується завданнями, зафіксованими у письмових додатках. Будь-які додаткові завдання виконуються за окремим погодженням з доплатою.`
      : `1.1. Contractor shall provide ${config.customScope || 'software development and technical support services'} as specified in signed Statements of Work, and Client shall accept and pay for properly rendered services.\n1.2. Scope is strictly limited to agreed written specifications. Any additional scope requires written change orders and additional compensation.`;

    const paymentText =
      config.paymentScheme === '50_50'
        ? (isUk
            ? `Оплата вартості послуг здійснюється двома етапами: авансовий платіж у розмірі 50% (${Number(config.amount) * 0.5} ${config.currency}) сплачується Замовником до початку робіт; залишок у розмірі 50% (${Number(config.amount) * 0.5} ${config.currency}) сплачується протягом 5 банківських днів після прийняття результатів.`
            : `Fees shall be paid in two milestones: a 50% upfront deposit before commencing work; remaining 50% within 5 business days after final milestone acceptance.`)
        : config.paymentScheme === 'HOURLY'
        ? (isUk
            ? `Послуги оплачуються за узгодженою погодинною ставкою ${config.amount} ${config.currency}/година щотижнево або раз на 2 тижні згідно з наданими тайм-трекер звітами.`
            : `Services shall be billed at ${config.amount} ${config.currency}/hour payable bi-weekly based on submitted timesheets.`)
        : (isUk
            ? `Загальна вартість складає ${config.amount} ${config.currency}. Оплата здійснюється Замовником протягом 10 (десяти) банківських днів з дати підписання Акта приймання-передачі послуг.`
            : `Total contract fee is ${config.amount} ${config.currency}, payable within 10 business days following invoice approval.`);

    const s2 = isUk
      ? `2.1. Строк надання послуг становить ${config.deadlineDays} календарних днів з дати внесення авансового платежу.\n2.2. Замовник зобов'язаний розглянути звіт та підписати Акт протягом 5 робочих днів або надати мотивовану відмову. У разі ненадання зауважень у цей строк послуги вважаються прийнятими.\n2.3. До базової вартості входить не більше ${config.revisionsCount} раундів правок. Додаткові правки оплачуються окремо.`
      : `2.1. Target delivery term is ${config.deadlineDays} calendar days from deposit receipt.\n2.2. Client shall review deliverables within 5 business days and sign acceptance or submit itemized defect notice. If no notice is given, deliverables are deemed accepted.\n2.3. Deliverables include up to ${config.revisionsCount} rounds of revisions. Further revisions require supplemental fees.`;

    const s3 = paymentText;

    const s4 = isUk
      ? `4.1. Виключні майнові права на спеціально створений код переходять до Замовника ВИКЛЮЧНО ПІСЛЯ 100% ПОВНОЇ ОПЛАТИ вартості послуг.\n4.2. Виконавець зберігає повне право власності на власні бібліотеки, фреймворки, шаблони та starter-інструменти, створені до цього Договору, надаючи Замовнику безстрокову ліцензію на їх використання у складі оплаченого коду.`
      : `4.1. Exclusive proprietary IP rights to custom deliverables transfer to Client SOLELY UPON RECEIPT OF 100% FULL PAYMENT.\n4.2. Contractor retains full ownership of pre-existing tools, libraries, and templates, granting Client a perpetual license for embedded components.`;

    const s5 = isUk
      ? `5.1. Жодна зі Сторін не несе відповідальності за упущену вигоду або непрямі збитки.\n5.2. Сукупна відповідальність Виконавця за будь-якими претензіями суворо обмежується сумою винагороди, фактично отриманої за цим Договором.`
      : `5.1. Neither party shall be liable for indirect, incidental, or consequential damages or lost profits.\n5.2. Contractor's aggregate liability under this Agreement is strictly capped at the fees actually received by Contractor.`;

    const s6 = isUk
      ? `6.1. За порушення строків оплати Замовник сплачує пеню у розмірі подвійної облікової ставки НБУ за кожен день прострочення.\n6.2. Виконавець не несе відповідальності за затримки, спричинені несвоєчасним наданням матеріалів або доступів Замовником.`
      : `6.1. For late payment, Client shall pay statutory late interest on overdue amounts.\n6.2. Contractor is not liable for schedule delays caused by Client's failure to provide required assets, credentials, or timely feedback.`;

    const s7 = isUk
      ? `7.1. Виконавець дотримується конфіденційності переданої інформації.\n7.2. Виконавець зобов'язується не переманювати прямих співробітників Замовника протягом дії Договору. Жодні обмеження не стосуються роботи Виконавця з іншими замовниками на ринку ІТ.`
      : `7.1. Contractor shall protect Client's non-public confidential information.\n7.2. During this term, Contractor shall not solicit Client's direct employees. Nothing restricts Contractor from performing services for other clients across the software industry.`;

    const s8 = isUk
      ? `8.1. Кожна зі Сторін має право розірвати цей Договір, попередивши за 14 календарних днів, за умови повної оплати Замовником фактично наданих послуг до дати розірвання.`
      : `8.1. Either party may terminate for convenience with 14 calendar days written notice, subject to Client paying Contractor for all services performed up to termination date.`;

    return [
      { id: 'sec-title', heading: title, text: preamble, badge: isUk ? 'Офіційні реквізити' : 'Formal Recitals' },
      { id: 'sec-scope', heading: isUk ? '1. ПРЕДМЕТ ДОГОВОРУ ТА ОБСЯГ' : '1. SCOPE OF SERVICES', text: s1, badge: isUk ? 'Захист від Scope Creep' : 'Scope Creep Protection' },
      { id: 'sec-delivery', heading: isUk ? '2. ПОРЯДОК ЗДАЧІ ТА ПРАВОК' : '2. ACCEPTANCE & REVISIONS', text: s2, badge: isUk ? `Ліміт ${config.revisionsCount} раундів правок` : `Capped at ${config.revisionsCount} revisions` },
      { id: 'sec-pay', heading: isUk ? '3. ВАРТІСТЬ ТА ПОРЯДОК РОЗРАХУНКІВ' : '3. FEES & PAYMENT TERMS', text: s3, badge: isUk ? 'Безпечні строки виплати' : 'Guaranteed Payout Terms' },
      { id: 'sec-ip', heading: isUk ? '4. ПРАВА ІНТЕЛЕКТУАЛЬНОЇ ВЛАСНОСТІ' : '4. INTELLECTUAL PROPERTY', text: s4, badge: isUk ? 'Код передається ТІЛЬКИ після оплати' : 'IP Transfers solely upon payment' },
      { id: 'sec-liab', heading: isUk ? '5. ВІДПОВІДАЛЬНІСТЬ ТА ЛІМІТ ЗБИТКІВ' : '5. LIMITATION OF LIABILITY', text: s5, badge: isUk ? 'Ліміт відповідальності сумою гонорару' : 'Liability capped at fees paid' },
      { id: 'sec-pen', heading: isUk ? '6. ШТРАФНІ САНКЦІЇ ТА ЗАТРИМКИ' : '6. PENALTIES & DELAYS', text: s6, badge: isUk ? 'Захист від затримок з вини клієнта' : 'Client delay protection' },
      { id: 'sec-nc', heading: isUk ? '7. КОНФІДЕНЦІЙНІСТЬ ТА СПІВПРАЦЯ' : '7. CONFIDENTIALITY & NON-SOLICIT', text: s7, badge: isUk ? 'Жодної заборони на роботу (No Non-Compete)' : 'Fair Non-Solicit / No Non-Compete' },
      { id: 'sec-term', heading: isUk ? '8. ПОРЯДОК РОЗІРВАННЯ' : '8. TERMINATION', text: s8, badge: isUk ? 'Гарантована оплата виконаного' : 'Guaranteed payout on termination' },
    ];
  };

  const sections = generateContractSections();

  // Export full text to DOCX
  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    try {
      const docChildren: Paragraph[] = [];

      sections.forEach((sec, idx) => {
        if (idx === 0) {
          docChildren.push(
            new Paragraph({
              text: sec.heading,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
          );
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: sec.text, size: 21, italics: true })],
              spacing: { after: 260 },
            }),
          );
        } else {
          docChildren.push(
            new Paragraph({
              text: sec.heading,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 120 },
            }),
          );
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: sec.text, size: 21 })],
              spacing: { after: 220 },
            }),
          );
        }
      });

      const doc = new Document({
        sections: [{ children: docChildren }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract_${config.contractType.toLowerCase()}_vetted.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleCopyAll = () => {
    const fullText = sections.map((s) => `${s.heading}\n${s.text}`).join('\n\n');
    void navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-brand text-xs font-bold">
          <Wand2 className="h-3.5 w-3.5" />
          <span>{lang === 'uk' ? 'AI Contract Builder & Vetted Clauses' : 'AI Contract Builder'}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-primary sm:text-4xl">
          {lang === 'uk' ? 'Конструктор перевірених договорів' : 'Build a vetted B2B contract in 2 minutes'}
        </h1>
        <p className="text-sm text-ink-secondary max-w-2xl mx-auto leading-relaxed">
          {lang === 'uk'
            ? 'Зберіть бездоганний B2B-договір, який гарантує оплату, захищає ваш код від крадіжки, обмежує правки та не містить кабальних умов. Готовий експорт у Word (.docx) та PDF.'
            : 'Assemble a rock-solid B2B contract from lawyer-vetted modular clauses: guaranteed payout, IP protection, capped revisions, and zero predatory traps.'}
        </p>
      </div>

      {/* Top Instant Download Banner */}
      <div className="rounded-3xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-emerald-50 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white text-xs font-bold">
                ✓
              </span>
              <h3 className="text-base font-extrabold text-ink-primary">
                {lang === 'uk'
                  ? 'Ваш готовий договір уже зібрано нижче!'
                  : 'Your vetted contract is generated below!'}
              </h3>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              {lang === 'uk'
                ? 'Оберіть тип послуги або змініть суму, якщо потрібно, і натисніть кнопку, щоб отримати готовий файл для підписання:'
                : 'Select your service preset or adjust the fee, and download the ready-to-sign file:'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={downloadingDocx}
              onClick={() => void handleDownloadDocx()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-brand/20 hover:bg-brand-hover transition disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              <span>{downloadingDocx ? (lang === 'uk' ? 'Генерується...' : 'Generating...') : (lang === 'uk' ? 'Завантажити Word (.docx)' : 'Download Word (.docx)')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-xs font-bold text-ink-primary shadow-xs hover:bg-slate-50 transition"
            >
              <Printer className="h-4 w-4" />
              <span>{lang === 'uk' ? 'Зберегти як PDF' : 'Save as PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Natural Language Prompt & Quick Type Selector */}
      <div className="rounded-3xl border border-surface-border bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>{lang === 'uk' ? 'Опишіть умови своїми словами (або оберіть шаблон нижче):' : 'Describe your terms in plain words (or choose a preset):'}</span>
          </label>
          <div className="flex items-center gap-1.5">
            {(['DEV', 'DESIGN', 'DEVOPS', 'NDA'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setConfig({ ...config, contractType: type })}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  config.contractType === type
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface-subtle text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {type === 'DEV' ? '💻 Dev' : type === 'DESIGN' ? '🎨 Design' : type === 'DEVOPS' ? '⚙️ DevOps' : '🔒 NDA'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder={
              lang === 'uk'
                ? 'Напр.: «React-розробка, $2500, 50% аванс, 30 днів дедлайн, 2 раунди правок, для клієнта з Польщі»'
                : 'E.g.: "Full-stack React dev, $3000, 50% deposit, 30 day deadline, 2 revisions..."'
            }
            className="flex-1 rounded-2xl border border-surface-border bg-surface-bg px-4 py-2.5 text-xs text-ink-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <button
            type="button"
            onClick={handleApplyPrompt}
            className="rounded-2xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-hover transition shrink-0"
          >
            {lang === 'uk' ? 'Застосувати' : 'Apply'}
          </button>
        </div>

        {/* Configuration Parameter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-surface-border text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">
              {lang === 'uk' ? 'Схема оплати' : 'Payment Scheme'}
            </label>
            <select
              value={config.paymentScheme}
              onChange={(e) => setConfig({ ...config, paymentScheme: e.target.value as any })}
              className="w-full rounded-xl border border-surface-border bg-surface-bg px-2.5 py-2 text-xs font-semibold text-ink-primary outline-none focus:border-brand"
            >
              <option value="50_50">{lang === 'uk' ? '50% Аванс + 50% Реліз (Рекомендовано)' : '50% Deposit + 50% Release'}</option>
              <option value="100_POST">{lang === 'uk' ? '100% Постоплата (10 днів)' : '100% Post-pay (Net 10)'}</option>
              <option value="HOURLY">{lang === 'uk' ? 'Погодинна оплата (щотижня)' : 'Hourly rate (bi-weekly)'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">
              {lang === 'uk' ? 'Сума / Ставка' : 'Amount / Fee'}
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={config.amount}
                onChange={(e) => setConfig({ ...config, amount: e.target.value })}
                className="w-full rounded-xl border border-surface-border bg-surface-bg px-2.5 py-2 text-xs font-semibold text-ink-primary outline-none focus:border-brand"
              />
              <select
                value={config.currency}
                onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                className="rounded-xl border border-surface-border bg-surface-bg px-2 py-2 text-xs font-semibold text-ink-primary outline-none"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="UAH">UAH</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">
              {lang === 'uk' ? 'Дедлайн (днів)' : 'Deadline (days)'}
            </label>
            <input
              type="number"
              value={config.deadlineDays}
              onChange={(e) => setConfig({ ...config, deadlineDays: e.target.value })}
              className="w-full rounded-xl border border-surface-border bg-surface-bg px-2.5 py-2 text-xs font-semibold text-ink-primary outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">
              {lang === 'uk' ? 'Раундів правок' : 'Capped Revisions'}
            </label>
            <select
              value={config.revisionsCount}
              onChange={(e) => setConfig({ ...config, revisionsCount: e.target.value })}
              className="w-full rounded-xl border border-surface-border bg-surface-bg px-2.5 py-2 text-xs font-semibold text-ink-primary outline-none focus:border-brand"
            >
              <option value="1">1 раунд</option>
              <option value="2">2 раунди (Оптимально)</option>
              <option value="3">3 раунди</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contract Preview & Action Bar */}
      <div className="space-y-4">
        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-subtle p-4 rounded-2xl border border-surface-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <span className="text-xs font-bold text-ink-primary">
              {lang === 'uk' ? 'Зібрано 8 перевірених клауз (Vetted Legal Modules)' : '8 Vetted Lawyer-Grade Clauses Assembled'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={downloadingDocx}
              onClick={() => void handleDownloadDocx()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-hover transition disabled:opacity-50"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>{downloadingDocx ? 'Генерується...' : (lang === 'uk' ? 'Завантажити Word (.docx)' : 'Download Word (.docx)')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-white px-3.5 py-2 text-xs font-bold text-ink-primary shadow-xs hover:bg-slate-50 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{lang === 'uk' ? 'Друк / Зберегти як PDF' : 'Print / Save as PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-white px-3.5 py-2 text-xs font-bold text-ink-primary shadow-xs hover:bg-slate-50 transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{lang === 'uk' ? 'Скопійовано!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{lang === 'uk' ? 'Скопіювати весь текст' : 'Copy Full Text'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Document Sheet Preview */}
        <div className="rounded-3xl border border-surface-border bg-white p-8 sm:p-12 shadow-md space-y-6 text-ink-primary font-sans">
          {sections.map((sec, idx) => (
            <div key={sec.id} className="space-y-2 border-b border-surface-border pb-5 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className={`font-bold ${idx === 0 ? 'text-lg text-brand' : 'text-sm text-ink-primary'}`}>
                  {sec.heading}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>{sec.badge}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {sec.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
