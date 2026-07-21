import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { QRCodeSVG } from "qrcode.react";
import { API_BASE } from "../config";
import { Loader2, ArrowLeft, Copy, Check, Share2 } from "lucide-react";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const translations = {
  en: {
    pageTitle: "Student Registration",
    pageSubtitle: "Join our upcoming naturopathy and Muthra acupressure batches.",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    phone: "Phone Number",
    selectCourse: "Select Course",
    selectCoursePlaceholder: "Select a course",
    address: "Full Address",
    place: "Place (City/State)",
    country: "Country",
    paymentTitle: "Course Payment",
    feeLabel: "Fee",
    paymentInstructions: "Please scan the App payment QR code below to complete your payment before submitting.",
    securePayment: "SECURE PAYMENT",
    submitButton: "Submit Application",
    terms: "By registering, you agree to the Selvalakshmi Institute of Health Education terms and conditions.",
    successTitle: "Registration Successful!",
    successMessage: "Thank you for registering. Your application is under review.",
    copySaveInstruction: "Please copy and save this Student ID. You will need it (along with your phone number) to log in to the Student Portal.",
    goToLogin: "Go to Login"
  },
  ta: {
    pageTitle: "மாணவர் பதிவு",
    pageSubtitle: "எங்கள் இயற்கை மருத்துவம் மற்றும் முத்திரை அக்குபிரஷர் வகுப்புகளில் இணையுங்கள்.",
    firstName: "முதல் பெயர்",
    lastName: "கடைசி பெயர்",
    email: "மின்னஞ்சல் முகவரி",
    phone: "தொலைபேசி எண்",
    selectCourse: "வகுப்பைத் தேர்ந்தெடுக்கவும்",
    selectCoursePlaceholder: "ஒரு வகுப்பைத் தேர்ந்தெடுக்கவும்",
    address: "முழு முகவரி",
    place: "இடம் (நகரம்/மாநிலம்)",
    country: "நாடு",
    paymentTitle: "வகுப்பு கட்டணம்",
    feeLabel: "கட்டணம்",
    paymentInstructions: "பதிவு செய்வதற்கு முன், கீழே உள்ள QR குறியீட்டை ஸ்கேன் செய்து கட்டணத்தை செலுத்தவும்.",
    securePayment: "பாதுகாப்பான கட்டணம்",
    submitButton: "விண்ணப்பத்தை சமர்ப்பிக்கவும்",
    terms: "பதிவு செய்வதன் மூலம், Selvalakshmi Institute of Health Education-இன் விதிமுறைகள் மற்றும் நிபந்தனைகளை ஏற்கிறீர்கள்.",
    successTitle: "பதிவு வெற்றிகரமானது!",
    successMessage: "பதிவு செய்தமைக்கு நன்றி. உங்கள் விண்ணப்பம் பரிசீலனையில் உள்ளது.",
    copySaveInstruction: "இந்த மாணவர் அடையாளத்தை நகலெடுத்து சேமிக்கவும். மாணவர் போர்ட்டலில் உள்நுழைய இது (மற்றும் உங்கள் தொலைபேசி எண்) தேவைப்படும்.",
    goToLogin: "உள்நுழைய செல்லவும்"
  }
};

