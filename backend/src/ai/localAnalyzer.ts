import { ClauseItem, ContractLanguage } from '../extraction/clauseSplitter.js';
import {
  ContractAnalysisResult,
  FlaggedClause,
  parseAndValidateAnalysis,
  RiskCategory,
  RiskLevel,
} from './schema.js';

interface RiskRule {
  category: RiskCategory;
  detect: (lowerText: string) => RiskLevel | null;
  buildUk: (clause: ClauseItem, level: RiskLevel) => Omit<FlaggedClause, 'clauseNumber' | 'category' | 'riskLevel' | 'originalExcerpt'>;
  buildEn: (clause: ClauseItem, level: RiskLevel) => Omit<FlaggedClause, 'clauseNumber' | 'category' | 'riskLevel' | 'originalExcerpt'>;
}

const RISK_RULES: RiskRule[] = [
  {
    category: 'UNLIMITED_LIABILITY',
    detect: (t) => {
      // Safe waiver: if parties expressly exclude lost profits or indirect damages, contractor is SAFE
      if (
        /не несе.*відповідальності.*(?:непрям|упущен)|не підлягає.*відшкодуванню.*(?:непрям|упущен)|neither party.*(?:liable|liability).*(?:consequential|indirect|lost profits)/i.test(
          t,
        )
      ) {
        return null;
      }
      if (
        /unlimited|uncapped|необмежен|без встановлення будь-якої верхньої межі|обмежується сумою в \$100/i.test(
          t,
        )
      ) {
        return 'HIGH';
      }
      // ONLY flag as MEDIUM if contractor IS expressly burdened with lost profits:
      if (
        /(?:виконавець|підрядник|contractor).*відшкодовує.*упущену вигоду|включаючи упущену вигоду|including lost profits/i.test(
          t,
        )
      ) {
        return 'MEDIUM';
      }
      return null;
    },
    buildUk: () => ({
      plainLanguageSummary:
        'Цей пункт покладає на виконавця фінансову відповідальність без верхньої межі, включаючи упущену вигоду замовника. Один технічний збій чи спір може призвести до вимог, що перевищують увесь ваш дохід за договором.',
      counterClause:
        'Жодна зі Сторін не несе відповідальності за непрямі збитки або упущену вигоду. За винятком умисного порушення, сукупна відповідальність Виконавця за цим Договором обмежується сумою фактично отриманої винагороди за останні 3 (три) місяці.',
    }),
    buildEn: () => ({
      plainLanguageSummary:
        'This clause exposes you to uncapped damages, including the client’s lost profits and third-party claims, with no maximum dollar ceiling. A single dispute could cost far more than the total value of your contract.',
      counterClause:
        'Neither party shall be liable for indirect, incidental, or consequential damages or lost profits. Except for willful misconduct, each party’s aggregate liability under this Agreement shall not exceed the fees actually paid to Contractor in the preceding three (3) months.',
    }),
  },
  {
    category: 'DELAYED_PAYMENT',
    detect: (t) => {
      // Safe standard terms: 5, 7, 10, 14, 15, 20 days are completely healthy
      if (
        /(?:протягом|within)\s+(?:5|7|10|14|15|20|десяти|семи|п['’]яти|чотирнадцяти|п['’]ятнадцяти|двадцяти)\s*(?:bank|banking|calendar|робочих|банківських|календарних)?\s*(?:днів|days)/i.test(
          t,
        ) && !/pay-when-paid|надходження валютної виручки/i.test(t)
      ) {
        return null;
      }
      if (
        /pay-when-paid|until client has first received|шістдесят|60\s*(?:calendar|bank|банківських)?\s*дн|sixty \(60\)|надходження валютної виручки|призупинити виплату.*невизначений/i.test(
          t,
        )
      ) {
        return 'HIGH';
      }
      if (/forty-five|45\s*(?:calendar|days|дн)|довільний строк|sole discretion/i.test(t)) {
        return 'MEDIUM';
      }
      return null;
    },
    buildUk: () => ({
      plainLanguageSummary:
        'Виплата винагороди відкладається понад 30 днів або залежить від того, чи заплатить замовнику його кінцевий клієнт. Ви фактично безкоштовно кредитуєте замовника і ризикуєте не отримати гроші за вже виконану роботу.',
      counterClause:
        'Замовник оплачує надані послуги протягом 15 (п’ятнадцяти) календарних днів з дати виставлення рахунку або підписання Акта, незалежно від розрахунків Замовника з третіми особами. У разі відсутності обґрунтованих зауважень протягом 5 робочих днів послуги вважаються прийнятими.',
    }),
    buildEn: () => ({
      plainLanguageSummary:
        'Payment is delayed beyond 30 days or conditioned on when the client gets paid by its own customer. You carry the client’s credit risk and could wait months—or indefinitely—for completed work.',
      counterClause:
        'Client shall pay undisputed invoices within fifteen (15) calendar days of receipt, regardless of whether Client has received payment from any third party. Deliverables shall be deemed accepted unless Client provides written defect notice within seven (7) business days.',
    }),
  },
  {
    category: 'UNFAIR_IP_TRANSFER',
    detect: (t) => {
      // Safe IP transfer: transfers upon full payment
      if (/(?:після|з моменту|за умови)\s+(?:повної|100%|фактичної)?\s*оплат|upon (?:full )?payment/i.test(t)) {
        return null;
      }
      if (
        /pre-existing|попередні напрацювання|власні бібліотеки|before any invoice is paid|regardless of whether invoices.*paid|незалежно від факту проведення оплати|upon creation/i.test(
          t,
        )
      ) {
        return 'HIGH';
      }
      if (/intellectual property assignment|майнові права інтелектуальної власності/i.test(t)) {
        return 'MEDIUM';
      }
      return null;
    },
    buildUk: () => ({
      plainLanguageSummary:
        'Права інтелектуальної власності на код і навіть ваші власні попередні бібліотеки переходять до замовника ще до отримання оплати. Якщо замовник не сплатить рахунок, ви втратите право використовувати власні напрацювання в інших проєктах.',
      counterClause:
        'Виключні майнові права на спеціально створений Результат послуг переходять до Замовника виключно з моменту повної оплати відповідного рахунку. Попередні напрацювання, бібліотеки та інструменти Виконавця залишаються у його власності з наданням Замовнику невиключної ліцензії на використання у складі оплаченого Результату.',
    }),
    buildEn: () => ({
      plainLanguageSummary:
        'This clause transfers ownership of your code—and even your pre-existing libraries and reusable tools—before your invoice is paid. If the client fails to pay, you lose both the payment and the right to reuse your own starter utilities.',
      counterClause:
        'Exclusive rights to custom Deliverables transfer to Client solely upon Contractor’s receipt of full payment for the applicable milestone. Contractor retains ownership of all pre-existing code libraries, tools, and general know-how, granting Client a non-exclusive license to use any components embedded in paid Deliverables.',
    }),
  },
  {
    category: 'PENALTY_CLAUSES',
    detect: (t) => {
      // Safe statutory NBU rate or reasonable mutual rates <= 0.1% are FAIR
      if (/облікової ставки нбу|облікова ставка нбу|подвійн.*обліков.*ставк/i.test(t)) {
        return null;
      }
      if (
        /\$15,000|\$10,000|50 000|40 000|[2-9]%|10%|liquidated penalty|fixed penalty/i.test(
          t,
        )
      ) {
        return 'HIGH';
      }
      if (/0[.,][2-9]%|0[.,]5%|неустойк.*0[.,]5%|deduct unilaterally|withhold payment/i.test(t)) {
        return 'MEDIUM';
      }
      return null;
    },
    buildUk: () => ({
      plainLanguageSummary:
        'Договір передбачає непропорційно великі фіксовані штрафи або пеню за кожен день навіть мінімальної затримки без права на виправлення. Замовник може утримати ці суми в односторонньому порядку з вашого гонорару.',
      counterClause:
        'У разі порушення строків з вини Виконавця, Замовник надсилає письмове повідомлення з наданням 5 (п’яти) робочих днів на усунення порушення. Після спливу цього строку може застосовуватися пеня у розмірі 0,1% від вартості простроченого етапу за день, але не більше 5% загальної вартості етапу.',
    }),
    buildEn: () => ({
      plainLanguageSummary:
        'This clause imposes steep fixed fines or daily percentage penalties for minor delays without giving you a cure period. The client can unilaterally deduct those penalties straight from your pending invoices.',
      counterClause:
        'If delivery is delayed due to Contractor’s fault, Client shall provide written notice and a five (5) business day cure period. Only if uncured may Contractor be subject to a capped delay credit of 0.1% of the delayed milestone fee per day, capped at five percent (5%) of that milestone.',
    }),
  },
  {
    category: 'UNFAIR_NON_COMPETE',
    detect: (t) => {
      // Standard non-solicitation of direct employees or clients is fair
      if (/не переманювати співробітників|не переманювати клієнтів/i.test(t) && !/не має права надавати будь-які послуги|забороняється працювати/i.test(t)) {
        return null;
      }
      if (
        /non-compete|неконкуренц|twenty-four \(24\) months|трьох \(3\) років|3 роки|worldwide|не має права надавати будь-які послуги/i.test(
          t,
        )
      ) {
        return 'HIGH';
      }
      if (/exclusivity|ексклюзивн/i.test(t)) {
        return 'MEDIUM';
      }
      return null;
    },
    buildUk: () => ({
      plainLanguageSummary:
        'Пункт забороняє вам працювати з іншими ІТ-компаніями у всьому секторі протягом кількох років після завершення контракту. Для фрілансера або агенції це фактична заборона на професію без компенсації.',
      counterClause:
        'Протягом дії Договору та 6 (шести) місяців після його припинення Виконавець зобов’язується не переманювати конкретних кінцевих клієнтів Замовника, до яких Виконавець отримав прямий доступ у межах цього проєкту. Жодні обмеження не стосуються роботи з іншими компаніями на ринку ІТ.',
    }),
    buildEn: () => ({
      plainLanguageSummary:
        'This restriction bars you from working across the entire software/tech industry for years after the contract ends. For a freelancer or boutique agency, an industry-wide non-compete effectively blocks your livelihood.',
      counterClause:
        'During this Agreement and for six (6) months thereafter, Contractor shall not directly solicit Client’s specific end-customers to whom Contractor was directly introduced under this Agreement. Nothing restricts Contractor from serving other clients in the technology sector.',
    }),
  },
  {
    category: 'OTHER_ASYMMETRIC_RISK',
    detect: (t) => {
      // Mutual termination with payment for work done is fair
      if ((/кожна зі сторін|either party/i.test(t)) && (/оплат|pay/i.test(t))) {
        return null;
      }
      if (/односторонньому порядку розірвати.*без оплати|arbitration in new york/i.test(t)) {
        return 'HIGH';
      }
      if (/sole discretion|довільний строк без обмеження часу/i.test(t)) {
        return 'MEDIUM';
      }
      return null;
    },
    buildUk: () => ({
      plainLanguageSummary:
        'Замовник може в односторонньому порядку розірвати договір або нескінченно затягувати приймання робіт без оплати фактично витраченого часу. Ви ризикуєте виконати тижні роботи без права вимагати розрахунку.',
      counterClause:
        'Будь-яка Сторона може розірвати Договір з письмовим попередженням за 14 (чотирнадцять) календарних днів, при цьому Замовник зобов’язаний оплатити весь фактично виконаний та задокументований обсяг послуг до дати розірвання.',
    }),
    buildEn: () => ({
      plainLanguageSummary:
        'This clause gives the client unilateral power over acceptance, termination, or costly dispute venues at your expense. You risk completing weeks of work without a fair acceptance deadline or guaranteed compensation.',
      counterClause:
        'Either party may terminate this Agreement for convenience upon fourteen (14) days’ prior written notice, and Client shall pay Contractor for all services rendered and expenses incurred up to the termination date.',
    }),
  },
];

