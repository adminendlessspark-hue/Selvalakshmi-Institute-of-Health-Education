import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { FloatingActions } from "./components/FloatingActions";
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
import { Appointment } from "./pages/Appointment";
import { StoreProvider, useStore } from "./context/StoreContext";

import { PaymentResult } from "./pages/PaymentResult";

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useStore();
  return isAdmin ? children : <Navigate to="/login" />;
}

function ProtectedStudent({ children }: { children: React.ReactNode }) {
  const { loggedStudentId, isAdmin } = useStore();
  return (loggedStudentId || isAdmin) ? children : <Navigate to="/login" />;
}

function HashRedirector() {
  React.useEffect(() => {
    // If the browser visits a path without the Hash prefix e.g. /register or /register?course=xxx
    const pathname = window.location.pathname;
    const search = window.location.search;
    if (pathname && pathname !== "/" && !window.location.hash) {
      window.location.replace(`${window.location.origin}/#${pathname}${search}`);
    } else if (search && (!window.location.hash || !window.location.hash.includes("?"))) {
      // If query params are in window.location.search instead of inside the hash e.g. /#/register?course=xxx
      const currentHashPath = window.location.hash ? window.location.hash.split("?")[0] : "#/";
      window.location.replace(`${window.location.origin}/${currentHashPath}${search}`);
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <HashRedirector />
      <Router>
        <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-sage-50">
          <Navigation />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/register" element={<Register />} />
              <Route path="/appointment" element={<Appointment />} />
              <Route path="/webinar" element={<WebinarLanding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/success" element={<PaymentResult status="success" />} />
              <Route path="/cancel" element={<PaymentResult status="cancel" />} />
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
          
          <FloatingActions />
          
          <Footer />
        </div>
      </Router>
    </StoreProvider>
  );
}
