/**
 * Rule-based risk factor analysis for EduCare AI.
 * Supports rawFeatures (human-readable labels) and encoded numeric features.
 */

function getNumeric(features, pascal, camel, fallback) {
  if (features[pascal] !== undefined) return Number(features[pascal]);
  if (features[camel] !== undefined) return Number(features[camel]);
  return fallback;
}

function isLowLabel(value) {
  return String(value).toLowerCase() === 'low';
}

function isHighLabel(value) {
  return String(value).toLowerCase() === 'high';
}

function isNoLabel(value) {
  return String(value).toLowerCase() === 'no';
}

function getRawField(features, camelKey) {
  if (features.rawFeatures?.[camelKey] !== undefined) {
    return features.rawFeatures[camelKey];
  }
  return features[camelKey];
}

const RISK_RULES = [
  {
    check: (f) => getNumeric(f, 'Attendance', 'attendance', 100) < 70,
    riskFactor: 'Tỷ lệ tham gia lớp thấp',
    explanation: 'Sinh viên có thể bỏ lỡ nội dung quan trọng trên lớp.',
    recommendedAction: 'Cố vấn học tập nên liên hệ sinh viên để tìm hiểu lý do vắng học và đặt mục tiêu tham gia lớp tối thiểu 80%.',
  },
  {
    check: (f) => getNumeric(f, 'AssignmentCompletion', 'assignmentCompletion', 100) < 70,
    riskFactor: 'Mức độ hoàn thành bài tập thấp',
    explanation: 'Sinh viên chưa duy trì tiến độ học tập đều đặn.',
    recommendedAction: 'Nên chia nhỏ deadline, nhắc lịch nộp bài và hỗ trợ trong office hour.',
  },
  {
    check: (f) => getNumeric(f, 'StudyHours', 'studyHours', 10) < 5,
    riskFactor: 'Thời gian tự học thấp',
    explanation: 'Sinh viên có thể chưa dành đủ thời gian ôn tập.',
    recommendedAction: 'Đề xuất lập kế hoạch học tập theo tuần và theo dõi lại sau 2 tuần.',
  },
  {
    check: (f) => {
      const raw = getRawField(f, 'motivation');
      if (typeof raw === 'string') return isLowLabel(raw);
      return getNumeric(f, 'Motivation', 'motivation', 2) <= 0;
    },
    riskFactor: 'Động lực học tập thấp',
    explanation: 'Sinh viên có thể cần hỗ trợ định hướng mục tiêu học tập.',
    recommendedAction: 'Kết nối sinh viên với mentor, nhóm học tập hoặc tư vấn học tập.',
  },
  {
    check: (f) => {
      const raw = getRawField(f, 'stressLevel');
      if (typeof raw === 'string') return isHighLabel(raw);
      return getNumeric(f, 'StressLevel', 'stressLevel', 0) >= 2;
    },
    riskFactor: 'Mức độ căng thẳng cao',
    explanation: 'Áp lực học tập có thể ảnh hưởng đến khả năng tiếp thu.',
    recommendedAction: 'Đề xuất trao đổi riêng với sinh viên hoặc giới thiệu đến bộ phận hỗ trợ sinh viên.',
  },
  {
    check: (f) => {
      const raw = getRawField(f, 'resources');
      if (typeof raw === 'string') return isLowLabel(raw);
      return getNumeric(f, 'Resources', 'resources', 2) <= 0;
    },
    riskFactor: 'Thiếu tài nguyên học tập',
    explanation: 'Sinh viên có thể gặp khó khăn khi tiếp cận tài liệu học tập.',
    recommendedAction: 'Hỗ trợ tài liệu, thư viện, tài khoản học liệu hoặc nguồn học online.',
  },
  {
    check: (f) => {
      const raw = getRawField(f, 'internet');
      if (typeof raw === 'string') return isNoLabel(raw);
      return getNumeric(f, 'Internet', 'internet', 1) <= 0;
    },
    riskFactor: 'Hạn chế kết nối Internet',
    explanation: 'Sinh viên có thể gặp khó khăn khi học online hoặc truy cập LMS.',
    recommendedAction: 'Hỗ trợ tài liệu offline hoặc gợi ý sử dụng phòng máy/thư viện.',
  },
  {
    check: (f) => getNumeric(f, 'Discussions', 'discussions', 1) <= 0,
    riskFactor: 'Ít tham gia thảo luận',
    explanation: 'Sinh viên chưa tương tác đủ với lớp học hoặc nhóm học tập.',
    recommendedAction: 'Khuyến khích tham gia nhóm học tập, diễn đàn lớp hoặc thảo luận trên LMS.',
  },
];

export function analyzeRiskFactors(features) {
  const riskFactors = [];
  const explanations = [];
  const recommendedActions = [];

  for (const rule of RISK_RULES) {
    if (rule.check(features)) {
      riskFactors.push(rule.riskFactor);
      explanations.push(rule.explanation);
      recommendedActions.push(rule.recommendedAction);
    }
  }

  return { riskFactors, explanations, recommendedActions };
}
