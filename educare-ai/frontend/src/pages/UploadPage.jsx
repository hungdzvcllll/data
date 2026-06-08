import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getClasses } from '../services/api';
import { uploadClassData, downloadUploadTemplate, downloadRosterTemplate } from '../services/uploadService';
import { runPredictionForUpload } from '../services/predictionService';
import FileUploadBox from '../components/FileUploadBox';
import DataPreviewTable from '../components/DataPreviewTable';
import ValidationErrorTable from '../components/ValidationErrorTable';
import RiskBadge from '../components/RiskBadge';
import { formatScore } from '../utils/constants';

const MODES = {
  roster: {
    label: 'Import sinh viên',
    title: 'Import sinh viên (10 cột)',
    description:
      'Một file gồm danh sách lớp (StudentID, Name, Email, Class) và 6 trường ngoài LMS. Upload một lần → hệ thống tự import, tạo tài khoản và chạy dự đoán. Cột Class phải trùng lớp đã chọn trên form.',
    download: downloadRosterTemplate,
    downloadLabel: 'Tải template (10 cột)',
    uploadLabel: 'Upload & Import sinh viên',
    autoImport: true,
  },
  full: {
    label: 'Upload đầy đủ',
    title: 'Upload đầy đủ 14 features',
    description: 'Dùng khi đã có sẵn toàn bộ dữ liệu khảo sát và hành vi trong một file Excel.',
    download: downloadUploadTemplate,
    downloadLabel: 'Tải template đầy đủ',
    uploadLabel: 'Upload & Validate',
    runLabel: 'Run Prediction',
    autoImport: false,
  },
};

const BEHAVIOR_FEATURES = [
  'StudyHours', 'Resources', 'OnlineCourses', 'Discussions',
  'AssignmentCompletion', 'EduTech', 'Motivation', 'LearningStyle',
];

const EXTERNAL_FEATURES = [
  'Gender', 'Age', 'Attendance', 'Internet', 'Extracurricular', 'StressLevel',
];

const ROSTER_COLUMNS = [
  'StudentID', 'Name', 'Email', 'Class', ...EXTERNAL_FEATURES,
];

