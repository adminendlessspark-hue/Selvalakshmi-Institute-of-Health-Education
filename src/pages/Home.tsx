import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ArrowRight, Leaf, Heart, BookOpen, Youtube, Instagram, MessageCircle, Hand, Target } from "lucide-react";
import { cn } from "../lib/utils";

export function Home() {
  const { courses, logoUrl, heroImages, heroOverlayColor, heroOverlayOpacity, testimonialVideos, founderVideoUrl, aboutVideoUrl, whatsappNumber, youtubeUrl, instagramUrl, muthraIconUrl, acupressureIconUrl, foodIconUrl, webinarVisible, isAdmin } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

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
               <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
               <Leaf className="w-16 h-16 md:w-20 md:h-20 text-sage-600" />
            )}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-sage-50 leading-tight mb-6 max-w-4xl drop-shadow-md">
            Selvalakshmi Institute of Health Education
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
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-sage-50 border-y border-sage-100">
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
                
                return (
                <div key={video.id} className="flex flex-col">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border-[3px] border-white bg-slate-900 mb-4">
                    <iframe 
                      src={displayUrl}
                      title={video.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                  <h3 className="font-semibold text-lg text-sage-900 text-center">{video.title}</h3>
                </div>
              )})}
            </div>
          </div>
        </section>
      )}

      {/* Footer is now a common component globally */}
    </div>
  );
}
