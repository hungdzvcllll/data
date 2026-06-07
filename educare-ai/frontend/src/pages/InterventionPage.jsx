import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInterventions, updateIntervention } from '../services/api';
import { formatDate } from '../utils/constants';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function InterventionPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getInterventions()
      .then((res) => setItems(res.data.interventions || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatusChange = async (id, status) => {
    await updateIntervention(id, { status });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Theo dõi can thiệp học tập</h2>
        <p className="text-sm text-slate-500">Quản lý ghi chú và tiến trình hỗ trợ sinh viên</p>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/students/${item.studentId?._id || item.studentId}`}
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    {item.studentId?.fullName || 'Sinh viên'} ({item.studentId?.studentCode})
                  </Link>
                  <p className="text-sm text-slate-500">{item.interventionType} · {item.advisorId?.fullName}</p>
                </div>
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item._id, e.target.value)}
                  className="rounded-lg border px-3 py-1.5 text-sm"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="mt-3 text-sm text-slate-700">{item.note}</p>
              {item.actionPlan && (
                <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p className="font-medium">Kế hoạch:</p>
                  <p>{item.actionPlan}</p>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-400">
                Tạo: {formatDate(item.createdAt)} · Follow-up: {formatDate(item.followUpDate)}
              </p>
            </div>
          ))}
          {!items.length && (
            <p className="rounded-xl border bg-white p-8 text-center text-slate-500">
              Chưa có ghi chú can thiệp. Tạo từ trang chi tiết sinh viên.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
