import { useState, useMemo } from "react";
import { useStore } from "../context/StoreContext";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2, MessageCircle, Mail } from "lucide-react";
import { cn } from "../lib/utils";
import { getOAuthToken } from "../lib/oauth";
import { API_BASE } from "../config";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function Appointment() {
  const { addAppointment, appointments, appointmentSettings, gpayQrUrl, whatsappNumber } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [generatedMeetLink, setGeneratedMeetLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [useUpiFallback, setUseUpiFallback] = useState(false);
  const [upiRefNo, setUpiRefNo] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    problem: "",
  });

  const fee = appointmentSettings?.fee ?? 100;
  const configuredSlots = appointmentSettings?.slots || [];

  const availableSlots = useMemo(() => {
    return configuredSlots.map(slot => {
      const isBooked = appointments.some(apt => apt.date === slot.date && apt.time === slot.time && apt.status !== "rejected" as any);
      return { ...slot, isBooked };
    });
  }, [configuredSlots, appointments]);

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.date || !formData.time) {
      setErrorMsg("Please select an available slot.");
      return;
    }
    setStep(2);
  };

  const submitAppointment = async (statusToSet: "pending" | "confirmed", paymentReference: string) => {
    const meetLink = appointmentSettings?.defaultMeetLink || "";
    try {
      const result = await addAppointment({
        ...formData,
        phone: `+91 ${formData.phone}`,
        status: statusToSet,
        meetLink: meetLink,
        problem: formData.problem ? `${formData.problem} (Payment: ${paymentReference})` : `Payment: ${paymentReference}`,
      });

      if (result && result.startsWith("APT-")) {
        setSubmittedId(result);
        setGeneratedMeetLink(meetLink);
        setStep(3);

        const customerPhone = formData.phone.replace(/[^0-9]/g, '');
        const finalMeetLink = meetLink || "Link will be shared by Admin";
        const message = `Hello ${formData.name},\n\nYour consultation appointment is confirmed for ${formData.date} at ${formData.time}.\n\nPlease join using this Google Meet link: ${finalMeetLink}\n\nFrom: jcmpselvalakshmifoundation@gmail.com`;

        window.open(`https://wa.me/91${customerPhone}?text=${encodeURIComponent(message)}`, '_blank');
        
        if (formData.email) {
          const subject = `Consultation Appointment Confirmation - ${formData.date} ${formData.time}`;
          setTimeout(() => {
            window.open(`mailto:${formData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_blank');
          }, 500);
        }
      } else {
        setErrorMsg(`Failed to submit the appointment: ${result || 'Unknown error'}. Please try again.`);
        setStep(1);
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
      console.error(err);
      setStep(1);
    }
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      let rzpKey = appointmentSettings?.razorpayKeyId;
      let orderId = null;
      let orderAmount = fee * 100;
      let orderCurrency = "INR";

      // Try to fetch key from server if not configured in Firestore
      if (!rzpKey) {
        try {
          const keyResponse = await fetch(`${API_BASE}/api/razorpay-key`);
          const keyContentType = keyResponse.headers.get("content-type");
          if (keyResponse.ok && keyContentType && keyContentType.includes("application/json")) {
            const keyData = await keyResponse.json();
            rzpKey = keyData.key;
          }
        } catch (e) {
          console.warn("Could not fetch Razorpay key from server", e);
        }
      }

      // Try to create order
      try {
        const response = await fetch(`${API_BASE}/api/create-razorpay-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: fee, title: "Consultation Fee" }),
        });

        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          const orderData = await response.json();
          orderId = orderData.id;
          orderAmount = orderData.amount;
          orderCurrency = orderData.currency;
        }
      } catch (e) {
        console.warn("Failed to create order on server, using direct client checkout", e);
      }

      // If we still do not have a Razorpay key, enable UPI fallback
      if (!rzpKey) {
        setUseUpiFallback(true);
        throw new Error("Razorpay payment gateway is not configured. Please use the GPay / PhonePe / UPI payment option below.");
      }

      const options: any = {
        key: rzpKey,
        amount: orderAmount,
        currency: orderCurrency,
        name: "Selvalakshmi Foundation",
        description: "Consultation Appointment",
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: `+91${formData.phone}`
        },
        theme: {
          color: "#059669"
        },
        handler: async function (response: any) {
          await submitAppointment("confirmed", `Razorpay Payment ID: ${response.razorpay_payment_id}`);
        }
      };

      if (orderId) {
        options.order_id = orderId;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        setErrorMsg(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 3 && submittedId) {
    return (
      <div className="min-h-screen bg-sage-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-sage-100 text-center">
          <div className="bg-sage-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-sage-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Appointment Confirmed!</h2>
          <p className="text-slate-600 mb-8">
            Your appointment has been successfully scheduled and confirmed for {formData.date} at {formData.time}.
          </p>

          <div className="bg-white border border-sage-100 p-8 rounded-2xl text-left mb-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 text-lg border-b pb-2">Appointment Details</h3>
            <div className="space-y-3 text-slate-700">
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Date & Time:</strong> {formData.date} at {formData.time}</p>
              <p><strong>Status:</strong> <span className="text-green-600 font-semibold">Confirmed</span></p>
              {generatedMeetLink && (
                <div className="mt-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="font-bold text-purple-900 mb-2">Google Meet Link:</p>
                  <a href={generatedMeetLink} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 break-all font-medium underline">
                    {generatedMeetLink}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-8 text-left">
            <h3 className="font-bold text-slate-900 mb-3 text-base flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" /> Send Booking Notifications
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              If the automatic notification did not open, you can send or receive the confirmation on WhatsApp/Email using the buttons below.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  const customerPhone = formData.phone.replace(/[^0-9]/g, '');
                  const finalMeetLink = generatedMeetLink || appointmentSettings?.defaultMeetLink || "Link will be shared by Admin";
                  const message = `Hello ${formData.name},\n\nYour consultation appointment is confirmed for ${formData.date} at ${formData.time}.\n\nPlease join using this Google Meet link: ${finalMeetLink}\n\nFrom: jcmpselvalakshmifoundation@gmail.com`;
                  window.open(`https://wa.me/91${customerPhone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition shadow-sm text-sm"
              >
                <MessageCircle className="w-4 h-4" /> Send to My WhatsApp
              </button>

              {whatsappNumber && (
                <button
                  onClick={() => {
                    const cleanAdminPhone = whatsappNumber.replace(/[^0-9]/g, '');
                    const finalMeetLink = generatedMeetLink || appointmentSettings?.defaultMeetLink || "Link will be shared by Admin";
                    const adminMessage = `New Consultation Appointment Booked!\n\nName: ${formData.name}\nPhone: +91 ${formData.phone}\nEmail: ${formData.email || 'N/A'}\nDate: ${formData.date}\nTime: ${formData.time}\nMeet Link: ${finalMeetLink}`;
                    window.open(`https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(adminMessage)}`, '_blank');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Notify Admin on WhatsApp
                </button>
              )}

              {formData.email && (
                <button
                  onClick={() => {
                    const finalMeetLink = generatedMeetLink || appointmentSettings?.defaultMeetLink || "Link will be shared by Admin";
                    const message = `Hello ${formData.name},\n\nYour consultation appointment is confirmed for ${formData.date} at ${formData.time}.\n\nPlease join using this Google Meet link: ${finalMeetLink}\n\nFrom: jcmpselvalakshmifoundation@gmail.com`;
                    const subject = `Consultation Appointment Confirmation - ${formData.date} ${formData.time}`;
                    window.open(`mailto:${formData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-xl font-semibold hover:bg-slate-800 transition shadow-sm text-sm"
                >
                  <Mail className="w-4 h-4" /> Send Email
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <Link to="/" className="text-slate-500 hover:text-slate-700 font-medium">
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-sage-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-sage-100 text-center relative">
          <button onClick={() => setStep(1)} className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to form
          </button>
          
          <h2 className="text-3xl font-bold text-slate-900 mb-2 mt-4">Complete Payment</h2>
          <p className="text-slate-600 mb-6">
            Please pay the consultation fee of <strong>₹{fee}</strong> to confirm your appointment.
          </p>

          <div className="flex border-b border-slate-150 mb-6 justify-center">
            <button 
              onClick={() => { setUseUpiFallback(false); setErrorMsg(null); }}
              className={`pb-3 px-6 font-semibold text-sm transition-all border-b-2 ${!useUpiFallback ? 'border-sage-600 text-sage-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Razorpay Secure Checkout
            </button>
            <button 
              onClick={() => { setUseUpiFallback(true); setErrorMsg(null); }}
              className={`pb-3 px-6 font-semibold text-sm transition-all border-b-2 ${useUpiFallback ? 'border-sage-600 text-sage-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Direct UPI / GPay QR Payment
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-left">
              {errorMsg}
            </div>
          )}

          {!useUpiFallback ? (
            <div className="space-y-4 max-w-sm mx-auto">
              <button
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="w-full bg-sage-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-sage-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-lg shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...
                  </>
                ) : (
                  "Pay with Razorpay"
                )}
              </button>
              <p className="text-sm text-slate-500">
                Clicking this will securely open the Razorpay payment window.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                If payment fails or "Failed to fetch" appears, switch to the <strong>Direct UPI / GPay QR Payment</strong> tab above to complete booking.
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              {gpayQrUrl ? (
                <div className="flex flex-col items-center p-4 border border-slate-100 rounded-2xl bg-slate-50 mb-4">
                  <p className="text-sm text-slate-600 font-medium mb-3">Scan the QR code to pay using GPay / PhonePe / Paytm / BHIM</p>
                  <img src={gpayQrUrl} alt="GPay QR Code" className="w-48 h-48 object-contain rounded-lg border border-slate-200 p-2 bg-white" referrerPolicy="no-referrer" />
                  <p className="text-xs text-slate-500 mt-2">Pay exactly ₹{fee} to the foundation</p>
                </div>
              ) : (
                <div className="flex flex-col items-center p-4 border border-slate-100 rounded-2xl bg-slate-50 mb-4">
                  <p className="text-sm text-slate-600 font-medium mb-2">Pay via GPay / PhonePe / UPI ID</p>
                  <p className="text-sage-700 font-mono font-bold text-lg select-all">jcmpselvalakshmifoundation@gmail.com</p>
                  {whatsappNumber && <p className="text-slate-700 text-sm mt-1 font-medium">UPI Phone Number: +91 {whatsappNumber}</p>}
                  <p className="text-xs text-slate-500 mt-2">Please send exactly ₹{fee} and keep the reference ID handy</p>
                </div>
              )}

              <div className="mt-4 text-left">
                <label className="block text-sm font-medium text-slate-700 mb-2 font-semibold">UPI Transaction Reference ID / UTR *</label>
                <input 
                  type="text" 
                  placeholder="e.g. 12-digit number from payment receipt"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sage-500 text-center font-mono font-bold tracking-wide"
                  value={upiRefNo}
                  onChange={e => setUpiRefNo(e.target.value)}
                />
                <button 
                  onClick={async () => {
                    if (!upiRefNo.trim()) {
                      setErrorMsg("Please enter your payment reference transaction ID or your phone number used for payment.");
                      return;
                    }
                    setIsSubmitting(true);
                    setErrorMsg(null);
                    await submitAppointment("pending", `Manual UPI Reference: ${upiRefNo}`);
                    setIsSubmitting(false);
                  }}
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold transition shadow-sm text-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Submitting booking...
                    </>
                  ) : (
                    "I Have Paid, Submit Booking"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sage-600 hover:text-sage-700 font-medium mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Book a Consultation Appointment</h1>
          <p className="text-slate-600">
            Get personalized guidance and consultation for ₹{fee}. Please fill out the form below to request an appointment.
          </p>
        </div>

        <form onSubmit={handleProceedToPayment} className="bg-white p-8 rounded-xl shadow-sm border border-sage-100">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value.replace(/^\+91\s*/, '')})}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address (Optional)</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Available Slots *</label>
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableSlots.map((slot, idx) => {
                    const isSelected = formData.date === slot.date && formData.time === slot.time;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={slot.isBooked}
                        onClick={() => setFormData({...formData, date: slot.date, time: slot.time})}
                        className={cn(
                          "px-4 py-3 border rounded-lg text-sm font-medium text-center transition-colors",
                          slot.isBooked 
                            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60" 
                            : isSelected 
                              ? "bg-sage-600 border-sage-600 text-white" 
                              : "bg-white border-sage-200 text-sage-800 hover:border-sage-400"
                        )}
                      >
                        <div className="mb-1">{slot.date}</div>
                        <div>{slot.time}</div>
                        {slot.isBooked && <div className="text-xs mt-1 text-slate-400 font-normal">Booked</div>}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                  There are no pre-configured slots available right now. Please select your preferred date and time.
                </p>
              )}
            </div>

            {availableSlots.length === 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Time *</label>
                  <input
                    type="time"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 mt-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Briefly describe your problem or reason for consultation *</label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none"
                value={formData.problem}
                onChange={e => setFormData({...formData, problem: e.target.value})}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex justify-end">
            <button
              type="submit"
              className="bg-sage-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-sage-700 transition"
            >
              Proceed to Payment (₹{fee})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
