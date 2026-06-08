import StudentLearningBehavior from '../models/StudentLearningBehavior.js';
import { getOrCreateBehavior } from './behaviorSyncService.js';
import { ML_FEATURE_KEYS } from '../utils/featureColumns.js';

const SNAPSHOT_FIELDS = [
  'videoWatchMinutes',
  'assignmentWorkMinutes',
  'readingMinutes',
  'resourceViews',
  'lectureMaterialViews',
  'resourceDownloads',
  'discussionPosts',
  'discussionReplies',
  'questionsAsked',
  'answersGiven',
  'completedModulesCount',
  'eduTechUsageCount',
  'submittedAssignments',
  'onTimeSubmissions',
  'totalSubmissions',
  'loginDaysPerWeek',
  'optionalLearningActivities',
  'practiceMinutes',
  'audioListenMinutes',
];

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function snapshotBehaviorCounters(behavior) {
  const snap = {};
  for (const field of SNAPSHOT_FIELDS) {
    snap[field] = num(behavior[field]);
  }
  snap.completedModulesCount = num(behavior.completedModulesCount);
  return snap;
}

/** Save teacher-edited features as baseline; further LMS activity adds on top. */
export async function applyTeacherFeatureBaselines(studentId, encodedFeatures) {
  const behavior = await getOrCreateBehavior(studentId);
  const ordered = {};
  for (const key of ML_FEATURE_KEYS) {
    ordered[key] = num(encodedFeatures[key], 0);
  }

  behavior.teacherFeatureBaselines = ordered;
  behavior.behaviorSnapshotAtBaseline = snapshotBehaviorCounters(behavior);
  behavior.teacherBaselineAt = new Date();
  await behavior.save();
  return behavior;
}

export function buildBehaviorDelta(current, snapshot = {}) {
  const delta = {};
  for (const field of SNAPSHOT_FIELDS) {
    delta[field] = Math.max(0, num(current[field]) - num(snapshot[field]));
  }
  delta.totalAssignments = num(current.totalAssignments);
  delta.submittedAssignments = num(current.submittedAssignments);
  return delta;
}
