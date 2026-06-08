import StudentLearningBehavior from '../models/StudentLearningBehavior.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import LectureProgress from '../models/LectureProgress.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';

export async function getOrCreateBehavior(studentId) {
  let behavior = await StudentLearningBehavior.findOne({ studentId });
  if (!behavior) {
    behavior = await StudentLearningBehavior.create({ studentId });
  }
  return behavior;
}

/** Sync assignment counts from LMS data for accurate AssignmentCompletion. */
export async function syncAssignmentBehavior(studentId) {
  const student = await Student.findById(studentId);
  if (!student) return null;

  const behavior = await getOrCreateBehavior(studentId);
  const totalAssignments = await Assignment.countDocuments({
    classId: student.classId,
    status: 'published',
  });

  const submissions = await Submission.find({ studentId });
  const submittedAssignments = submissions.length;
  const assignmentWorkMinutes = submissions.reduce(
    (sum, s) => sum + (s.timeSpentMinutes || 0),
    0
  );
  const onTimeSubmissions = submissions.filter((s) => s.status !== 'late').length;
  const totalSubmissions = submissions.length;

  behavior.totalAssignments = totalAssignments;
  behavior.submittedAssignments = submittedAssignments;
  behavior.assignmentWorkMinutes = assignmentWorkMinutes;
  behavior.onTimeSubmissions = onTimeSubmissions;
  behavior.totalSubmissions = totalSubmissions;
  behavior.lastActivityAt = new Date();
  await behavior.save();
  return behavior;
}

export async function syncModuleProgress(studentId) {
  const behavior = await getOrCreateBehavior(studentId);
  const completedModulesCount = await LectureProgress.countDocuments({
    studentId,
    completed: true,
  });
  const completedCourses = await Course.countDocuments({ status: 'published' });
  behavior.completedModulesCount = completedModulesCount;
  behavior.completedOnlineCourses = completedModulesCount;
  behavior.lastActivityAt = new Date();
  await behavior.save();
  return behavior;
}

export async function touchBehavior(studentId, updates = {}) {
  const behavior = await getOrCreateBehavior(studentId);
  Object.assign(behavior, updates);
  behavior.lastActivityAt = new Date();
  await behavior.save();
  return behavior;
}

export async function incrementBehavior(studentId, increments) {
  const behavior = await getOrCreateBehavior(studentId);
  for (const [key, value] of Object.entries(increments)) {
    if (typeof value === 'number') {
      behavior[key] = (behavior[key] || 0) + value;
    }
  }
  behavior.lastActivityAt = new Date();
  await behavior.save();
  return behavior;
}
