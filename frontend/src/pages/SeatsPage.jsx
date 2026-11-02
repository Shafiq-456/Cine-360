import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, Flame, Sparkles, Map, Box, ChevronRight, AlertCircle, ArrowLeft } from "lucide-react";
import { api, getCurrentUser } from "../api";
import Theatre3D from "../Theatre3D.jsx";
import FlatSeatMap from "../components/FlatSeatMap.jsx";
import CheckoutDrawer from "../components/CheckoutDrawer.jsx";

export default function SeatsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showData, setShowData] = useState(null);
  const [focusSeat, setFocusSeat] = useState(null);
  const [mode, setMode] = useState("overview"); // overview vs seat
  const [viewType, setViewType] = useState("3d"); // 3d vs 2d
  const [heat, setHeat] = useState(false);
  const [groupCount, setGroupCount] = useState(2);
  const [msg, setMsg] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const loadShow = useCallback(() => {
    api(`/shows/${id}`)
      .then((data) => {
        setShowData(data);
      })
      .catch((err) => {
        setMsg(err.message || "Failed to load show details");
      });
  }, [id]);

  useEffect(() => {
    loadShow();
    const interval = setInterval(loadShow, 12000);

    // WebSocket live updates
    const protocol = location.protocol === "https:" ? "wss://" : "ws://";
    const ws = new WebSocket(`${protocol}${location.host}/ws/shows/${id}`);
    ws.onmessage = () => loadShow();

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [id, loadShow]);

  // Countdown timer for held seats
  useEffect(() => {
    const t = setInterval(() => setExpiresIn((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  if (!showData) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4f7cff] mb-4" />
        <div className="text-white text-sm">{msg || "Loading 3D Cinema Experience..."}</div>
      </div>
    );
  }

  const mineSeats = showData.seats.filter((s) => s.status === "mine");
  const mineSeatIds = mineSeats.map((s) => s.id);

  // Seat hold logic
  const handleHold = async (seatIds) => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      if (seatIds.length > 0) {
        const res = await api(`/shows/${id}/hold`, {
          method: "POST",
          body: { seats: seatIds }
        });
        setExpiresIn(res.expires_in);
      } else {
        await api(`/shows/${id}/hold`, { method: "DELETE" });
        setExpiresIn(0);
      }
      setMsg("");
      loadShow();
    } catch (err) {
      setMsg(err.message || "Could not hold seat");
      loadShow();
    }
  };

  const handlePickSeat = (seat) => {
    setFocusSeat(seat);
    if (seat.status === "booked" || seat.status === "held") return;

    if (mineSeatIds.includes(seat.id)) {
      handleHold(mineSeatIds.filter((sid) => sid !== seat.id));
    } else {
      if (mineSeatIds.length >= 8) {
        setMsg("You can select a maximum of 8 seats per booking");
        return;
      }
      handleHold([...mineSeatIds, seat.id]);
    }
  };

  const findBestSeats = async () => {
    try {
      const best = await api(`/shows/${id}/recommend?count=${groupCount}`);
      if (!best || best.length === 0) {
        setMsg(`No ${groupCount} adjacent free seats found`);
        return;
      }
      const topSeats = best[0].seats;
      handleHold(topSeats);
      const firstSeat = showData.seats.find((s) => s.id === topSeats[0]);
      if (firstSeat) setFocusSeat(firstSeat);
    } catch (err) {
      setMsg(err.message || "Recommendation error");
    }
  };

  const subtotal = mineSeats.reduce((acc, s) => acc + s.price, 0);
  const seatPriceMap = {};
  showData.seats.forEach((s) => { seatPriceMap[s.id] = s.price; });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-6">
      
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back to Movie
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <h2 className="text-sm font-bold text-white">{showData.movie.title}</h2>
            <p className="text-[11px] text-slate-400">
              {showData.theatre} • {new Date(showData.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Seat Workspace: Viewport + Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left 3 Columns: 3D / 2D Viewport */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          
          {/* Viewport Top Bar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#0f1424] border border-white/5 text-xs">
            
            {/* View Type Switcher: 3D vs 2D */}
            <div className="flex items-center gap-1 p-1 bg-[#141b2e] rounded-xl border border-white/5">
              <button
                onClick={() => setViewType("3d")}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  viewType === "3d" ? "bg-[#4f7cff] text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                <Box size={13} /> 3D View
              </button>
              <button
                onClick={() => setViewType("2d")}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  viewType === "2d" ? "bg-[#4f7cff] text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                <Map size={13} /> 2D Map
              </button>
            </div>

            {/* Camera & Heatmap Actions */}
            <div className="flex items-center gap-2">
              {viewType === "3d" && (
                <>
                  <button
                    onClick={() => setMode("overview")}
                    className={`px-3 py-1.5 rounded-xl border transition-all ${
                      mode === "overview" ? "bg-white/10 border-white/20 text-white font-semibold" : "bg-transparent border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    360° Theatre
                  </button>
                  <button
                    disabled={!focusSeat}
                    onClick={() => setMode("seat")}
                    className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                      mode === "seat"
                        ? "bg-[#4f7cff] border-[#4f7cff] text-white font-semibold"
                        : "bg-transparent border-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    }`}
                  >
                    <Eye size={13} />
                    <span>View from seat {focusSeat?.id || ""}</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setHeat(!heat)}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                  heat
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    : "bg-transparent border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <Flame size={13} />
                <span>Best-Seat Heatmap</span>
              </button>
            </div>
          </div>

          {/* Visual Canvas Area */}
          <div className="theatre-viewport-container">
            {viewType === "3d" ? (
              <Theatre3D
                seats={showData.seats}
                screen={showData.screen}
                movie={showData.movie}
                mode={mode}
                focus={focusSeat}
                heat={heat}
                onPick={handlePickSeat}
              />
            ) : (
              <div className="w-full h-full overflow-y-auto">
                <FlatSeatMap
                  seats={showData.seats}
                  focus={focusSeat}
                  onPick={handlePickSeat}
                  heat={heat}
                />
              </div>
            )}
          </div>

          {/* Availability Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-[#0f1424] border border-white/5 text-xs text-slate-400">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#2ec4b6]" /> Free
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ffb703]" /> Yours (Held)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#9a6727]" /> Other Held
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#33384a]" /> Sold
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="text-slate-300">Normal: ₹{showData.price}</span>
              <span className="text-slate-300">Executive: ₹{Math.round(showData.price * 1.35)}</span>
              <span className="text-slate-300">Premium: ₹{Math.round(showData.price * 1.75)}</span>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Seat Inspector & Recommendation */}
        <aside className="flex flex-col gap-4">
          
          {/* Smart Best Seat Recommender */}
          <div className="p-4 rounded-2xl bg-[#0f1424] border border-white/[0.06] flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#4f7cff]" />
                <span>Find Best Seats</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <label className="text-slate-400">Group:</label>
              <div className="flex items-center gap-1 bg-[#141b2e] p-1 rounded-xl border border-white/5 flex-1 justify-around">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setGroupCount(num)}
                    className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                      groupCount === num ? "bg-[#4f7cff] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={findBestSeats}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer"
            >
              Recommend {groupCount} Best Seats
            </button>
          </div>

          {/* Focused Seat Inspection Card */}
          {focusSeat ? (
            <div className="p-4 rounded-2xl bg-[#0f1424] border border-[#4f7cff]/40 shadow-[0_8px_24px_rgba(79,124,255,0.12)] flex flex-col gap-3 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Seat {focusSeat.id}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300 font-normal">
                      {focusSeat.tier}
                    </span>
                  </h3>
                  <p className="text-emerald-400 font-bold text-sm mt-0.5">₹{focusSeat.price}</p>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-[#4f7cff]">{focusSeat.score}/100</div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-300">{focusSeat.label}</span>
                </div>
              </div>

              {/* Score Bar */}
              <div className="w-full bg-[#141b2e] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#2ec4b6] via-[#4f7cff] to-[#ffb703] h-full rounded-full transition-all"
                  style={{ width: `${focusSeat.score}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-300 italic leading-relaxed">
                "{focusSeat.tip}"
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px] text-slate-400">
                <div>Screen View: <b className="text-white">{focusSeat.angle}°</b></div>
                <div>Off-Centre: <b className="text-white">{focusSeat.off_axis}°</b></div>
                <div>Neck Tilt: <b className="text-white">{focusSeat.neck_tilt}°</b></div>
                <div>Distance: <b className="text-white">{focusSeat.distance}m</b></div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#0f1424] border border-white/5 text-center text-slate-400 text-xs">
              Click any seat in 3D or 2D to inspect sightline metrics and pricing.
            </div>
          )}

          {/* Error notice */}
          {msg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{msg}</span>
            </div>
          )}
        </aside>
      </div>

      {/* Sticky Bottom Booking Bar */}
      {mineSeats.length > 0 && (
        <div className="sticky bottom-4 z-40 p-4 rounded-2xl bg-[#0f1424]/95 backdrop-blur-xl border border-[#4f7cff]/40 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Selected Seats:</span>
                <span className="text-sm font-bold text-white">{mineSeats.map((s) => s.id).join(", ")}</span>
              </div>
              <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                Held for {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, "0")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-400">Subtotal</div>
              <div className="text-xl font-extrabold text-[#4f7cff]">₹{subtotal}</div>
            </div>

            <button
              onClick={() => setCheckoutOpen(true)}
              className="px-8 py-3 rounded-xl bg-[#4f7cff] hover:bg-[#3d6ae8] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_4px_20px_rgba(79,124,255,0.4)] transition-all cursor-pointer"
            >
              <span>Proceed to Pay</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Checkout & Payment Drawer Modal */}
      <CheckoutDrawer
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        show={showData}
        selectedSeats={mineSeatIds}
        seatPriceMap={seatPriceMap}
        expiresIn={expiresIn}
        onSuccess={(booking) => {
          setCheckoutOpen(false);
          navigate(`/booking/confirmed/${booking.ref}`);
        }}
      />
    </div>
  );
}

