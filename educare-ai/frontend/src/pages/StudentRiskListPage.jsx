import { useEffect, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { getClasses, getRiskStudents } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { formatDate, formatScore } from '../utils/constants';

const RISK_FILTERS = ['All', 'EXCELLENT', 'STABLE', 'AT_RISK', 'HIGH_RISK'];
const EXTRA_FILTERS = ['Low Attendance', 'High Stress', 'Low Motivation', 'Low AssignmentCompletion'];

export default function StudentRiskListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const uploadSuccess = location.state?.uploadSuccess;
  const uploadMessage = location.state?.message;
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState('All');
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState(searchParams.get('classId') || '');

  const load = () => {
    setLoading(true);
    getRiskStudents({
      classId: classId || undefined,
      risk: risk === 'All' ? undefined : risk,
      filter: filter || undefined,
      search: search || undefined,
    })
      .then((res) => setStudents(res.data.students || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getClasses().then((res) => setClasses(res.data.classes || []));
  }, []);

  useEffect(load, [classId, risk, filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Danh sách sinh viên & mức rủi ro</h2>
        <p className="text-sm text-slate-500">Phát hiện sớm sinh viên cần can thiệp</p>
      </div>

      {uploadSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {uploadMessage || 'Upload và dự đoán thành công. Danh sách đã được cập nhật.'}
        </div>
      )}

      <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Tất cả lớp</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.className}</option>)}
        </select>
        <select value={risk} onChange={(e) => setRisk(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          {RISK_FILTERS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Bộ lọc đặc biệt</option>
          {EXTRA_FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm StudentID, tên, lớp..."
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white">Tìm</button>
        </form>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">StudentID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Predicted Score</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Main Risk Factors</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.studentId} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono">{s.studentCode}</td>
                  <td className="px-4 py-3">{s.fullName}</td>
                  <td className="px-4 py-3">{s.className}</td>
                  <td className="px-4 py-3 font-semibold">{formatScore(s.predictedScore)}</td>
                  <td className="px-4 py-3"><RiskBadge level={s.riskLevel} /></td>
                  <td className="px-4 py-3 max-w-xs truncate text-xs text-slate-600">
                    {(s.mainRiskFactors || []).join('; ') || '-'}
                  </td>
                  <td className="px-4 py-3">{formatDate(s.lastUpdated)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/students/${s.studentId}`} className="text-emerald-600 hover:underline">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!students.length && (
            <p className="p-8 text-center text-slate-500">Chưa có dữ liệu dự đoán. Hãy upload file và chạy prediction.</p>
          )}
        </div>
      )}
    </div>
  );
}
