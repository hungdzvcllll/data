import { useEffect, useState } from 'react';
import { getMyProfile } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import { formatDate, formatScore } from '../../utils/constants';

export default function PortalOverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyProfile()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Không tải được hồ sơ'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Đang tải...</p>;

  const { student, latestPrediction } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Tổng quan</h2>
        <p className="mt-2 text-slate-600">{student.fullName} · {student.studentCode}</p>
        <p className="text-sm text-slate-500">Lớp: {student.classId?.className} – {student.classId?.courseName}</p>
      </div>

      {latestPrediction && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Điểm thi dự đoán</h2>
              <p className="text-4xl font-bold text-emerald-700">{formatScore(latestPrediction.predictedScore)}</p>
            </div>
            <RiskBadge level={latestPrediction.riskLevel} />
          </div>
        </div>
      )}
    </div>
  );
}
