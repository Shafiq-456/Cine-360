import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Mail, Shield, ScanLine, ArrowRight, Sparkles } from "lucide-react";
import { api, setCurrentUser } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "user@cine.dev",
    password: "demo123",
    role: "user"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isRegister ? "/auth/register" : "/auth/login";
    try {
      const res = await api(endpoint, {
        method: "POST",
        body: form
      });
      setCurrentUser(res);
      if (res.role === "admin") navigate("/admin");
      else if (res.role === "staff") navigate("/staff");
      else navigate("/");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (email, role) => {
    setLoading(true);
    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: { email, password: "demo123" }
      });
      setCurrentUser(res);
      if (role === "admin") navigate("/admin");
      else if (role === "staff") navigate("/staff");
      else navigate("/");
    } catch (err) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16 flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-[#141b2e] border border-[#4f7cff]/40 flex items-center justify-center text-[#4f7cff] shadow-[0_0_20px_rgba(79,124,255,0.2)]">
          <Sparkles size={24} />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-2">
          {isRegister ? "Join CINE360" : "Welcome Back"}
        </h1>
        <p className="text-xs text-slate-400">
          Sign in to access your 3D seat reservations, digital passes, and ecosystem settings
        </p>
      </div>

      {/* Quick Demo Logins Pill Grid */}
      <div className="p-4 rounded-2xl bg-[#0f1424] border border-white/5 flex flex-col gap-2.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          1-Click Instant Demo Login
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => quickDemoLogin("user@cine.dev", "user")}
            className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 border border-white/5 transition-all"
          >
            <User size={14} className="text-[#4f7cff]" />
            <span>User</span>
          </button>
          <button
            type="button"
            onClick={() => quickDemoLogin("admin@cine.dev", "admin")}
            className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 border border-white/5 transition-all"
          >
            <Shield size={14} className="text-purple-400" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => quickDemoLogin("staff@cine.dev", "staff")}
            className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex flex-col items-center gap-1 border border-white/5 transition-all"
          >
            <ScanLine size={14} className="text-emerald-400" />
            <span>Staff</span>
          </button>
        </div>
      </div>

      {/* Main Auth Form */}
      <div className="p-6 rounded-3xl bg-[#0f1424] border border-white/[0.08] shadow-2xl flex flex-col gap-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {isRegister && (
            <div>
              <label className="text-slate-400 block mb-1">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Alex Hunter"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141b2e] border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-[#4f7cff]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 block mb-1">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="user@cine.dev"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141b2e] border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-[#4f7cff]"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="demo123"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141b2e] border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-[#4f7cff]"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d6ae8] text-white font-bold text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(79,124,255,0.4)] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <span>{isRegister ? "Create Account" : "Sign In to CINE360"}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            {isRegister ? "Already registered? Sign in" : "Need an account? Create one now"}
          </button>
        </div>
      </div>
    </main>
  );
}

