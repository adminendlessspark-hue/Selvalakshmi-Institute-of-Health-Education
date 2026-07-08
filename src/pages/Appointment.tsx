import { useState, useMemo } from "react";
import { useStore } from "../context/StoreContext";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { getOAuthToken } from "../lib/oauth";

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

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      const response = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: fee, title: "Consultation Fee" }),
      });

      const orderData = await response.json();
      if (!response.ok) {
        throw new Error(orderData.error || "Failed to create Razorpay order");
      }

      const keyResponse = await fetch("/api/razorpay-key");
      const keyData = await keyResponse.json();
      if (!keyData.key) {
        throw new Error("Razorpay Key ID not configured on server.");
      }

      const options = {
        key: keyData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Selvalakshmi Foundation",
        description: "Consultation Appointment",
        order_id: orderData.id,
        handler: async function (response: any) {
          // Payment successful, proceed to create appointment
          const meetLink = appointmentSettings?.defaultMeetLink || "";
          const statusToSet = "confirmed";
          
          try {
            const result = await addAppointment({
              ...formData,
              phone: `+91 ${formData.phone}`,
              status: statusToSet,
              meetLink: meetLink,
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
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: `+91${formData.phone}`
        },
        theme: {
          color: "#059669" // sage-600 approx
        }
      };

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

          <div className="bg-white border-2 border-sage-100 p-8 rounded-2xl text-left mb-8 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 text-lg">Appointment Details</h3>
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
                  <p className="text-sm text-purple-700 mt-2">
                    We've opened WhatsApp / your Email client to send you this link automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-sage-100 pt-6">
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
          <p className="text-slate-600 mb-8">
            Please pay the consultation fee of <strong>₹{fee}</strong> to confirm your appointment.
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

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
          </div>
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
