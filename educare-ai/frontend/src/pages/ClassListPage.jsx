import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createClass, deleteClass, getClasses } from '../services/api';

const emptyForm = {
  className: '',
  courseName: '',
  semester: 'HK1',
  academicYear: '2025-2026',
};

export default function ClassListPage() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getClasses()
      .then((res) => setClasses(res.data.classes || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createClass(form);
    setForm(emptyForm);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa lớp học này?')) return;
    await deleteClass(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý lớp học</h2>
          <p className="text-sm text-slate-500">Tạo và quản lý lớp để upload & phân tích sinh viên</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {showForm ? 'Đóng form' : '+ Tạo lớp'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
          {Object.entries(emptyForm).map(([key, placeholder]) => (
            <input
              key={key}
              placeholder={key}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="rounded-lg border px-3 py-2"
              required
            />
          ))}
          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-white md:col-span-2">
            Lưu lớp học
          </button>
        </form>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Môn học</th>
                <th className="px-4 py-3">Học kỳ</th>
                <th className="px-4 py-3">Năm học</th>
                <th className="px-4 py-3">Giảng viên</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{c.className}</td>
                  <td className="px-4 py-3">{c.courseName}</td>
                  <td className="px-4 py-3">{c.semester}</td>
                  <td className="px-4 py-3">{c.academicYear}</td>
                  <td className="px-4 py-3">{c.teacherId?.fullName || '-'}</td>
                  <td className="px-4 py-3 space-x-2">
                    <Link to={`/upload?classId=${c._id}`} className="text-emerald-600 hover:underline">Upload</Link>
                    <Link to={`/students?classId=${c._id}`} className="text-blue-600 hover:underline">Sinh viên</Link>
                    <button type="button" onClick={() => handleDelete(c._id)} className="text-red-600 hover:underline">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
