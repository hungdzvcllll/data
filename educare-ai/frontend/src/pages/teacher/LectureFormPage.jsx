import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createLecture, uploadMedia } from '../../services/lmsService';

export default function LectureFormPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', durationSeconds: '', order: 0 });
  const [uploadedName, setUploadedName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadMedia(file);
      setForm((f) => ({ ...f, videoUrl: res.data.url }));
      setUploadedName(file.name);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload thất bại');
      setUploadedName('');
      setForm((f) => ({ ...f, videoUrl: '' }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.videoUrl) {
      setError('Vui lòng upload file video trước khi lưu.');
      return;
    }
    try {
      await createLecture(courseId, {
        ...form,
        durationSeconds: Number(form.durationSeconds) || 0,
        order: Number(form.order) || 0,
      });
      navigate(`/courses/${courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi tạo bài giảng');
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link to={`/courses/${courseId}`} className="text-sm text-emerald-600">← Quay lại khóa học</Link>
      <h2 className="text-2xl font-bold">Thêm bài giảng video</h2>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6">
        <input required placeholder="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
        <textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border px-3 py-2" rows={3} />
        <div>
          <label className="text-sm font-medium text-slate-700">Upload file video *</label>
          <p className="mt-1 text-xs text-slate-500">
            Chỉ hỗ trợ upload file (MP4, WebM…). Thời gian xem sẽ được ghi nhận cho StudyHours.
          </p>
          <input
            type="file"
            accept="video/*"
            onChange={handleFile}
            disabled={uploading}
            className="mt-2 block w-full text-sm"
          />
          {uploading && <p className="mt-1 text-sm text-slate-500">Đang upload...</p>}
          {form.videoUrl && !uploading && (
            <p className="mt-2 text-sm text-emerald-700">
              Đã upload: {uploadedName || form.videoUrl}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" placeholder="Thời lượng (giây)" value={form.durationSeconds} onChange={(e) => setForm({ ...form, durationSeconds: e.target.value })} className="rounded-lg border px-3 py-2" />
          <input type="number" placeholder="Thứ tự" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="rounded-lg border px-3 py-2" />
        </div>
        <button type="submit" disabled={uploading || !form.videoUrl} className="w-full rounded-lg bg-emerald-600 py-2 text-white disabled:opacity-50">
          Lưu bài giảng
        </button>
      </form>
    </div>
  );
}
