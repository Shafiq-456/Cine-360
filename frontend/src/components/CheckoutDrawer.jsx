import { useState, useEffect } from "react";
import { X, Clock, Tag, ShoppingBag, CreditCard, QrCode, Building, Wallet, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { api } from "../api";

export default function CheckoutDrawer({
  isOpen,
  onClose,
  show,
  selectedSeats = [],
  seatPriceMap = {},
  expiresIn = 600,
  onSuccess
}) {
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [foodItems, setFoodItems] = useState([]);
  const [foodCart, setFoodCart] = useState({});
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardData, setCardData] = useState({
    number: "4242 4242 4242 4242",
    expiry: "12/28",
    cvv: "123",
    name: "Alex Hunter"
  });
  const [upiId, setUpiId] = useState("demo@okhdfcbank");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    setTimeLeft(expiresIn);
  }, [expiresIn]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      api("/food-items")
        .then(setFoodItems)
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Pricing computations
  const ticketSubtotal = selectedSeats.reduce((sum, seatId) => sum + (seatPriceMap[seatId] || show?.price || 240), 0);
  const convenienceFee = Math.round(ticketSubtotal * 0.03 * 100) / 100;
  const gst = Math.round(convenienceFee * 0.18 * 100) / 100;

  const foodSubtotal = Object.entries(foodCart).reduce((sum, [id, qty]) => {
    const item = foodItems.find((f) => f.id === Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const discountAmount = appliedPromo ? appliedPromo.discount : 0;
  const grandTotal = Math.max(0, Math.round((ticketSubtotal + convenienceFee + gst + foodSubtotal - discountAmount) * 100) / 100);

  const updateFoodQty = (id, delta) => {
    setFoodCart((prev) => {
      const cur = prev[id] || 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const applyPromo = async () => {
    setPromoError("");
    if (!promoCode.trim()) return;
    try {
      const res = await api("/promo/validate", {
        method: "POST",
        body: { code: promoCode.trim(), subtotal: ticketSubtotal }
      });
      setAppliedPromo(res);
    } catch (err) {
      setPromoError(err.message || "Invalid coupon code");
      setAppliedPromo(null);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    setPayError("");
    try {
      const formattedFood = Object.entries(foodCart).map(([id, qty]) => {
        const item = foodItems.find((f) => f.id === Number(id));
        return {
          id: Number(id),
          name: item.name,
          price: item.price,
          qty
        };
      });

      // Call booking endpoint
      const bookingRes = await api("/bookings", {
        method: "POST",
        body: {
          show_id: show.id,
          seats: selectedSeats,
          card: cardData.number,
          payment_method: paymentMethod,
          promo_code: appliedPromo?.code || "",
          food_items: formattedFood
        }
      });

      onSuccess(bookingRes);
    } catch (err) {
      setPayError(err.message || "Payment could not be processed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0f1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden my-auto max-h-[92vh]">
        
        {/* Left Side: Order Details, F&B, Promos */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Order Summary</h2>
              <p className="text-xs text-slate-400">{show?.theatre} • {show?.city}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-semibold">
              <Clock size={14} className="animate-spin-slow" />
              <span>{minutes}:{seconds}</span>
            </div>
          </div>

          {/* Show & Seat Details */}
          <div className="p-4 rounded-2xl bg-[#141b2e] border border-white/5 flex flex-col gap-2 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-white text-sm">{show?.movie?.title}</div>
                <div className="text-slate-400">{show?.format} • {new Date(show?.start).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-[#4f7cff]/10 text-[#4f7cff] font-semibold">
                {selectedSeats.length} Seats
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-slate-300">
              <span>Selected: <b className="text-white">{selectedSeats.join(", ")}</b></span>
              <span>₹{ticketSubtotal}</span>
            </div>
          </div>

          {/* Food & Beverage Add-ons */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-white uppercase tracking-wider">
              <ShoppingBag size={14} className="text-[#4f7cff]" />
              <span>Grab a Bite (Optional F&B)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
              {foodItems.slice(0, 4).map((item) => {
                const qty = foodCart[item.id] || 0;
                return (
                  <div key={item.id} className="p-3 rounded-xl bg-[#141b2e] border border-white/5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl">{item.image_url}</span>
                      <div className="truncate">
                        <div className="font-medium text-white truncate">{item.name}</div>
                        <div className="text-[11px] text-slate-400">₹{item.price}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {qty > 0 && (
                        <>
                          <button onClick={() => updateFoodQty(item.id, -1)} className="w-6 h-6 rounded-md bg-white/10 text-white font-bold flex items-center justify-center hover:bg-white/20">-</button>
                          <span className="font-semibold text-white w-4 text-center">{qty}</span>
                        </>
                      )}
                      <button onClick={() => updateFoodQty(item.id, 1)} className="px-2.5 py-1 rounded-md bg-[#4f7cff] text-white font-semibold text-[11px] hover:bg-[#3d6ae8]">
                        {qty > 0 ? "+" : "Add"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Promo Code Box */}
          <div className="p-4 rounded-2xl bg-[#141b2e] border border-white/5">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-white">
              <Tag size={13} className="text-[#4f7cff]" />
              <span>Have a Promo Code?</span>
              <span className="text-[10px] text-slate-400 font-normal">(Try WELCOME50 or CINE20)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Promo Code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0a0d1a] border border-white/10 text-xs text-white uppercase tracking-wider focus:outline-none focus:border-[#4f7cff]"
              />
              <button
                type="button"
                onClick={applyPromo}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all"
              >
                Apply
              </button>
            </div>
            {appliedPromo && (
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>{appliedPromo.message}</span>
              </div>
            )}
            {promoError && (
              <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle size={13} />
                <span>{promoError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Payment Methods & Pay Button */}
        <div className="w-full md:w-[380px] p-6 md:p-8 bg-[#0b0f1d] flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase font-semibold">Payment Details</span>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#141b2e] rounded-xl border border-white/5 text-[11px] font-medium text-center">
            {[
              { id: "card", label: "Card", icon: CreditCard },
              { id: "upi", label: "UPI", icon: QrCode },
              { id: "netbanking", label: "NetBank", icon: Building },
              { id: "wallet", label: "Wallet", icon: Wallet }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPaymentMethod(tab.id)}
                  className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === tab.id ? "bg-[#4f7cff] text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Payment Method Inputs */}
          <div className="flex-1 flex flex-col justify-center">
            {paymentMethod === "card" && (
              <div className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141b2e] border border-white/10 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Test mode prefilled (Use 4000...2 to test decline)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#141b2e] border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#141b2e] border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141b2e] border border-white/10 text-white"
                  />
                </div>
              </div>
            )}

            {paymentMethod === "upi" && (
              <div className="flex flex-col gap-3 text-xs">
                <label className="text-[11px] text-slate-400">Virtual Payment Address (VPA)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okhdfcbank"
                  className="w-full px-3 py-2 rounded-xl bg-[#141b2e] border border-white/10 text-white font-mono"
                />
                <div className="p-3 rounded-xl bg-[#141b2e] border border-dashed border-[#4f7cff]/40 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <QrCode size={36} className="text-black" />
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <div className="font-semibold text-white">Dynamic UPI QR</div>
                    Scan with GPay, PhonePe, or Paytm
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "netbanking" && (
              <div className="flex flex-col gap-3 text-xs">
                <label className="text-[11px] text-slate-400">Select Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank"].map((bank) => (
                    <button
                      key={bank}
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        selectedBank === bank ? "bg-[#4f7cff]/20 border-[#4f7cff] text-white" : "bg-[#141b2e] border-white/5 text-slate-400"
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === "wallet" && (
              <div className="flex flex-col gap-2 text-xs">
                {["Paytm Wallet", "PhonePe Wallet", "Amazon Pay"].map((w, idx) => (
                  <button
                    key={w}
                    onClick={() => setSelectedBank(w)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                      idx === 0 ? "bg-[#4f7cff]/20 border-[#4f7cff] text-white" : "bg-[#141b2e] border-white/5 text-slate-300"
                    }`}
                  >
                    <span>{w}</span>
                    <span className="text-[10px] text-emerald-400">Active</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Breakdown & Action Button */}
          <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.08] text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Tickets Subtotal</span>
              <span>₹{ticketSubtotal}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Convenience Fee (3%)</span>
              <span>₹{convenienceFee}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST (18% on Fee)</span>
              <span>₹{gst}</span>
            </div>
            {foodSubtotal > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Food & Beverages</span>
                <span>₹{foodSubtotal}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Coupon Discount ({appliedPromo?.code})</span>
                <span>- ₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10">
              <span>Grand Total</span>
              <span className="text-[#4f7cff]">₹{grandTotal}</span>
            </div>

            {payError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={loading || selectedSeats.length === 0}
              className="w-full py-3.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d6ae8] text-white font-bold text-sm shadow-[0_4px_20px_rgba(79,124,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Securing Payment...</span>
              ) : (
                <>
                  <span>Pay ₹{grandTotal}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

