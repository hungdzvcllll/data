import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import RiskBadge from '../components/RiskBadge';
import { formatDate, formatScore } from '../utils/constants';

export default function StudentPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyProfile()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Không tải được hồ sơ'));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow">
          <p className="text-red-600">{error}</p>
          <button type="button" onClick={handleLogout} className="mt-4 text-sm text-emerald-600">Đăng xuất</button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="flex min-h-screen items-center justify-center">Đang tải...</div>;

  const { student, latestPrediction, latestFeature, predictionHistory } = data;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-emerald-700">EduCare AI – Cổng sinh viên</h1>
          <p className="text-sm text-slate-500">{user?.fullName}</p>
        </div>
        <button type="button" onClick={handleLogout} className="rounded-lg border px-4 py-2 text-sm">Đăng xuất</button>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Hồ sơ cá nhân</h2>
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

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-semibold">Gợi ý cải thiện học tập</h2>
          {latestPrediction?.recommendedActions?.length ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-emerald-900">
              {latestPrediction.recommendedActions.map((a) => <li key={a}>{a}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Tiếp tục duy trì thói quen học tập hiện tại.</p>
          )}
        </div>

        {latestFeature && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold">Chỉ số học tập gần nhất</h2>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
              {[
                ['Giờ học/tuần', latestFeature.studyHours],
                ['Chuyên cần %', latestFeature.attendance],
                ['Hoàn thành BT %', latestFeature.assignmentCompletion],
                ['Khóa online', latestFeature.onlineCourses],
                ['Động lực', latestFeature.motivation],
                ['Stress', latestFeature.stressLevel],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">{label}: </span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(predictionHistory || []).length > 1 && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold">Lịch sử dự đoán</h2>
            <div className="space-y-2">
              {predictionHistory.map((p) => (
                <div key={p._id} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
                  <span>{formatDate(p.createdAt)}</span>
                  <span className="font-medium">{formatScore(p.predictedScore)}</span>
                  <RiskBadge level={p.riskLevel} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
