import { useState, useEffect } from "react";
import { useStore } from "../context/StoreContext";
import { Link } from "react-router-dom";
import { Play, Lock, Clock } from "lucide-react";

interface CourseCardProps {
  course: any;
  formatDateString: (dateStr: string) => string;
}

function CourseCard({ course, formatDateString }: CourseCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          setIsPlaying(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isExpired) return;
    setIsPlaying(true);
  };

  const getAutoplayUrl = (url: string) => {
    if (!url) return "";
    let embedUrl = url;
    if (url.includes("youtube.com/watch?v=")) {
      embedUrl = url.replace("youtube.com/watch?v=", "youtube.com/embed/");
    } else if (url.includes("youtu.be/")) {
      embedUrl = url.replace("youtu.be/", "youtube.com/embed/");
    }
    const separator = embedUrl.includes("?") ? "&" : "?";
    return `${embedUrl}${separator}autoplay=1`;
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-sage-100 group flex flex-col">
      <div className="h-48 overflow-hidden relative bg-slate-900">
        {isExpired ? (
          <div className="absolute inset-0 bg-sage-950/95 flex flex-col items-center justify-center text-center p-4 z-10">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2 border border-red-500/20">
              <Lock className="w-6 h-6 text-red-400 animate-bounce" />
            </div>
            <h4 className="text-white font-serif font-bold text-sm mb-1">Free Preview Ended</h4>
            <p className="text-sage-200 text-[11px] leading-relaxed max-w-[240px] mb-3">
              Register to unlock full course lectures, certification, study materials & live webinars!
            </p>
            <div className="flex gap-2">
              <Link
                to={`/register?course=${course.id}`}
                className="bg-sage-600 hover:bg-sage-500 text-white font-medium text-xs px-3 py-1.5 rounded transition shadow-sm"
              >
                Register Now
              </Link>
              <button
                onClick={() => {
                  setIsExpired(false);
                  setTimeLeft(180);
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-medium text-xs px-2 py-1.5 rounded transition"
              >
                Reset Preview
              </button>
            </div>
          </div>
         ) : isPlaying && course.videoUrl ? (
          (() => {
            const videoUrl = course.videoUrl || "";
            const isAudio = videoUrl.toLowerCase().startsWith('data:audio/') || 
                            videoUrl.toLowerCase().endsWith('.mp3') || 
                            videoUrl.toLowerCase().endsWith('.wav') || 
                            videoUrl.toLowerCase().endsWith('.m4a') || 
                            videoUrl.toLowerCase().endsWith('.ogg') || 
                            videoUrl.toLowerCase().endsWith('.aac');

            const isUploadedVideo = !isAudio && (
              videoUrl.toLowerCase().startsWith('data:video/') || 
              videoUrl.toLowerCase().endsWith('.mp4') || 
              videoUrl.toLowerCase().endsWith('.webm') || 
              videoUrl.toLowerCase().endsWith('.mov') || 
              videoUrl.toLowerCase().endsWith('.avi') || 
              videoUrl.toLowerCase().endsWith('.mkv')
            );

            if (isAudio) {
              return (
                <div className="w-full h-full relative flex flex-col justify-center items-center p-4 bg-sage-900">
                  {course.imageUrl && (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm"
                    />
                  )}
                  <div className="relative z-10 w-full flex flex-col items-center gap-2">
                    <span className="text-white text-[10px] font-semibold uppercase tracking-wider bg-sage-800 px-2 py-0.5 rounded">Audio Preview</span>
                    <audio
                      src={course.videoUrl}
                      autoPlay
                      controls
                      className="w-full max-w-[240px] h-8"
                    />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1.5 font-mono z-10">
                    <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>Preview: {formatTime(timeLeft)}</span>
                  </div>
                </div>
              );
            } else if (isUploadedVideo) {
              return (
                <div className="w-full h-full relative">
                  <video
                    src={course.videoUrl}
                    autoPlay
                    controls
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1.5 font-mono z-10">
                    <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>Preview: {formatTime(timeLeft)}</span>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="w-full h-full relative">
                  <iframe
                    src={getAutoplayUrl(course.videoUrl)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1.5 font-mono z-10">
                    <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>Preview: {formatTime(timeLeft)}</span>
                  </div>
                </div>
              );
            }
          })()
        ) : (
          <div className="relative w-full h-full cursor-pointer" onClick={handlePlay}>
            {course.imageUrl ? (
              <img
                src={course.imageUrl}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sage-100 text-sage-400">
                <span>No Thumbnail</span>
              </div>
            )}
            
            {course.videoUrl ? (
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-white text-sage-700 flex items-center justify-center shadow-lg transition duration-300 transform group-hover:scale-110">
                  <Play className="w-5 h-5 fill-current translate-x-0.5 text-sage-700" />
                </div>
                <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full font-medium tracking-wide shadow">
                  Watch 3-Min Free Preview
                </span>
              </div>
            ) : (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-sm font-medium text-sage-700 rounded-full shadow-sm z-10 pointer-events-none">
                {course.duration}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h3>
        {!course.isOffline && course.launchDate && (
          <p className="text-sm font-semibold text-sage-600 mb-2">🚀 Launch Date: {formatDateString(course.launchDate)}</p>
        )}
        <p className="text-slate-600 mb-4 flex-1 leading-relaxed">{course.description}</p>
        {course.fee && (
          <div className="flex justify-between items-center bg-sage-50 px-4 py-2 rounded-lg mb-6">
            <span className="text-sm font-medium text-slate-600">Course Fee:</span>
            <span className="text-lg font-bold text-sage-800">
              {course.fee.toLowerCase() === 'free' || course.fee.includes('₹') ? course.fee : `₹${course.fee}`}
            </span>
          </div>
        )}
        <Link
          to={`/register?course=${course.id}`}
          className="block text-center bg-sage-50 text-sage-700 font-medium py-2 rounded-md hover:bg-sage-100 transition-colors w-full"
        >
          Register for this course
        </Link>
      </div>
    </div>
  );
}

export function Courses() {
  const { courses } = useStore();

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const liveCourses = courses.filter((c) => !c.isOffline);
  const offlineCourses = courses.filter((c) => c.isOffline);

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-serif font-bold text-sage-900 mb-4">Our Available Courses</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">Choose the path that fits your schedule and depth of interest in Naturopathy.</p>
      </div>

      {liveCourses.length > 0 && (
        <div className="mb-16">
          <h3 className="text-2xl font-serif font-bold text-sage-800 mb-6 border-b border-sage-200 pb-2">Live Courses</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {liveCourses.map((course) => (
              <CourseCard key={course.id} course={course} formatDateString={formatDateString} />
            ))}
          </div>
        </div>
      )}

      {offlineCourses.length > 0 && (
        <div>
          <h3 className="text-2xl font-serif font-bold text-sage-800 mb-6 border-b border-sage-200 pb-2">Offline Courses</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {offlineCourses.map((course) => (
              <CourseCard key={course.id} course={course} formatDateString={formatDateString} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
