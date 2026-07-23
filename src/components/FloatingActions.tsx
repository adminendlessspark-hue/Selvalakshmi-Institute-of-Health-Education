import { useStore } from "../context/StoreContext";
import { MessageCircle, CalendarPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { openExternalUrl } from "../lib/share";

export function FloatingActions() {
  const { whatsappNumber } = useStore();

  const phoneString = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
      <Link
        to="/appointment"
        className="flex items-center justify-center w-14 h-14 bg-sage-600 text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 group relative"
        aria-label="Book Consultation"
      >
        <CalendarPlus className="w-7 h-7 group-hover:animate-pulse" />
        <span className="absolute right-16 bg-white text-slate-800 text-sm font-medium px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Book Consultation
        </span>
      </Link>

      {phoneString && (
        <button
          type="button"
          onClick={() => openExternalUrl(`https://wa.me/${phoneString}`)}
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 group relative cursor-pointer"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-8 h-8 group-hover:animate-pulse" />
          <span className="absolute right-16 bg-white text-slate-800 text-sm font-medium px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Chat with us!
          </span>
        </button>
      )}
    </div>
  );
}
