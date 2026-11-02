export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#070913] mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-1 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#151c33] border border-[#4f7cff]/40 flex items-center justify-center text-[#4f7cff]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="m9 8 7 4-7 4Z" fill="currentColor" fillOpacity="0.3" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                CINE<span className="text-[#4f7cff]">360</span>
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Next-generation cinema operating ecosystem powered by real-time 3D spatial seat visualization, distributed concurrency safety, and instant commerce.
            </p>
            <div className="font-mono text-[10px] text-slate-400">
              v2.5.0 • Cinema OS
            </div>
          </div>

          {/* Col 1: 3D & Frontend Engine */}
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">3D & Frontend</h4>
            <p className="leading-relaxed text-[11px]">
              Three.js & React Three Fiber dynamic spatial view. Interactive raycasting, real-time neck tilt, screen filling angle calculations, and best-seat heatmaps.
            </p>
          </div>

          {/* Col 2: Backend & Concurrency */}
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Concurrency & DB</h4>
            <p className="leading-relaxed text-[11px]">
              FastAPI asynchronous runtime. Zero double-booking guarantee via Redis distributed atomic locks and SQLite/PostgreSQL unique schema constraints.
            </p>
          </div>

          {/* Col 3: Security & Commerce */}
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Commerce & Security</h4>
            <p className="leading-relaxed text-[11px]">
              Razorpay sandbox integration, cryptographically signed HMAC/JWT QR tickets, role-based RBAC, and real-time gate admission scanning.
            </p>
          </div>

          {/* Col 4: Support & Ecosystem */}
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Support & Network</h4>
            <p className="leading-relaxed text-[11px]">
              Serving IMAX, 4DX, and Dolby Atmos screens across Chennai, Bengaluru, Hyderabad, Mumbai, and Delhi. Instant refunds up to 2 hours before showtime.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>© {new Date().getFullYear()} CINE360 Ecosystem Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <span className="text-emerald-400 font-mono">● System Status: All Systems Operational</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

