import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import { getTeacherDashboard, getClasses, getClassDashboard } from '../services/api';
import { formatScore, toDisplayScore } from '../utils/constants';

const RISK_COLORS = {
  EXCELLENT: '#10b981',
  STABLE: '#3b82f6',
  AT_RISK: '#f59e0b',
  HIGH_RISK: '#ef4444',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [scatter, setScatter] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoadError('');
    try {
      const res = await getClasses();
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error(err);
    }
    await loadDashboard();
  };

  const loadDashboard = async (classId) => {
    setLoading(true);
    setLoadError('');
    try {
      if (classId) {
        const res = await getClassDashboard(classId);
        setData(res.data);
        setScatter(res.data.scatter || []);
      } else {
        const res = await getTeacherDashboard();
        setData(res.data);
        setScatter([]);
      }
    } catch (err) {
      console.error(err);
      setLoadError('Không kết nối được API. Hãy đảm bảo backend đang chạy (port 5000), rồi thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e) => {
    const val = e.target.value;
    setSelectedClass(val);
    loadDashboard(val || undefined);
  };

  if (loadError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={loadInitial}
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return <p className="text-slate-500">Đang tải dashboard...</p>;
  }

  const riskPie = Object.entries(data.riskDistribution || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const scoreBuckets = [
    { range: '4–5.4', count: 0 },
    { range: '5.5–6.9', count: 0 },
    { range: '7–8.4', count: 0 },
    { range: '8.5–10', count: 0 },
  ];
  (data.scoreDistribution || []).forEach(({ predictedScore }) => {
    const s = predictedScore;
    if (s < 55) scoreBuckets[0].count += 1;
    else if (s < 70) scoreBuckets[1].count += 1;
    else if (s < 85) scoreBuckets[2].count += 1;
    else scoreBuckets[3].count += 1;
  });

  const scatterDisplay = scatter.map((point) => ({
    ...point,
    predictedScore: toDisplayScore(point.predictedScore),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard tổng quan</h2>
          <p className="text-sm text-slate-500">Phân tích nguy cơ học tập theo lớp</p>
        </div>
        <select
          value={selectedClass}
          onChange={handleClassChange}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Tất cả lớp</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.className} - {c.courseName}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng sinh viên" value={data.totalStudents} />
        <StatCard
          title="Điểm TB dự đoán (thang 10)"
          value={formatScore(data.averagePredictedScore || 0)}
          accent="border-l-blue-500"
        />
        <StatCard title="Nguy cơ cao" value={data.highRiskCount} accent="border-l-red-500" />
        <StatCard title="Cần theo dõi" value={data.atRiskCount} accent="border-l-amber-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Phân bố điểm dự đoán (thang 10)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scoreBuckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Sinh viên theo mức rủi ro</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={riskPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {riskPie.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {scatter.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { title: 'Attendance vs Predicted Score', xKey: 'attendance', color: '#3b82f6' },
            { title: 'Assignment vs Predicted Score', xKey: 'assignmentCompletion', color: '#8b5cf6' },
            { title: 'Stress vs Predicted Score', xKey: 'stressLevel', color: '#ef4444' },
          ].map((chart) => (
            <div key={chart.xKey} className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold">{chart.title}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey={chart.xKey} name={chart.xKey} />
                  <YAxis type="number" dataKey="predictedScore" name="Điểm" domain={[4, 10]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterDisplay} fill={chart.color} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Ổn định" value={data.stableCount} accent="border-l-blue-500" />
        <StatCard title="Rất tốt" value={data.excellentCount} accent="border-l-emerald-500" />
        <StatCard title="Tổng lớp" value={data.totalClasses} accent="border-l-slate-500" />
      </div>
    </div>
  );
}
