import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClasses } from '../../services/api';
import { createCourse, deleteCourse, getCourses, publishCourse } from '../../services/lmsService';

const emptyForm = { title: '', description: '', classId: '' };

export default function CoursesListPage() {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [cRes, clsRes] = await Promise.all([getCourses(), getClasses()]);
    setCourses(cRes.data.courses || []);
    setClasses(clsRes.data.classes || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createCourse(form);
    setForm(emptyForm);
    setShowForm(false);
    load();
  };

  const handlePublish = async (id) => {
    await publishCourse(id);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa khóa học này?')) return;
    await deleteCourse(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Khóa học</h2>
          <p className="text-sm text-slate-500">Tạo và quản lý khóa học cho từng lớp</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
          {showForm ? 'Đóng' : '+ Tạo khóa học'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
          <input required placeholder="Tên khóa học" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border px-3 py-2" />
          <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="rounded-lg border px-3 py-2">
            <option value="">Chọn lớp</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.className} – {c.courseName}</option>)}
          </select>
          <textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="md:col-span-2 rounded-lg border px-3 py-2" rows={3} />
          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-white md:col-span-2">Lưu khóa học</button>
        </form>
      )}

      {loading ? <p>Đang tải...</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <div key={course._id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link to={`/courses/${course._id}`} className="text-lg font-semibold text-emerald-700 hover:underline">{course.title}</Link>
                  <p className="mt-1 text-sm text-slate-500">{course.classId?.className}</p>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{course.description}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${course.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {course.status === 'published' ? 'Đã công bố' : 'Nháp'}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/courses/${course._id}`} className="rounded-lg border px-3 py-1.5 text-sm">Chi tiết</Link>
                {course.status !== 'published' && (
                  <button type="button" onClick={() => handlePublish(course._id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white">Công bố</button>
                )}
                <button type="button" onClick={() => handleDelete(course._id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600">Xóa</button>
              </div>
            </div>
          ))}
          {!courses.length && <p className="text-slate-500">Chưa có khóa học nào.</p>}
        </div>
      )}
    </div>
  );
}
