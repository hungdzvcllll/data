import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  deleteAssignment,
  deleteLecture,
  deleteResource,
  getCourse,
  publishAssignment,
  publishCourse,
} from '../../services/lmsService';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    getCourse(courseId)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Lỗi tải khóa học'));
  };

  useEffect(load, [courseId]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Đang tải...</p>;

  const { course, lectures, resources, assignments, students } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/courses" className="text-sm text-emerald-600">← Danh sách khóa học</Link>
          <h2 className="mt-1 text-2xl font-bold">{course.title}</h2>
          <p className="text-sm text-slate-500">{course.classId?.className} · {course.status}</p>
          <p className="mt-2 text-slate-600">{course.description}</p>
        </div>
        {course.status !== 'published' && (
          <button type="button" onClick={async () => { await publishCourse(courseId); load(); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
            Công bố khóa học
          </button>
        )}
      </div>

      <section className="rounded-xl border bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Bài giảng ({lectures.length})</h3>
          <Link to={`/courses/${courseId}/lectures/new`} className="text-sm text-emerald-600">+ Thêm bài giảng</Link>
        </div>
        <div className="space-y-2">
          {lectures.map((l) => (
            <div key={l._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
              <span>{l.order}. {l.title} {l.durationSeconds ? `(${Math.round(l.durationSeconds / 60)} phút)` : ''}</span>
              <button type="button" onClick={async () => { if (window.confirm('Xóa?')) { await deleteLecture(l._id); load(); } }} className="text-red-600">Xóa</button>
            </div>
          ))}
          {!lectures.length && <p className="text-sm text-slate-500">Chưa có bài giảng.</p>}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Tài liệu ({resources.length})</h3>
          <Link to={`/courses/${courseId}/resources/new`} className="text-sm text-emerald-600">+ Thêm tài liệu</Link>
        </div>
        <div className="space-y-2">
          {resources.map((r) => (
            <div key={r._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
              <span>{r.title} · {r.fileType}</span>
              <button type="button" onClick={async () => { if (window.confirm('Xóa?')) { await deleteResource(r._id); load(); } }} className="text-red-600">Xóa</button>
            </div>
          ))}
          {!resources.length && <p className="text-sm text-slate-500">Chưa có tài liệu.</p>}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Bài tập ({assignments.length})</h3>
          <Link to={`/courses/${courseId}/assignments/new`} className="text-sm text-emerald-600">+ Tạo bài tập</Link>
        </div>
        <div className="space-y-2">
          {assignments.map((a) => (
            <div key={a._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm">
              <span>{a.title} · hạn {a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : '—'} · {a.status}</span>
              <div className="flex gap-2">
                {a.status !== 'published' && (
                  <button type="button" onClick={async () => { await publishAssignment(a._id); load(); }} className="text-emerald-600">Công bố</button>
                )}
                <button type="button" onClick={async () => { if (window.confirm('Xóa?')) { await deleteAssignment(a._id); load(); } }} className="text-red-600">Xóa</button>
              </div>
            </div>
          ))}
          {!assignments.length && <p className="text-sm text-slate-500">Chưa có bài tập.</p>}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h3 className="mb-3 font-semibold">Sinh viên trong lớp ({students.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-2 pr-4">MSSV</th><th className="py-2">Họ tên</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-b"><td className="py-2 pr-4">{s.studentCode}</td><td className="py-2"><Link to={`/students/${s._id}`} className="text-emerald-600">{s.fullName}</Link></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
