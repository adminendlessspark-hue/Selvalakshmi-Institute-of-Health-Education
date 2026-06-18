import { useStore } from "../context/StoreContext";
import { MessageCircle } from "lucide-react";

export function FloatingWhatsApp() {
  const { whatsappNumber } = useStore();

  if (!whatsappNumber) return null;

  const phoneString = whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <a
      href={`https://wa.me/${phoneString}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-8 h-8 group-hover:animate-pulse" />
      <span className="absolute right-16 bg-white text-slate-800 text-sm font-medium px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        Chat with us!
      </span>
    </a>
  );
}
