import { runUploadPrediction } from './uploadService';

export async function runPredictionForUpload(uploadId) {
  const res = await runUploadPrediction(uploadId);
  return res.data;
}
