import api from './api';

export function getLearningBehavior(studentId) {
  return api.get(`/learning-behavior/${studentId}`);
}

export function saveLearningBehavior(studentId, payload) {
  return api.post(`/learning-behavior/${studentId}`, payload);
}

export function getComputedFeatures(studentId) {
  return api.get(`/learning-behavior/${studentId}/computed-features`);
}

export function repredictWithBehavior(studentId, payload) {
  return api.post(`/learning-behavior/${studentId}/repredict`, payload || {});
}

export function repredictStudent(studentId) {
  return api.post(`/predictions/student/${studentId}/repredict`);
}
