import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { User, PlayCircle, Award, Leaf, ListChecks, X, CheckCircle, XCircle } from "lucide-react";
import { cn } from "../lib/utils";

export function Dashboard() {
  const { students, courses, videos, logoUrl, loggedStudentId, updateStudent } = useStore();
  const [activeTab, setActiveTab] = useState<"id" | "videos" | "cert">("id");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [activeQuizVideoId, setActiveQuizVideoId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // Use the authenticated student
  const student = students.find(s => s.id === loggedStudentId);

  if (!student) {
    return <div className="min-h-[50vh] flex items-center justify-center">Loading student data...</div>;
  }

  const course = courses.find(c => c.id === student.courseId) || courses[0];
  const myVideos = videos.filter(v => v.courseId === student.courseId);

  const submitQuiz = () => {
    if (!activeQuizVideoId) return;
    const activeVideo = myVideos.find(v => v.id === activeQuizVideoId);
    if (!activeVideo || !activeVideo.quiz) return;
    
    let score = 0;
    activeVideo.quiz.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });
    
    const percentage = score / activeVideo.quiz.questions.length;
    let grade = "F";
    if (percentage >= 0.9) grade = "A";
    else if (percentage >= 0.75) grade = "B";
    else if (percentage >= 0.6) grade = "C";
    
    const newQuizResults = { 
      ...(student.quizResults || {}), 
      [activeQuizVideoId]: { 
        videoId: activeQuizVideoId,
        score,
        total: activeVideo.quiz.questions.length,
        grade,
        completedAt: new Date().toISOString()
      }
    };
    
    updateStudent({ ...student, quizResults: newQuizResults });
    setActiveQuizVideoId(null);
  };

  const activeQuizVideo = activeQuizVideoId ? myVideos.find(v => v.id === activeQuizVideoId) : null;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden sticky top-24">
              <div className="p-6 border-b border-sage-100 text-center">
                <div className="w-20 h-20 bg-sage-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10 text-sage-600" />
                </div>
                <h2 className="font-bold text-slate-900">{student.firstName} {student.lastName}</h2>
                <p className="text-sm text-slate-500">Student</p>
                <div className="mt-2">
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    (student.status || "pending") === "approved" && "bg-green-100 text-green-700",
                    (student.status || "pending") === "pending" && "bg-yellow-100 text-yellow-700",
                    (student.status || "pending") === "rejected" && "bg-red-100 text-red-700"
                  )}>
                    {(student.status || "pending").charAt(0).toUpperCase() + (student.status || "pending").slice(1)}
                  </span>
                </div>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => setActiveTab("id")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition",
                    activeTab === "id" ? "bg-sage-50 text-sage-700" : "text-slate-600 hover:bg-slate-50",
                    (student.status || "pending") !== "approved" && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={(student.status || "pending") !== "approved"}
                >
                  <User className="w-5 h-5" /> Student Profile & ID
                </button>
                <button
                  onClick={() => setActiveTab("videos")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition",
                    activeTab === "videos" ? "bg-sage-50 text-sage-700" : "text-slate-600 hover:bg-slate-50",
                    (student.status || "pending") !== "approved" && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={(student.status || "pending") !== "approved"}
                >
                  <PlayCircle className="w-5 h-5" /> Video Library
                </button>
                <button
                  onClick={() => setActiveTab("cert")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition",
                    activeTab === "cert" ? "bg-sage-50 text-sage-700" : "text-slate-600 hover:bg-slate-50",
                    (student.status || "pending") !== "approved" && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={(student.status || "pending") !== "approved"}
                >
                  <Award className="w-5 h-5" /> Certificates
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {(student.status || "pending") === "pending" && (
              <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-xl text-center space-y-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl text-yellow-600">⏳</span>
                </div>
                <h2 className="text-xl font-bold text-yellow-800">Application Pending Approval</h2>
                <p className="text-yellow-700 max-w-md mx-auto">
                  Your registration for the <strong>{course?.title}</strong> has been received. Our administrators are currently reviewing your payment and application. You will be able to access the portal once approved.
                </p>
              </div>
            )}
            
            {(student.status || "pending") === "rejected" && (
              <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl text-red-600">❌</span>
                </div>
                <h2 className="text-xl font-bold text-red-800">Application Rejected</h2>
                <p className="text-red-700 max-w-md mx-auto">
                  Your registration for the <strong>{course?.title}</strong> could not be approved. Please contact our support team for more information regarding your payment or application details.
                </p>
              </div>
            )}

            {(student.status || "pending") === "approved" && activeTab === "id" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-serif font-bold text-sage-900">Student Identity Card</h1>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-sage-100 max-w-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sage-100 rounded-bl-full -z-0"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      {logoUrl ? (
                         <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-full border border-sage-200 bg-white" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                          <Leaf className="w-6 h-6 text-sage-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-serif font-bold text-sage-900 leading-tight">Selvalakshmi</h3>
                        <p className="text-xs text-sage-600 uppercase tracking-widest">Institute of Health Education</p>
                      </div>
                    </div>

                    <div className="flex gap-6 mb-8">
                      <div className="w-24 h-32 bg-slate-100 border-2 border-sage-200 rounded-md flex items-center justify-center flex-shrink-0">
                         <span className="text-xs text-slate-400">Photo</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Name</p>
                        <p className="font-bold text-slate-900 mb-4">{student.firstName} {student.lastName}</p>
                        
                        <p className="text-xs text-slate-500 mb-1">Course Enrolled</p>
                        <p className="font-bold text-slate-900 mb-4 text-sm">{course?.title} ({course?.duration})</p>
                        
                        <p className="text-xs text-slate-500 mb-1">Student ID</p>
                        <p className="font-mono text-sage-700 font-bold">{student.id}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-500">
                      <p>Valid through: Dec {new Date(student.registrationDate).getFullYear()}</p>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${student.id}`} alt="QR Code" className="w-10 h-10 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(student.status || "pending") === "approved" && activeTab === "videos" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-serif font-bold text-sage-900">{course.isWebinar ? "Webinar Modules" : "Video Library"}</h1>
                <p className="text-slate-600 mb-8">Access your enrolled course modules here.</p>
                
                {course.isWebinar && course.meetLink && (
                  <div className="bg-sage-600 rounded-xl p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Live Webinar Sessions</h2>
                      <p className="text-sage-100 text-sm">Join the interactive Google Meet sessions using the link.</p>
                    </div>
                    <a href={course.meetLink} target="_blank" rel="noopener noreferrer" className="bg-white text-sage-700 px-6 py-3 rounded-lg font-bold hover:bg-sage-50 transition shrink-0">
                      Join Google Meet
                    </a>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  {myVideos.map((video, index) => (
                    <div key={video.id} className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden group cursor-pointer hover:shadow-md transition">
                      {playingVideoId === video.id && video.url ? (
                        <div className="aspect-video w-full bg-slate-900 object-cover relative">
                          <iframe 
                            src={video.url}
                            className="w-full h-full absolute top-0 left-0"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                      ) : (
                        <div className="relative aspect-video" onClick={() => setPlayingVideoId(video.id)}>
                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition flex items-center justify-center">
                            <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                          </div>
                          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                            {video.duration}
                          </div>
                        </div>
                      )}
                      <div className="p-4 flex justify-between items-end">
                        <div onClick={() => setPlayingVideoId(video.id)} className="flex-1">
                          <p className="text-xs text-sage-600 font-medium mb-1">Module {index + 1}</p>
                          <h3 className="font-bold text-slate-900">{video.title}</h3>
                          {video.materialUrl && (
                            <a 
                              href={video.materialUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={e => e.stopPropagation()} 
                              className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-sage-600 hover:text-sage-800"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              Training Material
                            </a>
                          )}
                        </div>
                        {video.quiz && video.quiz.questions.length > 0 && (
                          <div className="shrink-0 flex flex-col items-end pl-2">
                            {student.quizResults && student.quizResults[video.id] ? (
                              <div className="text-right">
                                <p className="text-xs font-medium text-slate-600 mb-1">Score: {student.quizResults[video.id].score}/{student.quizResults[video.id].total}</p>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider",
                                    student.quizResults[video.id].grade === 'A' ? 'bg-green-100 text-green-700' : 
                                    student.quizResults[video.id].grade === 'B' ? 'bg-blue-100 text-blue-700' : 
                                    student.quizResults[video.id].grade === 'C' ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-red-100 text-red-700'
                                  )}>Grade: {student.quizResults[video.id].grade}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setActiveQuizVideoId(video.id); setQuizAnswers({}); }}
                                    className="text-xs text-sage-600 hover:text-sage-700 font-medium"
                                  >
                                    Retake
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveQuizVideoId(video.id); setQuizAnswers({}); }}
                                className="flex items-center gap-1.5 bg-sage-50 hover:bg-sage-100 text-sage-700 px-3 py-1.5 border border-sage-200 rounded text-xs font-medium transition"
                              >
                                <ListChecks className="w-3.5 h-3.5" /> Take Quiz
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {myVideos.length === 0 && (
                    <p className="text-slate-500 col-span-2">No videos uploaded for this course yet.</p>
                  )}
                </div>
              </div>
            )}

            {(student.status || "pending") === "approved" && activeTab === "cert" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-serif font-bold text-sage-900">Your Certificates</h1>
                
                <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-sage-200 text-center relative overflow-hidden">
                   {/* Decorative borders for the certificate view */}
                  <div className="absolute inset-4 border-2 border-sage-100 opacity-50 pointer-events-none"></div>
                  <div className="absolute inset-5 border border-sage-200 pointer-events-none"></div>
                  
                  <div className="w-16 h-16 rounded-full mx-auto mb-6 shadow-sm border border-sage-200 bg-white flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Leaf className="w-8 h-8 text-sage-600" />
                    )}
                  </div>
                  
                  <h4 className="text-sage-600 uppercase tracking-[0.2em] text-sm font-medium mb-2">Selvalakshmi Institute of Health Education</h4>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-sage-900 mb-8 pb-8 border-b max-w-lg mx-auto">Certificate of Completion</h2>
                  
                  <p className="text-slate-500 mb-4 italic">This is proudly presented to</p>
                  <h3 className="text-3xl font-serif text-slate-900 mb-8">{student.firstName} {student.lastName}</h3>
                  
                  <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
                    For successfully completing the rigorous <strong>{course?.title} ({course?.duration})</strong> course, demonstrating proficiency in natural healing techniques and foundational naturopathy.
                  </p>
                  
                  <div className="flex justify-around items-end max-w-md mx-auto pt-8">
                    <div className="text-center">
                       <p className="font-serif italic text-sage-800 text-xl border-b border-slate-300 px-4 mb-2">S. Nanda</p>
                       <p className="text-xs text-slate-500 uppercase tracking-wider">Course Director</p>
                    </div>
                    
                    <div className="w-20 h-20 bg-amber-50 rounded-full border-2 border-amber-200 flex items-center justify-center shadow-inner">
                      <Award className="w-8 h-8 text-amber-500" />
                    </div>
                    
                    <div className="text-center">
                       <p className="text-slate-800 font-medium border-b border-slate-300 px-4 mb-2">June 7, 2026</p>
                       <p className="text-xs text-slate-500 uppercase tracking-wider">Date</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                   <button className="px-6 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded hover:bg-slate-50 transition shadow-sm">
                     Download PDF
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Take Modal */}
      {activeQuizVideoId && activeQuizVideo && activeQuizVideo.quiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-sage-100 flex justify-between items-center bg-sage-50">
              <h2 className="text-xl font-bold font-serif text-sage-900">Quiz: {activeQuizVideo.title}</h2>
              <button onClick={() => { setActiveQuizVideoId(null); setQuizAnswers({}); }} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-8">
              {activeQuizVideo.quiz.questions.map((q, idx) => (
                <div key={q.id} className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-800">
                    <span className="text-sage-600 font-bold mr-2">{idx + 1}.</span> 
                    {q.text}
                  </h3>
                  
                  <div className="space-y-3 pl-6">
                    {(q.options || []).map((opt, optIdx) => {
                      if (!opt) return null;
                      const isSelected = quizAnswers[q.id] === opt;
                      return (
                        <label 
                          key={optIdx} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition",
                            isSelected ? "border-sage-500 bg-sage-50" : "border-slate-200 hover:border-sage-300 hover:bg-slate-50"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                            isSelected ? "border-sage-600 border-4" : "border-slate-300"
                          )} />
                          <input 
                            type="radio" 
                            name={`quiz-${q.id}`} 
                            className="hidden" 
                            checked={isSelected}
                            onChange={() => {
                              setQuizAnswers(prev => ({ ...prev, [q.id]: opt }));
                            }}
                          />
                          <span className="text-slate-700">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-sage-100 bg-white flex justify-between items-center">
              <p className="text-sm text-slate-500">
                Answered: {Object.keys(quizAnswers).length} / {activeQuizVideo.quiz.questions.length}
              </p>
              <button 
                onClick={submitQuiz}
                disabled={Object.keys(quizAnswers).length !== activeQuizVideo.quiz.questions.length}
                className="px-6 py-2.5 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Submit Quiz <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
