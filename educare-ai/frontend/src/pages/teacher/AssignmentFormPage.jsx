import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createAssignment } from '../../services/lmsService';

const OPTION_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function createEmptyQuestion() {
  return { questionText: '', options: ['', ''], correctOptionIndex: 0 };
}

function validateQuizForm(title, questions) {
  const errors = [];
  if (!title.trim()) errors.push('Tiêu đề bài tập là bắt buộc.');
  if (!questions.length) errors.push('Cần ít nhất 1 câu hỏi.');

  questions.forEach((q, qi) => {
    const n = qi + 1;
    if (!q.questionText.trim()) errors.push(`Câu ${n}: nhập nội dung câu hỏi.`);
    const filled = q.options.map((o) => o.trim()).filter(Boolean);
    if (filled.length < 2) errors.push(`Câu ${n}: cần ít nhất 2 đáp án.`);
    if (
      !Number.isInteger(q.correctOptionIndex)
      || q.correctOptionIndex < 0
      || q.correctOptionIndex >= filled.length
    ) {
      errors.push(`Câu ${n}: chọn 1 đáp án đúng.`);
    }
  });

  return errors;
}

export default function AssignmentFormPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [meta, setMeta] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    status: 'draft',
  });
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [error, setError] = useState('');

  const updateQuestion = (qIndex, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === qIndex ? { ...q, ...patch } : q)));
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (qIndex) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
  };

  const addOption = (qIndex) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIndex) return q;
      if (q.options.length >= 6) return q;
      return { ...q, options: [...q.options, ''] };
    }));
  };

  const removeOption = (qIndex, oIndex) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIndex) return q;
      if (q.options.length <= 2) return q;
      const options = q.options.filter((_, j) => j !== oIndex);
      let correctOptionIndex = q.correctOptionIndex;
      if (correctOptionIndex === oIndex) correctOptionIndex = 0;
      else if (correctOptionIndex > oIndex) correctOptionIndex -= 1;
      if (correctOptionIndex >= options.length) correctOptionIndex = 0;
      return { ...q, options, correctOptionIndex };
    }));
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const options = [...q.options];
      options[oIndex] = value;
      return { ...q, options };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateQuizForm(meta.title, questions);
    if (errors.length) {
      setError(errors.join(' '));
      return;
    }

    const payload = {
      ...meta,
      maxScore: Number(meta.maxScore) || 100,
      assignmentType: 'quiz',
      questions: questions.map((q) => {
        const options = q.options.map((o) => o.trim()).filter(Boolean);
        return {
          questionText: q.questionText.trim(),
          options,
          correctOptionIndex: q.correctOptionIndex,
        };
      }),
    };

    try {
      await createAssignment(courseId, payload);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi tạo bài tập');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <Link to={`/courses/${courseId}`} className="text-sm text-emerald-600">← Quay lại khóa học</Link>
      <h2 className="text-2xl font-bold">Tạo bài tập trắc nghiệm</h2>
      <p className="text-sm text-slate-500">Mỗi câu chỉ có 1 đáp án đúng. Hệ thống tự chấm điểm khi sinh viên nộp.</p>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-xl border bg-white p-6">
          <h3 className="font-semibold">Thông tin bài tập</h3>
          <input
            required
            placeholder="Tiêu đề bài tập *"
            value={meta.title}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            className="w-full rounded-lg border px-3 py-2"
          />
          <textarea
            placeholder="Mô tả / hướng dẫn"
            value={meta.description}
            onChange={(e) => setMeta({ ...meta, description: e.target.value })}
            className="w-full rounded-lg border px-3 py-2"
            rows={3}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs text-slate-500">Hạn nộp</label>
              <input
                type="datetime-local"
                value={meta.dueDate}
                onChange={(e) => setMeta({ ...meta, dueDate: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Điểm tối đa</label>
              <input
                type="number"
                min={1}
                value={meta.maxScore}
                onChange={(e) => setMeta({ ...meta, maxScore: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Trạng thái</label>
              <select
                value={meta.status}
                onChange={(e) => setMeta({ ...meta, status: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                <option value="draft">Nháp</option>
                <option value="published">Công bố ngay</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Câu hỏi trắc nghiệm</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50"
            >
              + Thêm câu hỏi
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div key={qIndex} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <label className="text-sm font-medium text-slate-700">Câu {qIndex + 1}</label>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Xóa câu
                  </button>
                )}
              </div>
              <textarea
                placeholder="Nội dung câu hỏi *"
                value={q.questionText}
                onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
                className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
                rows={2}
              />

              <p className="mb-2 text-xs text-slate-500">Chọn radio là đáp án đúng duy nhất</p>
              <div className="space-y-2">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={q.correctOptionIndex === oIndex}
                      onChange={() => updateQuestion(qIndex, { correctOptionIndex: oIndex })}
                      title="Đáp án đúng"
                    />
                    <span className="w-6 text-sm font-medium text-slate-500">
                      {OPTION_LABELS[oIndex]}.
                    </span>
                    <input
                      placeholder={`Đáp án ${OPTION_LABELS[oIndex]}`}
                      value={opt}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {q.options.length < 6 && (
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="mt-3 text-sm text-emerald-600 hover:underline"
                >
                  + Thêm đáp án
                </button>
              )}
            </div>
          ))}
        </section>

        <button type="submit" className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700">
          Lưu bài tập trắc nghiệm
        </button>
      </form>
    </div>
  );
}
