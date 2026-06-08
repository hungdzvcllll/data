import { useEffect, useState } from 'react';
import { getMyProfile } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import { formatDate, formatScore } from '../../utils/constants';

export default function PortalPredictionPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getMyProfile().then((res) => setData(res.data));
  }, []);

  if (!data) return <p>Đang tải...</p>;

  const { latestPrediction, predictionHistory } = data;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Kết quả dự đoán</h2>
      {latestPrediction ? (
        <>
          <div className="rounded-xl border bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Điểm thi dự đoán</p>
                <p className="text-4xl font-bold text-emerald-700">{formatScore(latestPrediction.predictedScore)}</p>
              </div>
              <RiskBadge level={latestPrediction.riskLevel} />
            </div>
            {latestPrediction.computedFeatures && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                {Object.entries(latestPrediction.computedFeatures).map(([k, v]) => (
                  <div key={k} className="rounded bg-slate-50 px-2 py-1">{k}: {String(v)}</div>
                ))}
              </div>
            )}
          </div>
          {(predictionHistory || []).length > 1 && (
            <div className="rounded-xl border bg-white p-5">
              <h3 className="mb-3 font-semibold">Lịch sử</h3>
              {predictionHistory.map((p) => (
                <div key={p._id} className="flex justify-between border-b py-2 text-sm">
                  <span>{formatDate(p.createdAt)}</span>
                  <span>{formatScore(p.predictedScore)}</span>
                  <RiskBadge level={p.riskLevel} />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-slate-500">Chưa có dự đoán. Giảng viên cần upload dữ liệu Excel trước.</p>
      )}
    </div>
  );
}
