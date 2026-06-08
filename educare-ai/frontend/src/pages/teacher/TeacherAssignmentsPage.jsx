import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getCourse } from '../../services/lmsService';

export default function TeacherAssignmentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const coursesRes = await getCourses();
      const courses = coursesRes.data.courses || [];
      const all = [];
      for (const c of courses) {
        const detail = await getCourse(c._id);
        (detail.data.assignments || []).forEach((a) => {
          all.push({ ...a, courseTitle: c.title, courseId: c._id });
        });
      }
      setItems(all);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Bài tập</h2>
      <p className="text-sm text-slate-500">Tất cả bài tập trong các khóa học</p>
      {loading ? <p>Đang tải...</p> : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr><th className="px-4 py-3">Bài tập</th><th className="px-4 py-3">Khóa học</th><th className="px-4 py-3">Hạn nộp</th><th className="px-4 py-3">Trạng thái</th></tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="px-4 py-3">{a.title}</td>
                  <td className="px-4 py-3"><Link to={`/courses/${a.courseId}`} className="text-emerald-600">{a.courseTitle}</Link></td>
                  <td className="px-4 py-3">{a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="px-4 py-3">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <p className="p-4 text-slate-500">Chưa có bài tập.</p>}
        </div>
      )}
    </div>
  );
}
