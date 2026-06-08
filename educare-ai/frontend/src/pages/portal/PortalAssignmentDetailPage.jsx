import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPortalAssignment, submitAssignment, trackAssignmentStart } from '../../services/lmsService';

const OPTION_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function PortalAssignmentDetailPage() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [content, setContent] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const startTimeRef = useRef(Date.now());
  const startedRef = useRef(false);

  const isQuiz = assignment?.assignmentType === 'quiz';

  useEffect(() => {
    getPortalAssignment(assignmentId).then((res) => {
      setAssignment(res.data.assignment);
      setSubmission(res.data.submission);
      if (res.data.submission?.content) setContent(res.data.submission.content);
      if (res.data.assignment?.questions?.length) {
        setSelectedAnswers(res.data.assignment.questions.map(() => null));
      }
    });
  }, [assignmentId]);

  useEffect(() => {
    if (assignment && !startedRef.current && !submission) {
      startedRef.current = true;
      trackAssignmentStart(assignmentId).catch(() => {});
      startTimeRef.current = Date.now();
    }
  }, [assignment, assignmentId, submission]);

  const handleSelectAnswer = (questionIndex, optionIndex) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setFormError('');
    const timeSpentMinutes = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    try {
      const res = await submitAssignment(assignmentId, { content, fileUrl: '', timeSpentMinutes });
      setSubmission(res.data.submission);
      setMessage('Đã nộp bài thành công!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setMessage('');

    const unanswered = selectedAnswers.findIndex((a) => a === null || a === undefined);
    if (unanswered >= 0) {
      setFormError(`Vui lòng chọn đáp án cho câu ${unanswered + 1}.`);
      return;
    }

    setSubmitting(true);
    const timeSpentMinutes = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    const answers = selectedAnswers.map((selectedOptionIndex, questionIndex) => ({
      questionIndex,
      selectedOptionIndex,
    }));

    try {
      const res = await submitAssignment(assignmentId, { answers, timeSpentMinutes });
      setSubmission(res.data.submission);
      setMessage('Đã nộp bài và chấm điểm tự động!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignment) return <p>Đang tải...</p>;

  return (
    <div className="space-y-4">
      <Link to="/portal/assignments" className="text-sm text-emerald-600">← Danh sách bài tập</Link>
      <h2 className="text-xl font-bold">{assignment.title}</h2>
      {isQuiz && (
        <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
          Trắc nghiệm · {assignment.questions?.length || 0} câu
        </span>
      )}
      <p className="whitespace-pre-wrap text-sm text-slate-600">{assignment.description}</p>
      <p className="text-xs text-slate-500">
        Hạn nộp: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString('vi-VN') : '—'} · Điểm tối đa: {assignment.maxScore}
      </p>

      {submission ? (
        <div className="rounded-xl border bg-emerald-50 p-4 text-sm">
          <p className="font-medium text-emerald-800">Trạng thái: {submission.status}</p>
          {isQuiz ? (
            <>
              <p className="mt-2 text-lg font-bold text-emerald-900">
                Điểm: {submission.score} / {assignment.maxScore}
              </p>
              <p className="mt-1 text-slate-700">
                Đúng {submission.correctAnswers}/{submission.totalQuestions} câu
              </p>
            </>
          ) : (
            <>
              <p className="mt-2">Bài làm: {submission.content}</p>
              {submission.score != null && (
                <p className="mt-2">Điểm: {submission.score} — {submission.feedback}</p>
              )}
            </>
          )}
        </div>
      ) : isQuiz ? (
        <form onSubmit={handleQuizSubmit} className="space-y-4">
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          {(assignment.questions || []).map((q, qIndex) => (
            <div key={qIndex} className="rounded-xl border bg-white p-5">
              <p className="mb-3 font-medium text-slate-800">
                Câu {qIndex + 1}. {q.questionText}
              </p>
              <div className="space-y-2">
                {(q.options || []).map((opt, oIndex) => (
                  <label
                    key={oIndex}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name={`q-${qIndex}`}
                      checked={selectedAnswers[qIndex] === oIndex}
                      onChange={() => handleSelectAnswer(qIndex, oIndex)}
                    />
                    <span className="font-medium text-slate-500">{OPTION_LABELS[oIndex]}.</span>
                    <span className="text-sm text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? 'Đang nộp...' : 'Nộp bài trắc nghiệm'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleTextSubmit} className="space-y-4 rounded-xl border bg-white p-5">
          <textarea
            required
            rows={8}
            placeholder="Nhập bài làm..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </form>
      )}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </div>
  );
}
