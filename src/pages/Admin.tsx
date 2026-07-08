import React, { useState, useRef } from "react";
import { useStore } from "../context/StoreContext";
import { getOAuthToken } from "../lib/oauth";
import { Users, BookOpen, Video as VideoIcon, Plus, Edit2, Trash2, X, Check, Image as ImageIcon, Upload, Share2, Copy, ListChecks } from "lucide-react";
import { cn } from "../lib/utils";
import { Course, Student, Video, Quiz } from "../types";

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

const convertToEmbedUrl = (input: string | null | undefined): string => {
  if (!input) return "";
  const trimmed = input.trim();
  
  // 1. Try to extract from iframe src attribute if user pasted an iframe
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  let url = srcMatch && srcMatch[1] ? srcMatch[1] : trimmed;

  // Ensure it has a protocol
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }

  // 2. Check for YouTube embed URL directly
  const embedMatch = url.match(/(?:youtube\.com|youtube-nocookie\.com)\/embed\/([^?&#\s]+)/i);
  if (embedMatch && embedMatch[1]) {
    return `https://www.youtube.com/embed/${embedMatch[1]}`;
  }

  // 3. Check for standard watch link (m.youtube.com or youtube.com)
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([^?&#\s]+)/i);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  // 4. Check for shortened link (youtu.be)
  const shortMatch = url.match(/youtu\.be\/([^?&#\s]+)/i);
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  // 5. Check for YouTube shorts link
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&#\s]+)/i);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }

  return url;
};

export function Admin() {
  const { 
    courses, students, appointments, videos, logoUrl, heroImages, heroOverlayColor, heroOverlayOpacity, gpayQrUrl, testimonialVideos,
    founderVideoUrl, aboutVideoUrl, whatsappNumber, youtubeUrl, instagramUrl, facebookUrl,
    muthraIconUrl, acupressureIconUrl, foodIconUrl,
    appointmentSettings, updateAppointmentSettings,
    addCourse, updateCourse, deleteCourse, 
    addStudent, updateStudent, deleteStudent, 
    updateAppointmentStatus, deleteAppointment,
    addVideo, updateVideo, deleteVideo, updateLogo,
    updateFounderVideo, updateAboutVideo, updateSocialLinks,
    addHeroImage, removeHeroImage, updateHeroOverlay, updateGpayQr, addTestimonialVideo, removeTestimonialVideo, updateFeatureIcons,
    webinarVisible, updateWebinarVisible
  } = useStore();
  const [activeTab, setActiveTab] = useState<"registrations" | "appointments" | "courses" | "videos" | "appearance" | "marketing">("registrations");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const gpayInputRef = useRef<HTMLInputElement>(null);
  const muthraInputRef = useRef<HTMLInputElement>(null);
  const acupressureInputRef = useRef<HTMLInputElement>(null);
  const foodInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateMeetLink = async (apt: any) => {
    try {
      const token = await getOAuthToken(['https://www.googleapis.com/auth/meetings.space.created']);
      const response = await fetch("https://meet.googleapis.com/v2/spaces", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error("Failed to create Google Meet space");
      }
      const data = await response.json();
      const meetLink = data.meetingUri;
      
      await updateAppointmentStatus(apt.id, apt.status, meetLink);
      alert("Meet link generated successfully!");
    } catch (err) {
      alert("Failed to generate Google Meet link: " + (err as Error).message);
    }
  };

  const handleShareMeetLink = (apt: any) => {
    const meetLink = apt.meetLink || appointmentSettings?.defaultMeetLink || "No link provided";
    const message = `Hello ${apt.name},\n\nYour consultation appointment is confirmed for ${apt.date} at ${apt.time}.\n\nPlease join using this Google Meet link: ${meetLink}\n\nFrom: jcmpselvalakshmifoundation@gmail.com`;
    window.open(`https://wa.me/${apt.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    
    if (apt.email) {
      const subject = `Consultation Appointment Confirmation - ${apt.date} ${apt.time}`;
      window.open(`mailto:${apt.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`);
    }
  };

  // Local state for forms
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState<Course>({ id: "", title: "", duration: "", description: "", imageUrl: "", videoUrl: "", fee: "", launchDate: "", isWebinar: false, meetLink: "" });

  const [showVideoForm, setShowVideoForm] = useState(false);
  const [newVideo, setNewVideo] = useState<{ courseId: string; title: string; duration: string; thumbnail: string; url: string; materialUrl?: string }>({ courseId: "", title: "", duration: "", thumbnail: "", url: "", materialUrl: "" });

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentData, setEditingStudentData] = useState<Student | null>(null);

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourseData, setEditingCourseData] = useState<Course | null>(null);

  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingVideoData, setEditingVideoData] = useState<Video | null>(null);
  
  const [editingQuizVideoId, setEditingQuizVideoId] = useState<string | null>(null);
  const [editingQuizData, setEditingQuizData] = useState<Quiz | null>(null);

  const [templateLanguage, setTemplateLanguage] = useState<"en" | "ta">("en");
  const [selectedCourseForTemplate, setSelectedCourseForTemplate] = useState<string>("");
  const [shareTemplateText, setShareTemplateText] = useState<string>(`🌟 *Welcome to Our Platform!* 🌟\n\nExplore our latest courses and sign up today!\n\n🔗 *Visit:*\nhttps://selvalakshmihealtheducation.in`);

  const [feeInput, setFeeInput] = useState<number | "">(appointmentSettings?.fee ?? 100);
  const [meetLinkInput, setMeetLinkInput] = useState<string>(appointmentSettings?.defaultMeetLink || "");
  const [razorpayKeyIdInput, setRazorpayKeyIdInput] = useState<string>(appointmentSettings?.razorpayKeyId || "");

  React.useEffect(() => {
    if (appointmentSettings) {
      setFeeInput(appointmentSettings.fee);
      setMeetLinkInput(appointmentSettings.defaultMeetLink || "");
      setRazorpayKeyIdInput(appointmentSettings.razorpayKeyId || "");
    }
  }, [appointmentSettings]);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.id) newCourse.id = newCourse.title.toLowerCase().replace(/\s+/g, '-');
    
    const finalUrl = convertToEmbedUrl(newCourse.videoUrl);
    
    addCourse({...newCourse, videoUrl: finalUrl});
    setShowCourseForm(false);
    setNewCourse({ id: "", title: "", duration: "", description: "", imageUrl: "", videoUrl: "", fee: "", launchDate: "", isWebinar: false, meetLink: "" });
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = convertToEmbedUrl(newVideo.url);
    addVideo({...newVideo, url: finalUrl});
    setShowVideoForm(false);
    setNewVideo({ courseId: "", title: "", duration: "", thumbnail: "", url: "", materialUrl: "" });
  };

  React.useEffect(() => {
    const course = courses.find(c => c.id === selectedCourseForTemplate);
    if (course) {
      const convertToWatchUrl = (url: string | null | undefined) => {
        if (!url) return "";
        const m = url.match(/youtube\.com\/embed\/([^?&]+)/);
        return m ? `https://www.youtube.com/watch?v=${m[1]}` : url;
      };

      const testimonyUrl = testimonialVideos && testimonialVideos.length > 0 ? convertToWatchUrl(testimonialVideos[0].url) : "";
      const cleanCourseVideoUrl = convertToWatchUrl(course.videoUrl);

      const videoLineEn = cleanCourseVideoUrl ? `\n\n📺 *Course Overview Video:*\n${cleanCourseVideoUrl}` : "";
      const testimonyLineEn = testimonyUrl ? `\n\n🗣️ *Testimony Video:*\n${testimonyUrl}` : "";
      
      const videoLineTa = cleanCourseVideoUrl ? `\n\n📺 *வகுப்பு பற்றிய விளக்கம்:*\n${cleanCourseVideoUrl}` : "";
      const testimonyLineTa = testimonyUrl ? `\n\n🗣️ *பயிற்சியாளர் கருத்து:*\n${testimonyUrl}` : "";

      const getPublicBaseUrl = () => {
        return "https://selvalakshmihealtheducation.in";
      };

      const publicBaseUrl = getPublicBaseUrl();
      const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
      const registerUrl = `${cleanBaseUrl}/#/register?course=${course.id}`;

      if (templateLanguage === "en") {
        setShareTemplateText(`🌟 *Join Our New Program: ${course.title}* 🌟\n\nClick the link below to view course details and register:\n\n🔗 *Register Now at:*\n${registerUrl}\n\nDon't miss out on this opportunity!`);
      } else {
         setShareTemplateText(`🌟 *எங்கள் புதிய வகுப்பில் இணையுங்கள்: ${course.title}* 🌟\n\nவகுப்பு விவரங்களை அறியவும் பதிவு செய்யவும் கீழே உள்ள லிங்கை அழுத்தவும்:\n\n🔗 *இப்போதே பதிவு செய்யுங்கள்:*\n${registerUrl}\n\nஇந்த வாய்ப்பை தவறவிடாதீர்கள்!`);
      }
    } else {
      const getPublicBaseUrl = () => {
        return "https://selvalakshmihealtheducation.in";
      };
      
      const publicBaseUrl = getPublicBaseUrl();
      const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;

      if (templateLanguage === "en") {
        setShareTemplateText(`🌟 *Welcome to Our Platform!* 🌟\n\nExplore our latest courses and sign up today!\n\n🔗 *Visit:*\n${cleanBaseUrl}`);
      } else {
        setShareTemplateText(`🌟 *எங்கள் தளத்திற்கு வருக!* 🌟\n\nஎங்கள் புதிய வகுப்புகளைத் தேர்ந்தெடுத்து இன்றே இணையுங்கள்!\n\n🔗 *தொடர்புக்கு:*\n${cleanBaseUrl}`);
      }
    }
  }, [selectedCourseForTemplate, templateLanguage, courses, testimonialVideos]);

  const resizeImage = (file: File, maxWidth: number, maxHeight: number, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL("image/webp", 0.5)); 
        }
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resizeImage(file, 200, 200, (resizedDataUrl) => {
        updateLogo(resizedDataUrl);
      });
    }
  };

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resizeImage(file, 1000, 600, (resizedDataUrl) => {
        addHeroImage(resizedDataUrl);
      });
    }
  };

  const handleGpayQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resizeImage(file, 600, 600, (resizedDataUrl) => {
        updateGpayQr(resizedDataUrl);
      });
    }
  };

  const handleMuthraIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { resizeImage(file, 200, 200, (url) => updateFeatureIcons(url, acupressureIconUrl, foodIconUrl)); }
  };
  const handleAcupressureIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { resizeImage(file, 200, 200, (url) => updateFeatureIcons(muthraIconUrl, url, foodIconUrl)); }
  };
  const handleFoodIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { resizeImage(file, 200, 200, (url) => updateFeatureIcons(muthraIconUrl, acupressureIconUrl, url)); }
  };


  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-sage-900 mb-8">Admin Dashboard</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden sticky top-24">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => setActiveTab("registrations")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition",
                    activeTab === "registrations" ? "bg-sage-50 text-sage-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Users className="w-5 h-5" /> Registrations
                </button>
                <button
                  onClick={() => setActiveTab("appointments")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition",
                    activeTab === "appointments" ? "bg-sage-50 text-sage-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Users className="w-5 h-5" /> Appointments
                </button>
                <button
                  onClick={() => setActiveTab("courses")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition",
                    activeTab === "courses" ? "bg-sage-50 text-sage-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <BookOpen className="w-5 h-5" /> Manage Courses
                </button>
                <button
                  onClick={() => setActiveTab("videos")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition",
                    activeTab === "videos" ? "bg-sage-50 text-sage-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <VideoIcon className="w-5 h-5" /> Manage Videos
                </button>
                <button
                  onClick={() => setActiveTab("appearance")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition",
                    activeTab === "appearance" ? "bg-sage-50 text-sage-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <ImageIcon className="w-5 h-5" /> Appearance
                </button>
                <button
                  onClick={() => setActiveTab("marketing")}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition",
                    activeTab === "marketing" ? "bg-sage-50 text-sage-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Share2 className="w-5 h-5" /> Marketing
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "registrations" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-sage-900">Student Registrations</h2>
                {students.length === 0 ? (
                  <p className="text-slate-600 bg-white p-6 rounded-xl border border-sage-100">No students registered yet.</p>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-sage-50 text-sage-800 border-b border-sage-200">
                        <tr>
                          <th className="p-4 font-semibold">ID</th>
                          <th className="p-4 font-semibold">Name</th>
                          <th className="p-4 font-semibold">Location</th>
                          <th className="p-4 font-semibold">Contact</th>
                          <th className="p-4 font-semibold">Course</th>
                          <th className="p-4 font-semibold">Date</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sage-100">
                        {students.map(student => {
                          const course = courses.find(c => c.id === student.courseId);
                          const isEditing = editingStudentId === student.id;

                          if (isEditing && editingStudentData) {
                            return (
                              <tr key={student.id} className="bg-sage-50/50">
                                <td className="p-4 font-mono text-sage-600">{student.id}</td>
                                <td className="p-4">
                                  <div className="flex flex-col gap-1">
                                    <input type="text" className="w-full px-2 py-1 border rounded text-xs" value={editingStudentData.firstName} onChange={(e) => setEditingStudentData({...editingStudentData, firstName: e.target.value})} placeholder="First Name" />
                                    <input type="text" className="w-full px-2 py-1 border rounded text-xs" value={editingStudentData.lastName} onChange={(e) => setEditingStudentData({...editingStudentData, lastName: e.target.value})} placeholder="Last Name" />
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-col gap-1">
                                    <input type="text" className="w-full px-2 py-1 border rounded text-xs" value={editingStudentData.place || ''} onChange={(e) => setEditingStudentData({...editingStudentData, place: e.target.value})} placeholder="Place" />
                                    <input type="text" className="w-full px-2 py-1 border rounded text-xs" value={editingStudentData.country || ''} onChange={(e) => setEditingStudentData({...editingStudentData, country: e.target.value})} placeholder="Country" />
                                  </div>
                                </td>
                                <td className="p-4">
                                  <input type="email" className="w-full px-2 py-1 border rounded mb-1 text-xs" value={editingStudentData.email} onChange={(e) => setEditingStudentData({...editingStudentData, email: e.target.value})} placeholder="Email" />
                                  <input type="text" className="w-full px-2 py-1 border rounded text-xs" value={editingStudentData.phone} onChange={(e) => setEditingStudentData({...editingStudentData, phone: e.target.value})} placeholder="Phone" />
                                </td>
                                <td className="p-4">
                                  <select className="w-full px-2 py-1 border rounded text-xs" value={editingStudentData.courseId} onChange={(e) => setEditingStudentData({...editingStudentData, courseId: e.target.value})}>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                  </select>
                                </td>
                                <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(student.registrationDate).toLocaleDateString()}</td>
                                <td className="p-4">
                                  <select className="w-full px-2 py-1 border rounded text-xs" value={editingStudentData.status} onChange={(e) => setEditingStudentData({...editingStudentData, status: e.target.value as "pending"|"approved"|"rejected"})}>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </td>
                                <td className="p-4 flex gap-2 justify-end">
                                  <button onClick={() => { updateStudent(editingStudentData); setEditingStudentId(null); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-5 h-5"/></button>
                                  <button onClick={() => setEditingStudentId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-5 h-5"/></button>
                                </td>
                              </tr>
                            )
                          }

                          return (
                            <tr key={student.id} className="hover:bg-slate-50 transition">
                              <td className="p-4 font-mono text-sage-600">{student.id}</td>
                              <td className="p-4 font-medium text-slate-800">{student.firstName} {student.lastName}</td>
                              <td className="p-4">
                                <div>{student.place || '-'}</div>
                                <div className="text-slate-500">{student.country || '-'}</div>
                              </td>
                              <td className="p-4">
                                <div>{student.email}</div>
                                <div className="text-slate-500">{student.phone}</div>
                                {student.paymentReference && (
                                  <div className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded mt-1 font-mono inline-block break-all max-w-[200px]">
                                    {student.paymentReference}
                                  </div>
                                )}
                              </td>
                              <td className="p-4">{course ? course.title : student.courseId}</td>
                              <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(student.registrationDate).toLocaleDateString()}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-2 py-1 text-xs font-medium rounded-full",
                                  (student.status || "pending") === "approved" && "bg-green-100 text-green-700",
                                  (student.status || "pending") === "pending" && "bg-yellow-100 text-yellow-700",
                                  (student.status || "pending") === "rejected" && "bg-red-100 text-red-700"
                                )}>
                                  {(student.status || "pending").charAt(0).toUpperCase() + (student.status || "pending").slice(1)}
                                </span>
                              </td>
                              <td className="p-4 flex gap-1 justify-end opacity-50 hover:opacity-100">
                                {(student.status || "pending") === "pending" && (
                                  <>
                                    <button title="Approve" onClick={() => updateStudent({...student, status: "approved"})} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4"/></button>
                                    <button title="Reject" onClick={() => updateStudent({...student, status: "rejected"})} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4"/></button>
                                  </>
                                )}
                                <button onClick={() => { setEditingStudentId(student.id); setEditingStudentData(student); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4"/></button>
                                <button onClick={() => { if(window.confirm('Delete this registration?')) deleteStudent(student.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
                  <h3 className="font-bold text-slate-900 mb-4 text-lg">Appointment & Payment Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee (₹)</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-sage-500 outline-none" 
                        value={feeInput} 
                        onChange={e => setFeeInput(e.target.value === "" ? "" : parseInt(e.target.value) || 0)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Default Google Meet Link (Reusable)</label>
                      <input 
                        type="url" 
                        placeholder="https://meet.google.com/..."
                        className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-sage-500 outline-none" 
                        value={meetLinkInput} 
                        onChange={e => setMeetLinkInput(e.target.value)} 
                      />
                      <p className="text-xs text-slate-500 mt-1">If set, this link is automatically sent to patients upon booking.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Razorpay Key ID (For Custom Domain Payments)</label>
                      <input 
                        type="text" 
                        placeholder="rzp_live_..."
                        className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-sage-500 outline-none" 
                        value={razorpayKeyIdInput} 
                        onChange={e => setRazorpayKeyIdInput(e.target.value)} 
                      />
                      <p className="text-xs text-slate-500 mt-1">Enter your live Razorpay Key ID here to accept payments on your custom domain.</p>
                    </div>
                  </div>

                  <div className="flex justify-start mb-6 border-b pb-6 border-slate-100">
                    <button
                      onClick={async () => {
                        await updateAppointmentSettings({
                          ...(appointmentSettings || { slots: [] }),
                          fee: typeof feeInput === "number" ? feeInput : 100,
                          defaultMeetLink: meetLinkInput,
                          razorpayKeyId: razorpayKeyIdInput
                        });
                        alert("Settings saved successfully!");
                      }}
                      className="bg-sage-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-sage-700 transition"
                    >
                      Save Settings
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900 text-sm">Add Available Slot</h4>
                    <div className="flex gap-2 max-w-md">
                      <input type="date" id="newSlotDate" className="px-3 py-2 border rounded-md outline-none text-sm" />
                      <input type="time" id="newSlotTime" className="px-3 py-2 border rounded-md outline-none text-sm" />
                      <button 
                        onClick={() => {
                          const d = (document.getElementById("newSlotDate") as HTMLInputElement).value;
                          const t = (document.getElementById("newSlotTime") as HTMLInputElement).value;
                          if (d && t) {
                            updateAppointmentSettings({
                              ...(appointmentSettings || { fee: typeof feeInput === "number" ? feeInput : 100, defaultMeetLink: meetLinkInput, razorpayKeyId: razorpayKeyIdInput }),
                              slots: [...(appointmentSettings?.slots || []), { date: d, time: t }]
                            });
                            (document.getElementById("newSlotDate") as HTMLInputElement).value = "";
                            (document.getElementById("newSlotTime") as HTMLInputElement).value = "";
                          }
                        }}
                        className="bg-sage-600 text-white px-4 py-2 rounded-md hover:bg-sage-700 transition whitespace-nowrap text-sm font-medium"
                      >
                        Add Slot
                      </button>
                    </div>
                  </div>
                  
                  {appointmentSettings?.slots && appointmentSettings.slots.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Configured Slots</h4>
                      <div className="flex flex-wrap gap-2">
                        {appointmentSettings.slots.map((slot, idx) => (
                          <div key={idx} className="bg-sage-50 text-sage-800 px-3 py-1.5 rounded-full text-sm border border-sage-200 flex items-center gap-2">
                            <span>{slot.date} {slot.time}</span>
                            <button 
                              onClick={() => {
                                const newSlots = appointmentSettings.slots.filter((_, i) => i !== idx);
                                updateAppointmentSettings({ ...appointmentSettings, slots: newSlots });
                              }}
                              className="text-sage-500 hover:text-red-500"
                            >×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-serif font-bold text-sage-900 mt-8">Consultation Appointments</h2>
                {appointments && appointments.length === 0 ? (
                  <p className="text-slate-600 bg-white p-6 rounded-xl border border-sage-100">No appointments requested yet.</p>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-sage-50 text-sage-800 border-b border-sage-200">
                        <tr>
                          <th className="p-4 font-semibold">ID</th>
                          <th className="p-4 font-semibold">Name</th>
                          <th className="p-4 font-semibold">Contact</th>
                          <th className="p-4 font-semibold">Date & Time</th>
                          <th className="p-4 font-semibold">Problem</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sage-100">
                        {(appointments || []).map((apt) => (
                          <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-medium text-slate-900">{apt.id}</td>
                            <td className="p-4">{apt.name}</td>
                            <td className="p-4">
                              <div>{apt.phone}</div>
                              <div className="text-slate-500">{apt.email || '-'}</div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div>{apt.date}</div>
                              <div className="text-slate-500">{apt.time}</div>
                            </td>
                            <td className="p-4 max-w-xs truncate" title={apt.problem}>{apt.problem}</td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-1 text-xs font-medium rounded-full",
                                apt.status === "confirmed" && "bg-blue-100 text-blue-700",
                                apt.status === "completed" && "bg-green-100 text-green-700",
                                apt.status === "pending" && "bg-yellow-100 text-yellow-700",
                              )}>
                                {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                              </span>
                            </td>
                            <td className="p-4 flex gap-1 justify-end opacity-50 hover:opacity-100">
                              <button 
                                title="Generate Meet Link" 
                                onClick={() => handleGenerateMeetLink(apt)} 
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded flex items-center gap-1 px-2"
                              >
                                <VideoIcon className="w-4 h-4" />
                                <span className="text-xs font-medium">Generate</span>
                              </button>
                              <button 
                                title="Share Meet Link" 
                                onClick={() => handleShareMeetLink(apt)} 
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded flex items-center gap-1 px-2"
                              >
                                <VideoIcon className="w-4 h-4" />
                                <span className="text-xs font-medium">Share Meet</span>
                              </button>
                              {apt.meetLink && (
                                <a 
                                  href={apt.meetLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  title="Join Google Meet"
                                  className="p-1 text-green-600 hover:bg-green-50 rounded flex items-center gap-1 px-2"
                                >
                                  <VideoIcon className="w-4 h-4" />
                                  <span className="text-xs font-medium">Join</span>
                                </a>
                              )}
                              {apt.status === "pending" && (
                                <button title="Confirm" onClick={() => updateAppointmentStatus(apt.id, "confirmed")} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Check className="w-4 h-4"/></button>
                              )}
                              {apt.status === "confirmed" && (
                                <button title="Complete" onClick={() => updateAppointmentStatus(apt.id, "completed")} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4"/></button>
                              )}
                              <button onClick={() => { if(window.confirm('Delete this appointment?')) deleteAppointment(apt.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "courses" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-serif font-bold text-sage-900">Manage Courses</h2>
                  <button 
                    onClick={() => setShowCourseForm(!showCourseForm)}
                    className="flex items-center gap-2 bg-sage-600 text-white px-4 py-2 rounded-md hover:bg-sage-700 transition shadow-sm text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Course
                  </button>
                </div>

                {showCourseForm && (
                  <form onSubmit={handleAddCourse} className="bg-white p-6 rounded-xl shadow-sm border border-sage-200 space-y-4">
                    <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">New Course Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
                        <input required type="text" className="w-full px-3 py-2 border rounded-md" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration (e.g. 12 Weeks)</label>
                        <input required type="text" className="w-full px-3 py-2 border rounded-md" value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course Fee</label>
                        <input type="text" placeholder="e.g. ₹3000 or Free" className="w-full px-3 py-2 border rounded-md" value={newCourse.fee || ''} onChange={e => setNewCourse({...newCourse, fee: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Launch Date</label>
                        <input type="date" className="w-full px-3 py-2 border rounded-md" value={newCourse.launchDate || ''} onChange={e => setNewCourse({...newCourse, launchDate: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                        <input type="url" className="w-full px-3 py-2 border rounded-md" value={newCourse.imageUrl || ''} onChange={e => setNewCourse({...newCourse, imageUrl: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Video URL (Optional YouTube link)</label>
                        <input type="url" className="w-full px-3 py-2 border rounded-md" value={newCourse.videoUrl || ''} onChange={e => setNewCourse({...newCourse, videoUrl: e.target.value})} />
                      </div>
                      <div className="flex flex-col justify-center gap-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input type="checkbox" className="rounded" checked={newCourse.isWebinar || false} onChange={e => setNewCourse({...newCourse, isWebinar: e.target.checked})} />
                          This is a Live Webinar
                        </label>
                      </div>
                      {newCourse.isWebinar && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Google Meet Link</label>
                          <input type="url" placeholder="https://meet.google.com/..." className="w-full px-3 py-2 border rounded-md" value={newCourse.meetLink || ''} onChange={e => setNewCourse({...newCourse, meetLink: e.target.value})} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea required rows={2} className="w-full px-3 py-2 border rounded-md" value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowCourseForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 border rounded-md">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-sage-600 text-white rounded-md">Save Course</button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map(course => {
                    const isEditing = editingCourseId === course.id;

                    if (isEditing && editingCourseData) {
                      return (
                        <div key={course.id} className="bg-sage-50 p-5 rounded-xl border border-sage-200 flex flex-col space-y-3">
                          <input type="text" className="w-full px-2 py-1 border rounded" value={editingCourseData.title} onChange={(e) => setEditingCourseData({...editingCourseData, title: e.target.value})} placeholder="Title" />
                          <div className="flex gap-2">
                            <input type="text" className="w-1/3 px-2 py-1 border rounded" value={editingCourseData.duration} onChange={(e) => setEditingCourseData({...editingCourseData, duration: e.target.value})} placeholder="Duration" />
                            <input type="text" className="w-1/3 px-2 py-1 border rounded" value={editingCourseData.fee || ''} onChange={(e) => setEditingCourseData({...editingCourseData, fee: e.target.value})} placeholder="Fee (e.g. Free or ₹3000)" />
                            <input type="date" className="w-1/3 px-2 py-1 border rounded" value={editingCourseData.launchDate || ''} onChange={(e) => setEditingCourseData({...editingCourseData, launchDate: e.target.value})} placeholder="Launch Date" />
                          </div>
                          <textarea rows={2} className="w-full px-2 py-1 border rounded flex-1" value={editingCourseData.description} onChange={(e) => setEditingCourseData({...editingCourseData, description: e.target.value})} placeholder="Description" />
                          <input type="url" className="w-full px-2 py-1 border rounded" value={editingCourseData.imageUrl || ''} onChange={(e) => setEditingCourseData({...editingCourseData, imageUrl: e.target.value})} placeholder="Image URL" />
                          <input type="url" className="w-full px-2 py-1 border rounded" value={editingCourseData.videoUrl || ''} onChange={(e) => setEditingCourseData({...editingCourseData, videoUrl: e.target.value})} placeholder="Video URL" />
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={editingCourseData.isWebinar || false} onChange={e => setEditingCourseData({...editingCourseData, isWebinar: e.target.checked})} />
                            Webinar Program
                          </label>
                          {editingCourseData.isWebinar && (
                             <input type="url" className="w-full px-2 py-1 border rounded" value={editingCourseData.meetLink || ''} onChange={(e) => setEditingCourseData({...editingCourseData, meetLink: e.target.value})} placeholder="Google Meet Link" />
                          )}
                          
                          <div className="flex justify-end gap-2 mt-2">
                             <button onClick={() => setEditingCourseId(null)} className="px-3 py-1 text-slate-600 bg-white border rounded">Cancel</button>
                             <button onClick={() => {
                                const finalUrl = convertToEmbedUrl(editingCourseData.videoUrl);
                                 updateCourse({...editingCourseData, videoUrl: finalUrl}); 
                                 setEditingCourseId(null); 
                             }} className="px-3 py-1 text-white bg-sage-600 rounded">Save</button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={course.id} className="bg-white p-5 rounded-xl border border-sage-100 flex flex-col group relative">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button onClick={() => { setEditingCourseId(course.id); setEditingCourseData(course); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md bg-white border border-slate-100 shadow-sm"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => { if(window.confirm('Delete this course?')) deleteCourse(course.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md bg-white border border-slate-100 shadow-sm"><Trash2 className="w-4 h-4"/></button>
                        </div>
                        <h3 className="font-bold text-slate-900 pr-16">{course.title}</h3>
                        <p className="text-sm text-sage-600 mb-2">
                          {course.duration} {course.fee && `• ${(course.fee.toLowerCase() === 'free' || course.fee.includes('₹')) ? course.fee : `₹${course.fee}`}`} {course.launchDate && `• 🚀 ${formatDateString(course.launchDate)}`}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">{course.description}</p>
                        <div className="text-xs text-slate-400 font-mono mt-auto">ID: {course.id}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === "videos" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-serif font-bold text-sage-900">Manage Videos</h2>
                  <button 
                    onClick={() => setShowVideoForm(!showVideoForm)}
                    className="flex items-center gap-2 bg-sage-600 text-white px-4 py-2 rounded-md hover:bg-sage-700 transition shadow-sm text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Video
                  </button>
                </div>

                {showVideoForm && (
                  <form onSubmit={handleAddVideo} className="bg-white p-6 rounded-xl shadow-sm border border-sage-200 space-y-4">
                     <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">New Video Upload</h3>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Course</label>
                        <select required className="w-full px-3 py-2 border rounded-md" value={newVideo.courseId} onChange={e => setNewVideo({...newVideo, courseId: e.target.value})}>
                          <option value="">-- Choose a Course --</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.title} ({course.duration})</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Video Title</label>
                          <input required type="text" className="w-full px-3 py-2 border rounded-md" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Duration (e.g. 45 mins)</label>
                          <input required type="text" className="w-full px-3 py-2 border rounded-md" value={newVideo.duration} onChange={e => setNewVideo({...newVideo, duration: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">YouTube Video URL (Optional)</label>
                        <input type="text" className="w-full px-3 py-2 border rounded-md" value={newVideo.url || ''} onChange={e => setNewVideo({...newVideo, url: e.target.value})} placeholder="https://youtube.com/shorts/..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail URL</label>
                        <input required type="url" className="w-full px-3 py-2 border rounded-md" value={newVideo.thumbnail} onChange={e => setNewVideo({...newVideo, thumbnail: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Material URL (Worksheet/Notes)</label>
                        <input type="url" className="w-full px-3 py-2 border rounded-md" value={newVideo.materialUrl || ''} onChange={e => setNewVideo({...newVideo, materialUrl: e.target.value})} placeholder="https://..." />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowVideoForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 border rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-sage-600 text-white rounded-md">Add Video</button>
                      </div>
                  </form>
                )}

                {/* Group videos by course */}
                {courses.map(course => {
                  const courseVideos = videos.filter(v => v.courseId === course.id);
                  if (courseVideos.length === 0) return null;
                  
                  return (
                    <div key={course.id} className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden mb-6">
                      <div className="bg-sage-50 px-6 py-4 border-b border-sage-100">
                        <h3 className="font-bold text-slate-900">{course.title}</h3>
                      </div>
                      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {courseVideos.map(video => {
                          const isEditing = editingVideoId === video.id;

                          if (isEditing && editingVideoData) {
                            return (
                              <div key={video.id} className="relative rounded-lg overflow-hidden border bg-sage-50 p-3 space-y-2 flex flex-col">
                                <input type="text" className="w-full px-2 py-1 border rounded text-sm" value={editingVideoData.title} onChange={(e) => setEditingVideoData({...editingVideoData, title: e.target.value})} placeholder="Title" />
                                <input type="text" className="w-full px-2 py-1 border rounded text-sm" value={editingVideoData.duration} onChange={(e) => setEditingVideoData({...editingVideoData, duration: e.target.value})} placeholder="Duration" />
                                <input type="text" className="w-full px-2 py-1 border rounded text-sm" value={editingVideoData.url || ''} onChange={(e) => setEditingVideoData({...editingVideoData, url: e.target.value})} placeholder="Video URL" />
                                <input type="url" className="w-full px-2 py-1 border rounded text-sm" value={editingVideoData.thumbnail} onChange={(e) => setEditingVideoData({...editingVideoData, thumbnail: e.target.value})} placeholder="Thumbnail URL" />
                                <input type="url" className="w-full px-2 py-1 border rounded text-sm" value={editingVideoData.materialUrl || ''} onChange={(e) => setEditingVideoData({...editingVideoData, materialUrl: e.target.value})} placeholder="Material (Worksheet) URL" />
                                
                                <div className="flex justify-end gap-2 mt-auto pt-2">
                                   <button onClick={() => setEditingVideoId(null)} className="px-2 py-1 text-slate-600 bg-white border rounded text-xs">Cancel</button>
                                   <button onClick={() => {
                                      const finalUrl = convertToEmbedUrl(editingVideoData.url);
                                       updateVideo({...editingVideoData, url: finalUrl}); 
                                       setEditingVideoId(null); 
                                   }} className="px-2 py-1 text-white bg-sage-600 rounded text-xs">Save</button>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div key={video.id} className="group relative rounded-lg overflow-hidden border bg-white">
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                                <button onClick={() => { setEditingQuizVideoId(video.id); setEditingQuizData(video.quiz || { questions: [] }); }} className="p-1.5 text-sage-600 hover:bg-sage-50 rounded bg-white shadow-sm" title="Manage Quiz"><ListChecks className="w-3 h-3"/></button>
                                <button onClick={() => { setEditingVideoId(video.id); setEditingVideoData(video); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded bg-white shadow-sm" title="Edit Video"><Edit2 className="w-3 h-3"/></button>
                                <button onClick={() => { if(window.confirm('Delete this video?')) deleteVideo(video.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded bg-white shadow-sm" title="Delete Video"><Trash2 className="w-3 h-3"/></button>
                              </div>
                              <a href={video.url} target="_blank" rel="noopener noreferrer" className="block relative z-10 w-full h-32">
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-sage-600 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                  </div>
                                </div>
                              </a>
                              <div className="p-3">
                                <h4 className="font-semibold text-sm line-clamp-1 pr-6" title={video.title}>{video.title}</h4>
                                <p className="text-xs text-slate-500">{video.duration}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-sage-900">Appearance Settings</h2>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 max-w-2xl">
                  <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Page Visibility</h3>
                  <div className="space-y-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={webinarVisible || false} 
                          onChange={(e) => updateWebinarVisible(e.target.checked)} 
                        />
                        <div className={cn("block w-14 h-8 rounded-full transition-colors", webinarVisible ? "bg-sage-600" : "bg-slate-300")}></div>
                        <div className={cn("absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", webinarVisible ? "transform translate-x-6" : "")}></div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Show Webinar Page</div>
                        <div className="text-sm text-slate-500">Toggle whether the Webinar page is visible in the navigation and home page.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 max-w-2xl mt-6">
                  <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Global Logo</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-36 h-36 rounded-lg bg-sage-50 border-2 border-dashed border-sage-200 flex items-center justify-center overflow-hidden flex-shrink-0 p-2">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xs text-sage-400 text-center px-2">No logo set</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">Upload a logo to display in the navigation bar, ID card, and certificate. For best results, use a square image or transparent PNG.</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleLogoChange}
                        />
                        <div className="flex gap-3">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-sage-600 text-white px-4 py-2 rounded-md hover:bg-sage-700 transition shadow-sm text-sm"
                          >
                            <Upload className="w-4 h-4" /> Upload Custom Logo
                          </button>
                          {logoUrl && (
                            <button 
                              onClick={() => updateLogo('')}
                              className="px-4 py-2 text-red-600 hover:bg-red-50 border border-slate-200 rounded-md text-sm transition"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 max-w-2xl mt-6">
                  <div className="mb-4 border-b pb-2">
                    <h3 className="font-bold text-slate-900">Landing Page Slider Images</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Upload images to display in the background slider on the home page.</p>

                  <div 
                    onClick={() => heroInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-8 mb-6 border-2 border-dashed border-sage-200 rounded-xl bg-sage-50 hover:bg-sage-100 cursor-pointer transition"
                  >
                    <Plus className="w-8 h-8 text-sage-500 mb-2" />
                    <span className="font-medium text-sage-700">Click to Upload Image</span>
                    <span className="text-xs text-sage-500 mt-1">JPEG, PNG up to 5MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={heroInputRef}
                    onChange={handleHeroImageChange}
                  />

                  {heroImages.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">
                      No slider images uploaded. Default background active.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {heroImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video">
                          <img src={img} alt={`Slider ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => removeHeroImage(idx)}
                              className="bg-white text-red-600 p-2 rounded-full hover:scale-110 transition shadow-sm"
                              title="Remove image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h4 className="font-medium text-slate-900 mb-4">Background Overlay Adjustment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Overlay Color</label>
                        <div className="flex gap-3">
                          <input 
                            type="color" 
                            className="w-12 h-10 p-1 border border-slate-200 rounded cursor-pointer"
                            id="overlayColor"
                            defaultValue={heroOverlayColor || "#1A2F23"}
                          />
                          <input 
                            type="text" 
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                            id="overlayColorText"
                            defaultValue={heroOverlayColor || "#1A2F23"}
                            onChange={(e) => {
                               const picker = document.getElementById("overlayColor") as HTMLInputElement;
                               if(picker) picker.value = e.target.value;
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Opacity: <span id="opacityLabel">{heroOverlayOpacity ?? 70}</span>%
                        </label>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          className="w-full mt-2"
                          id="overlayOpacity"
                          defaultValue={heroOverlayOpacity ?? 70}
                          onChange={(e) => {
                            const lbl = document.getElementById("opacityLabel");
                            if(lbl) lbl.innerText = e.target.value;
                          }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const col = (document.getElementById("overlayColorText") as HTMLInputElement).value || "#1A2F23";
                        const op = parseInt((document.getElementById("overlayOpacity") as HTMLInputElement).value || "70", 10);
                        updateHeroOverlay(col, isNaN(op) ? 70 : op);
                        alert("Hero overlay updated successfully.");
                      }}
                      className="mt-4 bg-sage-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sage-700 transition"
                    >
                      Save Overlay Settings
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 max-w-2xl mt-6">
                  <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Home Page Feature Icons</h3>
                  <div className="space-y-6">
                    <p className="text-sm text-slate-600">Upload custom icons for the Muthra, Acupressure, and Food features on the landing page. (Default icons will be used if none are uploaded).</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Muthra Icon */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-sage-50 border-2 border-dashed border-sage-200 flex items-center justify-center overflow-hidden mb-3 p-1">
                          {muthraIconUrl ? (
                            <img src={muthraIconUrl} alt="Muthra Icon" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-xs text-sage-400">Muthra</span>
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" ref={muthraInputRef} onChange={handleMuthraIconChange} />
                        <div className="flex flex-col gap-2 w-full">
                          <button onClick={() => muthraInputRef.current?.click()} className="text-sm bg-sage-100 text-sage-700 px-3 py-1.5 rounded hover:bg-sage-200 transition">Upload</button>
                          {muthraIconUrl && <button onClick={() => updateFeatureIcons(null, acupressureIconUrl, foodIconUrl)} className="text-sm text-red-600 hover:text-red-700">Remove</button>}
                        </div>
                      </div>

                      {/* Acupressure Icon */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-sage-50 border-2 border-dashed border-sage-200 flex items-center justify-center overflow-hidden mb-3 p-1">
                          {acupressureIconUrl ? (
                            <img src={acupressureIconUrl} alt="Acupressure Icon" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-xs text-sage-400">Acupressure</span>
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" ref={acupressureInputRef} onChange={handleAcupressureIconChange} />
                        <div className="flex flex-col gap-2 w-full">
                          <button onClick={() => acupressureInputRef.current?.click()} className="text-sm bg-sage-100 text-sage-700 px-3 py-1.5 rounded hover:bg-sage-200 transition">Upload</button>
                          {acupressureIconUrl && <button onClick={() => updateFeatureIcons(muthraIconUrl, null, foodIconUrl)} className="text-sm text-red-600 hover:text-red-700">Remove</button>}
                        </div>
                      </div>

                      {/* Food Icon */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-sage-50 border-2 border-dashed border-sage-200 flex items-center justify-center overflow-hidden mb-3 p-1">
                          {foodIconUrl ? (
                            <img src={foodIconUrl} alt="Food Icon" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-xs text-sage-400">Food</span>
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" ref={foodInputRef} onChange={handleFoodIconChange} />
                        <div className="flex flex-col gap-2 w-full">
                          <button onClick={() => foodInputRef.current?.click()} className="text-sm bg-sage-100 text-sage-700 px-3 py-1.5 rounded hover:bg-sage-200 transition">Upload</button>
                          {foodIconUrl && <button onClick={() => updateFeatureIcons(muthraIconUrl, acupressureIconUrl, null)} className="text-sm text-red-600 hover:text-red-700">Remove</button>}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 max-w-2xl mt-6">
                  <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Testimonial Videos</h3>
                  <div className="space-y-6">
                    <p className="text-sm text-slate-600">Add YouTube video URLs (or any embeddable video links) and a title to display them dynamically on the home page.</p>
                    <div className="flex flex-col gap-3">
                       <input 
                         type="text"
                         id="testimonialTitleInput"
                         className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sage-500 outline-none text-sm"
                         placeholder="Enter Video Title (e.g. 'Student Success Story')"
                       />
                       <div className="flex gap-2">
                         <input 
                           type="text"
                           id="testimonialVideoInput" 
                           className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sage-500 outline-none text-sm"
                           placeholder="https://www.youtube.com/embed/..."
                         />
                         <button
                           type="button"
                           onClick={() => {
                             const titleInput = document.getElementById('testimonialTitleInput') as HTMLInputElement;
                             const urlInput = document.getElementById('testimonialVideoInput') as HTMLInputElement;
                             if (titleInput && urlInput && titleInput.value.trim() && urlInput.value.trim()) {
                               const finalUrl = convertToEmbedUrl(urlInput.value.trim());
                                addTestimonialVideo(titleInput.value.trim(), finalUrl);
                               titleInput.value = '';
                               urlInput.value = '';
                             } else {
                               alert("Please provide both Title and Video URL.");
                             }
                           }}
                           className="bg-sage-600 text-white px-4 py-2 rounded-md hover:bg-sage-700 transition shadow-sm text-sm"
                         >
                           Add Video
                         </button>
                       </div>
                    </div>

                    {testimonialVideos && testimonialVideos.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        {testimonialVideos.map((video) => (
                          <div key={video.id} className="border border-slate-200 p-3 rounded-lg relative bg-slate-50">
                            <button
                              onClick={() => removeTestimonialVideo(video.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition shadow-sm z-10"
                              title="Remove Video"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <h4 className="font-semibold text-sm mb-2 truncate" title={video.title}>{video.title}</h4>
                            <div className="aspect-video w-full rounded-md overflow-hidden bg-slate-900">
                              <iframe 
                                src={video.url}
                                title={video.title}
                                className="w-full h-full"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 max-w-2xl mt-6">
                  <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Foundation Videos</h3>
                  <div className="space-y-6">
                    <p className="text-sm text-slate-600">Add YouTube video URLs for the "Founder Video" and "About the Foundation" video.</p>
                    <div className="flex flex-col gap-3">
                       <label className="text-sm font-medium text-slate-700">Founder Video</label>
                       <div className="flex gap-2">
                         <input 
                           type="text"
                           id="founderVideoInput" 
                           defaultValue={founderVideoUrl || ""}
                           className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sage-500 outline-none text-sm"
                           placeholder="https://www.youtube.com/embed/..."
                         />
                         <button
                           type="button"
                           onClick={() => {
                             const urlInput = document.getElementById('founderVideoInput') as HTMLInputElement;
                             if (urlInput && urlInput.value.trim()) {
                               const finalUrl = convertToEmbedUrl(urlInput.value.trim());
                                updateFounderVideo(finalUrl);
                             } else {
                               updateFounderVideo("");
                             }
                           }}
                           className="bg-sage-600 text-white px-4 py-2 rounded-md hover:bg-sage-700 transition shadow-sm text-sm"
                         >
                           Save
                         </button>
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                       <label className="text-sm font-medium text-slate-700">About the Foundation Video</label>
                       <div className="flex gap-2">
                         <input 
                           type="text"
                           id="aboutVideoInput" 
                           defaultValue={aboutVideoUrl || ""}
                           className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sage-500 outline-none text-sm"
                           placeholder="https://www.youtube.com/embed/..."
                         />
                         <button
                           type="button"
                           onClick={() => {
                             const urlInput = document.getElementById('aboutVideoInput') as HTMLInputElement;
                             if (urlInput && urlInput.value.trim()) {
                               const finalUrl = convertToEmbedUrl(urlInput.value.trim());
                                updateAboutVideo(finalUrl);
                             } else {
                               updateAboutVideo("");
                             }
                           }}
                           className="bg-sage-600 text-white px-4 py-2 rounded-md hover:bg-sage-700 transition shadow-sm text-sm"
                         >
                           Save
                         </button>
                       </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
            
            {activeTab === "marketing" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold text-sage-900">Marketing & Sharing</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 max-w-2xl mb-6">
                  <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Social Media Links</h3>
                  <p className="text-sm text-slate-600 mb-6">Add links to your social media profiles to display in the main application.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number (with country code, e.g. +91XXXXXXXXXX)</label>
                      <input 
                        type="text" 
                        id="whatsappNumberInput"
                        defaultValue={whatsappNumber || ""} 
                        className="w-full px-3 py-2 border rounded-md" 
                        placeholder="+919876543210"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">YouTube Channel URL</label>
                      <input 
                        type="url" 
                        id="youtubeUrlInput"
                        defaultValue={youtubeUrl || ""} 
                        className="w-full px-3 py-2 border rounded-md" 
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Instagram Profile URL</label>
                      <input 
                        type="url" 
                        id="instagramUrlInput"
                        defaultValue={instagramUrl || ""} 
                        className="w-full px-3 py-2 border rounded-md" 
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Profile URL</label>
                      <input 
                        type="url" 
                        id="facebookUrlInput"
                        defaultValue={facebookUrl || ""} 
                        className="w-full px-3 py-2 border rounded-md" 
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div className="flex justify-start">
                      <button 
                        onClick={() => {
                          const wa = (document.getElementById('whatsappNumberInput') as HTMLInputElement).value.trim();
                          const yt = (document.getElementById('youtubeUrlInput') as HTMLInputElement).value.trim();
                          const ig = (document.getElementById('instagramUrlInput') as HTMLInputElement).value.trim();
                          const fb = (document.getElementById('facebookUrlInput') as HTMLInputElement).value.trim();
                          updateSocialLinks(wa, yt, ig, fb);
                          alert('Social links updated successfully!');
                        }}
                        className="bg-sage-600 text-white px-4 py-2 rounded-md hover:bg-sage-700 transition shadow-sm text-sm"
                      >
                        Save Social Links
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-100 max-w-2xl">
                  <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">WhatsApp / Social Media Share Template</h3>
                  <p className="text-sm text-slate-600 mb-6">Select a course to generate a promotional message you can copy and paste into WhatsApp groups or social media.</p>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <select 
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sage-500 outline-none"
                        value={selectedCourseForTemplate}
                        onChange={(e) => setSelectedCourseForTemplate(e.target.value)}
                      >
                        <option value="">-- Select a Course to Generate Template --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                      <select 
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sage-500 outline-none"
                        value={templateLanguage}
                        onChange={(e) => setTemplateLanguage(e.target.value as "en" | "ta")}
                      >
                        <option value="en">English</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                      </select>
                    </div>

                    <div className="relative">
                      <textarea
                        id="share-template"
                        className="w-full h-48 p-4 border border-slate-200 bg-slate-50 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-sage-500 outline-none resize-none"
                        value={shareTemplateText}
                        onChange={(e) => setShareTemplateText(e.target.value)}
                      />
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('share-template') as HTMLTextAreaElement).value;
                          navigator.clipboard.writeText(val);
                          alert('Copied to clipboard! You can now paste it in WhatsApp.');
                        }}
                        className="absolute bottom-4 right-4 flex items-center gap-2 bg-sage-600 text-white px-3 py-1.5 rounded-md hover:bg-sage-700 transition shadow-sm text-sm"
                      >
                        <Copy className="w-4 h-4" /> Copy Text
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quiz Editor Modal */}
            {editingQuizVideoId && editingQuizData && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
                  <div className="p-6 border-b border-sage-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold font-serif text-sage-900">Manage Quiz</h2>
                    <button onClick={() => setEditingQuizVideoId(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-6 flex-1 space-y-6">
                    {editingQuizData.questions.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No questions added yet.</p>
                    ) : (
                      editingQuizData.questions.map((q, idx) => (
                        <div key={q.id} className="border border-sage-100 rounded-lg p-4 bg-sage-50/50 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <span className="bg-sage-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                            <div className="flex-1 space-y-3">
                              <input 
                                type="text" 
                                value={q.text} 
                                onChange={(e) => {
                                  const newQuestions = [...editingQuizData.questions];
                                  newQuestions[idx].text = e.target.value;
                                  setEditingQuizData({ ...editingQuizData, questions: newQuestions });
                                }}
                                className="w-full px-3 py-2 border border-sage-200 rounded-md bg-white font-medium"
                                placeholder="Enter Question text..."
                              />
                              <div className="flex gap-4 items-center">
                                <label className="text-sm font-medium text-slate-700">Type:</label>
                                <select 
                                  value={q.type} 
                                  onChange={(e) => {
                                    const newQuestions = [...editingQuizData.questions];
                                    newQuestions[idx].type = e.target.value as "mcq" | "boolean";
                                    if (e.target.value === "boolean") {
                                      newQuestions[idx].options = ["True", "False"];
                                      newQuestions[idx].correctAnswer = "True";
                                    } else {
                                      newQuestions[idx].options = ["", "", "", ""];
                                      newQuestions[idx].correctAnswer = "";
                                    }
                                    setEditingQuizData({ ...editingQuizData, questions: newQuestions });
                                  }}
                                  className="px-2 py-1 border rounded text-sm bg-white"
                                >
                                  <option value="mcq">Multiple Choice</option>
                                  <option value="boolean">True / False</option>
                                </select>
                              </div>
                              
                              <div className="space-y-2 pl-2 border-l-2 border-sage-200">
                                {(q.options || []).map((opt, optIdx) => (
                                  <div key={optIdx} className="flex gap-2 items-center">
                                    <input 
                                      type="radio" 
                                      name={`correct-${q.id}`} 
                                      checked={q.correctAnswer === opt && opt !== ""}
                                      onChange={() => {
                                        const newQuestions = [...editingQuizData.questions];
                                        newQuestions[idx].correctAnswer = opt;
                                        setEditingQuizData({ ...editingQuizData, questions: newQuestions });
                                      }}
                                    />
                                    {q.type === "mcq" ? (
                                      <input 
                                        type="text" 
                                        value={opt} 
                                        onChange={(e) => {
                                          const newQuestions = [...editingQuizData.questions];
                                          newQuestions[idx].options![optIdx] = e.target.value;
                                          if (q.correctAnswer === opt) {
                                            newQuestions[idx].correctAnswer = e.target.value;
                                          }
                                          setEditingQuizData({ ...editingQuizData, questions: newQuestions });
                                        }}
                                        className="w-full px-2 py-1 text-sm border rounded bg-white"
                                        placeholder={`Option ${optIdx + 1}`}
                                      />
                                    ) : (
                                      <span className="text-sm text-slate-700">{opt}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                const newQuestions = editingQuizData.questions.filter((_, i) => i !== idx);
                                setEditingQuizData({ ...editingQuizData, questions: newQuestions });
                              }}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    
                    <button 
                      onClick={() => {
                        const newQuestions = [...editingQuizData.questions, {
                          id: `q-${Date.now()}`,
                          text: "",
                          type: "mcq" as const,
                          options: ["", "", "", ""],
                          correctAnswer: ""
                        }];
                        setEditingQuizData({ ...editingQuizData, questions: newQuestions });
                      }}
                      className="w-full py-3 border-2 border-dashed border-sage-300 rounded-lg text-sage-600 font-medium hover:bg-sage-50 transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Question
                    </button>
                  </div>
                  <div className="p-6 border-t border-sage-100 flex justify-end gap-3 sticky bottom-0 bg-white z-10">
                    <button onClick={() => setEditingQuizVideoId(null)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-md transition">Cancel</button>
                    <button 
                      onClick={() => {
                        // validation
                        for (const q of editingQuizData.questions) {
                          if (!q.text) return alert("All questions must have text");
                          if (q.type === "mcq" && q.options?.some(o => !o)) return alert("All MCQ options must be filled");
                          if (!q.correctAnswer) return alert("Please select a correct answer for all questions");
                        }
                        const v = videos.find(vid => vid.id === editingQuizVideoId);
                        if (v) {
                          updateVideo({ ...v, quiz: editingQuizData });
                          setEditingQuizVideoId(null);
                        }
                      }} 
                      className="px-5 py-2 bg-sage-600 text-white font-medium rounded-md hover:bg-sage-700 transition"
                    >
                      Save Quiz
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
