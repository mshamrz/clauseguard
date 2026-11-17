import React from 'react';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
}

const BADGE_CLASSES: Record<RiskLevel, string> = {
  HIGH: 'border-rose-200 bg-rose-50 text-rose-700',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700',
  LOW: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  const { t } = useLanguage();

  const icon =
    level === 'HIGH' ? (
      <AlertOctagon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    ) : level === 'MEDIUM' ? (
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    ) : (
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    );

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-0.5 text-[11px] font-bold tracking-wide shadow-xs ${BADGE_CLASSES[level]}`}
    >
      {icon}
      <span>{t.extraction.severityLabels[level]}</span>
    </span>
  );
};
