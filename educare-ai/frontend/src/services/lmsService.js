import api from './api';

const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function mediaFullUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

// Teacher — courses
export const getCourses = () => api.get('/courses');
export const createCourse = (data) => api.post('/courses', data);
export const getCourse = (id) => api.get(`/courses/${id}`);
export const updateCourse = (id, data) => api.patch(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
export const publishCourse = (id) => api.post(`/courses/${id}/publish`);

// Lectures
export const getCourseLectures = (courseId) => api.get(`/courses/${courseId}/lectures`);
export const createLecture = (courseId, data) => api.post(`/courses/${courseId}/lectures`, data);
export const updateLecture = (id, data) => api.patch(`/lectures/${id}`, data);
export const deleteLecture = (id) => api.delete(`/lectures/${id}`);

// Resources
export const getCourseResources = (courseId) => api.get(`/courses/${courseId}/resources`);
export const createResource = (courseId, data) => api.post(`/courses/${courseId}/resources`, data);
export const updateResource = (id, data) => api.patch(`/resources/${id}`, data);
export const deleteResource = (id) => api.delete(`/resources/${id}`);

// Assignments (teacher)
export const getCourseAssignments = (courseId) => api.get(`/courses/${courseId}/assignments`);
export const createAssignment = (courseId, data) => api.post(`/courses/${courseId}/assignments`, data);
export const updateAssignment = (id, data) => api.patch(`/assignments/${id}`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);
export const publishAssignment = (id) => api.post(`/assignments/${id}/publish`);
export const getAssignmentSubmissions = (id) => api.get(`/assignments/${id}/submissions`);
export const gradeSubmission = (id, data) => api.patch(`/submissions/${id}/grade`, data);

export const uploadMedia = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/courses/upload/media', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getLearningMonitor = (params) => api.get('/learning-monitor', { params });

// Student portal
export const getPortalCourses = () => api.get('/portal/courses');
export const getPortalCourse = (id) => api.get(`/portal/courses/${id}`);
export const getPortalLecture = (id) => api.get(`/portal/lectures/${id}`);
export const getPortalResource = (id) => api.get(`/portal/resources/${id}`);
export const getPortalAssignments = () => api.get('/portal/assignments');
export const getPortalAssignment = (id) => api.get(`/portal/assignments/${id}`);
export const getPortalProgress = () => api.get('/portal/progress');
export const portalRepredict = () => api.post('/portal/repredict');

// Learning events
export const trackVideoProgress = (data) => api.post('/learning-events/video-progress', data);
export const trackResourceView = (data) => api.post('/learning-events/resource-view', data);
export const trackCourseOpen = (courseId) => api.post('/learning-events/course-open', { courseId });
export const trackAssignmentStart = (assignmentId) => api.post('/learning-events/assignment-start', { assignmentId });
export const submitAssignment = (assignmentId, data) => api.post(`/assignments/${assignmentId}/submit`, data);
export const postDiscussion = (courseId, content, parentId = null) =>
  api.post(`/portal/courses/${courseId}/discussions`, { content, parentId });
export const getPortalDiscussions = (courseId) => api.get(`/portal/courses/${courseId}/discussions`);