function isClauseUkrainian(text: string): boolean {
  const cyr = (text.match(/[\u0400-\u04FF]/g) ?? []).length;
  const lat = (text.match(/[a-zA-Z]/g) ?? []).length;
  return cyr > lat;
}

/**
 * Deterministic grounded fallback analyzer used only when AWS Bedrock credentials are absent locally.
 * Validates output through the exact same Zod schema as live Bedrock responses.
 */
export function runLocalFallbackAnalysis(
  clauses: ClauseItem[],
  detectedLanguage: ContractLanguage,
): ContractAnalysisResult {
  const flaggedClauses: FlaggedClause[] = [];

  for (const clause of clauses) {
    const lower = clause.text.toLowerCase();
    for (const rule of RISK_RULES) {
      const level = rule.detect(lower);
      if (!level) continue;

      const useUk =
        detectedLanguage === 'uk' ||
        (detectedLanguage === 'mixed' && isClauseUkrainian(clause.text));

      const content = useUk ? rule.buildUk(clause, level) : rule.buildEn(clause, level);
      flaggedClauses.push({
        clauseNumber: clause.clauseNumber,
        category: rule.category,
        riskLevel: level,
        originalExcerpt: clause.text,
        ...content,
      });
      // Match primary risk per clause to keep output concise and readable
      break;
    }
  }

  const highCount = flaggedClauses.filter((c) => c.riskLevel === 'HIGH').length;
  const medCount = flaggedClauses.filter((c) => c.riskLevel === 'MEDIUM').length;
  const lowCount = flaggedClauses.filter((c) => c.riskLevel === 'LOW').length;
  const rawScore = Math.min(96, highCount * 20 + medCount * 11 + lowCount * 5);

  const isUkSummary = detectedLanguage === 'uk';
  const executiveSummary =
    flaggedClauses.length === 0
      ? isUkSummary
        ? 'Критичних комерційних пасток у перевірених пунктах не виявлено. Проте перевірте реквізити сторін та графік платежів перед підписанням.'
        : 'No major commercial traps were detected in the extracted clauses. Still review party details and milestone schedules before signing.'
      : isUkSummary
        ? `Виявлено ${flaggedClauses.length} ризикових умов (високий ризик: ${highCount}, середній: ${medCount}). Договір суттєво зміщує фінансові та юридичні ризики на виконавця і потребує правок перед підписанням.`
        : `Detected ${flaggedClauses.length} risky clauses (${highCount} High, ${medCount} Medium). The current draft shifts disproportionate financial and IP risk onto the contractor and should be negotiated before signing.`;

  const negotiationChecklist =
    flaggedClauses.length === 0
      ? [
          isUkSummary
            ? 'Перевірте точні строки оплати та банківські реквізити.'
            : 'Confirm payment dates and banking details.',
        ]
      : flaggedClauses.slice(0, 5).map((item) =>
          isUkSummary
            ? `Пункт ${item.clauseNumber} (${item.category}): запропонуйте збалансоване формулювання замість поточної редакції.`
            : `Clause ${item.clauseNumber} (${item.category}): propose the balanced counter-clause wording before signing.`,
        );

  const candidateJson = JSON.stringify({
    contractLanguage: detectedLanguage,
    overallRiskScore: rawScore,
    executiveSummary,
    negotiationChecklist,
    flaggedClauses,
  });

  return parseAndValidateAnalysis(candidateJson, clauses);
}
