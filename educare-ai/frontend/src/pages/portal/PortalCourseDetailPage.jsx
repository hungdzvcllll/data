import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPortalCourse, getPortalDiscussions, postDiscussion, trackCourseOpen } from '../../services/lmsService';

export default function PortalCourseDetailPage() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [discussionError, setDiscussionError] = useState('');

  const loadDiscussions = () => {
    getPortalDiscussions(courseId)
      .then((res) => setDiscussions(res.data.posts || []))
      .catch(() => setDiscussions([]));
  };

  useEffect(() => {
    trackCourseOpen(courseId).catch(() => {});
    getPortalCourse(courseId).then((res) => setData(res.data));
    loadDiscussions();
  }, [courseId]);

  const handlePostDiscussion = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setDiscussionError('');
    try {
      await postDiscussion(courseId, content.trim());
      setContent('');
      loadDiscussions();
    } catch (err) {
      setDiscussionError(err.response?.data?.message || 'Không gửi được bài thảo luận');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return <p>Đang tải...</p>;

  const { course, lectures, resources, assignments, progressPercent } = data;

  return (
    <div className="space-y-6">
      <Link to="/portal/courses" className="text-sm text-emerald-600">← Khóa học của tôi</Link>
      <div>
        <h2 className="text-xl font-bold">{course.title}</h2>
        <p className="text-sm text-slate-500">{course.description}</p>
        <p className="mt-2 text-sm font-medium text-emerald-700">Tiến độ: {progressPercent}%</p>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <h3 className="mb-3 font-semibold">Bài giảng</h3>
        <div className="space-y-2">
          {lectures.map((l) => (
            <Link key={l._id} to={`/portal/lectures/${l._id}`} className="block rounded-lg bg-slate-50 px-4 py-2 text-sm hover:bg-emerald-50">
              {l.title}
            </Link>
          ))}
          {!lectures.length && <p className="text-sm text-slate-500">Chưa có bài giảng.</p>}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h3 className="mb-3 font-semibold">Tài liệu</h3>
        <div className="space-y-2">
          {resources.map((r) => (
            <Link key={r._id} to={`/portal/resources/${r._id}`} className="block rounded-lg bg-slate-50 px-4 py-2 text-sm hover:bg-emerald-50">
              {r.title} ({r.fileType})
            </Link>
          ))}
          {!resources.length && <p className="text-sm text-slate-500">Chưa có tài liệu.</p>}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h3 className="mb-3 font-semibold">Bài tập</h3>
        <div className="space-y-2">
          {assignments.map((a) => (
            <Link key={a._id} to={`/portal/assignments/${a._id}`} className="block rounded-lg bg-slate-50 px-4 py-2 text-sm hover:bg-emerald-50">
              {a.title} · hạn {a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : '—'}
            </Link>
          ))}
          {!assignments.length && <p className="text-sm text-slate-500">Chưa có bài tập.</p>}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h3 className="mb-1 font-semibold">Thảo luận</h3>
        <p className="mb-3 text-xs text-slate-500">
          Đăng ít nhất một bài thảo luận trong khóa học — hoạt động này cập nhật feature Discussions (0 → 1) khi dự đoán lại.
        </p>

        {discussionError && <p className="text-sm text-red-600">{discussionError}</p>}
        <form onSubmit={handlePostDiscussion} className="mb-4 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến về khóa học..."
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? 'Đang gửi...' : 'Đăng bài thảo luận'}
          </button>
        </form>

        <div className="space-y-3">
          {discussions.map((post) => (
            <div key={post._id} className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <p className="font-medium text-slate-800">
                {post.studentId?.fullName || 'Sinh viên'}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {new Date(post.createdAt).toLocaleString('vi-VN')}
                </span>
              </p>
              <p className="mt-1 text-slate-700">{post.content}</p>
            </div>
          ))}
          {!discussions.length && <p className="text-sm text-slate-500">Chưa có thảo luận nào. Hãy là người đầu tiên!</p>}
        </div>
      </section>
    </div>
  );
}
