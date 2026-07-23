import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ArrowRight, Leaf, Heart, BookOpen, Youtube, Instagram, MessageCircle, Hand, Target, Headphones, Play, Pause, Volume2, Share2, Copy, Check, X } from "lucide-react";
import { cn } from "../lib/utils";
import { TestimonialVideo } from "../types";
import { shareToWhatsApp, openExternalUrl } from "../lib/share";

export function Home() {
  const { courses, logoUrl, heroImages, heroOverlayColor, heroOverlayOpacity, testimonialVideos, founderVideoUrl, aboutVideoUrl, whatsappNumber, youtubeUrl, instagramUrl, muthraIconUrl, acupressureIconUrl, foodIconUrl, webinarVisible, isAdmin } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeShareVideo, setActiveShareVideo] = useState<TestimonialVideo | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharedTestimony, setSharedTestimony] = useState<TestimonialVideo | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const testimonyId = params.get("testimony");
    if (testimonyId && testimonialVideos && testimonialVideos.length > 0) {
      const found = testimonialVideos.find(v => v.id === testimonyId);
      if (found) {
        setSharedTestimony(found);
        // Also scroll to testimonial section with delay so the page loads
        setTimeout(() => {
          const section = document.getElementById("testimonials-section");
          if (section) {
            section.scrollIntoView({ behavior: "smooth" });
          }
        }, 1000);
      }
    }
  }, [testimonialVideos]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getShareUrl = (video: TestimonialVideo) => {
    return `${window.location.origin}${window.location.pathname}?testimony=${video.id}`;
  };

  useEffect(() => {
    if (!heroImages || heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages]);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white py-20 px-4 sm:px-6 lg:px-8 min-h-[600px] flex items-center justify-center" style={{ backgroundColor: heroOverlayColor || '#1A2F23' }}>
        {heroImages && heroImages.length > 0 ? (
          <div className="absolute inset-0 z-0 bg-black">
            {heroImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Slide ${index + 1}`}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
                  index === currentSlide ? "opacity-100" : "opacity-0"
                )}
              />
            ))}
            <div className="absolute inset-0" style={{ backgroundColor: heroOverlayColor || '#1A2F23', opacity: (heroOverlayOpacity ?? 70) / 100 }} />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-black">
             <img 
               src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=1600" 
               alt="Hero Background" 
               className="absolute inset-0 w-full h-full object-cover opacity-100" 
             />
             <div className="absolute inset-0" style={{ backgroundColor: heroOverlayColor || '#1A2F23', opacity: (heroOverlayOpacity ?? 70) / 100 }} />
          </div>
        )}
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full shadow-lg border-2 border-sage-300 mb-6 bg-white flex items-center justify-center overflow-hidden">
            {logoUrl ? (
               <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-5" />
            ) : (
               <Leaf className="w-16 h-16 md:w-20 md:h-20 text-sage-600" />
            )}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-sage-50 leading-tight mb-6 max-w-4xl drop-shadow-md">
            Selvalakshmi Health Education
          </h1>
          <p className="text-lg md:text-xl text-sage-200 mb-10 max-w-2xl font-light leading-relaxed drop-shadow-sm">
            Empower yourself with ancient holistic healing. Join our certified courses in Muthra Acupressure & Natural Foods to restore balance and heal naturally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Link
              to="/register"
              className="bg-sage-300 text-sage-900 font-medium px-6 py-3 rounded-md hover:bg-sage-200 transition-colors shadow-sm inline-flex items-center justify-center gap-2"
            >
              Course Enroll <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/appointment"
              className="bg-white/10 backdrop-blur-sm text-white border border-white/20 font-medium px-6 py-3 rounded-md hover:bg-white/20 transition-colors shadow-sm inline-flex items-center justify-center gap-2"
            >
              Book Consultation
            </Link>
            {(webinarVisible || isAdmin) && (
              <Link
                to="/webinar"
                className="bg-white text-sage-900 font-medium px-6 py-3 rounded-md hover:bg-sage-100 transition-colors shadow-sm inline-flex items-center justify-center gap-2"
              >
                Webinar Enroll <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <Link to="/register" className="mb-6">
             <span className="text-red-500 font-bold text-lg animate-pulse tracking-wide uppercase drop-shadow-sm border-b-2 border-red-500 pb-1 hover:text-red-400 transition-colors">Register the course</span>
          </Link>
          <p className="text-sm text-sage-300">
            Already enrolled? <Link to="/dashboard" className="text-white hover:underline">Go to Student Portal</Link>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-sage-100 text-sage-600 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-sage-200">
              {muthraIconUrl ? (
                <img src={muthraIconUrl} alt="Muthra" className="w-full h-full object-cover" />
              ) : (
                <Hand className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">Muthra</h3>
            <p className="text-slate-600">Help regulate glandular secretions in the body, restoring balance and supporting the healing of various diseases.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-sage-100 text-sage-600 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-sage-200">
              {acupressureIconUrl ? (
                <img src={acupressureIconUrl} alt="Acupressure" className="w-full h-full object-cover" />
              ) : (
                <Target className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">Acupressure</h3>
            <p className="text-slate-600">By stimulating specific energy centers linked to internal organs, it becomes possible to detect imbalances and address them effectively within a short period.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-sage-100 text-sage-600 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-sage-200">
              {foodIconUrl ? (
                <img src={foodIconUrl} alt="Food" className="w-full h-full object-cover" />
              ) : (
                <Leaf className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">Food</h3>
            <p className="text-slate-600">With simple dietary adjustments and training in fireless cooking methods, many chronic conditions such as diabetes, high blood pressure, heart problems, and body pain can be managed and improved.</p>
          </div>
        </div>
      </section>

      {/* Institute Videos Section */}
      {(founderVideoUrl || aboutVideoUrl) && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-sage-100">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-serif font-bold text-sage-900 mb-4">About Our Institute</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Discover the vision and the legacy that inspires our natural healing programs.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {founderVideoUrl && (
                <div className="flex flex-col">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border-[3px] border-sage-100 bg-slate-900 mb-4">
                    <iframe 
                      src={founderVideoUrl}
                      title="Founder Video"
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                  <h3 className="font-semibold text-lg text-sage-900 text-center">Founder Video</h3>
                </div>
              )}
              {aboutVideoUrl && (
                <div className="flex flex-col">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border-[3px] border-sage-100 bg-slate-900 mb-4">
                    <iframe 
                      src={aboutVideoUrl}
                      title="About the Foundation"
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                  <h3 className="font-semibold text-lg text-sage-900 text-center">About the Institute</h3>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Testimonial Videos Section */}
      {testimonialVideos && testimonialVideos.length > 0 && (
        <section id="testimonials-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-sage-50 border-y border-sage-100">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-serif font-bold text-sage-900 mb-4">Student Testimonials</h2>
              <p className="text-slate-600">Hear directly from those whose lives have been transformed by our programs.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonialVideos.map((video) => {
                let displayUrl = video.url;
                if (displayUrl.startsWith('<iframe')) {
                  const srcMatch = displayUrl.match(/src=["']([^"']+)["']/);
                  if (srcMatch && srcMatch[1]) displayUrl = srcMatch[1];
                }
                
                const isAudio = video.type === "audio" || (video.type === undefined && (
                  displayUrl.toLowerCase().startsWith('data:audio/') || 
                  displayUrl.toLowerCase().includes('.mp3') || 
                  displayUrl.toLowerCase().includes('.wav') || 
                  displayUrl.toLowerCase().includes('.m4a') || 
                  displayUrl.toLowerCase().includes('.ogg') || 
                  displayUrl.toLowerCase().includes('.aac')
                ));

                const isUploadedVideo = !isAudio && (
                  video.type === "video" || 
                  displayUrl.toLowerCase().startsWith('data:video/') || 
                  displayUrl.toLowerCase().includes('.mp4') || 
                  displayUrl.toLowerCase().includes('.webm') || 
                  displayUrl.toLowerCase().includes('.mov') || 
                  displayUrl.toLowerCase().includes('.avi') || 
                  displayUrl.toLowerCase().includes('.mkv') ||
                  displayUrl.includes('firebasestorage.googleapis.com') ||
                  (!displayUrl.includes('youtube.com') && !displayUrl.includes('youtu.be') && displayUrl.startsWith('http'))
                );

                return (
                  <div key={video.id} className="flex flex-col bg-white p-4 rounded-2xl border border-sage-100 shadow-sm hover:shadow-md transition">
                    {isAudio ? (
                      <AudioTestimonialPlayer url={displayUrl} title={video.title} />
                    ) : isUploadedVideo ? (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-sm border-[3px] border-white bg-slate-900 mb-4">
                        <video 
                          src={displayUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-sm border-[3px] border-white bg-slate-900 mb-4">
                        <iframe 
                          src={displayUrl}
                          title={video.title}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-lg text-sage-900 leading-tight flex-1">{video.title}</h3>
                      <button 
                        onClick={() => setActiveShareVideo(video)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-sage-600 hover:text-sage-800 bg-sage-50 hover:bg-sage-100 border border-sage-200 py-1.5 px-3 rounded-full transition shadow-sm shrink-0"
                        title="Share Testimonial"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Share Testimonial Modal */}
      {activeShareVideo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl border border-sage-100 flex flex-col">
            <button 
              onClick={() => setActiveShareVideo(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-serif font-bold text-sage-900 mb-2">Share Testimonial</h3>
            <p className="text-sm text-slate-500 mb-6">Share "{activeShareVideo.title}" with friends on social media</p>
            
            {(() => {
              const shareUrl = getShareUrl(activeShareVideo);
              const shareMsg = `🌟 *Student Testimonial from Selvalakshmi Institute* 🌟\n\n` +
                `🎓 *Course Success Story:* ${activeShareVideo.title}\n\n` +
                `✨ Discover how ancient holistic healing (Muthra Acupressure & Natural Foods) can restore balance and support natural healing!\n\n` +
                `👇 *Watch the testimonial here:* \n` +
                `🔗 ${shareUrl}`;
                
              const twitterMsg = `Student success testimonial from Selvalakshmi Institute: "${activeShareVideo.title}"`;
              const telegramMsg = `🌟 *Student Testimonial from Selvalakshmi Institute* 🌟\n\n🎓 *Success Story:* ${activeShareVideo.title}\n\n👇 *Watch the testimonial here:* \n🔗 ${shareUrl}`;

              return (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {/* WhatsApp */}
                  <button 
                    type="button"
                    onClick={() => shareToWhatsApp(shareMsg)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center group-hover:scale-110 transition duration-300">
                      <MessageCircle className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">WhatsApp</span>
                  </button>

                  {/* Facebook */}
                  <button 
                    type="button"
                    onClick={() => openExternalUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center group-hover:scale-110 transition duration-300">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Facebook</span>
                  </button>

                  {/* Twitter / X */}
                  <button 
                    type="button"
                    onClick={() => openExternalUrl(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(twitterMsg)}`)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-950/10 text-slate-900 flex items-center justify-center group-hover:scale-110 transition duration-300">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Twitter / X</span>
                  </button>

                  {/* Telegram */}
                  <button 
                    type="button"
                    onClick={() => openExternalUrl(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(telegramMsg)}`)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center group-hover:scale-110 transition duration-300">
                      <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.703.064-1.237-.465-1.917-.911-1.066-.7-1.67-1.131-2.705-1.812-1.196-.789-.42-1.223.26-1.93.179-.184 3.29-3.018 3.35-3.275.008-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.507-1.523 5.845-2.528 7.014-3.013 3.336-1.381 4.03-1.62 4.482-1.628.1.002.322.028.465.144.12.097.153.227.161.321.008.093.018.291.01 1.05z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Telegram</span>
                  </button>
                </div>
              );
            })()}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
              <input 
                type="text" 
                readOnly 
                value={getShareUrl(activeShareVideo)} 
                className="bg-transparent text-slate-700 text-sm focus:outline-none w-full font-mono overflow-ellipsis"
              />
              <button 
                onClick={() => copyToClipboard(getShareUrl(activeShareVideo))}
                className="bg-sage-600 hover:bg-sage-700 text-white p-2 rounded-lg transition shrink-0 flex items-center justify-center gap-1 text-xs font-semibold px-3"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Testimony Modal (Deep Link popup) */}
      {sharedTestimony && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 relative shadow-2xl border border-sage-100 flex flex-col">
            <button 
              onClick={() => {
                setSharedTestimony(null);
                const url = new URL(window.location.href);
                url.searchParams.delete("testimony");
                window.history.pushState({}, '', url.toString());
              }}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-4">
              <span className="bg-sage-100 text-sage-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">Shared Testimonial</span>
              <h3 className="text-2xl font-serif font-bold text-sage-900 mt-2">{sharedTestimony.title}</h3>
            </div>
            
            <div className="mb-6">
              {(() => {
                let displayUrl = sharedTestimony.url;
                if (displayUrl.startsWith('<iframe')) {
                  const srcMatch = displayUrl.match(/src=["']([^"']+)["']/);
                  if (srcMatch && srcMatch[1]) displayUrl = srcMatch[1];
                }
                const isAudio = sharedTestimony.type === "audio" || (sharedTestimony.type === undefined && (
                  displayUrl.toLowerCase().startsWith('data:audio/') || 
                  displayUrl.toLowerCase().includes('.mp3') || 
                  displayUrl.toLowerCase().includes('.wav') || 
                  displayUrl.toLowerCase().includes('.m4a') || 
                  displayUrl.toLowerCase().includes('.ogg') || 
                  displayUrl.toLowerCase().includes('.aac')
                ));

                const isUploadedVideo = !isAudio && (
                  sharedTestimony.type === "video" || 
                  displayUrl.toLowerCase().startsWith('data:video/') || 
                  displayUrl.toLowerCase().includes('.mp4') || 
                  displayUrl.toLowerCase().includes('.webm') || 
                  displayUrl.toLowerCase().includes('.mov') || 
                  displayUrl.toLowerCase().includes('.avi') || 
                  displayUrl.toLowerCase().includes('.mkv') ||
                  displayUrl.includes('firebasestorage.googleapis.com') ||
                  (!displayUrl.includes('youtube.com') && !displayUrl.includes('youtu.be') && displayUrl.startsWith('http'))
                );

                if (isAudio) {
                  return <AudioTestimonialPlayer url={displayUrl} title={sharedTestimony.title} />;
                } else if (isUploadedVideo) {
                  return (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border bg-slate-900">
                      <video src={displayUrl} controls autoPlay className="w-full h-full object-cover" />
                    </div>
                  );
                } else {
                  return (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border bg-slate-900">
                      <iframe 
                        src={displayUrl} 
                        title={sharedTestimony.title} 
                        className="w-full h-full" 
                        allowFullScreen 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  );
                }
              })()}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSharedTestimony(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete("testimony");
                  window.history.pushState({}, '', url.toString());
                }}
                className="bg-sage-600 hover:bg-sage-700 text-white font-medium px-6 py-2.5 rounded-full transition shadow-md hover:shadow-lg"
              >
                Explore Institute
              </button>
              <button
                onClick={() => {
                  setActiveShareVideo(sharedTestimony);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-6 py-2.5 rounded-full transition flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-slate-600" />
                Share Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer is now a common component globally */}
    </div>
  );
}

function AudioTestimonialPlayer({ url, title }: { url: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = parseFloat(e.target.value);
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border-[3px] border-white bg-gradient-to-br from-[#0c2e1b] via-[#143d26] to-[#0a1e13] mb-4 p-5 flex flex-col justify-between text-white relative select-none">
      <audio 
        ref={audioRef}
        src={url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      
      {/* Top section: Audio label and Hearing/Pulse icon */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold bg-emerald-800/60 text-emerald-300 border border-emerald-700/50 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Student Voice
        </span>
        <div className={cn(
          "p-2 rounded-full bg-emerald-900/40 border border-emerald-800/30 transition-all duration-300",
          isPlaying ? "scale-110 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-emerald-300/70"
        )}>
          <Headphones className={cn("w-5 h-5", isPlaying && "animate-bounce")} style={{ animationDuration: '1.5s' }} />
        </div>
      </div>

      {/* Center: Play button & Animated soundwave */}
      <div className="flex items-center gap-4 my-auto">
        <button 
          onClick={togglePlay}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 flex items-center justify-center transition-all duration-300 shadow-md hover:scale-105 active:scale-95 shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-emerald-950" />
          ) : (
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-emerald-950 translate-x-0.5" />
          )}
        </button>

        {/* Dynamic Waveform Visualizer */}
        <div className="flex-1 flex items-end justify-center gap-[3px] h-12 px-2 border-l border-emerald-800/40">
          <style>{`
            @keyframes soundWaveHeight {
              0%, 100% { height: 6px; }
              50% { height: 38px; }
            }
            .sound-bar {
              width: 3px;
              background-color: #10b981;
              border-radius: 9999px;
              transition: height 0.2s ease, background-color 0.3s;
            }
            .sound-bar-active {
              animation: soundWaveHeight 1s ease-in-out infinite;
              background-color: #34d399;
            }
          `}</style>
          {[0.4, 0.7, 0.2, 0.9, 0.5, 0.8, 0.3, 0.6, 0.4, 0.8, 0.5, 0.9, 0.2, 0.7, 0.4].map((delay, idx) => (
            <div 
              key={idx} 
              className={cn("sound-bar", isPlaying && "sound-bar-active")}
              style={{ 
                animationDelay: isPlaying ? `${delay}s` : undefined,
                height: isPlaying ? undefined : `${4 + delay * 10}px`
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom: Timer and Seek bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-emerald-300/70 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input 
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${(currentTime / (duration || 1)) * 100}%, #04120a ${(currentTime / (duration || 1)) * 100}%, #04120a 100%)`
          }}
        />
      </div>
    </div>
  );
}
