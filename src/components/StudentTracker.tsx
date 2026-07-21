import { useState, useEffect } from "react";
import { useStore } from "../context/StoreContext";
import { Student, HealthTracker, Course } from "../types";
import { Check, Save, Download, Upload, Eye, X, ExternalLink } from "lucide-react";

export function StudentTracker({ student, course }: { student: Student; course: Course }) {
  const { updateStudent } = useStore();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string>("");

  useEffect(() => {
    let objectUrl = "";
    if (isPdfModalOpen && course.dietWorksheetUrl) {
      if (course.dietWorksheetUrl.startsWith("data:")) {
        try {
          const parts = course.dietWorksheetUrl.split(";base64,");
          const contentType = parts[0].split(":")[1] || "application/pdf";
          const raw = window.atob(parts[1]);
          const rawLength = raw.length;
          const uInt8Array = new Uint8Array(rawLength);
          for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
          }
          const blob = new Blob([uInt8Array], { type: contentType });
          objectUrl = URL.createObjectURL(blob);
          setPdfViewerUrl(objectUrl);
        } catch (e) {
          console.error("Error generating viewable PDF blob", e);
          setPdfViewerUrl(course.dietWorksheetUrl);
        }
      } else {
        setPdfViewerUrl(course.dietWorksheetUrl);
      }
    } else {
      setPdfViewerUrl("");
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isPdfModalOpen, course.dietWorksheetUrl]);
  
  const [healthTracker, setHealthTracker] = useState<HealthTracker>(
    student.healthTracker || {
      dailyDiet: {
        "1": { morningDrink: false, breakfast: false, lunch: false, eveningDrink: false, dinner: false },
        "2": { morningDrink: false, breakfast: false, lunch: false, eveningDrink: false, dinner: false },
        "3": { morningDrink: false, breakfast: false, lunch: false, eveningDrink: false, dinner: false },
        "4": { morningDrink: false, breakfast: false, lunch: false, eveningDrink: false, dinner: false },
        "5": { morningDrink: false, breakfast: false, lunch: false, eveningDrink: false, dinner: false },
        "6": { morningDrink: false, breakfast: false, lunch: false, eveningDrink: false, dinner: false },
        "7": { morningDrink: false, breakfast: false, lunch: false, eveningDrink: false, dinner: false },
      },
      bloodTestDay1: { fastingSugar: "", postPrandialSugar: "" },
      bloodTestDay8: { fastingSugar: "", postPrandialSugar: "" },
    }
  );

  const [assignmentVideoUrl, setAssignmentVideoUrl] = useState(student.assignmentVideoUrl || "");
  const [bloodReportUrl, setBloodReportUrl] = useState(student.bloodReportUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateStudent({
      ...student,
      healthTracker,
      assignmentVideoUrl,
      bloodReportUrl
    });
    alert("Tracker updated successfully!");
    setIsSaving(false);
  };

  const handleBloodReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("File is too large. Please upload a report/image under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBloodReportUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPdf = (dataUrl: string, fileName: string) => {
    try {
      if (dataUrl.startsWith("data:")) {
        const parts = dataUrl.split(";base64,");
        const contentType = parts[0].split(":")[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.target = "_blank";
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
      window.open(dataUrl, "_blank");
    }
  };

  const updateDiet = (day: string, field: keyof typeof healthTracker.dailyDiet["1"], value: boolean) => {
    setHealthTracker({
      ...healthTracker,
      dailyDiet: {
        ...healthTracker.dailyDiet,
        [day]: {
          ...(healthTracker.dailyDiet[day] || { morningDrink: false, breakfast: false, lunch: false, eveningDrink: false, dinner: false }),
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      {course.isOffline && course.dietWorksheetUrl && (
        <div className="bg-emerald-50 p-6 rounded-xl shadow-sm border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-emerald-950 mb-1">Diet Worksheet PDF</h2>
            <p className="text-sm text-emerald-800">View or download your prescribed diet worksheet.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-5 py-2.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-4 h-4" /> View Diet Sheet
            </button>
            <button 
              onClick={() => downloadPdf(course.dietWorksheetUrl!, `${course.title.replace(/\s+/g, '_')}_Diet_Worksheet.pdf`)}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {isPdfModalOpen && course.dietWorksheetUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-emerald-950 text-white">
              <h3 className="font-semibold text-lg">{course.title} - Diet Worksheet</h3>
              <button 
                onClick={() => setIsPdfModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4 flex flex-col overflow-auto min-h-[50vh]">
              <div className="w-full text-center py-2 px-4 bg-amber-50 text-amber-950 border border-amber-200 rounded-lg text-xs mb-3 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
                <span className="font-medium text-left">
                  ⚠️ If the PDF does not load below (blocked by browser security), you can view it directly in a new window or download it.
                </span>
                <button
                  onClick={() => pdfViewerUrl && window.open(pdfViewerUrl, "_blank")}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded font-semibold text-[11px] shrink-0 transition cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Open in New Tab
                </button>
              </div>
              <iframe 
                src={pdfViewerUrl} 
                className="w-full flex-1 min-h-[55vh] border-0 rounded-lg shadow-inner bg-white"
                title="Diet Worksheet PDF"
              />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition text-sm font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => pdfViewerUrl && window.open(pdfViewerUrl, "_blank")}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 border border-slate-300 rounded-lg font-semibold transition text-sm cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> Open in New Tab
              </button>
              <button
                onClick={() => downloadPdf(course.dietWorksheetUrl!, `${course.title.replace(/\s+/g, '_')}_Diet_Worksheet.pdf`)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition text-sm cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blood Report Upload */}
      {course.isOffline && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
          <h2 className="text-xl font-serif font-bold text-sage-900 mb-4 border-b pb-2 flex items-center gap-2">
            <span>🩸</span> Blood Report Verification (Physical Evidence)
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              For offline courses, uploading your original blood test report is mandatory as physical evidence. Please upload your report in PDF or Image format (under 800KB).
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label className="cursor-pointer bg-sage-600 hover:bg-sage-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition gap-2">
                <Upload className="w-4 h-4" />
                <span>{bloodReportUrl ? "Re-upload Blood Report" : "Upload Blood Report PDF / Image"}</span>
                <input 
                  type="file" 
                  accept="application/pdf,image/*" 
                  className="hidden" 
                  onChange={handleBloodReportUpload} 
                />
              </label>

              {bloodReportUrl && (
                <div className="flex items-center gap-4">
                  <a 
                    href={bloodReportUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sage-600 hover:text-sage-800 font-semibold text-sm underline flex items-center gap-1.5"
                  >
                    View Uploaded Report
                  </a>
                  <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-2 py-1 rounded font-medium">
                    ✓ Received
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
        <h2 className="text-xl font-serif font-bold text-sage-900 mb-4 border-b pb-2">Offline Course Assignment Video</h2>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Please provide the URL for your recorded assignment video (e.g., Google Drive link, unlisted YouTube video).</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Video URL</label>
            <input 
              type="url" 
              value={assignmentVideoUrl} 
              onChange={e => setAssignmentVideoUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md" 
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200 overflow-x-auto">
        <h2 className="text-xl font-serif font-bold text-sage-900 mb-4 border-b pb-2">7-Day Diet Tracker</h2>
        <p className="text-sm text-slate-600 mb-4">Check the boxes after completing each meal/drink as per the provided 1-week diet chart.</p>
        
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 uppercase bg-sage-50">
            <tr>
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3 text-center">Morning Drink<br/><span className="text-xs font-normal text-slate-500">(Coriander)</span></th>
              <th className="px-4 py-3 text-center">Breakfast<br/><span className="text-xs font-normal text-slate-500">(Coconut/Fruits)</span></th>
              <th className="px-4 py-3 text-center">Lunch<br/><span className="text-xs font-normal text-slate-500">(Regular)</span></th>
              <th className="px-4 py-3 text-center">Evening Drink<br/><span className="text-xs font-normal text-slate-500">(Avarampoo)</span></th>
              <th className="px-4 py-3 text-center">Dinner<br/><span className="text-xs font-normal text-slate-500">(Before 7 PM)</span></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <tr key={day} className="border-b">
                <td className="px-4 py-3 font-medium text-slate-900">Day {day}</td>
                {["morningDrink", "breakfast", "lunch", "eveningDrink", "dinner"].map((field) => {
                  const dayStr = day.toString();
                  const isChecked = healthTracker.dailyDiet[dayStr]?.[field as keyof typeof healthTracker.dailyDiet["1"]] || false;
                  return (
                    <td key={field} className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => updateDiet(dayStr, field as any, e.target.checked)}
                        className="w-5 h-5 text-sage-600 rounded focus:ring-sage-500 cursor-pointer accent-sage-600"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-sage-200">
        <h2 className="text-xl font-serif font-bold text-sage-900 mb-4 border-b pb-2">Blood Test & Health Tracker</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Health Condition / Disease Title</label>
          <input 
            type="text" 
            value={healthTracker.diseaseTitle || ""} 
            onChange={e => setHealthTracker({ ...healthTracker, diseaseTitle: e.target.value })}
            className="w-full px-3 py-2 border rounded-md" 
            placeholder="e.g. Diabetes, Hypertension"
          />
        </div>

        <p className="text-sm text-slate-600 mb-6">Enter your test levels (Before & After) for Day 1 and Day 8.</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">Day 1 Test</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Before Food / Fasting Level</label>
              <input 
                type="text" 
                value={healthTracker.bloodTestDay1?.fastingSugar || ""} 
                onChange={e => setHealthTracker({
                  ...healthTracker,
                  bloodTestDay1: { ...(healthTracker.bloodTestDay1 || { fastingSugar: "", postPrandialSugar: "" }), fastingSugar: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-md" 
                placeholder="e.g. 110"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">After Food / Post-Prandial Level</label>
              <input 
                type="text" 
                value={healthTracker.bloodTestDay1?.postPrandialSugar || ""} 
                onChange={e => setHealthTracker({
                  ...healthTracker,
                  bloodTestDay1: { ...(healthTracker.bloodTestDay1 || { fastingSugar: "", postPrandialSugar: "" }), postPrandialSugar: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-md" 
                placeholder="e.g. 140"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">Day 8 Test</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Before Food / Fasting Level</label>
              <input 
                type="text" 
                value={healthTracker.bloodTestDay8?.fastingSugar || ""} 
                onChange={e => setHealthTracker({
                  ...healthTracker,
                  bloodTestDay8: { ...(healthTracker.bloodTestDay8 || { fastingSugar: "", postPrandialSugar: "" }), fastingSugar: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-md" 
                placeholder="e.g. 95"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">After Food / Post-Prandial Level</label>
              <input 
                type="text" 
                value={healthTracker.bloodTestDay8?.postPrandialSugar || ""} 
                onChange={e => setHealthTracker({
                  ...healthTracker,
                  bloodTestDay8: { ...(healthTracker.bloodTestDay8 || { fastingSugar: "", postPrandialSugar: "" }), postPrandialSugar: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-md" 
                placeholder="e.g. 120"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-sage-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-sage-700 transition disabled:opacity-50"
        >
          {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Save Tracker Data</>}
        </button>
      </div>
    </div>
  );
}
