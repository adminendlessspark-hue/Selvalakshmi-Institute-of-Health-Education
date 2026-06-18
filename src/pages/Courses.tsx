import { useStore } from "../context/StoreContext";
import { Link } from "react-router-dom";

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

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-serif font-bold text-sage-900 mb-4">Our Available Courses</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">Choose the path that fits your schedule and depth of interest in Naturopathy.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-sage-100 group flex flex-col">
            <div className="h-48 overflow-hidden relative bg-slate-900">
              {course.videoUrl ? (
                <iframe 
                  src={course.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <img 
                  src={course.imageUrl} 
                  alt={course.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-sm font-medium text-sage-700 rounded-full shadow-sm z-10 pointer-events-none">
                {course.duration}
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h3>
              {course.launchDate && (
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
        ))}
      </div>
    </div>
  );
}
