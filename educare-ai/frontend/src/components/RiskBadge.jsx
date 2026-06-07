import { RISK_CONFIG } from '../utils/constants';

export default function RiskBadge({ level, showLabel = true }) {
  const cfg = RISK_CONFIG[level] || { label: level, color: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      {showLabel ? cfg.label : level}
    </span>
  );
}
