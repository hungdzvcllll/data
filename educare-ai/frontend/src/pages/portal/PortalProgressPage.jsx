import { useEffect, useState } from 'react';
import { getPortalProgress, portalRepredict } from '../../services/lmsService';
import RiskBadge from '../../components/RiskBadge';
import { formatScore } from '../../utils/constants';

export default function PortalProgressPage() {
  const [data, setData] = useState(null);
  const [repredicting, setRepredicting] = useState(false);

  const load = () => {
    getPortalProgress().then((res) => setData(res.data));
  };

  useEffect(load, []);

  const handleRepredict = async () => {
    setRepredicting(true);
    try {
      await portalRepredict();
      load();
    } finally {
      setRepredicting(false);
    }
  };

  if (!data) return <p>Đang tải...</p>;

  const b = data.behavior || {};
  const pred = data.prediction;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tiến độ học tập</h2>
        <button type="button" onClick={handleRepredict} disabled={repredicting} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
          {repredicting ? 'Đang dự đoán...' : 'Cập nhật dự đoán'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Giờ học (ước tính)', data.behaviorSummary?.studyHoursPerWeek ?? '—'],
          ['Xem video (phút)', Math.round(b.videoWatchMinutes || 0)],
          ['Hoàn thành BT', b.totalAssignments ? `${Math.round(((b.submittedAssignments || 0) / b.totalAssignments) * 100)}%` : '—'],
          ['Lượt xem tài liệu', b.resourceViews || 0],
          ['Module hoàn thành', b.completedModulesCount || 0],
          ['EduTech usage', b.eduTechUsageCount || 0],
        ].map(([label, val]) => (
          <div key={label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-emerald-700">{val}</p>
          </div>
        ))}
      </div>

      {pred && (
        <div className="rounded-xl border bg-white p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-sm text-slate-500">Điểm dự đoán hiện tại</p>
              <p className="text-3xl font-bold">{formatScore(pred.predictedScore)}</p>
            </div>
            <RiskBadge level={pred.riskLevel} />
          </div>
        </div>
      )}

      {data.computedFeaturePreview && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-2 font-semibold">Features tính từ hành vi</h3>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            {Object.entries(data.computedFeaturePreview.computedFeatures || {}).map(([k, v]) => (
              <div key={k} className="rounded bg-slate-50 px-2 py-1">
                <span className="text-slate-500">{k}: </span>
                <span className="font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
