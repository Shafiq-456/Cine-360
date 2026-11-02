import { useState, useEffect } from "react";
import { Box, MapPin, Sparkles, X, Check } from "lucide-react";
import { api, getSelectedCity } from "../api";
import Theatre3D from "../Theatre3D.jsx";

export default function TheatresPage() {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(getSelectedCity());
  const [previewTheatre, setPreviewTheatre] = useState(null);

  useEffect(() => {
    const handleCity = () => setCity(getSelectedCity());
    window.addEventListener("cine360_city_change", handleCity);
    return () => window.removeEventListener("cine360_city_change", handleCity);
  }, []);

  useEffect(() => {
    setLoading(true);
    api(`/theatres?city=${city}`)
      .then((data) => {
        setTheatres(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [city]);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>CINE360 Premium Theatres</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Experience our laser projection, Dolby Atmos soundscapes, and luxury seating in {city}
          </p>
        </div>
      </div>

      {/* Theatres Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-60 rounded-3xl bg-[#0f1424] border border-white/5" />
          ))}
        </div>
      ) : theatres.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">No theatres listed in {city}.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {theatres.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-3xl bg-[#0f1424] border border-white/[0.06] hover:border-[#4f7cff]/40 shadow-xl flex flex-col justify-between gap-6 transition-all group"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#4f7cff] font-bold uppercase tracking-wider">
                      FLAGSHIP MULTIPLEX
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#4f7cff] transition-colors mt-0.5">
                      {t.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin size={13} className="text-[#4f7cff]" /> {t.city}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                    {t.formats.map((fmt) => (
                      <span key={fmt} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4f7cff]/10 text-[#4f7cff] font-bold">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Amenities List */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {t.amenities.map((a) => (
                    <span key={a} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/5">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom 3D Preview Trigger */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">
                  Rows: {t.layout?.rows?.length || 10} • Screen: {t.layout?.screen?.width}m
                </div>

                <button
                  onClick={() => setPreviewTheatre(t)}
                  className="px-4 py-2.5 rounded-xl bg-[#4f7cff]/10 hover:bg-[#4f7cff] text-[#4f7cff] hover:text-white border border-[#4f7cff]/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Box size={14} />
                  <span>Preview 3D Theatre</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3D Preview Modal */}
      {previewTheatre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-5xl h-[80vh] rounded-3xl bg-[#0f1424] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 bg-[#141b2e] border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{previewTheatre.name}</span>
                  <span className="text-xs text-slate-400 font-normal">({previewTheatre.city})</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">Interactive 3D Spatial Architectural Preview</p>
              </div>
              <button
                onClick={() => setPreviewTheatre(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 relative w-full h-full bg-[#080a14]">
              <Theatre3D
                seats={previewTheatre.layout?.rows ? previewTheatre.seats || [] : []}
                screen={previewTheatre.layout?.screen}
                movie={{ title: previewTheatre.name, genre: previewTheatre.city, minutes: 120, c1: "#0a0d1a", c2: "#4f7cff" }}
                mode="overview"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

