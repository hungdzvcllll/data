import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPortalAssignments } from '../../services/lmsService';

export default function PortalAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    getPortalAssignments().then((res) => {
      setAssignments(res.data.assignments || []);
      setSubmissions(res.data.submissions || []);
    });
  }, []);

  const submittedIds = new Set(submissions.map((s) => s.assignmentId?._id || s.assignmentId));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Bài tập</h2>
      <div className="space-y-2">
        {assignments.map((a) => (
          <Link key={a._id} to={`/portal/assignments/${a._id}`} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm hover:border-emerald-300">
            <span>{a.title} · {a.courseId?.title}</span>
            <span className={submittedIds.has(a._id) ? 'text-emerald-600' : 'text-amber-600'}>
              {submittedIds.has(a._id) ? 'Đã nộp' : 'Chưa nộp'}
            </span>
          </Link>
        ))}
        {!assignments.length && <p className="text-slate-500">Chưa có bài tập.</p>}
      </div>
    </div>
  );
}
