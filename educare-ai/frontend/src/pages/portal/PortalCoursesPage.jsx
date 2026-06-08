import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPortalCourses } from '../../services/lmsService';

export default function PortalCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortalCourses()
      .then((res) => setCourses(res.data.courses || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Khóa học của tôi</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => (
          <Link key={c._id} to={`/portal/courses/${c._id}`} className="rounded-xl border bg-white p-5 shadow-sm hover:border-emerald-300">
            <h3 className="font-semibold text-emerald-700">{c.title}</h3>
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{c.description}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
              <span>{c.lectureCount} bài giảng</span>
              <span>{c.resourceCount} tài liệu</span>
              <span>{c.assignmentCount} bài tập</span>
            </div>
          </Link>
        ))}
        {!courses.length && <p className="text-slate-500">Chưa có khóa học được công bố.</p>}
      </div>
    </div>
  );
}
