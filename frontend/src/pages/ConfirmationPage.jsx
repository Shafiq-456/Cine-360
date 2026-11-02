import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Calendar, Download, Share2, Ticket, ArrowRight } from "lucide-react";
import { api } from "../api";

export default function ConfirmationPage() {
  const { ref } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api("/bookings/me")
      .then((list) => {
        const found = list.find((b) => b.ref === ref);
        setBooking(found || list[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ref]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center text-white">
        Verifying confirmed booking...
      </div>
    );
  }

  const b = booking;
  const qrData = b?.qr_token || b?.ref || ref;

  const downloadTicket = () => {
    window.print();
  };

  const addToCalendar = () => {
    if (!b) return;
    const title = encodeURIComponent(`Movie: ${b.movie} at ${b.theatre}`);
    const details = encodeURIComponent(`Seats: ${b.seats.join(", ")} | Booking Ref: ${b.ref}`);
    const startIso = new Date(b.start).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endIso = new Date(new Date(b.start).getTime() + 2.5 * 3600000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${encodeURIComponent(b.theatre + ", " + b.city)}`;
    window.open(gCalUrl, "_blank");
  };

  const shareBooking = () => {
    if (navigator.share) {
      navigator.share({
        title: `CINE360 Ticket: ${b?.movie}`,
        text: `I'm watching ${b?.movie} at ${b?.theatre}! Booking ID: ${b?.ref}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-12 flex flex-col items-center gap-8">
      
      {/* Animated Success Badge */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce-short">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Booking Confirmed!
        </h1>
        <p className="text-xs text-slate-400">
          Your e-ticket has been issued. Show the QR code at the cinema entry gate.
        </p>
      </div>

      {/* Ticket Card */}
      <div className="w-full rounded-3xl bg-[#0f1424] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Ticket Header */}
        <div className="p-6 bg-[#141b2e] border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#4f7cff] font-bold tracking-wider">CINE360 PASS</span>
            <h2 className="text-lg font-bold text-white mt-0.5">{b?.movie || "Confirmed Movie"}</h2>
            <p className="text-xs text-slate-400">{b?.theatre} • {b?.city}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 block font-mono">Booking Ref</span>
            <span className="text-base font-extrabold text-white font-mono">{b?.ref || ref}</span>
          </div>
        </div>

        {/* Mid Ticket Info */}
        <div className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Showtime</span>
              <span className="font-semibold text-white">
                {b ? new Date(b.start).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Today"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Seats</span>
              <span className="font-extrabold text-[#4f7cff] text-sm">
                {b?.seats?.join(", ") || "Confirmed"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Format & Language</span>
              <span className="font-semibold text-white">{b?.format || "3D Laser"} • English</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total Paid</span>
              <span className="font-bold text-emerald-400">₹{b?.total || "Confirmed"}</span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner my-2">
            <QRCodeSVG
              value={qrData}
              size={170}
              level="H"
              includeMargin={true}
            />
            <span className="text-[10px] font-mono text-slate-800 font-semibold mt-2">
              SCAN AT TURNSTILE OR STAFF GATE
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#0a0d1a] border-t border-white/[0.06] grid grid-cols-3 gap-2">
          <button
            onClick={addToCalendar}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Calendar size={13} className="text-[#4f7cff]" />
            <span>Calendar</span>
          </button>
          <button
            onClick={downloadTicket}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Download size={13} className="text-[#4f7cff]" />
            <span>Print PDF</span>
          </button>
          <button
            onClick={shareBooking}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 size={13} className="text-[#4f7cff]" />
            <span>{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      <Link
        to="/bookings"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#4f7cff] hover:underline"
      >
        <Ticket size={14} />
        <span>View all in My Tickets</span>
        <ArrowRight size={14} />
      </Link>
    </main>
  );
}

