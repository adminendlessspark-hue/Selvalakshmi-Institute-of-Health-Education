import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Leaf, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../context/StoreContext";

export function Navigation() {
  const location = useLocation();
  const { logoUrl, isAdmin, loggedStudentId, logoutAdmin, logoutStudent, webinarVisible } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const baseNavLinks = [
    { to: "/", label: "Home" },
    { to: "/courses", label: "Courses" },
  ];
  const endNavLinks = [
    { to: "/register", label: "Register" },
  ];

  const navLinks = webinarVisible || isAdmin
    ? [...baseNavLinks, { to: "/webinar", label: "Webinar", special: true }, ...endNavLinks]
    : [...baseNavLinks, ...endNavLinks];

  return (
    <nav className="bg-white border-b border-sage-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 max-w-full">
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 sm:h-14 object-contain" />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sage-100 flex items-center justify-center">
                  <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-sage-600" />
                </div>
              )}
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn("text-sm font-medium transition-colors hover:text-sage-600", location.pathname === link.to ? "text-sage-600 border-b-2 border-sage-600 py-7" : "text-slate-600", link.special && "flex items-center gap-1")}
              >
                {link.label} {link.special && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
              </Link>
            ))}
            
            {loggedStudentId && (
              <Link
                to="/dashboard"
                className={cn("text-sm font-medium transition-colors hover:text-sage-600", location.pathname === "/dashboard" ? "text-sage-600 border-b-2 border-sage-600 py-7" : "text-slate-600")}
              >
                Student Portal
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={cn("text-sm font-medium transition-colors hover:text-sage-600", location.pathname === "/admin" ? "text-sage-600 border-b-2 border-sage-600 py-7" : "text-slate-600")}
              >
                Admin Panel
              </Link>
            )}
            
            {(!loggedStudentId && !isAdmin) && (
               <Link
                 to="/login"
                 className="text-sm font-medium transition-colors text-white bg-sage-700 hover:bg-sage-800 px-4 py-2 rounded-md ml-2"
               >
                 Login
               </Link>
            )}

            {loggedStudentId && (
               <button
                 onClick={() => logoutStudent()}
                 className="text-sm font-medium transition-colors text-red-600 hover:text-red-700 px-2"
               >
                 Logout
               </button>
            )}
            
            {isAdmin && (
               <button
                 onClick={() => logoutAdmin()}
                 className="text-sm font-medium transition-colors text-red-600 hover:text-red-700 px-2"
               >
                 Logout Admin
               </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden ml-auto">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-sage-700 hover:text-sage-900 focus:outline-none p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-sage-100 bg-white absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-3 rounded-md text-base font-medium",
                  location.pathname === link.to ? "bg-sage-50 text-sage-800" : "text-slate-600 hover:bg-sage-50 hover:text-sage-800"
                )}
              >
                <div className="flex items-center gap-2">
                  {link.label}
                  {link.special && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                </div>
              </Link>
            ))}
            
            {loggedStudentId && (
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-3 rounded-md text-base font-medium",
                  location.pathname === "/dashboard" ? "bg-sage-50 text-sage-800" : "text-slate-600 hover:bg-sage-50 hover:text-sage-800"
                )}
              >
                Student Portal
              </Link>
            )}
            
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-3 rounded-md text-base font-medium",
                  location.pathname === "/admin" ? "bg-sage-50 text-sage-800" : "text-slate-600 hover:bg-sage-50 hover:text-sage-800"
                )}
              >
                Admin Panel
              </Link>
            )}

            <div className="mt-4 pt-4 border-t border-sage-100 px-3">
              {(!loggedStudentId && !isAdmin) && (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex justify-center text-base font-medium text-white bg-sage-700 hover:bg-sage-800 px-4 py-3 rounded-md"
                >
                  Login
                </Link>
              )}
              
              {loggedStudentId && (
                <button
                  onClick={() => { logoutStudent(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left text-base font-medium text-red-600 hover:text-red-700 py-3"
                >
                  Logout
                </button>
              )}
              
              {isAdmin && (
                <button
                  onClick={() => { logoutAdmin(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left text-base font-medium text-red-600 hover:text-red-700 py-3"
                >
                  Logout Admin
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
