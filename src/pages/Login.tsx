import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { User, Shield } from "lucide-react";
import { cn } from "../lib/utils";

export function Login() {
  const { students, loginAdmin, loginStudent } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"student" | "admin">("student");
  
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [error, setError] = useState("");

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const found = students.find(s => 
      s.id.toLowerCase() === studentId.toLowerCase() && 
      s.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, '')
    );
    
    if (found) {
      loginStudent(found.id);
      navigate("/dashboard");
    } else {
      setError("Invalid Student ID or Phone Number.");
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (adminPin === "admin1234") { // A simple dummy PIN since we aren't using Firebase Auth for admin
      loginAdmin();
      navigate("/admin");
    } else {
      setError("Invalid Admin PIN.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-sage-100">
        <h2 className="text-3xl font-serif font-bold text-center text-sage-900 mb-8">Login to Portal</h2>
        
        <div className="flex border-b border-sage-100 mb-8">
          <button
            className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2", tab === "student" ? "border-sage-600 text-sage-800" : "border-transparent text-slate-500 hover:text-sage-600")}
            onClick={() => { setTab("student"); setError(""); }}
          >
            <User className="w-4 h-4 inline-block mr-2" />
            Student Login
          </button>
          <button
            className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2", tab === "admin" ? "border-sage-600 text-sage-800" : "border-transparent text-slate-500 hover:text-sage-600")}
            onClick={() => { setTab("admin"); setError(""); }}
          >
            <Shield className="w-4 h-4 inline-block mr-2" />
            Admin Login
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        {tab === "student" ? (
          <form onSubmit={handleStudentLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
              <input
                type="text"
                required
                placeholder="e.g. STU-123456"
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                placeholder="Registered phone number"
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-sage-800 text-white rounded-md py-3 font-medium hover:bg-sage-700 transition">
              View Dashboard
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PIN Code</label>
              <input
                type="password"
                required
                placeholder="Enter PIN (try admin1234)"
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-sage-800 text-white rounded-md py-3 font-medium hover:bg-sage-700 transition">
              Access Admin Portal
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
