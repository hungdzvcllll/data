import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createIntervention, getStudent, getStudentInterventions } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { formatDate, formatScore } from '../utils/constants';
import { displayFeatureValue } from '../utils/featureDisplay';

export default function StudentDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [form, setForm] = useState({
    interventionType: 'Academic Support',
    note: '',
    actionPlan: '',
    followUpDate: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    getStudent(id).then((res) => setData(res.data));
    getStudentInterventions(id).then((res) => setInterventions(res.data.interventions || []));
  };

  useEffect(load, [id]);

  const handleCreateIntervention = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createIntervention({
        studentId: id,
        predictionId: data.latestPrediction?._id,
        ...form,
        followUpDate: form.followUpDate || undefined,
      });
      setForm({ interventionType: 'Academic Support', note: '', actionPlan: '', followUpDate: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <p>Đang tải...</p>;

  const { student, latestPrediction, latestFeature, predictionHistory } = data;

  const featureLabels = [
    'StudyHours',
    'Attendance',
    'AssignmentCompletion',
    'OnlineCourses',
    'Discussions',
    'Extracurricular',
    'Resources',
    'Internet',
    'EduTech',
    'Gender',
    'Age',
    'LearningStyle',
    'Motivation',
    'StressLevel',
  ];

  return (
    <div className="space-y-6">
      <Link to="/students" className="text-sm text-emerald-600 hover:underline">← Quay lại danh sách</Link>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{student.fullName}</h2>
            <p className="text-slate-500">{student.studentCode} · {student.classId?.className}</p>
          </div>
          {latestPrediction && (
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-700">{formatScore(latestPrediction.predictedScore)}</p>
              <RiskBadge level={latestPrediction.riskLevel} />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">14 Features đầu vào</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {featureLabels.map((label) => (
              <div key={label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium">
                  {displayFeatureValue(label, latestFeature, student)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Phân tích rủi ro & gợi ý</h3>
          {latestPrediction ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-slate-700">Risk Factors</p>
                <ul className="mt-1 list-disc pl-5 text-slate-600">
                  {(latestPrediction.riskFactors || []).map((f) => <li key={f}>{f}</li>)}
                  {!latestPrediction.riskFactors?.length && <li>Không phát hiện yếu tố rủi ro nổi bật</li>}
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-700">Explanations</p>
                <ul className="mt-1 list-disc pl-5 text-slate-600">
                  {(latestPrediction.explanations || []).map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-700">Recommended Actions</p>
                <ul className="mt-1 list-disc pl-5 text-emerald-800">
                  {(latestPrediction.recommendedActions || []).map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Chưa có dự đoán</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold">Lịch sử dự đoán</h3>
        <div className="space-y-2">
          {(predictionHistory || []).map((p) => (
            <div key={p._id} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
              <span>{formatDate(p.createdAt)}</span>
              <span className="font-medium">{formatScore(p.predictedScore)}</span>
              <RiskBadge level={p.riskLevel} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold">Tạo ghi chú can thiệp</h3>
        <form onSubmit={handleCreateIntervention} className="space-y-3">
          <input
            value={form.interventionType}
            onChange={(e) => setForm({ ...form, interventionType: e.target.value })}
            placeholder="Loại can thiệp"
            className="w-full rounded-lg border px-3 py-2"
            required
          />
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Ghi chú"
            className="w-full rounded-lg border px-3 py-2"
            rows={3}
            required
          />
          <textarea
            value={form.actionPlan}
            onChange={(e) => setForm({ ...form, actionPlan: e.target.value })}
            placeholder="Kế hoạch hành động"
            className="w-full rounded-lg border px-3 py-2"
            rows={3}
          />
          <input
            type="date"
            value={form.followUpDate}
            onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
            className="rounded-lg border px-3 py-2"
          />
          <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-white">
            {saving ? 'Đang lưu...' : 'Lưu intervention'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <h4 className="font-medium">Intervention Notes</h4>
          {interventions.map((item) => (
            <div key={item._id} className="rounded-lg border border-slate-200 p-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{item.interventionType}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{item.status}</span>
              </div>
              <p className="mt-2 text-slate-600">{item.note}</p>
              {item.actionPlan && <p className="mt-2 text-emerald-800">{item.actionPlan}</p>}
              <p className="mt-2 text-xs text-slate-400">
                {formatDate(item.createdAt)} · Follow-up: {formatDate(item.followUpDate)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
