import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { QRCodeSVG } from "qrcode.react";
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
  const { courses, addStudent, gpayQrUrl } = useStore();
  const [searchParams] = useSearchParams();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "ta">("en");
  const [countryCode, setCountryCode] = useState("+91");
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
    const id = await addStudent({...formData, phone: `${countryCode}${formData.phone}`});
    setCreatedStudentId(id);

    // Check if course requires payment
    const selectedCourse = courses.find(c => c.id === formData.courseId);
    const feeString = selectedCourse?.fee || "";
    const isFree = feeString.toLowerCase() === 'free' || feeString === '0' || feeString === '';
    
    if (!isFree) {
        try {
          setLoadingPayment(true);
          const feeAmountMatch = feeString.match(/\d+(\.\d+)?/);
          // Amount in rupees for Razorpay
          const amountInRupees = feeAmountMatch ? parseFloat(feeAmountMatch[0]) : 50;
          
          const isLoaded = await loadRazorpay();
          if (!isLoaded) throw new Error("Razorpay SDK not loaded");

          const response = await fetch(`${API_BASE}/api/create-razorpay-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              amount: amountInRupees, 
              title: `Registration for ${selectedCourse?.title || "Course"}` 
            }),
          });
          
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Payment gateway returned an invalid response. If you are in the preview environment, please open this application in a new tab to complete authorization.");
          }

          const orderData = await response.json();
          if (!response.ok) throw new Error(orderData.error || "Failed to create session");
          
          const keyResponse = await fetch(`${API_BASE}/api/razorpay-key`);
          const keyContentType = keyResponse.headers.get("content-type");
          if (!keyContentType || !keyContentType.includes("application/json")) {
            throw new Error("Failed to load payment configuration. If you are in the preview environment, please open this application in a new tab to complete authorization.");
          }

          const keyData = await keyResponse.json();
          if (!keyData.key) throw new Error("Razorpay Key ID not configured");
          
          const options = {
            key: keyData.key,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Selvalakshmi Foundation",
            description: `Registration for ${selectedCourse?.title || "Course"}`,
            order_id: orderData.id,
            handler: function (response: any) {
               setIsSubmitted(true);
            },
            prefill: {
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              contact: `${countryCode}${formData.phone}`
            },
            theme: {
              color: "#0d9488"
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any){
            alert(`Payment initialization failed: ${response.error.description}. Your registration was saved, but payment is pending.`);
            setIsSubmitted(true);
          });
          rzp.open();

        } catch (error: any) {
          console.error("Payment error:", error);
          alert(`Payment initialization failed: ${error.message}. Your registration was saved, but payment is pending.`);
          setIsSubmitted(true);
        } finally {
          setLoadingPayment(false);
        }
    } else {
        setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
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
              {selectedCourseObj.videoUrl ? (
                 <div className="w-full aspect-video">
                   <iframe 
                     src={selectedCourseObj.videoUrl}
                     className="w-full h-full"
                     allowFullScreen
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   />
                 </div>
              ) : selectedCourseObj.imageUrl && (
                 <img src={selectedCourseObj.imageUrl} alt={selectedCourseObj.title} className="w-full h-64 object-cover" />
              )}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedCourseObj.title}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-sage-700 mb-4 font-medium">
                   <span>⏱️ {selectedCourseObj.duration}</span>
                   {selectedCourseObj.fee && (
                      <span>💰 {selectedCourseObj.fee.toLowerCase() === 'free' || selectedCourseObj.fee.includes('₹') ? selectedCourseObj.fee : `₹${selectedCourseObj.fee}`}</span>
                   )}
                </div>
                <p className="text-slate-600 whitespace-pre-wrap">{selectedCourseObj.description}</p>
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

          {(() => {
            const selectedCourse = courses.find(c => c.id === formData.courseId);
            const feeString = selectedCourse?.fee || "";
            const isFree = feeString.toLowerCase() === 'free' || feeString === '0' || feeString === '';
            const feeAmountMatch = feeString.match(/\d+(\.\d+)?/);
            const feeAmount = feeAmountMatch ? feeAmountMatch[0] : null;

            // Only show payment section if a course is selected and it has a fee
            if (!formData.courseId || isFree) {
              return null;
            }

            const upiId = "mudrasmp@oksbi";
            const upiUrl = `upi://pay?pa=${upiId}&pn=Selvalakshmi%20Institute%20of%20Health%20Education${feeAmount ? `&am=${feeAmount}` : ''}&cu=INR`;

            return (
              <div className="mb-8 p-6 bg-sage-50 border border-sage-200 rounded-xl flex flex-col items-center">
                <h3 className="font-bold text-sage-900 mb-2 text-center text-lg">{t.paymentTitle}</h3>
                <div className="bg-white px-4 py-2 rounded-lg border border-sage-100 mb-4 font-medium text-sage-800 shadow-sm">
                  {t.feeLabel}: {feeString.includes('₹') ? feeString : `₹${feeString}`}
                </div>
                <p className="text-sm text-slate-600 mb-2 text-center">Standard Card Payment / Net Banking via Secure Gateway.</p>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  <span>Processed securely</span>
                </div>
              </div>
            );
          })()}

          <button
            type="submit"
            disabled={loadingPayment}
            className="w-full bg-sage-600 text-white font-medium py-3 rounded-md hover:bg-sage-700 transition shadow-sm disabled:bg-sage-400 flex justify-center items-center gap-2"
          >
            {loadingPayment ? "Redirecting to Payment Gateway..." : t.submitButton}
          </button>
          <p className="text-xs text-center text-slate-500 mt-4">
            {t.terms}
          </p>
        </form>
      </div>
    </div>
  );
}
