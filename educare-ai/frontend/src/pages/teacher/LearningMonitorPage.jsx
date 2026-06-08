import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClasses } from '../../services/api';
import { getLearningMonitor } from '../../services/lmsService';
import RiskBadge from '../../components/RiskBadge';
import { formatScore } from '../../utils/constants';

export default function LearningMonitorPage() {
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({ classId: '', riskLevel: '', lowStudyHours: false, lowAssignmentCompletion: false, noActivity: false });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = {
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.riskLevel && { riskLevel: filters.riskLevel }),
      ...(filters.lowStudyHours && { lowStudyHours: '1' }),
      ...(filters.lowAssignmentCompletion && { lowAssignmentCompletion: '1' }),
      ...(filters.noActivity && { noActivity: '1' }),
    };
    getLearningMonitor(params)
      .then((res) => setRows(res.data.students || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { getClasses().then((r) => setClasses(r.data.classes || [])); }, []);
  useEffect(load, [filters]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Theo dõi học tập</h2>
      <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
        <select value={filters.classId} onChange={(e) => setFilters({ ...filters, classId: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Tất cả lớp</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.className}</option>)}
        </select>
        <select value={filters.riskLevel} onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Mọi mức rủi ro</option>
          <option value="High Risk">High Risk</option>
          <option value="Medium Risk">Medium Risk</option>
          <option value="Low Risk">Low Risk</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.lowStudyHours} onChange={(e) => setFilters({ ...filters, lowStudyHours: e.target.checked })} /> Giờ học thấp</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.lowAssignmentCompletion} onChange={(e) => setFilters({ ...filters, lowAssignmentCompletion: e.target.checked })} /> Hoàn thành BT thấp</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.noActivity} onChange={(e) => setFilters({ ...filters, noActivity: e.target.checked })} /> Không hoạt động 7 ngày</label>
      </div>

      {loading ? <p>Đang tải...</p> : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Sinh viên</th>
                <th className="px-3 py-2">Lớp</th>
                <th className="px-3 py-2">StudyHours</th>
                <th className="px-3 py-2">Video (phút)</th>
                <th className="px-3 py-2">BT %</th>
                <th className="px-3 py-2">Tài liệu</th>
                <th className="px-3 py-2">Thảo luận</th>
                <th className="px-3 py-2">EduTech</th>
                <th className="px-3 py-2">Điểm DV (10)</th>
                <th className="px-3 py-2">Rủi ro</th>
                <th className="px-3 py-2">Hoạt động cuối</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.studentId} className="border-t">
                  <td className="px-3 py-2"><Link to={`/students/${r.studentId}`} className="text-emerald-600">{r.fullName}</Link></td>
                  <td className="px-3 py-2">{r.className}</td>
                  <td className="px-3 py-2">{r.studyHours ?? '—'}</td>
                  <td className="px-3 py-2">{Math.round(r.videoWatchMinutes || 0)}</td>
                  <td className="px-3 py-2">{r.assignmentCompletion ?? '—'}%</td>
                  <td className="px-3 py-2">{r.resourceViews}</td>
                  <td className="px-3 py-2">{r.discussionActivity}</td>
                  <td className="px-3 py-2">{r.eduTechUsage}</td>
                  <td className="px-3 py-2">{r.predictedScore != null ? formatScore(r.predictedScore) : '—'}</td>
                  <td className="px-3 py-2">{r.riskLevel ? <RiskBadge level={r.riskLevel} /> : '—'}</td>
                  <td className="px-3 py-2">{r.lastActivity ? new Date(r.lastActivity).toLocaleDateString('vi-VN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="p-4 text-slate-500">Không có dữ liệu phù hợp bộ lọc.</p>}
        </div>
      )}
    </div>
  );
}
