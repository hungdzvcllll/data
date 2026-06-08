import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { featureDocToMl } from '../utils/featureColumns.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const ML_SCRIPT = process.env.ML_SCRIPT_PATH
  ? path.resolve(process.env.ML_SCRIPT_PATH)
  : path.join(__dirname, '../../ml/predict.py');
const PREDICTION_TIMEOUT_MS = Number(process.env.PREDICTION_TIMEOUT_MS || 60000);

/**
 * Invoke Python predict.py with JSON payload via stdin.
 */
function runPythonPrediction(payload) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_PATH, [ML_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
    }, PREDICTION_TIMEOUT_MS);

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start Python: ${err.message}`));
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`Python prediction timed out after ${PREDICTION_TIMEOUT_MS}ms`));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim() || '{}');
        if (code !== 0 || result.success === false || result.error) {
          reject(new Error(result.message || result.error || stderr || `Python exited with code ${code}`));
          return;
        }
        resolve(result);
      } catch {
        reject(new Error(stderr || stdout || 'Invalid JSON from Python script'));
      }
    });

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
}

export async function predictSingle(features) {
  const mlFeatures = typeof features.studyHours !== 'undefined'
    ? featureDocToMl(features)
    : features;

  const result = await runPythonPrediction({ features: mlFeatures });
  return result.predictedScore;
}

export async function predictBatch(items) {
  const records = items.map((item) => {
    if (item.features && item.features.StudyHours !== undefined) {
      return {
        studentCode: item.studentCode ?? item.student?.studentCode,
        studentId: item.studentId?.toString() ?? item.student?._id?.toString(),
        features: item.features,
      };
    }

    const merged = item.featureDoc?.toObject
      ? item.featureDoc.toObject()
      : item.features;
    const mlFeatures = merged?.encodedFeatures
      ? featureDocToMl(merged)
      : (merged.studyHours !== undefined ? featureDocToMl(merged) : merged);

    return {
      studentCode: item.studentCode ?? item.student?.studentCode,
      studentId: item.studentId?.toString() ?? item.student?._id?.toString(),
      features: mlFeatures,
    };
  });

  const result = await runPythonPrediction({ records });
  return result.predictions;
}
