/** Risk level mapping from predicted exam score (40-100 scale). */
export const RISK_LEVELS = {
  EXCELLENT: 'EXCELLENT',
  STABLE: 'STABLE',
  AT_RISK: 'AT_RISK',
  HIGH_RISK: 'HIGH_RISK',
};

export const RISK_LABELS_VI = {
  EXCELLENT: 'Rất tốt',
  STABLE: 'Ổn định',
  AT_RISK: 'Cần theo dõi',
  HIGH_RISK: 'Nguy cơ cao',
};

export function getRiskLevel(score) {
  const s = Number(score);
  if (s >= 85) return RISK_LEVELS.EXCELLENT;
  if (s >= 70) return RISK_LEVELS.STABLE;
  if (s >= 55) return RISK_LEVELS.AT_RISK;
  return RISK_LEVELS.HIGH_RISK;
}

export function getEstimatedFinalGrade(score) {
  const s = Number(score);
  if (s >= 85) return 0;
  if (s >= 70) return 1;
  if (s >= 55) return 2;
  return 3;
}

export function formatRiskLevel(riskLevel) {
  return {
    code: riskLevel,
    labelVi: RISK_LABELS_VI[riskLevel] || riskLevel,
  };
}
