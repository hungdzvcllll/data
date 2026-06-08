import { useEffect, useRef, useState } from 'react';
import {
  ML_FEATURE_KEYS,
  FEATURE_EDIT_META,
  buildFeatureEditForm,
  formValuesToFeatureRow,
} from '../utils/featureDisplay';

const RESOURCES_LABELS = { 0: 'Low', 1: 'Medium', 2: 'High' };
const YES_NO_LABELS = { 0: 'No', 1: 'Yes' };
const MOTIVATION_LABELS = { 0: 'Low', 1: 'Medium', 2: 'High' };

function formatPreviewFeature(key, featureEdits, behaviorSummary) {
  if (behaviorSummary?.hasTeacherBaseline) {
    if (key === 'StudyHours' && behaviorSummary.effectiveStudyHours != null) {
      return `${behaviorSummary.effectiveStudyHours} giờ`;
    }
    if (key === 'AssignmentCompletion' && behaviorSummary.effectiveAssignmentCompletion != null) {
      return `${behaviorSummary.effectiveAssignmentCompletion}%`;
    }
    if (key === 'OnlineCourses' && behaviorSummary.effectiveOnlineCourses != null) {
      return String(behaviorSummary.effectiveOnlineCourses);
    }
    if (key === 'Resources' && behaviorSummary.effectiveResources != null) {
      return RESOURCES_LABELS[behaviorSummary.effectiveResources] ?? behaviorSummary.effectiveResources;
    }
    if (key === 'Discussions' && behaviorSummary.effectiveDiscussions != null) {
      return YES_NO_LABELS[behaviorSummary.effectiveDiscussions] ?? behaviorSummary.effectiveDiscussions;
    }
  }

  const val = featureEdits[key];
  if (key === 'StudyHours') return `${val || '—'} giờ`;
  if (key === 'AssignmentCompletion') return `${val ?? '—'}%`;
  return val || '—';
}
const LEARNING_STYLE_LABELS = {
  0: 'Visual',
  1: 'Auditory',
  2: 'Reading/Writing',
  3: 'Kinesthetic',
};

