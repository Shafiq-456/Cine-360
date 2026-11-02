import React from "react";

export default function FlatSeatMap({ seats = [], focus, onPick, heat }) {
  // Group seats by row
  const rowMap = {};
  seats.forEach((s) => {
    if (!rowMap[s.row]) rowMap[s.row] = [];
    rowMap[s.row].push(s);
  });

  const rowLabels = Object.keys(rowMap).sort();

  return (
    <div className="w-full flex flex-col items-center p-6 bg-[#0c1020] rounded-2xl border border-white/5 overflow-x-auto">
      {/* Screen Curved Indicator */}
      <div className="w-full max-w-2xl mb-8 flex flex-col items-center">
        <div className="w-4/5 h-3 border-t-4 border-[#4f7cff] rounded-t-[100px] shadow-[0_-8px_16px_rgba(79,124,255,0.4)]" />
        <span className="text-xs tracking-[0.25em] text-slate-400 font-mono mt-1">ALL EYES THIS WAY • SCREEN</span>
      </div>

      {/* Seating Grid */}
      <div className="flex flex-col gap-3 min-w-[580px] max-w-full">
        {rowLabels.map((rowLabel) => {
          const rowSeats = rowMap[rowLabel].sort((a, b) => a.num - b.num);
          const tier = rowSeats[0]?.tier || "Normal";

          return (
            <div key={rowLabel} className="flex items-center gap-3">
              <span className="w-6 text-xs font-mono font-semibold text-slate-400 text-center">{rowLabel}</span>
              <div className="flex items-center gap-2 flex-1 justify-center">
                {rowSeats.map((s, idx) => {
                  const isMine = s.status === "mine";
                  const isBooked = s.status === "booked";
                  const isHeld = s.status === "held";
                  const isFocused = focus?.id === s.id;

                  let bgColor = "#2ec4b6"; // free
                  if (isBooked) bgColor = "#2d3345";
                  else if (isHeld) bgColor = "#8a581e";
                  else if (isMine) bgColor = "#ffb703";
                  else if (heat) bgColor = `hsl(${Math.round(s.score * 1.2)}, 75%, 45%)`;

                  // Aisle spacing gap if next seat jump is > 1
                  const nextSeat = rowSeats[idx + 1];
                  const hasAisle = nextSeat && (nextSeat.x - s.x > 1.2);

                  return (
                    <React.Fragment key={s.id}>
                      <button
                        type="button"
                        onClick={() => onPick(s)}
                        disabled={isBooked || isHeld}
                        title={`Seat ${s.id} (${s.tier}) - ₹${s.price} • ${s.score}/100`}
                        style={{
                          backgroundColor: bgColor,
                          boxShadow: isFocused ? "0 0 10px #4f7cff" : "none"
                        }}
                        className={`w-7 h-7 rounded-t-lg rounded-b-sm text-[10px] font-bold flex items-center justify-center transition-all ${
                          isFocused ? "ring-2 ring-white scale-110 z-10" : "hover:scale-105"
                        } ${isBooked ? "cursor-not-allowed opacity-40 text-slate-500" : "text-slate-900 cursor-pointer"}`}
                      >
                        {s.num}
                      </button>
                      {hasAisle && <div className="w-5" />}
                    </React.Fragment>
                  );
                })}
              </div>
              <span className="w-16 text-[10px] text-slate-400 text-right">{tier}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

