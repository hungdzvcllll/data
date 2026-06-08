import { useEffect, useState } from 'react';
import { getMyProfile } from '../../services/api';

export default function PortalSuggestionsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getMyProfile().then((res) => setData(res.data));
  }, []);

  if (!data) return <p>Đang tải...</p>;

  const actions = data.latestPrediction?.recommendedActions || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Gợi ý học tập</h2>
      <div className="rounded-xl border bg-white p-6">
        {actions.length ? (
          <ul className="list-disc space-y-2 pl-5 text-sm text-emerald-900">
            {actions.map((a) => <li key={a}>{a}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Tiếp tục duy trì thói quen học tập hiện tại. Học trên LMS để hệ thống cập nhật gợi ý chính xác hơn.</p>
        )}
      </div>
    </div>
  );
}
