import React from "react";
import { Calendar, Clock, Video, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export function WebinarLanding() {
  const { courses, logoUrl } = useStore();
  
  // Find the first webinar course, or fallback to the first course if none
  const webinarCourse = courses.find(c => c.isWebinar) || courses[0];

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return "Upcoming Dates";
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
    return `${day}${suffix} ${month}, Sat - Mon`; // Adjust day range as needed
  };

  const currentFee = webinarCourse?.fee && (webinarCourse.fee.toLowerCase() !== 'free' && !webinarCourse.fee.includes('₹')) 
    ? `₹${webinarCourse.fee}` 
    : (webinarCourse?.fee || '₹3000');
    
  // Format the title to highlight portions in quotes
  const formatTitle = (title: string) => {
    const parts = title.split(/(".*?")/g);
    return parts.map((part, i) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return <span key={i} className="text-yellow-400">{part}</span>;
      }
      return <span key={i} className="text-white">{part}</span>;
    });
  };

  const titleText = webinarCourse?.title || 'Unlock your Seven health key "Freedom for Diabetes Naturally"';

  return (
    <div className="min-h-screen bg-[#0a3f24] font-sans pb-12 flex flex-col justify-center">
      {/* Top Header */}
      <header className="w-full p-4 sm:p-6 flex justify-between items-center z-10 relative">
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full flex items-center justify-center p-4 shadow-lg shrink-0 overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <div className="text-[#0a3f24] text-sm font-bold text-center leading-tight">Rosini<br/>Mudra<br/>India</div>
          )}
        </div>
        <div className="text-white text-sm sm:text-base font-medium uppercase tracking-wider relative group cursor-pointer border-b border-white pb-1">
          Rosini Mudra Training Center
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 z-10 relative flex flex-col items-center justify-center text-center">
        
        {/* Main Headline */}
        <h1 className="text-3xl md:text-5xl lg:text-5xl font-bold mb-8 leading-tight max-w-4xl tracking-tight">
          {formatTitle(titleText)}
        </h1>

        {/* Topic Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {["Mudra", "Acupressure", "Raw Foods", "Mind"].map((pill) => (
            <div key={pill} className="bg-emerald-500 hover:bg-emerald-400 cursor-default transition px-5 py-1.5 rounded-full text-white text-sm font-bold shadow-md">
              {pill}
            </div>
          ))}
        </div>

        {/* Main Info Grid */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-8 w-full max-w-5xl items-center">
          
          {/* Left Column: Author Profile */}
          <div className="flex flex-col items-center">
            <div className="w-64 h-64 md:w-72 md:h-72 rounded-full border-4 border-yellow-500 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.2)] bg-sage-800 relative z-10 mb-6">
              <img 
                src={webinarCourse?.imageUrl || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"} 
                alt="Dr. Panneerselvam" 
                className="w-full h-full object-cover object-top"
              />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Arulnidhi Dr. Jc. S. M. Panneerselvam</h3>
            <p className="text-yellow-400 font-medium">Your Health Coach & Consultant</p>
          </div>

          {/* Right Column: Webinar Details */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {/* Date Card */}
              <div className="bg-[#eab308] text-[#0a3f24] rounded-lg p-4 font-bold flex items-center gap-3 shadow-md hover:scale-105 transition-transform">
                <div className="p-2 bg-[#0a3f24] text-[#eab308] rounded-md shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <span>{webinarCourse?.launchDate ? formatDateLabel(webinarCourse.launchDate) : "13th - 15th Dec , Sat - Mon"}</span>
              </div>

              {/* Time Card */}
              <div className="bg-[#eab308] text-[#0a3f24] rounded-lg p-4 font-bold flex items-center gap-3 shadow-md hover:scale-105 transition-transform">
                <div className="p-2 bg-[#0a3f24] text-[#eab308] rounded-md shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <span>{webinarCourse?.duration ? `Time ${webinarCourse.duration}` : "Time 12 AM - 2:43 AM"}</span>
              </div>

              {/* Platform Card */}
              <div className="bg-[#eab308] text-[#0a3f24] rounded-lg p-4 font-bold flex items-center gap-3 shadow-md hover:scale-105 transition-transform">
                <div className="p-2 bg-[#0a3f24] text-[#eab308] rounded-md shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <span>{webinarCourse?.meetLink ? "On Google Meet" : "On Zoom"}</span>
              </div>

              {/* Language Card */}
              <div className="bg-[#eab308] text-[#0a3f24] rounded-lg p-4 font-bold flex items-center gap-3 shadow-md hover:scale-105 transition-transform">
                <div className="p-2 bg-[#0a3f24] text-[#eab308] rounded-md shrink-0">
                  <Globe2 className="w-5 h-5" />
                </div>
                <span>Language : Tamil</span>
              </div>
            </div>

            {/* CTA Container */}
            <div className="w-full flex flex-col items-center mt-6">
              <Link 
                to="/register" 
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-lg sm:text-xl py-4 flex items-center justify-center gap-2 rounded-lg shadow-lg hover:shadow-xl transition-all w-full max-w-sm"
              >
                Join Workshop for <span className="line-through opacity-70 ml-1">₹ 22500</span> {currentFee}
              </Link>
              
              <div className="bg-yellow-500 text-[#0a3f24] italic font-bold px-8 py-2 rounded-md mt-4 shadow-sm">
                Registrations Closing Soon
              </div>
              
              <div className="mt-6 text-center space-y-2">
                <p className="text-white italic font-medium">100% Money Back Guarantee | If Not Satisfied</p>
                <p className="text-emerald-200 italic font-medium text-sm">
                  On: {webinarCourse?.launchDate ? formatDateLabel(webinarCourse.launchDate) : "13th - 15th Dec"} | Time: {webinarCourse?.duration ? `Time ${webinarCourse.duration}` : "12 AM - 2:43 AM"}
                </p>
                <p className="text-white font-bold mt-4 pt-2">
                  Registrations Closing on <span className="text-red-500 uppercase tracking-wide">11th Dec</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Badges Stepper */}
      <div className="max-w-5xl mx-auto w-full px-4 mt-auto z-10 pt-8 sm:pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-4 relative px-4">
          {/* Connecting dashed line (visible only on sm+ screens) */}
          <div className="hidden sm:block absolute top-[28%] left-[10%] right-[10%] border-t-2 border-dashed border-white/30 z-0"></div>
          
          {[
            { num: 1, title: "🎉 2,000+ people rated this ⭐ 4.9!" },
            { num: 2, title: "💥 1000+ lives transformed 🚀" },
            { num: 3, title: "🚀 Mission: Help 1L+ people" }
          ].map((item) => (
            <div key={item.num} className="flex flex-col items-center gap-3 relative z-10 bg-[#0a3f24] px-4">
              <div className="w-12 h-12 bg-white text-[#0a3f24] rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-2 border-transparent">
                {item.num}
              </div>
              <p className="text-white text-sm sm:text-base font-bold whitespace-nowrap">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