export function Register() {
  const { courses, addStudent, gpayQrUrl, appointmentSettings, whatsappNumber, students, updateStudent } = useStore();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "ta">("en");
  const [countryCode, setCountryCode] = useState("+91");
  const [useUpiFallback, setUseUpiFallback] = useState(false);
  const [upiRefNo, setUpiRefNo] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const t = translations[language];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    courseId: "",
    address: "",
    place: "",
    country: "India",
  });

  useEffect(() => {
    if (courses.length > 0 && !formData.courseId) {
      setFormData(prev => ({ ...prev, courseId: courses[0].id }));
    }
  }, [courses, formData.courseId]);

  useEffect(() => {
    const prefillCourse = searchParams.get("course");
    if (prefillCourse && courses.some(c => c.id === prefillCourse)) {
      setFormData(prev => ({ ...prev, courseId: prefillCourse }));
    }
  }, [searchParams, courses]);

  const [loadingPayment, setLoadingPayment] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const id = await addStudent({...formData, phone: `${countryCode}${formData.phone}`});
      if (id) {
        setCreatedStudentId(id);
        
        // Check if course requires payment
        const selectedCourse = courses.find(c => c.id === formData.courseId);
        const feeString = selectedCourse?.fee || "";
        const isFree = feeString.toLowerCase() === 'free' || feeString === '0' || feeString === '';
        
        if (!isFree) {
          setStep(2); // Go to step 2: Complete Payment
        } else {
          setStep(3); // Go to step 3: Success Screen
        }
      } else {
        setErrorMsg("Failed to register. Please check your network connection and try again.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    }
  };

  const submitCoursePayment = async (paymentRef: string) => {
    if (!createdStudentId) return;
    const existingStudent = students.find(s => s.id === createdStudentId);
    if (existingStudent) {
      await updateStudent({
        ...existingStudent,
        paymentReference: paymentRef
      });
    }
    setStep(3);
  };

  const handleConfirmPayment = async () => {
    setLoadingPayment(true);
    setErrorMsg(null);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      const selectedCourse = courses.find(c => c.id === formData.courseId);
      const feeString = selectedCourse?.fee || "";
      const feeAmountMatch = feeString.match(/\d+(\.\d+)?/);
      const fee = feeAmountMatch ? parseFloat(feeAmountMatch[0]) : 50;

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
          body: JSON.stringify({ amount: fee, title: `Registration for ${selectedCourse?.title || "Course"}` }),
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
        description: `Registration for ${selectedCourse?.title || "Course"}`,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: `${countryCode}${formData.phone}`
        },
        theme: {
          color: "#0d9488"
        },
        handler: async function (response: any) {
          await submitCoursePayment(`Razorpay Payment ID: ${response.razorpay_payment_id}`);
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
    } catch (error: any) {
      console.error("Payment error:", error);
      setErrorMsg(error.message || "An error occurred during payment checkout. Please try again or use direct UPI payment.");
    } finally {
      setLoadingPayment(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-sage-100 text-center relative">
          <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 text-xs font-medium border rounded-l-lg hover:bg-sage-50 focus:z-10 focus:ring-2 focus:ring-sage-500 transition ${
                language === "en" ? "bg-sage-100 text-sage-800 border-sage-300 z-10" : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("ta")}
              className={`px-3 py-1 text-xs font-medium border-t border-b border-r rounded-r-lg hover:bg-sage-50 focus:z-10 focus:ring-2 focus:ring-sage-500 transition ${
                language === "ta" ? "bg-sage-100 text-sage-800 border-sage-300 z-10" : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

          <div className="w-16 h-16 bg-sage-100 text-sage-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
            ✓
          </div>
          <h2 className="text-2xl font-serif font-bold text-sage-900 mb-4">{t.successTitle}</h2>
          <p className="text-slate-600 mb-6">
            {t.successMessage}
          </p>
          {createdStudentId && (
            <div className="bg-sage-50 text-sage-800 py-4 px-2 rounded-md font-mono text-2xl font-bold tracking-widest mb-6 border border-sage-200">
               {createdStudentId}
            </div>
          )}
          
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-800 mb-2">Join our WhatsApp Group</h3>
            <p className="text-sm text-green-700 mb-4">Get the latest updates, class links, and announcements.</p>
            <a 
              href="https://chat.whatsapp.com/Dz3WU5fYBvA243FlXYP4Rj" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full bg-[#25D366] text-white font-bold py-3 rounded-md hover:bg-[#128C7E] transition"
            >
              Join WhatsApp Group
            </a>
          </div>

          <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
            {t.copySaveInstruction}
          </p>
          <Link
            to="/login"
            className="block w-full bg-sage-600 text-white font-medium py-3 rounded-md hover:bg-sage-700 transition"
          >
            {t.goToLogin}
          </Link>
        </div>
      </div>
    );
  }

  if (step === 2) {
    const selectedCourseObj = courses.find((c) => c.id === formData.courseId);
    const feeString = selectedCourseObj?.fee || "";
    const feeAmountMatch = feeString.match(/\d+(\.\d+)?/);
    const fee = feeAmountMatch ? parseFloat(feeAmountMatch[0]) : 50;

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-sage-100 text-center relative">
          <button 
            type="button"
            onClick={() => setStep(1)}
            className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          <h2 className="text-3xl font-bold text-slate-900 mb-2 mt-4 font-serif">Complete Payment</h2>
          <p className="text-slate-600 mb-6">
            Please pay the registration fee of <strong>{feeString.includes('₹') ? feeString : `₹${feeString}`}</strong> to complete registration for <strong>{selectedCourseObj?.title}</strong>.
          </p>

          <div className="flex border-b border-slate-150 mb-6 justify-center">
            <button 
              type="button"
              onClick={() => { setUseUpiFallback(false); setErrorMsg(null); }}
              className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${!useUpiFallback ? 'border-sage-600 text-sage-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Razorpay Secure Checkout
            </button>
            <button 
              type="button"
              onClick={() => { setUseUpiFallback(true); setErrorMsg(null); }}
              className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${useUpiFallback ? 'border-sage-600 text-sage-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Direct UPI / GPay QR
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
                type="button"
                onClick={handleConfirmPayment}
                disabled={loadingPayment}
                className="w-full bg-sage-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-sage-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-lg shadow-sm"
              >
                {loadingPayment ? (
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
                If payment fails or "Failed to fetch" appears, switch to the <strong>Direct UPI / GPay QR</strong> tab above to complete booking.
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto text-left">
              {gpayQrUrl ? (
                <div className="flex flex-col items-center p-4 border border-slate-100 rounded-2xl bg-slate-50 mb-4">
                  <p className="text-sm text-slate-600 font-medium mb-3 text-center">Scan the QR code to pay using GPay / PhonePe / Paytm / BHIM</p>
                  <img src={gpayQrUrl} alt="GPay QR Code" className="w-48 h-48 object-contain rounded-lg border border-slate-200 p-2 bg-white" referrerPolicy="no-referrer" />
                  <p className="text-xs text-slate-500 mt-2">Pay exactly {feeString.includes('₹') ? feeString : `₹${feeString}`} to the foundation</p>
                </div>
              ) : (
                <div className="flex flex-col items-center p-4 border border-slate-100 rounded-2xl bg-slate-50 mb-4 text-center">
                  <p className="text-sm text-slate-600 font-medium mb-2 font-semibold">Pay via GPay / PhonePe / UPI ID</p>
                  <p className="text-sage-700 font-mono font-bold text-lg select-all bg-white py-1 px-3 border rounded-lg shadow-sm">mudrasmp@oksbi</p>
                  {whatsappNumber && <p className="text-slate-700 text-sm mt-2 font-medium">UPI Phone Number: +91 {whatsappNumber}</p>}
                  <p className="text-xs text-slate-500 mt-2">Please send exactly {feeString.includes('₹') ? feeString : `₹${feeString}`} and keep the reference ID handy</p>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2 font-semibold">UPI Transaction Reference ID / UTR *</label>
                <input 
                  type="text" 
                  placeholder="e.g. 12-digit number from payment receipt"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sage-500 text-center font-mono font-bold tracking-wide"
                  value={upiRefNo}
                  onChange={e => setUpiRefNo(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={async () => {
                    if (!upiRefNo.trim()) {
                      setErrorMsg("Please enter your payment reference transaction ID.");
                      return;
                    }
                    setLoadingPayment(true);
                    setErrorMsg(null);
                    await submitCoursePayment(`Manual UPI Reference: ${upiRefNo}`);
                    setLoadingPayment(false);
                  }}
                  disabled={loadingPayment}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold transition shadow-sm text-lg flex items-center justify-center gap-2"
                >
                  {loadingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Submitting registration...
                    </>
                  ) : (
                    "I Have Paid, Submit Registration"
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-4 py-2 text-sm font-medium border rounded-l-lg hover:bg-sage-50 focus:z-10 focus:ring-2 focus:ring-sage-500 transition ${
                language === "en" ? "bg-sage-100 text-sage-800 border-sage-300 z-10" : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("ta")}
              className={`px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg hover:bg-sage-50 focus:z-10 focus:ring-2 focus:ring-sage-500 transition ${
                language === "ta" ? "bg-sage-100 text-sage-800 border-sage-300 z-10" : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-sage-900 mb-4">{t.pageTitle}</h1>
          <p className="text-slate-600">{t.pageSubtitle}</p>
        </div>

        {(() => {
          const selectedCourseObj = courses.find((c) => c.id === formData.courseId);
          if (!selectedCourseObj) return null;
          return (
            <div className="bg-white rounded-xl shadow-sm border border-sage-100 overflow-hidden mb-10">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedCourseObj.title}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-sage-700 mb-4 font-medium">
                   <span>⏱️ {selectedCourseObj.duration}</span>
                   {selectedCourseObj.fee && (
                      <span>💰 {selectedCourseObj.fee.toLowerCase() === 'free' || selectedCourseObj.fee.includes('₹') ? selectedCourseObj.fee : `₹${selectedCourseObj.fee}`}</span>
                   )}
                </div>

                {/* Render Media Assets BELOW the course name/title */}
                {selectedCourseObj.videoUrl ? (
                  <div className="mb-6 rounded-lg overflow-hidden border border-slate-100 shadow-inner bg-slate-50">
                    {(() => {
                      const videoUrl = selectedCourseObj.videoUrl || "";
                      const isUploaded = videoUrl.startsWith("data:");
                      const isAudio = videoUrl.toLowerCase().startsWith('data:audio/') || 
                                      (!isUploaded && (
                                        videoUrl.toLowerCase().includes('.mp3') || 
                                        videoUrl.toLowerCase().includes('.wav') || 
                                        videoUrl.toLowerCase().includes('.m4a') || 
                                        videoUrl.toLowerCase().includes('.ogg') || 
                                        videoUrl.toLowerCase().includes('.aac')
                                      ));

                      const isUploadedVideo = !isAudio && (
                        isUploaded ||
                        videoUrl.toLowerCase().includes('.mp4') || 
                        videoUrl.toLowerCase().includes('.webm') || 
                        videoUrl.toLowerCase().includes('.mov') || 
                        videoUrl.toLowerCase().includes('.avi') || 
                        videoUrl.toLowerCase().includes('.mkv') ||
                        videoUrl.includes('firebasestorage.googleapis.com') ||
                        (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be') && videoUrl.startsWith('http'))
                      );

                      if (isAudio) {
                        return (
                          <div className="w-full bg-slate-950 p-6 flex flex-col items-center justify-center gap-4 relative">
                            {selectedCourseObj.imageUrl && (
                              <img src={selectedCourseObj.imageUrl} alt={selectedCourseObj.title} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
                            )}
                            <div className="relative z-10 w-full flex flex-col items-center gap-2">
                              <span className="text-white text-xs font-semibold uppercase tracking-wider bg-sage-800 px-3 py-1 rounded">Course Audio Introduction</span>
                              <audio src={selectedCourseObj.videoUrl} controls className="w-full max-w-md h-10" />
                            </div>
                          </div>
                        );
                      } else if (isUploadedVideo) {
                        return (
                          <div className="w-full aspect-video bg-slate-900">
                            <video src={selectedCourseObj.videoUrl} controls className="w-full h-full object-contain" />
                          </div>
                        );
                      } else {
                        let embedUrl = videoUrl;
                        if (embedUrl && !/^https?:\/\//i.test(embedUrl)) {
                          embedUrl = "https://" + embedUrl;
                        }
                        if (embedUrl.includes("youtube.com/watch?v=")) {
                          embedUrl = embedUrl.replace("youtube.com/watch?v=", "youtube.com/embed/");
                        } else if (embedUrl.includes("youtu.be/")) {
                          embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/");
                        }
                        return (
                          <div className="w-full aspect-video">
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
                ) : selectedCourseObj.imageUrl && (
                  <div className="mb-6 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                    <img src={selectedCourseObj.imageUrl} alt={selectedCourseObj.title} className="w-full max-h-80 object-cover" />
                  </div>
                )}

                {/* Hook / Highlight Words */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sage-800">
                    {language === "en" ? "✨ Course Overview & Highlights" : "✨ வகுப்பு அறிமுகம் & சிறப்பம்சங்கள்"}
                  </h4>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-150">
                    {selectedCourseObj.description}
                  </p>
                </div>

                {/* Explicit Shareable / Direct Registration Link (Required) */}
                {(() => {
                  const regUrl = `${window.location.origin}/register?course=${selectedCourseObj.id}`;
                  const courseFeeText = selectedCourseObj.fee 
                    ? (selectedCourseObj.fee.toLowerCase() === 'free' || selectedCourseObj.fee.includes('₹') ? selectedCourseObj.fee : `₹${selectedCourseObj.fee}`)
                    : 'N/A';
                  return (
                    <div className="mt-6 p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                          <span className="text-base leading-none">📢</span>
                          <span>{language === "en" ? "Course Registration Link" : "வகுப்பு பதிவு செய்வதற்கான லிங்க்"}</span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          {language === "en" ? "Ready to Share" : "பகிர தயாராக உள்ளது"}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-600">
                        {language === "en" 
                          ? "Share this direct registration link with family, friends, or WhatsApp groups!" 
                          : "இந்த நேரடிப் பதிவு லிங்கை உங்கள் குடும்பத்தினர், நண்பர்கள் மற்றும் வாட்ஸ்அப் குழுக்களில் பகிருங்கள்!"}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs font-mono text-emerald-950 truncate select-all flex items-center justify-between">
                          <span className="truncate">{regUrl}</span>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(regUrl);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg transition font-bold text-xs"
                          >
                            {copiedLink ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">{language === "en" ? "Copied!" : "நகலெடுக்கப்பட்டது!"}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-600" />
                                <span>{language === "en" ? "Copy Link" : "லிங்க் நகலெடு"}</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const shareMsg = language === "en"
                                ? `🌟 *Join our program: ${selectedCourseObj.title}* 🌟\n\n⏱️ *Duration:* ${selectedCourseObj.duration || 'N/A'}\n💰 *Fee:* ${courseFeeText}\n\n✨ *Course Overview & Highlights:* \n${selectedCourseObj.description}\n\n👇 *Register here:* \n🔗 ${regUrl}`
                                : `🌟 *எங்களது புதிய வகுப்பில் இணையுங்கள்: ${selectedCourseObj.title}* 🌟\n\n⏱️ *கால அளவு:* ${selectedCourseObj.duration || 'N/A'}\n💰 *கட்டணம்:* ${courseFeeText}\n\n✨ *வகுப்பு அறிமுகம் & சிறப்பம்சங்கள்:* \n${selectedCourseObj.description}\n\n👇 *இப்போதே பதிவு செய்ய:* \n🔗 ${regUrl}`;
                              const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`;
                              window.open(whatsappUrl, '_blank');
                            }}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg transition font-bold text-xs shadow-sm"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>{language === "en" ? "Share" : "பகிர்"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          );
        })()}

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-sage-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.firstName}</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.lastName}</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.email}</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.phone}</label>
            <div className="flex gap-2">
              <select 
                className="w-28 px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition bg-slate-50 text-slate-700"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US/CA)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+61">+61 (AU)</option>
                <option value="+65">+65 (SG)</option>
                <option value="+971">+971 (AE)</option>
              </select>
              <input
                type="tel"
                required
                className="flex-1 px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.selectCourse}</label>
            <select
              className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition"
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            >
              <option value="" disabled>{t.selectCoursePlaceholder}</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.duration})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.address}</label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition resize-none"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.place}</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.country}</label>
              <select
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent outline-none transition"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Singapore">Singapore</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Sri Lanka">Sri Lanka</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-left">
              {errorMsg}
            </div>
          )}

          {(() => {
            const selectedCourse = courses.find(c => c.id === formData.courseId);
            const feeString = selectedCourse?.fee || "";
            const isFree = feeString.toLowerCase() === 'free' || feeString === '0' || feeString === '';
            const isPaid = !isFree;
            const buttonText = isPaid 
              ? (language === 'en' ? `Proceed to Payment (${feeString.includes('₹') ? feeString : `₹${feeString}`})` : `பதிவு கட்டணம் செலுத்தவும் (${feeString.includes('₹') ? feeString : `₹${feeString}`})`)
              : t.submitButton;

            return (
              <button
                type="submit"
                disabled={loadingPayment}
                className="w-full bg-sage-600 text-white font-medium py-3.5 rounded-md hover:bg-sage-700 transition shadow-sm disabled:bg-sage-400 flex justify-center items-center gap-2 text-base font-semibold"
              >
                {loadingPayment ? "Processing..." : buttonText}
              </button>
            );
          })()}
          <p className="text-xs text-center text-slate-500 mt-4">
            {t.terms}
          </p>
        </form>
      </div>
    </div>
  );
}