export default function UploadPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [uploadMode, setUploadMode] = useState('roster');
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(searchParams.get('classId') || '');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadId, setUploadId] = useState('');
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [results, setResults] = useState([]);
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [accountRules, setAccountRules] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const modeConfig = MODES[uploadMode];

  useEffect(() => {
    getClasses().then((res) => setClasses(res.data.classes || []));
  }, []);

  const resetUploadState = () => {
    setPreview([]);
    setErrors([]);
    setSuccessMessage('');
    setResults([]);
    setStudentAccounts([]);
    setAccountRules(null);
    setUploadId('');
  };

  const handleModeChange = (mode) => {
    setUploadMode(mode);
    setFile(null);
    resetUploadState();
  };

  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      await modeConfig.download();
    } catch (err) {
      setErrors([err.response?.data?.message || 'Không tải được template']);
    } finally {
      setDownloadLoading(false);
    }
  };

  const applyImportResult = (data) => {
    setResults(data.predictions || []);
    setStudentAccounts(data.studentAccounts || []);
    setAccountRules({
      passwordRule: data.passwordRule,
      emailRule: data.emailRule,
    });
    setSuccessMessage(data.message || `Đã xử lý ${data.count} sinh viên.`);
    setTimeout(() => {
      navigate('/students', { state: { uploadSuccess: true, message: data.message, classId } });
    }, 2500);
  };

  const handleUpload = async () => {
    if (!classId || !file) return;
    setLoading(true);
    if (!modeConfig.autoImport) setPredicting(false);
    resetUploadState();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('classId', classId);
      const res = await uploadClassData(formData, uploadMode);
      setUploadId(res.data.uploadId);
      setPreview(res.data.preview || []);

      if (modeConfig.autoImport && res.data.imported) {
        applyImportResult(res.data);
      } else if (modeConfig.autoImport) {
        setSuccessMessage(res.data.message || 'Upload thành công');
      }
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors || [data?.message || 'Upload thất bại']);
      if (data?.uploadId) setUploadId(data.uploadId);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!uploadId) return;
    setPredicting(true);
    setErrors([]);
    setSuccessMessage('');

    try {
      const data = await runPredictionForUpload(uploadId);
      applyImportResult(data);
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors || [data?.message || 'Xử lý thất bại']);
    } finally {
      setPredicting(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  const newAccounts = studentAccounts.filter((a) => a.isNewAccount && a.password);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload dữ liệu sinh viên</h2>
        <p className="mt-1 text-sm text-slate-500">
          Template chính: <strong>10 cột Excel</strong> (4 danh sách + 6 ngoài LMS) · <strong>8 trường</strong> còn lại tự thu từ LMS
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm">
          <p className="font-medium text-emerald-900">Tự thu từ LMS (8) — không cần Excel</p>
          <p className="mt-1 text-emerald-800">{BEHAVIOR_FEATURES.join(', ')}</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-900">Trong file Excel (6) — cột 5–10, tùy chọn</p>
          <p className="mt-1 text-amber-800">{EXTERNAL_FEATURES.join(', ')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {Object.entries(MODES).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleModeChange(key)}
            className={`rounded-lg px-4 py-2 text-sm ${
              uploadMode === key ? 'bg-emerald-600 text-white' : 'bg-white border hover:bg-slate-50'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">{modeConfig.title}</p>
        <p className="mt-1">{modeConfig.description}</p>
        {uploadMode === 'roster' && (
          <>
            <p className="mt-2 font-medium">10 cột template:</p>
            <p className="mt-1 font-mono text-xs">{ROSTER_COLUMNS.join(' · ')}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Chọn đúng lớp trên form — cột Class trong Excel phải khớp tên lớp đó</li>
              <li>Bấm <strong>Upload & Import sinh viên</strong> — một bước: import + tài khoản + dự đoán</li>
              <li>Sinh viên học LMS → repredict khi cần cập nhật 8 trường hành vi</li>
            </ol>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloadLoading}
          className="rounded-lg border border-emerald-600 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
        >
          {downloadLoading ? 'Đang tải...' : modeConfig.downloadLabel}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Chọn lớp học</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-lg border px-3 py-2">
            <option value="">-- Chọn lớp --</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.className} - {c.courseName}</option>
            ))}
          </select>
        </div>
      </div>

      <FileUploadBox
        file={file}
        onFileChange={setFile}
        dragOver={dragOver}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      />

      <ValidationErrorTable errors={errors} />

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || predicting || !file || !classId}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-white disabled:opacity-50"
        >
          {loading
            ? (modeConfig.autoImport ? 'Đang import & dự đoán...' : 'Đang upload & validate...')
            : modeConfig.uploadLabel}
        </button>
        {!modeConfig.autoImport && (
          <button
            type="button"
            onClick={handlePredict}
            disabled={predicting || loading || !uploadId || preview.length === 0}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
          >
            {predicting ? 'Đang chạy dự đoán...' : modeConfig.runLabel}
          </button>
        )}
      </div>

      {(loading || predicting) && modeConfig.autoImport && (
        <div className="flex items-center gap-3 rounded-lg border bg-white p-4 text-sm text-slate-600">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          Đang import sinh viên, tạo tài khoản và chạy dự đoán…
        </div>
      )}

      <DataPreviewTable rows={preview} />

      {studentAccounts.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
          <h3 className="mb-1 font-semibold text-emerald-800">
            Tài khoản sinh viên ({newAccounts.length} mới / {studentAccounts.length} tổng)
          </h3>
          {accountRules && (
            <p className="mb-3 text-xs text-slate-500">
              Mật khẩu mặc định: {accountRules.passwordRule?.replace('{studentCode}', 'SV00X')}
            </p>
          )}
          <div className="max-h-80 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">MSSV</th>
                  <th className="px-3 py-2">Họ tên</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Mật khẩu</th>
                </tr>
              </thead>
              <tbody>
                {studentAccounts.map((a) => (
                  <tr key={a.studentCode} className="border-t">
                    <td className="px-3 py-2 font-mono">{a.studentCode}</td>
                    <td className="px-3 py-2">{a.fullName}</td>
                    <td className="px-3 py-2">{a.email || '—'}</td>
                    <td className="px-3 py-2 font-mono text-emerald-700">{a.password || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Kết quả ({results.length})</h3>
          <div className="space-y-2">
            {results.slice(0, 10).map((r) => (
              <div key={r.studentCode} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm">
                <span>{r.studentCode} - {r.fullName}</span>
                <span className="font-medium">{formatScore(r.predictedScore)}</span>
                <RiskBadge level={r.riskLevel} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
