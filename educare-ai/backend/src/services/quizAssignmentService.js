import { AppError } from '../middlewares/errorHandler.js';

export function validateQuizQuestions(questions) {
  const errors = [];

  if (!Array.isArray(questions) || questions.length === 0) {
    return ['Cần ít nhất 1 câu hỏi trắc nghiệm.'];
  }

  questions.forEach((q, qi) => {
    const n = qi + 1;
    const text = String(q.questionText || '').trim();
    if (!text) errors.push(`Câu ${n}: thiếu nội dung câu hỏi.`);

    const options = (q.options || []).map((o) => String(o || '').trim()).filter(Boolean);
    if (options.length < 2) {
      errors.push(`Câu ${n}: cần ít nhất 2 đáp án.`);
    }

    const correct = Number(q.correctOptionIndex);
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
      errors.push(`Câu ${n}: phải chọn đúng 1 đáp án đúng.`);
    }
  });

  return errors;
}

export function normalizeQuizQuestions(questions) {
  return questions.map((q) => {
    const options = (q.options || []).map((o) => String(o).trim()).filter(Boolean);
    return {
      questionText: String(q.questionText).trim(),
      options,
      correctOptionIndex: Number(q.correctOptionIndex),
    };
  });
}

export function validateStudentQuizAnswers(assignment, answers) {
  const errors = [];
  const total = assignment.questions?.length || 0;

  if (!Array.isArray(answers) || answers.length !== total) {
    return [`Phải trả lời đủ ${total} câu hỏi.`];
  }

  answers.forEach((ans, qi) => {
    const n = qi + 1;
    const qIndex = Number(ans.questionIndex);
    const selected = Number(ans.selectedOptionIndex);

    if (qIndex !== qi) {
      errors.push(`Câu ${n}: thứ tự câu trả lời không hợp lệ.`);
    }

    const optionCount = assignment.questions[qi]?.options?.length || 0;
    if (!Number.isInteger(selected) || selected < 0 || selected >= optionCount) {
      errors.push(`Câu ${n}: phải chọn 1 đáp án.`);
    }
  });

  return errors;
}

export function gradeQuizSubmission(assignment, answers) {
  const totalQuestions = assignment.questions.length;
  let correctAnswers = 0;

  answers.forEach((ans, qi) => {
    const question = assignment.questions[qi];
    if (Number(ans.selectedOptionIndex) === question.correctOptionIndex) {
      correctAnswers += 1;
    }
  });

  const maxScore = Number(assignment.maxScore) || 100;
  const score = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * maxScore * 100) / 100
    : 0;

  return { correctAnswers, totalQuestions, score };
}

/** Hide correct answers from students. */
export function sanitizeAssignmentForStudent(assignment) {
  const obj = assignment.toObject ? assignment.toObject() : { ...assignment };

  if (obj.assignmentType === 'quiz' && Array.isArray(obj.questions)) {
    obj.questions = obj.questions.map(({ questionText, options }) => ({
      questionText,
      options,
    }));
  }

  return obj;
}

export function assertQuizAssignment(data) {
  if (data.assignmentType === 'quiz' || (data.questions && data.questions.length)) {
    const errors = validateQuizQuestions(data.questions || []);
    if (errors.length) {
      throw new AppError(errors.join(' '), 400);
    }
  }
}
