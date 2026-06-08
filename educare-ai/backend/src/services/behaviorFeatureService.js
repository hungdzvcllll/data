import { ML_FEATURE_KEYS } from '../utils/featureColumns.js';

/** Features that can be computed from platform learning behavior. */
export const BEHAVIOR_DRIVEN_FEATURES = [
  'StudyHours',
  'Resources',
  'OnlineCourses',
  'Discussions',
  'AssignmentCompletion',
  'EduTech',
  'Motivation',
  'LearningStyle',
];

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function resolveOnlineCoursesCount(behavior) {
  if (Array.isArray(behavior.completedOnlineCourses)) {
    return behavior.completedOnlineCourses.length;
  }
  if (behavior.completedOnlineCourses != null && behavior.completedOnlineCourses !== '') {
    return num(behavior.completedOnlineCourses, 0);
  }
  if (behavior.completedModulesCount != null) {
    return num(behavior.completedModulesCount, 0);
  }
  return null;
}

function computeStudyHours(behavior) {
  const totalMinutes = num(behavior.videoWatchMinutes)
    + num(behavior.assignmentWorkMinutes)
    + num(behavior.readingMinutes);
  return Math.round((totalMinutes / 60) * 10) / 10;
}

function computeResources(behavior) {
  const views = num(behavior.resourceViews)
    + num(behavior.lectureMaterialViews);
  if (views >= 10) return 2;
  if (views >= 3) return 1;
  return 0;
}

function computeDiscussions(behavior) {
  const activity = num(behavior.discussionPosts)
    + num(behavior.discussionReplies)
    + num(behavior.questionsAsked)
    + num(behavior.answersGiven);
  return activity > 0 ? 1 : 0;
}

function computeAssignmentCompletion(behavior, existingFeatures) {
  const total = num(behavior.totalAssignments);
  const submitted = num(behavior.submittedAssignments);
  if (total === 0) {
    return num(existingFeatures?.AssignmentCompletion, num(existingFeatures?.assignmentCompletion, 0));
  }
  return Math.round((submitted / total) * 100);
}

function computeMotivation(behavior) {
  const loginDaysPerWeek = num(behavior.loginDaysPerWeek);
  const totalSubmissions = num(behavior.totalSubmissions);
  const onTimeSubmissionRate = totalSubmissions > 0
    ? (num(behavior.onTimeSubmissions) / totalSubmissions) * 100
    : 0;
  const optionalLearningActivities = num(behavior.optionalLearningActivities);

  if (loginDaysPerWeek >= 5 && onTimeSubmissionRate >= 80 && optionalLearningActivities >= 2) {
    return 2;
  }
  if (loginDaysPerWeek >= 2 || onTimeSubmissionRate >= 50) {
    return 1;
  }
  return 0;
}

function computeLearningStyle(behavior) {
  const videoWatchMinutes = num(behavior.videoWatchMinutes);
  const audioListenMinutes = num(behavior.audioListenMinutes);
  const readingMinutes = num(behavior.readingMinutes);
  const kinestheticMinutes = num(behavior.practiceMinutes)
    + num(behavior.assignmentWorkMinutes);

  const maxActivity = Math.max(
    videoWatchMinutes,
    audioListenMinutes,
    readingMinutes,
    kinestheticMinutes
  );
  if (maxActivity <= 0) return null;

  if (maxActivity === videoWatchMinutes) return 0;
  if (maxActivity === audioListenMinutes) return 1;
  if (maxActivity === readingMinutes) return 2;
  return 3;
}

function hasStudyTimeData(behavior) {
  return [
    behavior.videoWatchMinutes,
    behavior.assignmentWorkMinutes,
    behavior.readingMinutes,
  ].some((v) => v != null);
}

function hasResourcesData(behavior) {
  return behavior.resourceViews != null
    || behavior.lectureMaterialViews != null
    || behavior.resourceDownloads != null;
}

function hasDiscussionsData(behavior) {
  return [
    behavior.discussionPosts,
    behavior.discussionReplies,
    behavior.questionsAsked,
    behavior.answersGiven,
  ].some((v) => v != null);
}

function hasMotivationData(behavior) {
  return [
    behavior.loginDaysPerWeek,
    behavior.onTimeSubmissions,
    behavior.totalSubmissions,
    behavior.optionalLearningActivities,
  ].some((v) => v != null);
}

