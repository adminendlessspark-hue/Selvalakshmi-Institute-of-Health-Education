import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Courses } from "./pages/Courses";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Admin } from "./pages/Admin";
import { Login } from "./pages/Login";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Refund } from "./pages/Refund";
import { WebinarLanding } from "./pages/WebinarLanding";
import { StoreProvider, useStore } from "./context/StoreContext";

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useStore();
  return isAdmin ? children : <Navigate to="/login" />;
}

function ProtectedStudent({ children }: { children: React.ReactNode }) {
  const { loggedStudentId } = useStore();
  return loggedStudentId ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-sage-50">
          <Navigation />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/register" element={<Register />} />
              <Route path="/webinar" element={<WebinarLanding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/dashboard" element={
                <ProtectedStudent>
                  <Dashboard />
                </ProtectedStudent>
              } />
              <Route path="/admin" element={
                <ProtectedAdmin>
                  <Admin />
                </ProtectedAdmin>
              } />
            </Routes>
          </main>
          
          <FloatingWhatsApp />
          
          <Footer />
        </div>
      </Router>
    </StoreProvider>
  );
}
