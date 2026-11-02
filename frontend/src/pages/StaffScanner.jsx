import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, CheckCircle2, XCircle, Search, ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react";
import { api, getCurrentUser } from "../api";
import { Link } from "react-router-dom";

export default function StaffScanner() {
  const [user, setUser] = useState(getCurrentUser());
  const [manualRef, setManualRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scannerActive, setScannerActive] = useState(true);
  const scannerRef = useRef(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleValidate = async (tokenOrRef) => {
    if (!tokenOrRef || !tokenOrRef.trim()) return;
    setLoading(true);
    setScanResult(null);

    const isJwt = tokenOrRef.includes(".");
    const payload = isJwt ? { qr_token: tokenOrRef.trim() } : { ref: tokenOrRef.trim().toUpperCase() };

    try {
      const res = await api("/staff/scan", {
        method: "POST",
        body: payload
      });
      setScanResult(res);
    } catch (err) {
      setScanResult({
        valid: false,
        status: "error",
        message: err.message || "Failed to contact staff scanning gateway."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let html5QrcodeScanner = null;
    if (scannerActive) {
      try {
        html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader-container",
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          false
        );

        html5QrcodeScanner.render(
          (decodedText) => {
            handleValidate(decodedText);
          },
          (error) => {
            // Ignore frame-by-frame read errors
          }
        );
        scannerRef.current = html5QrcodeScanner;
      } catch (e) {
        console.warn("Scanner init warning:", e);
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [scannerActive]);

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <QrCode className="text-[#4f7cff]" />
            <span>Turnstile & Gate Scanner</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ticket validation & cryptographic JWT entry verification
          </p>
        </div>

        <Link
          to="/"
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/5 transition-all"
        >
          <ArrowLeft size={13} /> Back
        </Link>
      </div>

      {/* Manual Search Bar */}
      <div className="p-5 rounded-3xl bg-[#0f1424] border border-white/[0.06] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Enter 8-digit Booking Reference (e.g. C5F0614A)..."
            value={manualRef}
            onChange={(e) => setManualRef(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleValidate(manualRef)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141b2e] border border-white/10 text-xs text-white placeholder-slate-400 font-mono focus:outline-none focus:border-[#4f7cff]"
          />
        </div>
        <button
          onClick={() => handleValidate(manualRef)}
          disabled={loading || !manualRef.trim()}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d6ae8] text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Checking..." : "Verify Code"}
        </button>
      </div>

      {/* Big Result Card Banner */}
      {scanResult && (
        <div
          className={`p-6 rounded-3xl border-2 transition-all flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl ${
            scanResult.valid
              ? "bg-emerald-950/40 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              : "bg-red-950/40 border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          }`}
        >
          <div className="flex items-center gap-4 text-center md:text-left">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                scanResult.valid ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              }`}
            >
              {scanResult.valid ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
            </div>

            <div className="flex flex-col gap-1">
              <span
                className={`font-mono font-bold text-xs uppercase tracking-widest ${
                  scanResult.valid ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {scanResult.valid ? "ENTRY GRANTED • VALID PASS" : "ACCESS DENIED • INVALID PASS"}
              </span>
              <h2 className="text-xl font-extrabold text-white">{scanResult.message}</h2>
              {scanResult.booking && (
                <p className="text-xs text-slate-300 mt-1">
                  <b>{scanResult.booking.movie}</b> • Seats: <b className="text-[#4f7cff]">{scanResult.booking.seats.join(", ")}</b> • Ref: {scanResult.booking.ref}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setScanResult(null)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw size={13} /> Next Guest
          </button>
        </div>
      )}

      {/* Optical Camera QR Scanner */}
      <div className="p-6 rounded-3xl bg-[#0f1424] border border-white/[0.06] flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full text-xs text-slate-400">
          <span className="font-semibold text-white uppercase tracking-wider font-mono">Live Camera Feed</span>
          <button
            onClick={() => setScannerActive(!scannerActive)}
            className="text-[#4f7cff] hover:underline"
          >
            {scannerActive ? "Stop Camera" : "Start Camera"}
          </button>
        </div>

        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-black border border-white/10 shadow-inner">
          <div id="qr-reader-container" className="w-full text-slate-300" />
        </div>

        <p className="text-[11px] text-slate-400 text-center max-w-sm">
          Position the guest's mobile or printed CINE360 QR code in the camera frame to validate automatically.
        </p>
      </div>
    </main>
  );
}

