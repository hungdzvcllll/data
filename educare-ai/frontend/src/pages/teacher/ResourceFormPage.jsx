import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createResource, uploadMedia } from '../../services/lmsService';

export default function ResourceFormPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', fileUrl: '', fileType: 'pdf', order: 0 });
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadMedia(file);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      setForm((f) => ({ ...f, fileUrl: res.data.url, fileType: ext }));
    } catch (err) {
      setError(err.response?.data?.message || 'Upload thất bại');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createResource(courseId, { ...form, order: Number(form.order) || 0 });
      navigate(`/courses/${courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi tạo tài liệu');
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link to={`/courses/${courseId}`} className="text-sm text-emerald-600">← Quay lại khóa học</Link>
      <h2 className="text-2xl font-bold">Thêm tài liệu học tập</h2>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6">
        <input required placeholder="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
        <textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border px-3 py-2" rows={3} />
        <input placeholder="URL tài liệu" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
        <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={handleFile} className="w-full text-sm" />
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Loại file (pdf, docx...)" value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })} className="rounded-lg border px-3 py-2" />
          <input type="number" placeholder="Thứ tự" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="rounded-lg border px-3 py-2" />
        </div>
        <button type="submit" className="w-full rounded-lg bg-emerald-600 py-2 text-white">Lưu tài liệu</button>
      </form>
    </div>
  );
}
