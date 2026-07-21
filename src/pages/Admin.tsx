import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { getOAuthToken } from "../lib/oauth";
import { Users, BookOpen, Video as VideoIcon, Plus, Edit2, Trash2, X, Check, Image as ImageIcon, Upload, Share2, Copy, ListChecks, Activity, Headphones, Download, ExternalLink } from "lucide-react";
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
  if (trimmed.startsWith("data:")) return trimmed;
  
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
    founderVideoUrl, aboutVideoUrl, whatsappNumber, youtubeUrl, instagramUrl, facebookUrl, shareTemplate,
    muthraIconUrl, acupressureIconUrl, foodIconUrl,
    appointmentSettings, updateAppointmentSettings,
    addCourse, updateCourse, deleteCourse, 
    addStudent, updateStudent, deleteStudent, 
    updateAppointmentStatus, deleteAppointment,
    addVideo, updateVideo, deleteVideo, updateLogo,
    updateFounderVideo, updateAboutVideo, updateSocialLinks,
    addHeroImage, removeHeroImage, updateHeroOverlay, updateGpayQr, addTestimonialVideo, removeTestimonialVideo, updateFeatureIcons,
    webinarVisible, updateWebinarVisible, loginStudent
  } = useStore();
  const navigate = useNavigate();
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
  const [newCourse, setNewCourse] = useState<Course>({ id: "", title: "", duration: "", description: "", imageUrl: "", videoUrl: "", fee: "", launchDate: "", isWebinar: false, isOffline: false, meetLink: "", trackerPdfUrl: "", dietWorksheetUrl: "" });

  const [showVideoForm, setShowVideoForm] = useState(false);
  const [newVideo, setNewVideo] = useState<{ courseId: string; title: string; duration: string; thumbnail: string; url: string; materialUrl?: string }>({ courseId: "", title: "", duration: "", thumbnail: "", url: "", materialUrl: "" });

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentData, setEditingStudentData] = useState<Student | null>(null);
  const [viewingTrackerStudentId, setViewingTrackerStudentId] = useState<string | null>(null);

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourseData, setEditingCourseData] = useState<Course | null>(null);

  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingVideoData, setEditingVideoData] = useState<Video | null>(null);
  
  const [editingQuizVideoId, setEditingQuizVideoId] = useState<string | null>(null);
  const [editingQuizData, setEditingQuizData] = useState<Quiz | null>(null);

  const [templateLanguage, setTemplateLanguage] = useState<"en" | "ta">("en");
  const [templateLayout, setTemplateLayout] = useState<"video-top" | "video-bottom">("video-top");
  const [selectedCourseForTemplate, setSelectedCourseForTemplate] = useState<string>("");
  const [shareTemplateText, setShareTemplateText] = useState<string>(`🌟 *Welcome to Our Platform!* 🌟\n\nExplore our latest courses and sign up today!\n\n🔗 *Visit:*\nhttps://selvalakshmihealtheducation.in`);

  const [feeInput, setFeeInput] = useState<number | "">(appointmentSettings?.fee ?? 100);
  const [meetLinkInput, setMeetLinkInput] = useState<string>(appointmentSettings?.defaultMeetLink || "");
  const [razorpayKeyIdInput, setRazorpayKeyIdInput] = useState<string>(appointmentSettings?.razorpayKeyId || "");

  const [testimonyTitle, setTestimonyTitle] = useState("");
  const [testimonyUrl, setTestimonyUrl] = useState("");
  const [testimonyUploadType, setTestimonyUploadType] = useState<"link" | "audio" | "video">("link");
  const [isSavingTestimony, setIsSavingTestimony] = useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);

  // States for explicit save options in Course Media Assets Helper
  const [helperVideoFile, setHelperVideoFile] = useState<File | null>(null);
  const [helperVideoDataUrl, setHelperVideoDataUrl] = useState<string | null>(null);
  const [helperPosterFile, setHelperPosterFile] = useState<File | null>(null);
  const [helperPosterDataUrl, setHelperPosterDataUrl] = useState<string | null>(null);

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
    setNewCourse({ id: "", title: "", duration: "", description: "", imageUrl: "", videoUrl: "", fee: "", launchDate: "", isWebinar: false, isOffline: false, meetLink: "", trackerPdfUrl: "" });
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

      const isVideoUploaded = course.videoUrl && (course.videoUrl.startsWith("data:") || course.videoUrl === "chunked");
      const isTestimonyUploaded = testimonyUrl && (testimonyUrl.startsWith("data:") || testimonyUrl === "chunked");

      const getPublicBaseUrl = () => {
        return "https://selvalakshmihealtheducation.in";
      };

      const publicBaseUrl = getPublicBaseUrl();
      const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
      const registerUrl = `${cleanBaseUrl}/#/register?course=${course.id}`;

      const hookText = shareTemplate ? `${shareTemplate}\n\n` : '';

      if (templateLanguage === "en") {
        const testimonyLineEn = isTestimonyUploaded
          ? `\n\n🗣️ *Testimony Video:* Playable on our homepage!`
          : (testimonyUrl ? `\n🗣️ *Testimony Video:*\n${testimonyUrl}` : "");

        const videoLineEn = (isVideoUploaded || templateLayout === "video-top")
          ? `\n📺 *Course Video/Audio:* Playable directly on the registration link!`
          : (cleanCourseVideoUrl ? `\n📺 *Course Promotion Video:*\n${cleanCourseVideoUrl}` : "");

        let posterLineEn = "";
        if (course.imageUrl) {
          if (course.imageUrl.startsWith("http")) {
            posterLineEn = `\n🖼️ *Course Poster:*\n${course.imageUrl}`;
          } else {
            posterLineEn = `\n🖼️ *[Attach the Course Poster Image]*`;
          }
        }

        const phoneNo = whatsappNumber ? whatsappNumber : "+91 90428 21999";

        const bodyContentEn = `Hello! 👋

Welcome to *Selvalakshmi Health Education*!
We are excited to share an amazing opportunity to transform your life and health! 🚀

${hookText ? `${hookText}\n` : ""}📍 *Modes of Study Available:*
📍 *Offline Classes:* Practical, hands-on physical labs and classroom training.
💻 *Online Classes:* Learn from anywhere with our advanced interactive student app.

🌟 *Explore our industry-leading program:*
🎓 *Course Name:* ${course.title}
⏱️ *Duration:* ${course.duration}
💰 *Course Fee:* ${course.fee ? (course.fee.toLowerCase() === 'free' || course.fee.includes('₹') ? course.fee : `₹${course.fee}`) : "Free"}

✨ *Join us to get:*
✅ Flexible Class Schedules
✅ 100% Practical & Natural Therapies
✅ Industry Expert Mentorship & Diet Support

Ready to get started or learn more?
👉 *Fill out this quick inquiry form and we'll get right back to you:*
${registerUrl}
${videoLineEn}${testimonyLineEn}${posterLineEn}

📞 *Or reach us directly on Call / WhatsApp:* ${phoneNo}

Let's build a healthier future together! ⭐️

🔗 *For Admission:* ${registerUrl}`;

        if (templateLayout === "video-top") {
          const topVideoUrl = (cleanCourseVideoUrl && !isVideoUploaded) 
            ? cleanCourseVideoUrl 
            : ((testimonyUrl && !isTestimonyUploaded) ? testimonyUrl : "");

          if (topVideoUrl) {
            setShareTemplateText(`${topVideoUrl}\n\n${bodyContentEn}`);
          } else {
            setShareTemplateText(bodyContentEn);
          }
        } else {
          setShareTemplateText(bodyContentEn);
        }
      } else { 
        const testimonyLineTa = isTestimonyUploaded
          ? `\n🗣️ *பயிற்சியாளர் கருத்து:* எங்கள் முகப்புப் பக்கத்தில் கேட்கலாம்!`
          : (testimonyUrl ? `\n🗣️ *பயிற்சியாளர் கருத்து:*\n${testimonyUrl}` : "");

        const videoLineTa = (isVideoUploaded || templateLayout === "video-top")
          ? `\n📺 *வகுப்பு வீடியோ/ஆடியோ:* பதிவு செய்யும் பக்கத்தில் நேரடியாகக் கேட்கலாம்!`
          : (cleanCourseVideoUrl ? `\n📺 *வகுப்பு விளம்பர வீடியோ:*\n${cleanCourseVideoUrl}` : "");

        let posterLineTa = "";
        if (course.imageUrl) {
          if (course.imageUrl.startsWith("http")) {
            posterLineTa = `\n🖼️ *வகுப்பு போஸ்டர்:*\n${course.imageUrl}`;
          } else {
            posterLineTa = `\n🖼️ *[வகுப்பு போஸ்டர் படத்தை இத்துடன் இணைக்கவும்]*`;
          }
        }

        const phoneNo = whatsappNumber ? whatsappNumber : "+91 90428 21999";

        const bodyContentTa = `வணக்கம்! 👋

*செல்வலட்சுமி ஹெல்த் எஜுகேஷன்* உங்களை அன்போடு வரவேற்கிறது!
உங்கள் ஆரோக்கியத்தையும் வாழ்க்கை முறையையும் மாற்றுவதற்கான ஒரு அருமையான வாய்ப்பைப் பகிர்ந்து கொள்வதில் நாங்கள் மகிழ்ச்சியடைகிறோம்! 🚀

${hookText ? `${hookText}\n` : ""}📍 *வகுப்புகள் நடைபெறும் முறைகள்:*
📍 *நேரடி வகுப்புகள் (Offline):* நேரடி பயிற்சி மற்றும் செயல்முறை விளக்கங்கள்.
💻 *ஆன்லைன் வகுப்புகள் (Online):* எங்கள் மேம்பட்ட செயலி மூலம் எந்த இடத்திலிருந்தும் கற்கலாம்.

🌟 *எங்கள் புதிய வகுப்பில் இணையுங்கள்:*
🎓 *வகுப்பு பெயர்:* ${course.title}
⏱️ *கால அளவு:* ${course.duration}
💰 *கட்டணம்:* ${course.fee ? (course.fee.toLowerCase() === 'free' || course.fee.includes('₹') ? course.fee : `₹${course.fee}`) : "இலவசம்"}

✨ *எங்களோடு இணைவதன் நன்மைகள்:*
✅ நெகிழ்வான வகுப்பு நேரங்கள் (Flexible Schedules)
✅ 100% இயற்கை மற்றும் சுய-குணப்படுத்தும் பயிற்சிகள்
✅ சிறந்த நிபுணர்களின் வழிகாட்டுதல் & உணவு ஆலோசனை

வகுப்பில் சேர அல்லது மேலும் விவரங்கள் அறிய:
👉 *இந்த எளிய விண்ணப்பப் படிவத்தைப் பூர்த்தி செய்யவும்:*
${registerUrl}
${videoLineTa}${testimonyLineTa}${posterLineTa}

📞 *நேரடித் தொடர்புக்கு (அழைப்பு / வாட்ஸ்அப்):* ${phoneNo}

ஆரோக்கியமான எதிர்காலத்தை ஒன்றிணைந்து உருவாக்குவோம்! ⭐️

🔗 *இப்போதே பதிவு செய்ய:* ${registerUrl}`;

        if (templateLayout === "video-top") {
          const topVideoUrl = (cleanCourseVideoUrl && !isVideoUploaded) 
            ? cleanCourseVideoUrl 
            : ((testimonyUrl && !isTestimonyUploaded) ? testimonyUrl : "");

          if (topVideoUrl) {
            setShareTemplateText(`${topVideoUrl}\n\n${bodyContentTa}`);
          } else {
            setShareTemplateText(bodyContentTa);
          }
        } else {
          setShareTemplateText(bodyContentTa);
        }
      }
    } else {
      const getPublicBaseUrl = () => {
        return "https://selvalakshmihealtheducation.in";
      };
      
      const publicBaseUrl = getPublicBaseUrl();
      const cleanBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;

      const hookText = shareTemplate ? `${shareTemplate}\n\n` : '';

      if (templateLanguage === "en") {
        setShareTemplateText(`${hookText}🌟 *Welcome to Our Platform!* 🌟\n\nExplore our latest courses and sign up today!\n\n🔗 *Visit:*\n${cleanBaseUrl}`);
      } else {
        setShareTemplateText(`${hookText}🌟 *எங்கள் தளத்திற்கு வருக!* 🌟\n\nஎங்கள் புதிய வகுப்புகளைத் தேர்ந்தெடுத்து இன்றே இணையுங்கள்!\n\n🔗 *தொடர்புக்கு:*\n${cleanBaseUrl}`);
      }
    }
  }, [selectedCourseForTemplate, templateLanguage, templateLayout, courses, testimonialVideos, shareTemplate]);

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

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("File is too large. Please upload a PDF under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          callback(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      // With chunked Firestore uploading, we can easily support files up to 15MB.
      if (file.size > 15000000) {
        alert("Uploaded promotional/audio files must be under 15MB.\n\nTips:\n- Compress your video/audio file using a free online compressor.\n- Or, upload the video to YouTube (highly recommended) and simply paste the YouTube watch/embed link!");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          callback(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
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

  const handleTestimonialFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "audio" | "video") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2200000) {
        alert(`The selected file is too large (${(file.size / 1024 / 1024).toFixed(2)}MB).\n\nDue to database storage limitations, direct file uploads must be under 2MB to prevent save errors.\n\nTips:\n- For audio: Use a compressed format (such as a lower-bitrate MP3 or AAC) or a shorter recording.\n- For video: We highly recommend uploading your video to YouTube and pasting the link, or compressing your video to a small size!`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTestimonyUrl(event.target.result as string);
          setTestimonyUploadType(type);
          alert(`${type === "audio" ? "Audio" : "Video"} file loaded successfully! Click the "Save Testimonial" button below to store it.`);
        }
      };
      reader.readAsDataURL(file);
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
                                {course?.isOffline && (
                                  <div className="mt-2">
                                    {student.bloodReportUrl ? (
                                      <a 
                                        href={student.bloodReportUrl} 
                                        download={`Blood_Report_${student.firstName}_${student.lastName}.pdf`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded font-semibold border border-red-200"
                                        title="View/Download Blood Report"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block shrink-0" />
                                        🩸 Blood Report
                                      </a>
                                    ) : (
                                      <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 font-medium inline-block">
                                        ⚠️ Report Missing
                                      </span>
                                    )}
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
                                <button title="View Tracker" onClick={() => setViewingTrackerStudentId(student.id)} className="p-1 text-sage-600 hover:bg-sage-50 rounded"><Activity className="w-4 h-4"/></button>
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
                      {!newCourse.isOffline && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Launch Date</label>
                          <input type="date" className="w-full px-3 py-2 border rounded-md" value={newCourse.launchDate || ''} onChange={e => setNewCourse({...newCourse, launchDate: e.target.value})} />
                        </div>
                      )}
                      {newCourse.isOffline && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Image URL or Upload Thumbnail</label>
                          <div className="flex gap-2">
                            <input type="url" className="flex-1 px-3 py-2 border rounded-md" value={newCourse.imageUrl || ''} onChange={e => setNewCourse({...newCourse, imageUrl: e.target.value})} placeholder="Image URL" />
                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-2 rounded-md flex items-center justify-center">
                              <Upload className="w-4 h-4 mr-1" />
                              <span className="text-sm">Upload</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  resizeImage(file, 800, 600, (url) => setNewCourse({...newCourse, imageUrl: url}));
                                }
                              }} />
                            </label>
                          </div>
                        </div>
                      )}
                      {!newCourse.isOffline && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                          <input type="url" className="w-full px-3 py-2 border rounded-md" value={newCourse.imageUrl || ''} onChange={e => setNewCourse({...newCourse, imageUrl: e.target.value})} />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course Promotion Video (YouTube Link or Upload Video File)</label>
                        <div className="flex gap-2">
                          <input type="url" className="flex-1 px-3 py-2 border rounded-md text-sm" value={newCourse.videoUrl || ''} onChange={e => setNewCourse({...newCourse, videoUrl: e.target.value})} placeholder="YouTube Link or pasted base64 video" />
                          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-2 rounded-md flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4 mr-1" />
                            <span className="text-sm">Upload</span>
                            <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => handleVideoUpload(e, (url) => setNewCourse({...newCourse, videoUrl: url}))} />
                          </label>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">Recommended: Upload to YouTube and paste link, or upload a direct video/audio file under 2MB.</span>
                      </div>
                      <div className="flex flex-col justify-center gap-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input type="checkbox" className="rounded" checked={newCourse.isWebinar || false} onChange={e => setNewCourse({...newCourse, isWebinar: e.target.checked})} />
                          This is a Live Webinar
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input type="checkbox" className="rounded" checked={newCourse.isOffline || false} onChange={e => setNewCourse({...newCourse, isOffline: e.target.checked})} />
                          This is an Offline Course
                        </label>
                      </div>
                      {newCourse.isWebinar && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Google Meet Link</label>
                          <input type="url" placeholder="https://meet.google.com/..." className="w-full px-3 py-2 border rounded-md" value={newCourse.meetLink || ''} onChange={e => setNewCourse({...newCourse, meetLink: e.target.value})} />
                        </div>
                      )}
                      {newCourse.isOffline && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Diet Worksheet PDF URL or Upload</label>
                          <div className="flex gap-2">
                            <input type="url" placeholder="Link to diet worksheet PDF" className="w-full px-3 py-2 border rounded-md" value={newCourse.dietWorksheetUrl || ''} onChange={e => setNewCourse({...newCourse, dietWorksheetUrl: e.target.value})} />
                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-2 rounded-md flex items-center justify-center shrink-0">
                              <Upload className="w-4 h-4 mr-1" />
                              <span className="text-sm">Upload</span>
                              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handlePdfUpload(e, (url) => setNewCourse({...newCourse, dietWorksheetUrl: url}))} />
                            </label>
                          </div>
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
                            <input type="text" className="flex-1 px-2 py-1 border rounded" value={editingCourseData.duration} onChange={(e) => setEditingCourseData({...editingCourseData, duration: e.target.value})} placeholder="Duration" />
                            <input type="text" className="flex-1 px-2 py-1 border rounded" value={editingCourseData.fee || ''} onChange={(e) => setEditingCourseData({...editingCourseData, fee: e.target.value})} placeholder="Fee (e.g. Free or ₹3000)" />
                            {!editingCourseData.isOffline && (
                              <input type="date" className="flex-1 px-2 py-1 border rounded" value={editingCourseData.launchDate || ''} onChange={(e) => setEditingCourseData({...editingCourseData, launchDate: e.target.value})} placeholder="Launch Date" />
                            )}
                          </div>
                          <textarea rows={2} className="w-full px-2 py-1 border rounded flex-1" value={editingCourseData.description} onChange={(e) => setEditingCourseData({...editingCourseData, description: e.target.value})} placeholder="Description" />
                          {editingCourseData.isOffline ? (
                            <div className="flex gap-2">
                              <input type="url" className="flex-1 px-2 py-1 border rounded" value={editingCourseData.imageUrl || ''} onChange={(e) => setEditingCourseData({...editingCourseData, imageUrl: e.target.value})} placeholder="Image URL" />
                              <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2 py-1 rounded flex items-center justify-center">
                                <Upload className="w-3 h-3 mr-1" />
                                <span className="text-xs">Upload</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    resizeImage(file, 800, 600, (url) => setEditingCourseData({...editingCourseData, imageUrl: url}));
                                  }
                                }} />
                              </label>
                            </div>
                          ) : (
                            <input type="url" className="w-full px-2 py-1 border rounded" value={editingCourseData.imageUrl || ''} onChange={(e) => setEditingCourseData({...editingCourseData, imageUrl: e.target.value})} placeholder="Image URL" />
                          )}
                          <div className="flex gap-2">
                            <input type="url" className="flex-1 px-2 py-1 border rounded" value={editingCourseData.videoUrl || ''} onChange={(e) => setEditingCourseData({...editingCourseData, videoUrl: e.target.value})} placeholder="Course Promotion Video URL" />
                            <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2 py-1 rounded flex items-center justify-center shrink-0">
                              <Upload className="w-3 h-3 mr-1" />
                              <span className="text-xs">Upload Video/Audio</span>
                              <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => handleVideoUpload(e, (url) => setEditingCourseData({...editingCourseData, videoUrl: url}))} />
                            </label>
                          </div>
                          <span className="text-[10px] text-slate-500 block">Recommended: YouTube link or direct video/audio file under 2MB.</span>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={editingCourseData.isWebinar || false} onChange={e => setEditingCourseData({...editingCourseData, isWebinar: e.target.checked})} />
                            Webinar Program
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={editingCourseData.isOffline || false} onChange={e => setEditingCourseData({...editingCourseData, isOffline: e.target.checked})} />
                            Offline Course
                          </label>
                          {editingCourseData.isWebinar && (
                             <input type="url" className="w-full px-2 py-1 border rounded" value={editingCourseData.meetLink || ''} onChange={(e) => setEditingCourseData({...editingCourseData, meetLink: e.target.value})} placeholder="Google Meet Link" />
                          )}
                          {editingCourseData.isOffline && (
                             <div className="space-y-2">

                               <div className="flex gap-2">
                                 <input type="url" className="flex-1 px-2 py-1 border rounded" value={editingCourseData.dietWorksheetUrl || ''} onChange={(e) => setEditingCourseData({...editingCourseData, dietWorksheetUrl: e.target.value})} placeholder="Diet Worksheet PDF URL" />
                                 <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2 py-1 rounded flex items-center justify-center">
                                   <Upload className="w-3 h-3 mr-1" />
                                   <span className="text-xs">Upload Diet</span>
                                   <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handlePdfUpload(e, (url) => setEditingCourseData({...editingCourseData, dietWorksheetUrl: url}))} />
                                 </label>
                               </div>
                             </div>
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
                          {course.duration} {course.fee && `• ${(course.fee.toLowerCase() === 'free' || course.fee.includes('₹')) ? course.fee : `₹${course.fee}`}`} {!course.isOffline && course.launchDate && `• 🚀 ${formatDateString(course.launchDate)}`}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">{course.description}</p>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
                          <button
                            onClick={() => {
                              loginStudent(`MOCK-STUDENT-${course.id}`);
                              navigate("/dashboard");
                            }}
                            className="bg-sage-50 text-sage-700 hover:bg-sage-100 border border-sage-200 text-xs px-3 py-1.5 rounded-md font-medium transition inline-flex items-center gap-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            View Student Portal
                          </button>
                          <div className="text-xs text-slate-400 font-mono">ID: {course.id}</div>
                        </div>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Video Link (YouTube/pasted URL) or Upload Video/Audio File</label>
                        <div className="flex gap-2">
                          <input type="text" className="flex-1 px-3 py-2 border rounded-md text-sm" value={(newVideo.url && newVideo.url.startsWith("data:")) ? "Uploaded Direct Video/Audio File" : (newVideo.url || '')} onChange={e => setNewVideo({...newVideo, url: e.target.value})} placeholder="https://youtube.com/shorts/..." />
                          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-2 rounded-md flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4 mr-1" />
                            <span className="text-sm">Upload File</span>
                            <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => handleVideoUpload(e, (url) => {
                              const defaultThumb = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&auto=format&fit=crop&q=60";
                              setNewVideo({...newVideo, url: url, thumbnail: newVideo.thumbnail || defaultThumb});
                            })} />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail (Image URL or Upload Image)</label>
                        <div className="flex gap-2">
                          <input required type="url" className="flex-1 px-3 py-2 border rounded-md text-sm" value={newVideo.thumbnail || ''} onChange={e => setNewVideo({...newVideo, thumbnail: e.target.value})} placeholder="https://..." />
                          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-2 rounded-md flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4 mr-1" />
                            <span className="text-sm">Upload Poster</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                resizeImage(file, 400, 300, (url) => {
                                  setNewVideo({...newVideo, thumbnail: url});
                                });
                              }
                            }} />
                          </label>
                        </div>
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
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Title</label>
                                <input type="text" className="w-full px-2 py-1 border rounded text-sm bg-white" value={editingVideoData.title} onChange={(e) => setEditingVideoData({...editingVideoData, title: e.target.value})} placeholder="Title" />
                                
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                                <input type="text" className="w-full px-2 py-1 border rounded text-sm bg-white" value={editingVideoData.duration} onChange={(e) => setEditingVideoData({...editingVideoData, duration: e.target.value})} placeholder="Duration" />
                                
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Video (YouTube URL or Upload File)</label>
                                <div className="flex gap-1.5">
                                  <input type="text" className="flex-1 px-2 py-1 border rounded text-xs bg-white" value={(editingVideoData.url && editingVideoData.url.startsWith("data:")) ? "Uploaded File" : (editingVideoData.url || '')} onChange={(e) => setEditingVideoData({...editingVideoData, url: e.target.value})} placeholder="Video URL" />
                                  <label className="cursor-pointer bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-1.5 py-1 rounded flex items-center justify-center shrink-0">
                                    <Upload className="w-3 h-3" />
                                    <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => handleVideoUpload(e, (url) => setEditingVideoData({...editingVideoData, url: url}))} />
                                  </label>
                                </div>
                                
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Thumbnail (URL or Upload Image)</label>
                                <div className="flex gap-1.5">
                                  <input type="url" className="flex-1 px-2 py-1 border rounded text-xs bg-white" value={editingVideoData.thumbnail} onChange={(e) => setEditingVideoData({...editingVideoData, thumbnail: e.target.value})} placeholder="Thumbnail URL" />
                                  <label className="cursor-pointer bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-1.5 py-1 rounded flex items-center justify-center shrink-0">
                                    <Upload className="w-3 h-3" />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        resizeImage(file, 400, 300, (url) => {
                                          setEditingVideoData({...editingVideoData, thumbnail: url});
                                        });
                                      }
                                    }} />
                                  </label>
                                </div>
                                
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Material URL</label>
                                <input type="url" className="w-full px-2 py-1 border rounded text-sm bg-white" value={editingVideoData.materialUrl || ''} onChange={(e) => setEditingVideoData({...editingVideoData, materialUrl: e.target.value})} placeholder="Material (Worksheet) URL" />
                                
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
                  <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Student Testimonials (Videos & Audios)</h3>
                  <div className="space-y-6">
                    <p className="text-sm text-slate-600">
                      Add student feedback. You can paste a YouTube video link, an audio URL, or upload audio/video files (limited to 2MB). For high-quality media, uploading to YouTube is highly recommended.
                    </p>

                    {/* Testimony Firestore Quota Warning */}
                    <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3.5 text-xs text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-950 text-[13px]">
                        <span className="text-base leading-none">⚠️</span>
                        <span>Important: Prevent Database Rate Exceeded / Quota Errors</span>
                      </div>
                      <p className="opacity-95 leading-relaxed">
                        Uploading direct video or audio files uses heavy database writes. Since you are on the <strong>Firebase Spark (Free) Plan</strong>, this will cause <strong>"Rate Exceeded"</strong> or <strong>"Quota Exceeded"</strong> errors very quickly.
                      </p>
                      <p className="text-emerald-800 font-bold">
                        💡 Best Practice: Select "Web Link" and paste a YouTube video/audio link instead! This is 100% free, loads instantly, and has zero quota limits!
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Testimonial Form</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">STUDENT NAME / TITLE</label>
                          <input 
                            type="text"
                            value={testimonyTitle}
                            onChange={(e) => setTestimonyTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sage-500 outline-none text-sm bg-white text-slate-800"
                            placeholder="e.g. 'Karthik - Asthma Recovery'"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">SOURCE TYPE</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTestimonyUploadType("link");
                                setTestimonyUrl("");
                              }}
                              className={cn(
                                "py-1.5 px-3 rounded text-xs font-semibold border transition text-center cursor-pointer",
                                testimonyUploadType === "link"
                                  ? "bg-sage-600 text-white border-sage-600 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              Web Link
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTestimonyUploadType("audio");
                                setTestimonyUrl("");
                              }}
                              className={cn(
                                "py-1.5 px-3 rounded text-xs font-semibold border transition text-center cursor-pointer",
                                testimonyUploadType === "audio"
                                  ? "bg-sage-600 text-white border-sage-600 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              Upload Audio
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTestimonyUploadType("video");
                                setTestimonyUrl("");
                              }}
                              className={cn(
                                "py-1.5 px-3 rounded text-xs font-semibold border transition text-center cursor-pointer",
                                testimonyUploadType === "video"
                                  ? "bg-sage-600 text-white border-sage-600 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              Upload Video
                            </button>
                          </div>
                        </div>

                        {testimonyUploadType === "link" ? (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">YOUTUBE OR AUDIO LINK</label>
                            <input 
                              type="url"
                              value={testimonyUrl}
                              onChange={(e) => setTestimonyUrl(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sage-500 outline-none text-sm bg-white text-slate-800"
                              placeholder="Paste YouTube watch/embed link, or direct audio link"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">CHOOSE FILE (Max 2MB)</label>
                            <div className="flex items-center gap-3">
                              <label className="cursor-pointer bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded-md flex items-center justify-center gap-1.5 transition text-sm font-semibold shadow-sm">
                                <Upload className="w-4 h-4 text-slate-500" />
                                <span>Choose {testimonyUploadType === "audio" ? "Audio" : "Video"}</span>
                                <input 
                                  type="file" 
                                  accept={testimonyUploadType === "audio" ? "audio/*" : "video/*"}
                                  className="hidden" 
                                  onChange={(e) => handleTestimonialFileUpload(e, testimonyUploadType as "audio" | "video")} 
                                />
                              </label>
                              <div className="text-xs text-slate-500 truncate flex-1">
                                {testimonyUrl ? (
                                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                                    <Check className="w-4 h-4" /> File loaded successfully!
                                  </span>
                                ) : (
                                  <span>No file selected</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={isSavingTestimony}
                            onClick={async () => {
                              if (!testimonyTitle.trim()) {
                                alert("Please provide a Title / Student Name.");
                                return;
                              }
                              if (!testimonyUrl.trim()) {
                                alert(`Please ${testimonyUploadType === "link" ? "paste a link" : "select a file"} first.`);
                                return;
                              }
                              
                              setIsSavingTestimony(true);
                              try {
                                const finalUrl = testimonyUploadType === "link" ? convertToEmbedUrl(testimonyUrl.trim()) : testimonyUrl;
                                await addTestimonialVideo(testimonyTitle.trim(), finalUrl, testimonyUploadType);
                                
                                setTestimonyTitle("");
                                setTestimonyUrl("");
                                alert("Testimonial saved successfully!");
                              } catch (err: any) {
                                console.error("Error saving testimonial:", err);
                                alert("Failed to save testimonial! If you uploaded a file, it may be too large. Try compressing it under 2MB or hosting it on YouTube.");
                              } finally {
                                setIsSavingTestimony(false);
                              }
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-md transition shadow flex items-center justify-center gap-2 disabled:bg-emerald-400 cursor-pointer"
                          >
                            {isSavingTestimony ? "Saving..." : "Save Testimonial"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {testimonialVideos && testimonialVideos.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        {testimonialVideos.map((video) => {
                          const isAudio = video.type === "audio" || (video.type === undefined && (
                            video.url.toLowerCase().startsWith('data:audio/') || 
                            video.url.toLowerCase().endsWith('.mp3') || 
                            video.url.toLowerCase().endsWith('.wav') || 
                            video.url.toLowerCase().endsWith('.m4a') || 
                            video.url.toLowerCase().endsWith('.ogg') || 
                            video.url.toLowerCase().endsWith('.aac')
                          ));

                          const isUploadedVideo = !isAudio && (
                            video.type === "video" || 
                            video.url.toLowerCase().startsWith('data:video/') || 
                            video.url.toLowerCase().endsWith('.mp4') || 
                            video.url.toLowerCase().endsWith('.webm') || 
                            video.url.toLowerCase().endsWith('.mov') || 
                            video.url.toLowerCase().endsWith('.avi') || 
                            video.url.toLowerCase().endsWith('.mkv')
                          );

                          return (
                            <div key={video.id} className="border border-slate-200 p-3 rounded-lg relative bg-slate-50 flex flex-col justify-between">
                              <button
                                onClick={() => removeTestimonialVideo(video.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition shadow-sm z-10 cursor-pointer"
                                title="Remove Testimony"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <h4 className="font-semibold text-sm mb-2 truncate text-slate-800" title={video.title}>{video.title}</h4>
                              <div className="aspect-video w-full rounded-md overflow-hidden bg-slate-900 flex flex-col justify-center p-3 relative">
                                {isAudio ? (
                                  <div className="text-center space-y-2">
                                    <div className="flex justify-center text-emerald-400">
                                      <Headphones className="w-8 h-8 animate-pulse" />
                                    </div>
                                    <span className="text-xs text-slate-300 block font-medium">Audio Recording</span>
                                    <audio controls className="w-full mt-1 h-8" src={video.url} />
                                  </div>
                                ) : isUploadedVideo ? (
                                  <video 
                                    src={video.url} 
                                    controls 
                                    className="w-full h-full object-contain" 
                                  />
                                ) : (
                                  <iframe 
                                    src={video.url}
                                    title={video.title}
                                    className="w-full h-full"
                                    allowFullScreen
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Custom Share Template Hook (Optional)</label>
                      <textarea
                        id="shareTemplateInput"
                        defaultValue={shareTemplate || ""}
                        className="w-full h-24 p-3 border rounded-md"
                        placeholder="Enter a custom catchphrase or promotional hook to include in the generated share templates..."
                      />
                    </div>
                    <div className="flex justify-start">
                      <button 
                        onClick={() => {
                          const wa = (document.getElementById('whatsappNumberInput') as HTMLInputElement).value.trim();
                          const yt = (document.getElementById('youtubeUrlInput') as HTMLInputElement).value.trim();
                          const ig = (document.getElementById('instagramUrlInput') as HTMLInputElement).value.trim();
                          const fb = (document.getElementById('facebookUrlInput') as HTMLInputElement).value.trim();
                          const st = (document.getElementById('shareTemplateInput') as HTMLTextAreaElement).value.trim();
                          updateSocialLinks(wa, yt, ig, fb, st);
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

                    <div className="bg-sage-50/50 p-3 rounded-lg border border-sage-100/80">
                      <label className="block text-xs font-bold uppercase tracking-wider text-sage-800 mb-2">
                        WhatsApp Message Layout Strategy:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTemplateLayout("video-top")}
                          className={`flex items-center gap-2 p-2 rounded-md border text-xs font-medium transition text-left ${
                            templateLayout === "video-top"
                              ? "bg-sage-600 border-sage-600 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <VideoIcon className="w-4 h-4 shrink-0" />
                          <div>
                            <p className="font-semibold">Video Link at TOP</p>
                            <p className="opacity-85 text-[10px]">Forces WhatsApp video preview card to load</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateLayout("video-bottom")}
                          className={`flex items-center gap-2 p-2 rounded-md border text-xs font-medium transition text-left ${
                            templateLayout === "video-bottom"
                              ? "bg-sage-600 border-sage-600 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          <div>
                            <p className="font-semibold">Register Link at TOP</p>
                            <p className="opacity-85 text-[10px]">Standard layout (Register first, video bottom)</p>
                          </div>
                        </button>
                      </div>
                    </div>

                     <div className="space-y-3">
                      <textarea
                        id="share-template"
                        className="w-full h-48 p-4 border border-slate-200 bg-slate-50 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-sage-500 outline-none resize-none"
                        value={shareTemplateText}
                        onChange={(e) => setShareTemplateText(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => {
                            const val = (document.getElementById('share-template') as HTMLTextAreaElement).value;
                            navigator.clipboard.writeText(val);
                            alert('Copied to clipboard! You can now paste it in WhatsApp.');
                          }}
                          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-lg transition font-bold text-xs"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-600" /> Copy Text
                        </button>
                        
                        <button 
                          onClick={() => {
                            const val = (document.getElementById('share-template') as HTMLTextAreaElement).value;
                            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(val)}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                          className="flex-1 min-w-[150px] flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-2 rounded-lg transition font-bold text-xs shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.705 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
                          </svg>
                          <span>Share on WhatsApp</span>
                        </button>
                        
                        <button 
                          onClick={async () => {
                            const val = (document.getElementById('share-template') as HTMLTextAreaElement).value;
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  text: val,
                                });
                              } catch (err) {
                                console.log("Error sharing:", err);
                              }
                            } else {
                              navigator.clipboard.writeText(val);
                              alert('System sharing not supported on this browser. Text copied to clipboard instead!');
                            }
                          }}
                          className="flex-1 min-w-[130px] flex items-center justify-center gap-2 bg-sage-600 text-white hover:bg-sage-700 px-3 py-2 rounded-lg transition font-bold text-xs shadow-sm"
                        >
                          <Share2 className="w-3.5 h-3.5" /> System Share
                        </button>
                      </div>
                    </div>

                    {/* Live WhatsApp / Social Media Mockup Preview */}
                    {selectedCourseForTemplate && (() => {
                      const selCourse = courses.find(c => c.id === selectedCourseForTemplate);
                      if (!selCourse) return null;
                      
                      const formatWhatsAppPreviewText = (text: string) => {
                        if (!text) return "";
                        // Simple parser for WhatsApp markup
                        // Escape basic HTML characters to avoid broken markup, then swap WhatsApp style tokens
                        const escaped = text
                          .replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;");
                        
                        let formatted = escaped
                          .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
                          .replace(/_(.*?)_/g, "<em>$1</em>")
                          .replace(/~(.*?)~/g, "<del>$1</del>")
                          .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:underline break-all font-medium">$1</a>');
                        
                        return <span dangerouslySetInnerHTML={{ __html: formatted.replace(/\n/g, "<br />") }} />;
                      };

                      return (
                        <div className="mt-6 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Live Social Media / WhatsApp Mockup
                            </span>
                            <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                              How shared message renders
                            </span>
                          </div>

                          <div className="p-4 bg-slate-100 flex justify-center">
                            {/* Device Frame */}
                            <div className="w-full max-w-sm rounded-2xl border-4 border-slate-300 shadow-md bg-[#efeae2] overflow-hidden flex flex-col font-sans">
                              {/* WhatsApp App Header */}
                              <div className="bg-[#075e54] text-white px-3 py-2 flex items-center gap-2.5 shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-[#128c7e] flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
                                  SL
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-xs truncate">Selvalakshmi Health Education</p>
                                  <p className="text-[9px] opacity-85">Online</p>
                                </div>
                                <div className="flex items-center gap-3 opacity-90">
                                  {/* Call icon representational */}
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/></svg>
                                  {/* Options icon */}
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                                </div>
                              </div>

                              {/* Chat Screen Viewport */}
                              <div className="p-3 space-y-3 max-h-[480px] overflow-y-auto">
                                
                                {/* Date Stamp */}
                                <div className="flex justify-center">
                                  <span className="bg-white/80 backdrop-blur-sm text-[10px] text-slate-500 px-2 py-0.5 rounded shadow-xs uppercase font-medium">
                                    Today
                                  </span>
                                </div>

                                {/* Custom Sent Bubble representing the shared message */}
                                <div className="relative bg-[#d9fdd3] text-slate-800 rounded-tr-none rounded-br-lg rounded-l-lg p-2.5 shadow-xs max-w-[90%] ml-auto text-xs space-y-2">
                                  {/* Promo Video Render (at the top of the message bubble) */}
                                  {selCourse.videoUrl && (
                                    <div className="rounded-md overflow-hidden border border-[#bedbb7] bg-black mb-2 shadow-sm">
                                      {(() => {
                                        const videoUrl = selCourse.videoUrl || "";
                                        const isUploaded = videoUrl.startsWith("data:");
                                        const isAudio = videoUrl.toLowerCase().startsWith('data:audio/') || 
                                                        (!isUploaded && (
                                                          videoUrl.toLowerCase().endsWith('.mp3') || 
                                                          videoUrl.toLowerCase().endsWith('.wav') || 
                                                          videoUrl.toLowerCase().endsWith('.m4a') || 
                                                          videoUrl.toLowerCase().endsWith('.ogg') || 
                                                          videoUrl.toLowerCase().endsWith('.aac')
                                                        ));

                                        const isUploadedVideo = !isAudio && (
                                          isUploaded ||
                                          videoUrl.toLowerCase().endsWith('.mp4') || 
                                          videoUrl.toLowerCase().endsWith('.webm') || 
                                          videoUrl.toLowerCase().endsWith('.mov') || 
                                          videoUrl.toLowerCase().endsWith('.avi') || 
                                          videoUrl.toLowerCase().endsWith('.mkv')
                                        );

                                        if (isAudio) {
                                          return (
                                            <div className="w-full bg-[#111b21] p-3 flex items-center gap-3">
                                              <div className="w-9 h-9 rounded-full bg-[#202c33] flex items-center justify-center shrink-0">
                                                <span className="text-emerald-500 text-sm">🎙️</span>
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <audio src={videoUrl} controls className="w-full h-8" />
                                                <p className="text-[10px] text-slate-400 mt-1 px-1 font-semibold">Course Audio Attached</p>
                                              </div>
                                            </div>
                                          );
                                        } else if (isUploadedVideo) {
                                          return (
                                            <div className="w-full aspect-video bg-black relative">
                                              <video 
                                                src={videoUrl} 
                                                controls 
                                                className="w-full h-full object-contain" 
                                              />
                                            </div>
                                          );
                                        } else {
                                          // YouTube embed link
                                          let embedUrl = videoUrl;
                                          if (videoUrl.includes("youtube.com/watch?v=")) {
                                            embedUrl = videoUrl.replace("youtube.com/watch?v=", "youtube.com/embed/");
                                          } else if (videoUrl.includes("youtu.be/")) {
                                            embedUrl = videoUrl.replace("youtu.be/", "youtube.com/embed/");
                                          }
                                          return (
                                            <div className="w-full aspect-video bg-black">
                                              <iframe 
                                                src={embedUrl}
                                                className="w-full h-full border-0"
                                                allowFullScreen
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                              />
                                            </div>
                                          );
                                        }
                                      })()}
                                    </div>
                                  )}

                                  {/* Course Poster Asset (Rendered at top if available and there's no video) */}
                                  {selCourse.imageUrl && !selCourse.videoUrl && (
                                    <div className="rounded-md overflow-hidden border border-[#bedbb7] bg-white mb-2">
                                      <img src={selCourse.imageUrl} alt={selCourse.title} className="w-full h-32 object-cover" />
                                    </div>
                                  )}

                                  {/* Message Text Block with WhatsApp parsers */}
                                  <div className="whitespace-pre-wrap leading-relaxed text-slate-800 break-words font-medium">
                                    {formatWhatsAppPreviewText(shareTemplateText)}
                                  </div>

                                  {/* Delivery Metadata (Time + Double Blue Checkmarks) */}
                                  <div className="flex justify-end items-center gap-1 text-[8px] text-slate-500 select-none mt-1">
                                    <span>12:00 PM</span>
                                    <svg className="w-3 h-3 text-sky-500 fill-current" viewBox="0 0 24 24">
                                      <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17l-4.24-4.24-1.41 1.41 5.66 5.66L23.66 7l-1.42-1.41zM.41 13.41L1.82 12l5.66 5.66-1.42 1.41L.41 13.41z"/>
                                    </svg>
                                  </div>
                                </div>

                                {/* Shared Direct Preview Box Footer Card */}
                                <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-xs max-w-[90%] ml-auto text-xs">
                                  <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                    <span className="text-emerald-600 text-sm">🔗</span>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-[10px] text-slate-800 truncate">selvalakshmihealtheducation.in</p>
                                      <p className="text-[9px] text-slate-500 truncate">Register for {selCourse.title}</p>
                                    </div>
                                  </div>
                                  <div className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/70 transition flex items-center justify-between font-bold text-emerald-800 text-[10px] cursor-pointer">
                                    <span>🔗 FOR ADMISSION</span>
                                    <span>➔</span>
                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {selectedCourseForTemplate && courses.find(c => c.id === selectedCourseForTemplate) && (() => {
                      const selCourse = courses.find(c => c.id === selectedCourseForTemplate)!;
                      const hasImage = !!selCourse.imageUrl;
                      const hasVideo = !!selCourse.videoUrl;
                      
                      const triggerImageDownload = () => {
                        if (!selCourse.imageUrl) return;
                        try {
                          const a = document.createElement("a");
                          a.href = selCourse.imageUrl;
                          const safeTitle = selCourse.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
                          a.download = `${safeTitle}_poster.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        } catch (err) {
                          console.error("Failed to download image", err);
                          window.open(selCourse.imageUrl, "_blank");
                        }
                      };

                      const triggerVideoDownload = () => {
                        if (!selCourse.videoUrl) return;
                        try {
                          const videoUrl = selCourse.videoUrl;
                          if (!videoUrl.startsWith("data:")) {
                            window.open(videoUrl, "_blank");
                            return;
                          }

                          const isAudio = videoUrl.toLowerCase().startsWith('data:audio/') || 
                                          videoUrl.toLowerCase().endsWith('.mp3') || 
                                          videoUrl.toLowerCase().endsWith('.wav') || 
                                          videoUrl.toLowerCase().endsWith('.m4a') || 
                                          videoUrl.toLowerCase().endsWith('.ogg') || 
                                          videoUrl.toLowerCase().endsWith('.aac');

                          const a = document.createElement("a");
                          a.href = videoUrl;
                          const safeTitle = selCourse.title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
                          
                          let ext = "mp4";
                          if (isAudio) {
                            if (videoUrl.startsWith("data:audio/mp3") || videoUrl.startsWith("data:audio/mpeg")) ext = "mp3";
                            else if (videoUrl.startsWith("data:audio/wav")) ext = "wav";
                            else if (videoUrl.startsWith("data:audio/m4a")) ext = "m4a";
                            else ext = "mp3";
                          } else {
                            if (videoUrl.startsWith("data:video/webm")) ext = "webm";
                            else if (videoUrl.startsWith("data:video/ogg")) ext = "ogg";
                            else ext = "mp4";
                          }

                          a.download = `${safeTitle}_promo.${ext}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        } catch (err) {
                          console.error("Failed to download video/audio", err);
                          window.open(selCourse.videoUrl, "_blank");
                        }
                      };

                      return (
                        <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                          {/* Easy WhatsApp Sharing Instructions */}
                          <div className="bg-emerald-50 border border-emerald-100/70 rounded-lg p-3 text-xs text-emerald-900 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-emerald-950 text-[13px]">
                              <span className="text-base leading-none">💡</span>
                              <span>How to Share Video/Audio on WhatsApp with Audience:</span>
                            </div>
                            <ol className="list-decimal list-inside space-y-1 text-emerald-950 font-medium opacity-90 pl-1">
                              <li>
                                {selCourse.videoUrl && selCourse.videoUrl.startsWith("data:") ? (
                                  <span>
                                    Click <strong>"Download Video/Audio"</strong> under the video card below to download the file to your phone/PC.
                                  </span>
                                ) : (
                                  <span>
                                    Use the <strong>"Video Link at TOP"</strong> layout so WhatsApp automatically generates a video player card!
                                  </span>
                                )}
                              </li>
                              <li>
                                Click the <strong>"Copy Text"</strong> button above to copy the promotional details.
                              </li>
                              <li>
                                On WhatsApp, <strong>attach/upload the downloaded video file</strong> and <strong>paste the copied text into the caption</strong> before sending!
                              </li>
                            </ol>
                          </div>

                          {/* Firebase Spark Plan Rate Exceeded Warning */}
                          <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3.5 text-xs text-amber-900 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-amber-950 text-[13px]">
                              <span className="text-base leading-none">⚠️</span>
                              <span>Avoiding "Rate Exceeded" / "Quota Exceeded" Errors</span>
                            </div>
                            <p className="opacity-95 leading-relaxed">
                              You are currently on the <strong>Firebase Spark (Free) Plan</strong>. Uploading media files (images, audio, or video) directly uses heavy database chunks and will trigger <strong>"Rate Exceeded"</strong> or <strong>"Quota Exceeded"</strong> errors if multiple files are uploaded.
                            </p>
                            <div className="bg-white/85 rounded-md p-2.5 border border-amber-200 text-[11px] font-medium text-amber-900 space-y-1">
                              <p className="font-bold text-amber-950">🚀 100% Free & Unlimited Solution:</p>
                              <p>1. Upload your video/audio to <strong>YouTube</strong> (as Public or Unlisted).</p>
                              <p>2. Paste the YouTube link in the course details <strong>"Promotion Video URL"</strong> box instead of uploading a file!</p>
                              <p className="text-emerald-800 font-semibold pt-1">This is completely free, loads instantly for your audience, and will never exceed database limits!</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Course Media Assets Helper</h4>
                            {isUploadingAsset && (
                              <div className="flex items-center gap-2 text-xs text-sage-600 font-medium animate-pulse">
                                <div className="w-3.5 h-3.5 border-2 border-sage-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving...</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Course Poster Card */}
                            <div className="border border-slate-200 rounded-lg p-3 bg-white flex flex-col justify-between min-h-[160px]">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">COURSE POSTER</span>
                                {helperPosterDataUrl ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-semibold text-amber-600 mb-1">Pending Save:</span>
                                    <img 
                                      src={helperPosterDataUrl} 
                                      alt="Pending Course Poster" 
                                      className="max-h-24 object-contain rounded border-2 border-amber-300 mb-3 mx-auto animate-pulse"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="text-[10px] text-slate-500 mb-2 truncate max-w-full text-center">{helperPosterFile?.name}</span>
                                  </div>
                                ) : hasImage ? (
                                  <div className="flex flex-col items-center">
                                    {selCourse.imageUrl!.startsWith("data:") ? (
                                      <img 
                                        src={selCourse.imageUrl} 
                                        alt="Course Poster" 
                                        className="max-h-24 object-contain rounded border border-slate-100 mb-3 mx-auto"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="bg-slate-50 border border-dashed rounded p-3 text-center text-xs text-slate-500 mb-3 truncate w-full">
                                        <span className="block font-medium truncate">{selCourse.imageUrl}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-slate-50 border border-dashed rounded-lg p-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center h-24 mb-3">
                                    <ImageIcon className="w-6 h-6 text-slate-300 mb-1" />
                                    <span>No poster image uploaded yet</span>
                                  </div>
                                )}
                              </div>
                              
                              {helperPosterDataUrl ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setHelperPosterFile(null);
                                      setHelperPosterDataUrl(null);
                                    }}
                                    className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-1.5 rounded text-xs font-semibold transition"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setIsUploadingAsset(true);
                                      try {
                                        await updateCourse({ ...selCourse, imageUrl: helperPosterDataUrl });
                                        alert("Course poster image saved successfully!");
                                        setHelperPosterFile(null);
                                        setHelperPosterDataUrl(null);
                                      } catch (err) {
                                        alert("Failed to save poster image.");
                                      } finally {
                                        setIsUploadingAsset(false);
                                      }
                                    }}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded text-xs font-semibold transition"
                                  >
                                    Save Poster
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  {hasImage && (
                                    <button
                                      onClick={triggerImageDownload}
                                      className="flex-1 flex items-center justify-center gap-1 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 py-1.5 rounded text-xs font-semibold transition"
                                    >
                                      <Download className="w-3 h-3" /> Download
                                    </button>
                                  )}
                                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 bg-sage-50 text-sage-800 border border-sage-200 hover:bg-sage-100 py-1.5 rounded text-xs font-semibold transition">
                                    <Upload className="w-3 h-3" />
                                    <span>{hasImage ? "Change" : "Upload Image"}</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      disabled={isUploadingAsset}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          resizeImage(file, 800, 800, (resizedDataUrl) => {
                                            setHelperPosterFile(file);
                                            setHelperPosterDataUrl(resizedDataUrl);
                                          });
                                        }
                                      }} 
                                    />
                                  </label>
                                </div>
                              )}
                            </div>

                            {/* Course Promotion Video Card */}
                            <div className="border border-slate-200 rounded-lg p-3 bg-white flex flex-col justify-between min-h-[160px]">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">COURSE VIDEO / AUDIO (PROMOTIONAL)</span>
                                {helperVideoDataUrl ? (
                                  <div className="flex flex-col items-center w-full">
                                    <span className="text-[11px] font-semibold text-amber-600 mb-1">Pending Save:</span>
                                    <div className="bg-amber-50 border border-dashed border-amber-300 rounded p-3 text-center text-xs text-slate-500 mb-3 truncate w-full flex flex-col items-center justify-center h-24 animate-pulse">
                                      <VideoIcon className="w-6 h-6 text-amber-500 mb-1" />
                                      <span className="block font-medium truncate max-w-full text-[11px] text-slate-700">
                                        {helperVideoFile?.name}
                                      </span>
                                      <span className="text-[9px] text-slate-400 block">
                                        ({(helperVideoFile!.size / (1024 * 1024)).toFixed(2)} MB)
                                      </span>
                                    </div>
                                  </div>
                                ) : hasVideo ? (() => {
                                  const videoUrl = selCourse.videoUrl || "";
                                  const isUploaded = videoUrl.startsWith("data:");
                                  const isAudio = videoUrl.toLowerCase().startsWith('data:audio/') || 
                                                  (!isUploaded && (
                                                    videoUrl.toLowerCase().endsWith('.mp3') || 
                                                    videoUrl.toLowerCase().endsWith('.wav') || 
                                                    videoUrl.toLowerCase().endsWith('.m4a') || 
                                                    videoUrl.toLowerCase().endsWith('.ogg') || 
                                                    videoUrl.toLowerCase().endsWith('.aac')
                                                  ));

                                  const isUploadedVideo = !isAudio && (
                                    isUploaded ||
                                    videoUrl.toLowerCase().endsWith('.mp4') || 
                                    videoUrl.toLowerCase().endsWith('.webm') || 
                                    videoUrl.toLowerCase().endsWith('.mov') || 
                                    videoUrl.toLowerCase().endsWith('.avi') || 
                                    videoUrl.toLowerCase().endsWith('.mkv')
                                  );

                                  return (
                                    <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center relative mb-3">
                                      {isAudio ? (
                                        <div className="w-full p-4 flex flex-col items-center justify-center gap-2">
                                          <Headphones className="w-8 h-8 text-emerald-400 animate-pulse" />
                                          <span className="text-[10px] text-slate-400 font-mono">Audio Preview</span>
                                          <audio src={videoUrl} controls className="w-full max-w-xs h-8" />
                                        </div>
                                      ) : isUploadedVideo ? (
                                        <video src={videoUrl} controls className="w-full h-full object-contain" />
                                      ) : (
                                        <iframe 
                                          src={videoUrl} 
                                          className="w-full h-full border-0" 
                                          allowFullScreen
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        />
                                      )}
                                    </div>
                                  );
                                })() : (
                                  <div className="bg-slate-50 border border-dashed rounded-lg p-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center h-24 mb-3">
                                    <VideoIcon className="w-6 h-6 text-slate-300 mb-1" />
                                    <span>No promotional video or audio uploaded yet</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                {helperVideoDataUrl ? (
                                  <div className="flex gap-2 w-full">
                                    <button
                                      onClick={() => {
                                        setHelperVideoFile(null);
                                        setHelperVideoDataUrl(null);
                                      }}
                                      className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-1.5 rounded text-xs font-semibold transition"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={async () => {
                                        setIsUploadingAsset(true);
                                        try {
                                          await updateCourse({ ...selCourse, videoUrl: helperVideoDataUrl });
                                          alert("Course promotion video/audio file saved successfully!");
                                          setHelperVideoFile(null);
                                          setHelperVideoDataUrl(null);
                                        } catch (err) {
                                          alert("Failed to save video/audio file.");
                                        } finally {
                                          setIsUploadingAsset(false);
                                        }
                                      }}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded text-xs font-semibold transition animate-bounce"
                                    >
                                      Save Video
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2 w-full">
                                    {hasVideo && (
                                      selCourse.videoUrl!.startsWith("data:") ? (
                                        <button
                                          type="button"
                                          onClick={triggerVideoDownload}
                                          className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 py-1.5 rounded text-xs font-semibold transition shadow-sm"
                                        >
                                          <Download className="w-3.5 h-3.5" /> Download File
                                        </button>
                                      ) : (
                                        <a
                                          href={selCourse.videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-1 flex items-center justify-center gap-1 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 py-1.5 rounded text-xs font-semibold transition"
                                        >
                                          <ExternalLink className="w-3 h-3" /> View Video
                                        </a>
                                      )
                                    )}
                                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 py-1.5 rounded text-xs font-semibold transition">
                                      <Upload className="w-3 h-3" />
                                      <span>{hasVideo ? "Change File" : "Upload Video"}</span>
                                      <input 
                                        type="file" 
                                        accept="video/*,audio/*" 
                                        className="hidden" 
                                        disabled={isUploadingAsset}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            // Support files up to 15MB
                                            if (file.size > 15000000) {
                                              alert("Uploaded promotional/audio files must be under 15MB.\n\nTips:\n- Compress your video/audio file using a free online compressor.\n- Or, upload the video to YouTube (highly recommended) and simply paste the YouTube watch/embed link!");
                                              return;
                                            }
                                            setIsUploadingAsset(true);
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              if (event.target?.result) {
                                                setHelperVideoFile(file);
                                                setHelperVideoDataUrl(event.target.result as string);
                                              }
                                              setIsUploadingAsset(false);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }} 
                                      />
                                    </label>
                                  </div>
                                )}
                                
                                {!helperVideoDataUrl && (
                                  <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      id="directYoutubeLinkInput"
                                      placeholder="Or paste link..." 
                                      className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs"
                                      onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                          const val = (e.currentTarget as HTMLInputElement).value.trim();
                                          if (val) {
                                            setIsUploadingAsset(true);
                                            try {
                                              const finalUrl = convertToEmbedUrl(val);
                                              await updateCourse({ ...selCourse, videoUrl: finalUrl });
                                              (e.currentTarget as HTMLInputElement).value = "";
                                              alert("Promotion video link updated successfully!");
                                            } catch (err) {
                                              alert("Failed to update video link.");
                                            } finally {
                                              setIsUploadingAsset(false);
                                            }
                                          }
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={async () => {
                                        const inputEl = document.getElementById("directYoutubeLinkInput") as HTMLInputElement;
                                        const val = inputEl?.value.trim();
                                        if (val) {
                                          setIsUploadingAsset(true);
                                          try {
                                            const finalUrl = convertToEmbedUrl(val);
                                            await updateCourse({ ...selCourse, videoUrl: finalUrl });
                                            inputEl.value = "";
                                            alert("Promotion video link updated successfully!");
                                          } catch (err) {
                                            alert("Failed to update video link.");
                                          } finally {
                                            setIsUploadingAsset(false);
                                          }
                                        } else {
                                          alert("Please enter a URL first.");
                                        }
                                      }}
                                      className="bg-slate-800 text-white px-2 py-1 rounded text-xs hover:bg-slate-900 transition font-medium"
                                    >
                                      Save Link
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            
            {/* Student Tracker View Modal */}
            {viewingTrackerStudentId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                  <div className="sticky top-0 bg-white p-6 border-b border-sage-100 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold font-serif text-sage-900">
                      Student Tracker: {students.find(s => s.id === viewingTrackerStudentId)?.firstName} {students.find(s => s.id === viewingTrackerStudentId)?.lastName}
                    </h2>
                    <button onClick={() => setViewingTrackerStudentId(null)} className="text-slate-400 hover:text-slate-600 transition">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    {(() => {
                      const st = students.find(s => s.id === viewingTrackerStudentId);
                      if (!st) return <p>Student not found.</p>;
                      const tracker = st.healthTracker;
                      return (
                        <>
                          {st.assignmentVideoUrl && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                              <h3 className="font-bold text-slate-800 mb-2">Assignment Video</h3>
                              <a href={st.assignmentVideoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                {st.assignmentVideoUrl}
                              </a>
                            </div>
                          )}
                          {!tracker ? (
                            <p className="text-slate-500 italic">No tracker data submitted yet.</p>
                          ) : (
                            <>
                              <div className="mb-4">
                                <h3 className="font-bold text-slate-800 text-lg">
                                  Condition: <span className="text-sage-700">{tracker.diseaseTitle || "Not specified"}</span>
                                </h3>
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">Diet Tracker (7 Days)</h3>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                      <tr>
                                        <th className="px-4 py-2">Day</th>
                                        <th className="px-4 py-2 text-center">Morning</th>
                                        <th className="px-4 py-2 text-center">Breakfast</th>
                                        <th className="px-4 py-2 text-center">Lunch</th>
                                        <th className="px-4 py-2 text-center">Evening</th>
                                        <th className="px-4 py-2 text-center">Dinner</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[1, 2, 3, 4, 5, 6, 7].map(day => {
                                        const dayData = tracker.dailyDiet[day.toString()];
                                        return (
                                          <tr key={day} className="border-b">
                                            <td className="px-4 py-2 font-medium">Day {day}</td>
                                            <td className="px-4 py-2 text-center">{dayData?.morningDrink ? "✅" : "❌"}</td>
                                            <td className="px-4 py-2 text-center">{dayData?.breakfast ? "✅" : "❌"}</td>
                                            <td className="px-4 py-2 text-center">{dayData?.lunch ? "✅" : "❌"}</td>
                                            <td className="px-4 py-2 text-center">{dayData?.eveningDrink ? "✅" : "❌"}</td>
                                            <td className="px-4 py-2 text-center">{dayData?.dinner ? "✅" : "❌"}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-6 mt-6">
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                  <h3 className="font-bold text-slate-800 mb-3">Blood Test: Day 1</h3>
                                  <p className="text-sm"><span className="text-slate-500">Before Food (Fasting):</span> {tracker.bloodTestDay1?.fastingSugar || "-"}</p>
                                  <p className="text-sm"><span className="text-slate-500">After Food (Post-Prandial):</span> {tracker.bloodTestDay1?.postPrandialSugar || "-"}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                  <h3 className="font-bold text-slate-800 mb-3">Blood Test: Day 8</h3>
                                  <p className="text-sm"><span className="text-slate-500">Before Food (Fasting):</span> {tracker.bloodTestDay8?.fastingSugar || "-"}</p>
                                  <p className="text-sm"><span className="text-slate-500">After Food (Post-Prandial):</span> {tracker.bloodTestDay8?.postPrandialSugar || "-"}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
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
