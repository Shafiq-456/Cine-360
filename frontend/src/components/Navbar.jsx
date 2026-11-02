import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapPin, QrCode, User, Shield, ScanLine, LogOut, ChevronDown, Check } from "lucide-react";
import { getCurrentUser, setCurrentUser, getSelectedCity, setSelectedCity, api } from "../api";

const CITIES = ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Delhi"];

const DEMO_ROLES = [
  { label: "User Account", email: "user@cine.dev", role: "user", icon: User },
  { label: "Admin Dashboard", email: "admin@cine.dev", role: "admin", icon: Shield },
  { label: "Staff Scanner", email: "staff@cine.dev", role: "staff", icon: ScanLine }
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [city, setCity] = useState(getSelectedCity());
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    const handleAuth = () => setUser(getCurrentUser());
    const handleCity = () => setCity(getSelectedCity());
    window.addEventListener("cine360_auth_change", handleAuth);
    window.addEventListener("cine360_city_change", handleCity);
    return () => {
      window.removeEventListener("cine360_auth_change", handleAuth);
      window.removeEventListener("cine360_city_change", handleCity);
    };
  }, []);

  const selectCity = (c) => {
    setSelectedCity(c);
    setCity(c);
    setCityMenuOpen(false);
  };

  const loginAsRole = async (targetEmail, roleName) => {
    try {
      setLoadingRole(true);
      const res = await api("/auth/login", {
        method: "POST",
        body: { email: targetEmail, password: "demo123" }
      });
      setCurrentUser(res);
      setRoleMenuOpen(false);
      if (roleName === "admin") navigate("/admin");
      else if (roleName === "staff") navigate("/staff");
      else navigate("/");
    } catch (e) {
      console.error("Demo login error:", e);
    } finally {
      setLoadingRole(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setRoleMenuOpen(false);
    navigate("/");
  };

  const navLinks = [
    { label: "Movies", path: "/" },
    { label: "Theatres", path: "/theatres" },
    { label: "My Tickets", path: "/bookings" },
    ...(user?.role === "admin" ? [{ label: "Dashboard", path: "/admin" }] : [])
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0d1a]/85 border-b border-white/[0.06] px-4 md:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & City Selector */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group text-decoration-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e2746] to-[#0f1424] border border-[#4f7cff]/40 flex items-center justify-center text-[#4f7cff] shadow-[0_0_15px_rgba(79,124,255,0.25)] group-hover:border-[#4f7cff] transition-all">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="3" />
                <path d="m9 8 7 4-7 4Z" fill="currentColor" fillOpacity="0.25" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center">
                CINE<span className="text-[#4f7cff]">360</span>
              </span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-slate-400 font-semibold uppercase">
                3D Cinema Ecosystem
              </span>
            </div>
          </Link>

          {/* City Selector */}
          <div className="relative">
            <button
              onClick={() => { setCityMenuOpen(!cityMenuOpen); setRoleMenuOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-white/[0.04] border border-white/[0.08] hover:border-[#4f7cff]/40 hover:text-white transition-all"
            >
              <MapPin size={13} className="text-[#4f7cff]" />
              <span>{city}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {cityMenuOpen && (
              <div className="absolute left-0 mt-2 w-40 rounded-xl bg-[#0f1424] border border-white/10 shadow-2xl py-1 z-50">
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Select City</div>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => selectCity(c)}
                    className="w-full px-3 py-1.5 text-xs text-left flex items-center justify-between hover:bg-white/[0.06] text-slate-200"
                  >
                    <span>{c}</span>
                    {city === c && <Check size={13} className="text-[#4f7cff]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Pill Tabs */}
        <nav className="hidden md:flex items-center bg-[#070914] p-1 rounded-full border border-white/[0.08]">
          {navLinks.map((tab) => {
            const isActive = tab.path === "/" 
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#18223d] text-[#4f7cff] shadow-[inset_0_0_0_1px_rgba(79,124,255,0.4)]"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Staff Scanner & Demo Accounts */}
        <div className="flex items-center gap-3">
          <Link
            to="/staff"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 border border-white/[0.12] hover:border-[#4f7cff] hover:text-[#4f7cff] hover:bg-[#4f7cff]/5 transition-all"
          >
            <QrCode size={14} className="text-[#4f7cff]" />
            <span>Staff Scanner</span>
          </Link>

          {/* Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setRoleMenuOpen(!roleMenuOpen); setCityMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-[#172038] to-[#12192e] border border-white/[0.12] hover:border-[#4f7cff]/50 shadow-sm transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-[#4f7cff]/20 text-[#4f7cff] flex items-center justify-center font-bold text-[10px]">
                {user ? user.name[0].toUpperCase() : "D"}
              </div>
              <span className="max-w-[100px] truncate">{user ? user.name : "Demo Roles"}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f1424] border border-white/10 shadow-2xl py-2 z-50">
                <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Switch Demo Account
                </div>
                {DEMO_ROLES.map((r) => {
                  const Icon = r.icon;
                  const isCurrent = user?.email === r.email;
                  return (
                    <button
                      key={r.email}
                      onClick={() => loginAsRole(r.email, r.role)}
                      disabled={loadingRole}
                      className="w-full px-4 py-2 text-xs text-left flex items-center justify-between hover:bg-white/[0.06] text-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={14} className="text-[#4f7cff]" />
                        <div>
                          <div className="font-medium text-white">{r.label}</div>
                          <div className="text-[10px] text-slate-400">{r.email}</div>
                        </div>
                      </div>
                      {isCurrent && <Check size={14} className="text-[#4f7cff]" />}
                    </button>
                  );
                })}

                <div className="my-1.5 border-t border-white/[0.06]" />

                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-xs text-left flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Log Out ({user.name})</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setRoleMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-200 hover:bg-white/[0.06]"
                  >
                    Custom Login / Register
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

