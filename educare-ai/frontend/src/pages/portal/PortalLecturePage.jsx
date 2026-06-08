import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPortalLecture, mediaFullUrl, trackVideoProgress } from '../../services/lmsService';

export default function PortalLecturePage() {
  const { lectureId } = useParams();
  const [lecture, setLecture] = useState(null);
  const [progress, setProgress] = useState(null);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    getPortalLecture(lectureId).then((res) => {
      setLecture(res.data.lecture);
      setProgress(res.data.progress);
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lectureId]);

  const sendProgress = async (watchedSeconds, currentTime) => {
    if (watchedSeconds <= 0) return;
    try {
      const res = await trackVideoProgress({ lectureId, watchedSeconds, currentTime });
      if (res.data.progress) setProgress(res.data.progress);
    } catch {
      /* ignore transient errors */
    }
  };

  const handlePlay = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused) return;
      const now = Date.now();
      if (now - lastSentRef.current < 28000) return;
      lastSentRef.current = now;
      sendProgress(30, Math.floor(video.currentTime));
    }, 30000);
  };

  const handlePause = () => {
    const video = videoRef.current;
    if (video) sendProgress(5, Math.floor(video.currentTime));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  if (!lecture) return <p>Đang tải...</p>;

  const url = mediaFullUrl(lecture.videoUrl);

  return (
    <div className="space-y-4">
      <Link to={`/portal/courses/${lecture.courseId}`} className="text-sm text-emerald-600">← Quay lại khóa học</Link>
      <h2 className="text-xl font-bold">{lecture.title}</h2>
      <p className="text-sm text-slate-600">{lecture.description}</p>

      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full rounded-xl bg-black"
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handlePause}
      />

      {progress && (
        <p className="text-sm text-slate-600">
          Đã xem: {Math.round((progress.watchedSeconds || 0) / 60)} phút
          {progress.completed ? ' · ✓ Hoàn thành' : ''}
        </p>
      )}
    </div>
  );
}