function FeatureEditInput({ fieldKey, value, onChange }) {
  const meta = FEATURE_EDIT_META[fieldKey];
  const inputClass = 'w-full max-w-[140px] rounded border border-slate-200 px-2 py-1 text-sm';

  if (meta.type === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className={inputClass}
      >
        {meta.options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="number"
      value={value}
      min={meta.min}
      max={meta.max}
      step={meta.step || 1}
      onChange={(e) => onChange(fieldKey, e.target.value)}
      className={inputClass}
    />
  );
}

export default function LearningBehaviorSummary({
  behaviorSummary,
  featureSource,
  computedFeatures,
  mergedFeatures,
  latestFeature,
  student,
  latestPredictionId,
  onRepredict,
  repredicting,
}) {
  const displayCtx = {
    featureSource,
    mergedFeatures,
    computedFeatures,
    latestFeature,
    student,
  };

  const [featureEdits, setFeatureEdits] = useState(() => buildFeatureEditForm(displayCtx));
  const [repredictError, setRepredictError] = useState('');
  const initialFormRef = useRef(buildFeatureEditForm(displayCtx));

  useEffect(() => {
    const next = buildFeatureEditForm(displayCtx);
    initialFormRef.current = next;
    setFeatureEdits(next);
  }, [featureSource, mergedFeatures, latestFeature?._id, student?._id, latestPredictionId]);

  const previewSummaryItems = [
    ['StudyHours', formatPreviewFeature('StudyHours', featureEdits, behaviorSummary)],
    ['AssignmentCompletion', formatPreviewFeature('AssignmentCompletion', featureEdits, behaviorSummary)],
    ['Resources', formatPreviewFeature('Resources', featureEdits, behaviorSummary)],
    ['OnlineCourses', formatPreviewFeature('OnlineCourses', featureEdits, behaviorSummary)],
    ['Discussions', formatPreviewFeature('Discussions', featureEdits, behaviorSummary)],
    ['EduTech', featureEdits.EduTech || '—'],
    ['Motivation', featureEdits.Motivation || '—'],
    ['LearningStyle', featureEdits.LearningStyle || '—'],
  ];

  const handleFieldChange = (key, value) => {
    setFeatureEdits((prev) => ({ ...prev, [key]: value }));
  };

  const handleRepredictClick = async () => {
    if (!onRepredict) return;
    setRepredictError('');
    try {
      const initial = initialFormRef.current;
      const overrideKeys = ML_FEATURE_KEYS.filter(
        (key) => String(featureEdits[key] ?? '') !== String(initial[key] ?? '')
      );
      const payload = overrideKeys.length
        ? { features: formValuesToFeatureRow(featureEdits), overrideKeys }
        : undefined;
      await onRepredict(payload);
    } catch (err) {
      setRepredictError(err.response?.data?.message || 'Không thể dự đoán lại');
    }
  };

  if (!behaviorSummary && !featureSource) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="mb-2 font-semibold">Learning Behavior Summary</h3>
        <p className="text-sm text-slate-500">
          Chưa có dữ liệu hành vi học tập trên nền tảng. Hệ thống đang dùng features từ Excel.
        </p>
      </div>
    );
  }

  const summaryItems = behaviorSummary
    ? [
      ['Total Study Hours', `${behaviorSummary.totalStudyHours} giờ`],
      ['Video Watch Time', `${behaviorSummary.videoWatchMinutes} phút`],
      ['Assignment Completion', `${behaviorSummary.assignmentCompletion}%`],
      ['Resource Views', behaviorSummary.resourceViews],
      ['Discussion Activity', behaviorSummary.discussionActivity],
      ['Online Courses Completed', behaviorSummary.onlineCoursesCompleted],
      ['EduTech Usage', behaviorSummary.eduTechUsageCount],
      [
        'Inferred Motivation',
        behaviorSummary.inferredMotivation != null
          ? MOTIVATION_LABELS[behaviorSummary.inferredMotivation]
          : '—',
      ],
      [
        'Inferred Learning Style',
        behaviorSummary.inferredLearningStyle != null
          ? LEARNING_STYLE_LABELS[behaviorSummary.inferredLearningStyle]
          : '—',
      ],
    ]
    : [];

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Learning Behavior Summary</h3>
          <p className="text-xs text-slate-500">
            Log LMS (trên) và feature áp dụng model (dưới) — sửa feature rồi bấm dự đoán lại để lưu
          </p>
        </div>
        {onRepredict && (
          <button
            type="button"
            onClick={handleRepredictClick}
            disabled={repredicting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {repredicting ? 'Đang dự đoán lại...' : 'Dự đoán lại với behavior'}
          </button>
        )}
      </div>

      {repredictError && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{repredictError}</p>
      )}

      {summaryItems.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-slate-600">
            Hoạt động LMS thực tế (chỉ đổi khi sinh viên học trên portal, không đổi khi GV sửa feature)
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summaryItems.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <p className="text-slate-500">{label}</p>
                <p className="font-medium text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {featureSource && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-slate-600">
            Feature áp dụng model
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {previewSummaryItems.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm">
                <p className="text-slate-500">{label}</p>
                <p className="font-medium text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {featureSource && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">Nguồn dữ liệu từng feature</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {ML_FEATURE_KEYS.map((key) => (
              <div
                key={key}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <span className="text-slate-600">{key}</span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {onRepredict ? (
                    <FeatureEditInput
                      fieldKey={key}
                      value={featureEdits[key] ?? ''}
                      onChange={handleFieldChange}
                    />
                  ) : (
                    <span className="font-medium text-slate-800">
                      {featureEdits[key] || '—'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            StudyHours = video + làm BT + đọc tài liệu (giờ)
          </p>
        </div>
      )}
    </div>
  );
}
