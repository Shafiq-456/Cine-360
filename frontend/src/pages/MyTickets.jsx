import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Ticket, Calendar, Clock, Star, AlertCircle, CheckCircle2, X } from "lucide-react";
import { api, getCurrentUser } from "../api";

export default function MyTickets() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming"); // upcoming vs past
  const [qrModalRef, setQrModalRef] = useState(null);
  const [cancellingRef, setCancellingRef] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [ratingModalMovie, setRatingModalMovie] = useState(null);
  const [stars, setStars] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const loadBookings = () => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setLoading(true);
    api("/bookings/me")
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load bookings");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async (ref) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api(`/bookings/${ref}/cancel`, { method: "POST" });
      setCancellingRef(null);
      setSuccessMsg(`Booking ${ref} cancelled successfully! Full refund of ₹${res.refund_amount} processed.`);
      loadBookings();
    } catch (err) {
      setErrorMsg(err.message || "Cancellation failed");
      setCancellingRef(null);
    }
  };

  const submitRating = async () => {
    if (!ratingModalMovie) return;
    try {
      await api(`/movies/${ratingModalMovie.id || 1}/rate`, {
        method: "POST",
        body: { rating: stars * 2, review: reviewText }
      });
      setSuccessMsg("Thank you! Your rating has been submitted.");
      setRatingModalMovie(null);
    } catch (err) {
      setErrorMsg(err.message || "Rating could not be submitted");
    }
  };

  const now = new Date();
  const upcomingBookings = bookings.filter((b) => new Date(b.start) >= now && b.status !== "cancelled");
  const pastBookings = bookings.filter((b) => new Date(b.start) < now || b.status === "cancelled");

  const currentList = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            My Tickets
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage active passes and view booking history</p>
        </div>

        {/* Upcoming vs Past Pill Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#141b2e] rounded-xl border border-white/5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "upcoming" ? "bg-[#4f7cff] text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "past" ? "bg-[#4f7cff] text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Past & Cancelled ({pastBookings.length})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")}><X size={14} /></button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading passes...</div>
      ) : currentList.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0f1424] border border-white/5 text-center flex flex-col items-center gap-4">
          <Ticket size={40} className="text-slate-400" />
          <h3 className="text-base font-bold text-white">No {activeTab} tickets</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {activeTab === "upcoming"
              ? "You don't have any upcoming reservations. Pick a movie and experience our 3D sightline seat selector."
              : "No past bookings recorded yet."}
          </p>
          <Link to="/" className="btn-primary mt-2 text-xs">Explore Movies</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {currentList.map((b) => {
            const startDate = new Date(b.start);
            const isConfirmed = b.status === "confirmed";
            const isCheckedIn = b.status === "checked_in";
            const isCancelled = b.status === "cancelled";
            const hoursUntilShow = (startDate - now) / 3600000;
            const canCancel = isConfirmed && hoursUntilShow >= 2;

            return (
              <div
                key={b.ref}
                className="p-5 rounded-3xl bg-[#0f1424] border border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-[#4f7cff]/30 transition-all"
              >
                {/* Left Ticket Info */}
                <div className="flex items-start gap-4 flex-1">
                  {b.poster_url ? (
                    <img
                      src={b.poster_url}
                      alt={b.movie}
                      className="w-16 h-24 rounded-xl object-cover border border-white/10 shrink-0 hidden sm:block"
                    />
                  ) : (
                    <div className="w-16 h-24 rounded-xl bg-[#141b2e] border border-white/10 shrink-0 hidden sm:flex items-center justify-center text-slate-400">
                      <Ticket size={24} />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{b.movie}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isCheckedIn
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : isConfirmed
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{b.theatre} • {b.city}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar size={12} className="text-[#4f7cff]" />
                        {startDate.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock size={12} className="text-[#4f7cff]" />
                        {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>Seats: <b className="text-white font-mono">{b.seats.join(", ")}</b></span>
                      <span>Total: <b className="text-emerald-400 font-mono">₹{b.total}</b></span>
                    </div>

                    {isCancelled && (
                      <p className="text-[11px] text-amber-400 mt-1">
                        Refund of ₹{b.refund_amount || b.total} issued to payment source.
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Actions: QR Button, Cancel, Rate */}
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                  {(isConfirmed || isCheckedIn) && (
                    <button
                      onClick={() => setQrModalRef(b)}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <QRCodeSVG value={b.qr_token || b.ref} size={14} />
                      <span>View Pass</span>
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => setCancellingRef(b)}
                      className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  {/* Rating button for past shows */}
                  {activeTab === "past" && !isCancelled && (
                    <button
                      onClick={() => setRatingModalMovie(b)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Star size={13} fill="currentColor" />
                      <span>Rate Movie</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Pop-up Modal */}
      {qrModalRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0f1424] border border-white/10 p-6 flex flex-col items-center gap-4 text-center">
            <button
              onClick={() => setQrModalRef(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="text-xs font-mono text-[#4f7cff] font-bold uppercase tracking-wider">CINE360 GATE SCAN</div>
            <h3 className="text-base font-bold text-white">{qrModalRef.movie}</h3>
            <p className="text-xs text-slate-400">{qrModalRef.theatre} • Seats {qrModalRef.seats.join(", ")}</p>

            <div className="p-4 bg-white rounded-2xl shadow-xl my-2">
              <QRCodeSVG value={qrModalRef.qr_token || qrModalRef.ref} size={180} level="H" />
            </div>

            <div className="font-mono text-sm font-bold text-white tracking-widest">{qrModalRef.ref}</div>
            <p className="text-[10px] text-slate-400">Present this QR code to the usher at theatre entrance</p>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog Modal */}
      {cancellingRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0f1424] border border-red-500/30 p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-red-400" />
              <span>Cancel Booking {cancellingRef.ref}?</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel your tickets for <b className="text-white">{cancellingRef.movie}</b> (Seats: {cancellingRef.seats.join(", ")})?
            </p>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              ✓ Eligible for 100% refund of <b>₹{cancellingRef.total}</b> (cancelled {">"} 2 hours before showtime).
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCancellingRef(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20"
              >
                Keep Tickets
              </button>
              <button
                onClick={() => handleCancelBooking(cancellingRef.ref)}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-lg"
              >
                Confirm Cancellation & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movie Rating Modal */}
      {ratingModalMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0f1424] border border-white/10 p-6 flex flex-col gap-4">
            <button
              onClick={() => setRatingModalMovie(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-white">Rate {ratingModalMovie.movie}</h3>
            <p className="text-xs text-slate-400">How was your movie experience?</p>

            <div className="flex items-center justify-center gap-2 py-3">
              {[1, 2, 3, 4, 5].map((sVal) => (
                <button
                  key={sVal}
                  onClick={() => setStars(sVal)}
                  className="p-1 text-2xl transition-transform hover:scale-110"
                >
                  <Star
                    size={30}
                    className={sVal <= stars ? "text-amber-400 fill-amber-400" : "text-slate-600"}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows="3"
              placeholder="Write a brief review (optional)..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#141b2e] border border-white/10 text-xs text-white focus:outline-none focus:border-[#4f7cff]"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRatingModalMovie(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                className="px-5 py-2 rounded-xl bg-[#4f7cff] hover:bg-[#3d6ae8] text-white text-xs font-bold"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

