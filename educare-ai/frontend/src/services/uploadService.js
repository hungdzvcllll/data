import api from './api';

export async function downloadUploadTemplate() {
  const res = await api.get('/uploads/template', { responseType: 'blob' });
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'educare_student_upload_template.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function uploadClassData(formData) {
  return api.post('/uploads/class-data', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function getUploadPreview(uploadId) {
  return api.get(`/uploads/${uploadId}/preview`);
}

export function runUploadPrediction(uploadId) {
  return api.post(`/uploads/${uploadId}/run-prediction`);
}
