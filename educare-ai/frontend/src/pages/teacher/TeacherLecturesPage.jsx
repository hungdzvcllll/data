import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getCourse } from '../../services/lmsService';

export default function TeacherLecturesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const coursesRes = await getCourses();
      const courses = coursesRes.data.courses || [];
      const all = [];
      for (const c of courses) {
        const detail = await getCourse(c._id);
        (detail.data.lectures || []).forEach((l) => {
          all.push({ ...l, courseTitle: c.title, courseId: c._id });
        });
      }
      setItems(all);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Bài giảng</h2>
      <p className="text-sm text-slate-500">Tất cả bài giảng video trong các khóa học của bạn</p>
      {loading ? <p>Đang tải...</p> : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr><th className="px-4 py-3">Bài giảng</th><th className="px-4 py-3">Khóa học</th><th className="px-4 py-3">Thời lượng</th></tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l._id} className="border-t">
                  <td className="px-4 py-3">{l.title}</td>
                  <td className="px-4 py-3"><Link to={`/courses/${l.courseId}`} className="text-emerald-600">{l.courseTitle}</Link></td>
                  <td className="px-4 py-3">{l.durationSeconds ? `${Math.round(l.durationSeconds / 60)} phút` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <p className="p-4 text-slate-500">Chưa có bài giảng.</p>}
        </div>
      )}
    </div>
  );
}
