import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, Clock, Eye, Film, Sparkles } from "lucide-react";
import { api, getSelectedCity } from "../api";

const GENRES = [
  "All",
  "Sci-Fi",
  "Action",
  "IMAX Experience",
  "Cyberpunk",
  "Documentary",
  "Nature"
];

export default function Home() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [city, setCity] = useState(getSelectedCity());

  useEffect(() => {
    const handleCity = () => setCity(getSelectedCity());
    window.addEventListener("cine360_city_change", handleCity);
    return () => window.removeEventListener("cine360_city_change", handleCity);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (activeGenre && activeGenre !== "All") params.set("genre", activeGenre);
    if (searchTerm) params.set("search", searchTerm);

    api(`/movies?${params.toString()}`)
      .then((data) => {
        setMovies(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load movies:", err);
        setLoading(false);
      });
  }, [city, activeGenre, searchTerm]);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
      
      {/* Search & Genre Header */}
      <div className="flex flex-col gap-5 items-center text-center max-w-3xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151d38] border border-[#4f7cff]/30 text-[#4f7cff] text-xs font-semibold shadow-[0_0_20px_rgba(79,124,255,0.15)]">
          <Sparkles size={13} />
          <span>Interactive 3D Cinema Experience • {city}</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Explore Movies & <span className="text-[#4f7cff]">Live 3D Sightlines</span>
        </h1>

        {/* Wide Search Bar */}
        <div className="relative w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, director or synopsis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#0f1424] border border-white/[0.08] text-sm text-white placeholder-slate-400 shadow-xl focus:outline-none focus:border-[#4f7cff] focus:ring-1 focus:ring-[#4f7cff] transition-all"
          />
        </div>

        {/* Genre Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeGenre === g
                  ? "bg-[#4f7cff] text-white shadow-[0_0_15px_rgba(79,124,255,0.4)]"
                  : "bg-[#0f1424] text-slate-400 border border-white/[0.06] hover:text-white hover:border-white/20"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Movie Grid: 5 columns on desktop */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3 rounded-2xl bg-[#0f1424] p-3 border border-white/5">
              <div className="w-full aspect-[2/3] bg-slate-800/50 rounded-xl" />
              <div className="h-4 bg-slate-800/50 rounded w-3/4" />
              <div className="h-3 bg-slate-800/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Film size={44} className="text-slate-400" />
          <h3 className="text-lg font-bold text-white">No movies found</h3>
          <p className="text-xs text-slate-400 max-w-md">
            No showtimes match your current filters for {city}. Try switching to another genre or clearing the search bar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map((m) => {
            const genresStr = (m.genres || [m.genre]).slice(0, 3).join(" • ");
            const hasPoster = m.poster_url && m.poster_url.startsWith("http");

            return (
              <div key={m.id} className="movie-card-container group">
                {/* Poster Wrapper */}
                <div className="movie-poster-wrapper">
                  {hasPoster ? (
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      loading="lazy"
                      className="movie-poster-img"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}

                  {/* Gradient Fallback */}
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${m.c1 || "#0f172a"}, ${m.c2 || "#4f7cff"})`,
                      display: hasPoster ? "none" : "flex"
                    }}
                    className="w-full h-full p-4 flex-col justify-end text-white"
                  >
                    <span className="font-extrabold text-base leading-tight drop-shadow">{m.title}</span>
                  </div>

                  {/* Top-Left: Star Rating Badge */}
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 flex items-center gap-1 text-[11px] font-bold text-amber-400 z-10">
                    <Star size={11} fill="currentColor" />
                    <span>{m.rating || "8.5"}</span>
                  </div>

                  {/* Top-Right: Certificate Badge */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-[#0a0d1a]/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-semibold text-slate-300 z-10">
                    {m.certificate || "UA 16+"}
                  </div>

                  {/* Hover Overlay Action Buttons */}
                  <div className="movie-overlay-actions">
                    <button
                      onClick={() => navigate(`/movie/${m.id}`)}
                      className="w-full py-2.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d6ae8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(79,124,255,0.5)] transition-all cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>Select Showtime</span>
                    </button>
                    <button
                      onClick={() => navigate(`/movie/${m.id}`)}
                      className="w-full py-2 rounded-xl bg-[#0a0d1a]/90 hover:bg-[#0a0d1a] border border-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      Movie Details
                    </button>
                  </div>
                </div>

                {/* Card Info Content */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-2.5">
                  <div>
                    <h3 className="movie-card-title font-bold text-sm tracking-tight line-clamp-1">
                      {m.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {genresStr}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-400" />
                      <span>{m.minutes}m</span>
                    </div>
                    <span className="font-medium text-slate-300">{m.language}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