function behaviorDelta(current, snapshot = {}) {
  const delta = {};
  const fields = [
    'videoWatchMinutes', 'assignmentWorkMinutes', 'readingMinutes',
    'resourceViews', 'lectureMaterialViews', 'discussionPosts', 'discussionReplies',
    'questionsAsked', 'answersGiven', 'completedModulesCount', 'eduTechUsageCount',
    'submittedAssignments', 'onTimeSubmissions', 'totalSubmissions',
    'loginDaysPerWeek', 'optionalLearningActivities', 'practiceMinutes', 'audioListenMinutes',
  ];
  for (const field of fields) {
    delta[field] = Math.max(0, num(current[field]) - num(snapshot[field]));
  }
  delta.totalAssignments = num(current.totalAssignments);
  delta.submittedAssignments = num(current.submittedAssignments);
  return delta;
}

function modulesCount(behavior) {
  return resolveOnlineCoursesCount(behavior) ?? 0;
}

/**
 * Teacher baseline + LMS activity since baseline snapshot (additive / max where appropriate).
 */
function computeFeaturesWithTeacherBaseline(behaviorObj, existingFeatures, baselines, snapshot) {
  const merged = {};
  const featureSource = {};
  const computedFeatures = {};
  const delta = behaviorDelta(behaviorObj, snapshot || {});

  for (const key of ML_FEATURE_KEYS) {
    merged[key] = num(baselines[key], num(existingFeatures[key], 0));
    featureSource[key] = 'manual';
  }

  const addedStudyHours = computeStudyHours(delta);
  if (addedStudyHours > 0) {
    merged.StudyHours = Math.round((num(baselines.StudyHours) + addedStudyHours) * 10) / 10;
    featureSource.StudyHours = 'manual+behavior';
    computedFeatures.StudyHours = merged.StudyHours;
  }

  const moduleDelta = Math.max(0, modulesCount(behaviorObj) - modulesCount(snapshot || {}));
  if (moduleDelta > 0) {
    merged.OnlineCourses = num(baselines.OnlineCourses) + moduleDelta;
    featureSource.OnlineCourses = 'manual+behavior';
    computedFeatures.OnlineCourses = merged.OnlineCourses;
  }

  const lmsCompletion = computeAssignmentCompletion(behaviorObj, existingFeatures);
  if (lmsCompletion > num(baselines.AssignmentCompletion)) {
    merged.AssignmentCompletion = lmsCompletion;
    featureSource.AssignmentCompletion = 'manual+behavior';
    computedFeatures.AssignmentCompletion = merged.AssignmentCompletion;
  }

  const lmsResources = computeResources(behaviorObj);
  if (lmsResources > num(baselines.Resources)) {
    merged.Resources = lmsResources;
    featureSource.Resources = 'manual+behavior';
    computedFeatures.Resources = merged.Resources;
  }

  const lmsDiscussions = computeDiscussions(behaviorObj);
  if (lmsDiscussions > num(baselines.Discussions)) {
    merged.Discussions = lmsDiscussions;
    featureSource.Discussions = 'manual+behavior';
    computedFeatures.Discussions = merged.Discussions;
  }

  const newEduTech = num(behaviorObj.eduTechUsageCount) > num(snapshot?.eduTechUsageCount);
  if (newEduTech && num(baselines.EduTech) < 1) {
    merged.EduTech = 1;
    featureSource.EduTech = 'manual+behavior';
    computedFeatures.EduTech = merged.EduTech;
  }

  const lmsMotivation = hasMotivationData(behaviorObj) ? computeMotivation(behaviorObj) : null;
  if (lmsMotivation != null && lmsMotivation > num(baselines.Motivation)) {
    merged.Motivation = lmsMotivation;
    featureSource.Motivation = 'manual+behavior';
    computedFeatures.Motivation = merged.Motivation;
  }

  const deltaStyle = computeLearningStyle(delta);
  if (deltaStyle != null) {
    merged.LearningStyle = deltaStyle;
    featureSource.LearningStyle = 'manual+behavior';
    computedFeatures.LearningStyle = merged.LearningStyle;
  }

  return { features: merged, featureSource, computedFeatures };
}

/**
 * Merge Excel-encoded features with behavior-derived features.
 * Teacher baselines on behavior: LMS activity adds on top after teacher edit.
 */
