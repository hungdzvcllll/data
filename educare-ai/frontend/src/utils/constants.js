export const RISK_CONFIG = {
  EXCELLENT: { label: 'Rất tốt', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  STABLE: { label: 'Ổn định', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  AT_RISK: { label: 'Cần theo dõi', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  HIGH_RISK: { label: 'Nguy cơ cao', color: 'bg-red-100 text-red-800 border-red-200' },
};

/** Model lưu điểm thang 100; giao diện hiển thị thang 10. */
export const SCORE_DISPLAY_DIVISOR = 10;

export function toDisplayScore(score) {
  if (score == null || Number.isNaN(Number(score))) return null;
  return Number(score) / SCORE_DISPLAY_DIVISOR;
}

export function formatScore(score) {
  const display = toDisplayScore(score);
  if (display == null) return '—';
  return display.toFixed(1);
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN');
}
