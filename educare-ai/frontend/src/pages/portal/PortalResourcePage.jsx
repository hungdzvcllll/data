import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPortalResource, mediaFullUrl, trackResourceView } from '../../services/lmsService';

export default function PortalResourcePage() {
  const { resourceId } = useParams();
  const [resource, setResource] = useState(null);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    getPortalResource(resourceId).then((res) => setResource(res.data.resource));
  }, [resourceId]);

  useEffect(() => {
    if (resource && !tracked) {
      trackResourceView({ resourceId }).then(() => setTracked(true)).catch(() => {});
    }
  }, [resource, resourceId, tracked]);

  if (!resource) return <p>Đang tải...</p>;

  const url = mediaFullUrl(resource.fileUrl);

  return (
    <div className="space-y-4">
      <Link to={`/portal/courses/${resource.courseId}`} className="text-sm text-emerald-600">← Quay lại khóa học</Link>
      <h2 className="text-xl font-bold">{resource.title}</h2>
      <p className="text-sm text-slate-600">{resource.description}</p>
      {tracked && <p className="text-xs text-emerald-600">Đã ghi nhận lượt xem tài liệu</p>}
      <a href={url} target="_blank" rel="noreferrer" className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
        Mở / tải tài liệu ({resource.fileType})
      </a>
    </div>
  );
}