export function computeFeaturesFromBehavior(behavior, existingFeatures = {}, manualOverrideKeys = []) {
  const merged = {};
  const featureSource = {};
  const computedFeatures = {};
  const overrideSet = new Set(manualOverrideKeys || []);

  if (!behavior) {
    for (const key of ML_FEATURE_KEYS) {
      merged[key] = num(existingFeatures[key], 0);
      featureSource[key] = 'excel';
    }
    return { features: merged, featureSource, computedFeatures };
  }

  const behaviorObj = behavior.toObject ? behavior.toObject() : behavior;

  if (behaviorObj.teacherFeatureBaselines) {
    return computeFeaturesWithTeacherBaseline(
      behaviorObj,
      existingFeatures,
      behaviorObj.teacherFeatureBaselines,
      behaviorObj.behaviorSnapshotAtBaseline
    );
  }

  for (const key of ML_FEATURE_KEYS) {
    merged[key] = num(existingFeatures[key], 0);
    featureSource[key] = overrideSet.has(key) ? 'manual' : 'excel';
  }

  if (hasStudyTimeData(behaviorObj) && !overrideSet.has('StudyHours')) {
    merged.StudyHours = computeStudyHours(behaviorObj);
    featureSource.StudyHours = 'behavior';
    computedFeatures.StudyHours = merged.StudyHours;
  }

  if (hasResourcesData(behaviorObj) && !overrideSet.has('Resources')) {
    merged.Resources = computeResources(behaviorObj);
    featureSource.Resources = 'behavior';
    computedFeatures.Resources = merged.Resources;
  }

  const onlineCourses = resolveOnlineCoursesCount(behaviorObj);
  if (onlineCourses != null && !overrideSet.has('OnlineCourses')) {
    merged.OnlineCourses = onlineCourses;
    featureSource.OnlineCourses = 'behavior';
    computedFeatures.OnlineCourses = merged.OnlineCourses;
  }

  if (hasDiscussionsData(behaviorObj) && !overrideSet.has('Discussions')) {
    merged.Discussions = computeDiscussions(behaviorObj);
    featureSource.Discussions = 'behavior';
    computedFeatures.Discussions = merged.Discussions;
  }

  if (
    (behaviorObj.totalAssignments != null || behaviorObj.submittedAssignments != null)
    && !overrideSet.has('AssignmentCompletion')
  ) {
    merged.AssignmentCompletion = computeAssignmentCompletion(behaviorObj, existingFeatures);
    featureSource.AssignmentCompletion = 'behavior';
    computedFeatures.AssignmentCompletion = merged.AssignmentCompletion;
  }

  if (behaviorObj.eduTechUsageCount != null && !overrideSet.has('EduTech')) {
    merged.EduTech = num(behaviorObj.eduTechUsageCount) > 0 ? 1 : 0;
    featureSource.EduTech = 'behavior';
    computedFeatures.EduTech = merged.EduTech;
  }

  if (hasMotivationData(behaviorObj) && !overrideSet.has('Motivation')) {
    merged.Motivation = computeMotivation(behaviorObj);
    featureSource.Motivation = 'behavior';
    computedFeatures.Motivation = merged.Motivation;
  }

  const learningStyle = computeLearningStyle(behaviorObj);
  if (learningStyle != null && !overrideSet.has('LearningStyle')) {
    merged.LearningStyle = learningStyle;
    featureSource.LearningStyle = 'behavior';
    computedFeatures.LearningStyle = merged.LearningStyle;
  }

  return { features: merged, featureSource, computedFeatures };
}

export function getBehaviorSummary(behavior, existingFeatures = null) {
  if (!behavior) return null;
  const b = behavior.toObject ? behavior.toObject() : behavior;

  const raw = {
    totalStudyHours: computeStudyHours(b),
    videoWatchMinutes: num(b.videoWatchMinutes),
    assignmentWorkMinutes: num(b.assignmentWorkMinutes),
    readingMinutes: num(b.readingMinutes),
    resourceViews: num(b.resourceViews) + num(b.lectureMaterialViews),
    resourceDownloads: num(b.resourceDownloads),
    discussionActivity: num(b.discussionPosts)
      + num(b.discussionReplies)
      + num(b.questionsAsked)
      + num(b.answersGiven),
    onlineCoursesCompleted: resolveOnlineCoursesCount(b) ?? 0,
    assignmentCompletion: computeAssignmentCompletion(b, existingFeatures || {}),
    eduTechUsageCount: num(b.eduTechUsageCount),
    inferredMotivation: hasMotivationData(b) ? computeMotivation(b) : null,
    inferredLearningStyle: computeLearningStyle(b),
    updatedAt: b.updatedAt,
    hasTeacherBaseline: Boolean(b.teacherFeatureBaselines),
    teacherBaselineAt: b.teacherBaselineAt,
  };

  if (b.teacherFeatureBaselines && existingFeatures) {
    const { features } = computeFeaturesWithTeacherBaseline(
      b,
      existingFeatures,
      b.teacherFeatureBaselines,
      b.behaviorSnapshotAtBaseline
    );
    return {
      ...raw,
      effectiveStudyHours: features.StudyHours,
      effectiveAssignmentCompletion: features.AssignmentCompletion,
      effectiveOnlineCourses: features.OnlineCourses,
      effectiveResources: features.Resources,
      effectiveDiscussions: features.Discussions,
    };
  }

  return raw;
}
