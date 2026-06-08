import api from './api';

async function downloadBlob(path, filename) {
  const res = await api.get(path, { responseType: 'blob' });
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadUploadTemplate() {
  return downloadBlob('/uploads/template', 'educare_student_upload_template.xlsx');
}

export async function downloadRosterTemplate() {
  return downloadBlob('/uploads/template/roster', 'educare_student_roster_template.xlsx');
}

/** @deprecated Same as roster template (10 columns merged) */
export async function downloadExternalProfileTemplate() {
  return downloadRosterTemplate();
}

export function uploadClassData(formData, uploadMode = 'full') {
  formData.append('uploadMode', uploadMode);
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
