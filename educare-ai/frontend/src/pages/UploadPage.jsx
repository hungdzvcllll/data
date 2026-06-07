import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getClasses } from '../services/api';
import { uploadClassData } from '../services/uploadService';
import { runPredictionForUpload } from '../services/predictionService';
import DownloadTemplateButton from '../components/DownloadTemplateButton';
import FileUploadBox from '../components/FileUploadBox';
import DataPreviewTable from '../components/DataPreviewTable';
import ValidationErrorTable from '../components/ValidationErrorTable';
import RiskBadge from '../components/RiskBadge';

export default function UploadPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  };

  const handleUpload = async () => {
    if (!classId || !file) return;
    setLoading(true);
    resetUploadState();
    setUploadId('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('classId', classId);
      const res = await uploadClassData(formData);
      setUploadId(res.data.uploadId);
      setPreview(res.data.preview || []);
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors || [data?.message || 'Upload thất bại']);
      if (data?.uploadId) setUploadId(data.uploadId);
      setPreview([]);
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
      setResults(data.predictions || []);
      setStudentAccounts(data.studentAccounts || []);
      setAccountRules({
        passwordRule: data.passwordRule,
        emailRule: data.emailRule,
      });
      setSuccessMessage(data.message || `Đã dự đoán cho ${data.count} sinh viên.`);

      setTimeout(() => {
        navigate('/students', {
          state: {
            uploadSuccess: true,
            message: data.message,
            classId,
          },
        });
      }, 2500);
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors || [data?.message || 'Dự đoán thất bại']);
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Upload dữ liệu sinh viên</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tải template Excel, nhập dữ liệu bằng chữ dễ hiểu, upload và chạy dự đoán ML
          </p>
        </div>
        <DownloadTemplateButton />
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Hướng dẫn nhanh</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Bấm <strong>Download Excel Template</strong> — sheet <strong>StudentData</strong> + hướng dẫn cột</li>
          <li>Nhập giá trị chữ: Gender (Male/Female), Resources (Low/Medium/High), Yes/No, …</li>
          <li>Chọn lớp, upload file — hệ thống validate và hiển thị preview</li>
          <li>Bấm <strong>Run Prediction</strong> — tự tạo tài khoản sinh viên (mật khẩu: {'{StudentID}@Educare'})</li>
        </ol>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Chọn lớp học</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.className} - {c.courseName}
              </option>
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
          <p className="mt-1 text-emerald-700">Đang chuyển sang danh sách sinh viên có nguy cơ…</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !file || !classId}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Đang upload & validate...' : 'Upload & Validate'}
        </button>
        <button
          type="button"
          onClick={handlePredict}
          disabled={predicting || !uploadId || preview.length === 0}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
        >
          {predicting ? 'Đang chạy dự đoán...' : 'Run Prediction'}
        </button>
        {results.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="rounded-lg border px-5 py-2 hover:bg-slate-50"
          >
            Xem danh sách rủi ro ngay
          </button>
        )}
      </div>

      {predicting && (
        <div className="flex items-center gap-3 rounded-lg border bg-white p-4 text-sm text-slate-600">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Đang gọi model ML, lưu dữ liệu và tạo tài khoản sinh viên…
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
                  <th className="px-3 py-2">Email đăng nhập</th>
                  <th className="px-3 py-2">Mật khẩu</th>
                  <th className="px-3 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {studentAccounts.map((a) => (
                  <tr key={a.studentCode} className="border-t">
                    <td className="px-3 py-2 font-mono">{a.studentCode}</td>
                    <td className="px-3 py-2">{a.fullName}</td>
                    <td className="px-3 py-2">{a.email || '—'}</td>
                    <td className="px-3 py-2 font-mono text-emerald-700">
                      {a.password || (a.isNewAccount ? '—' : 'Đã có sẵn')}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {a.error ? (
                        <span className="text-red-600">{a.error}</span>
                      ) : a.isNewAccount ? (
                        <span className="text-emerald-600">Mới tạo</span>
                      ) : (
                        <span className="text-slate-500">Đã liên kết</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Kết quả dự đoán ({results.length} sinh viên)</h3>
          <div className="space-y-2">
            {results.slice(0, 10).map((r) => (
              <div
                key={r.studentCode}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm"
              >
                <span>{r.studentCode} - {r.fullName}</span>
                <span className="font-medium">{r.predictedScore?.toFixed?.(1) ?? r.predictedScore}</span>
                <RiskBadge level={r.riskLevel} />
              </div>
            ))}
            {results.length > 10 && (
              <p className="text-xs text-slate-400">… và {results.length - 10} sinh viên khác</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
