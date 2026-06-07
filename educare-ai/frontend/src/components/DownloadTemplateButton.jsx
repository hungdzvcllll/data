import { useState } from 'react';
import { downloadUploadTemplate } from '../services/uploadService';

export default function DownloadTemplateButton({ className = '' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      await downloadUploadTemplate();
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được template. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 ${className}`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 6l-4-4-4 4m4-4v12" />
        </svg>
        {loading ? 'Đang tải...' : 'Download Excel Template'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
