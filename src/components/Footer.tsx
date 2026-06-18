import { MessageCircle, Youtube, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export function Footer() {
  const { whatsappNumber, youtubeUrl, instagramUrl, loggedStudentId, isAdmin, webinarVisible } = useStore();

  return (
    <footer className="bg-sage-900 text-sage-200 py-12 mt-auto border-t border-sage-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Contact Details */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
          <p className="text-sm text-sage-300 leading-relaxed mb-4">
            3, Vivekananda road, P. N. Pudur, Coimbatore - 641041.
          </p>
          <div className="text-sm text-sage-300 flex flex-col gap-2">
            <a href="tel:+918072887131" className="hover:text-white transition-colors font-medium">+91 8072 887 131</a>
            <a href="mailto:info@selvalakshmihealtheducation.in" className="hover:text-white transition-colors">info@selvalakshmihealtheducation.in</a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
          <ul className="flex flex-col gap-3 text-sm text-sage-300">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/courses" className="hover:text-white transition-colors">Courses</Link></li>
            {(webinarVisible || isAdmin) && <li><Link to="/webinar" className="hover:text-white transition-colors flex items-center gap-2 w-fit">Webinar <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span></Link></li>}
            <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
            <li><Link to={loggedStudentId ? "/dashboard" : "/login"} className="hover:text-white transition-colors">Student Portal</Link></li>
            {isAdmin && <li><Link to="/admin" className="hover:text-white transition-colors">Admin Panel</Link></li>}
          </ul>
        </div>

        {/* Legal & Social */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
          <ul className="flex flex-col gap-3 text-sm text-sage-300 mb-8">
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/refund" className="hover:text-white transition-colors">Cancellation & Refund Policy</Link></li>
          </ul>

          {(whatsappNumber || youtubeUrl || instagramUrl) && (
            <div>
              <h3 className="text-white font-bold text-sm mb-3">Connect With Us</h3>
              <div className="flex items-center gap-4">
                {whatsappNumber && (
                  <a 
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:opacity-80 transition-opacity shadow-md"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
                {youtubeUrl && (
                  <a 
                    href={youtubeUrl.startsWith('http') ? youtubeUrl : `https://${youtubeUrl}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#FF0000] text-white rounded-full flex items-center justify-center hover:opacity-80 transition-opacity shadow-md"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {instagramUrl && (
                  <a 
                    href={instagramUrl.startsWith('http') ? instagramUrl : `https://${instagramUrl}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-full flex items-center justify-center hover:opacity-80 transition-opacity shadow-md"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 border-t border-sage-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <p className="text-sm text-sage-400">© {new Date().getFullYear()} Selvalakshmi Institute of Health Education.</p>
        <p className="text-sm text-sage-400">Holistic knowledge for a naturally balanced life.</p>
      </div>
    </footer>
  );
}
