import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Clock, Calendar, Play, Shield, MapPin, X } from "lucide-react";
import { api, getSelectedCity } from "../api";

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(getSelectedCity());
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState("All");
  const [trailerOpen, setTrailerOpen] = useState(false);

  // Generate 7 upcoming dates
  const next7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d,
      dayStr: i === 0 ? "Today" : d.toLocaleDateString([], { weekday: "short" }),
      dateNum: d.getDate(),
      monthStr: d.toLocaleDateString([], { month: "short" }),
      isoDay: d.toISOString().split("T")[0]
    };
  });

  useEffect(() => {
    const handleCity = () => setCity(getSelectedCity());
    window.addEventListener("cine360_city_change", handleCity);
    return () => window.removeEventListener("cine360_city_change", handleCity);
  }, []);

  useEffect(() => {
    setLoading(true);
    api(`/movies/${id}?city=${city}`)
      .then((data) => {
        setMovie(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load movie details:", err);
        setLoading(false);
      });
  }, [id, city]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 animate-pulse flex flex-col gap-8">
        <div className="w-full h-80 bg-slate-800/40 rounded-3xl" />
        <div className="w-1/2 h-8 bg-slate-800/40 rounded" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center text-white">
        Movie not found. <Link to="/" className="text-[#4f7cff] underline">Back to home</Link>
      </div>
    );
  }

  // Filter shows by selected day & format
  const chosenDayStr = next7Days[selectedDateIdx].isoDay;
  const filteredShows = (movie.shows || []).filter((s) => {
    const showDay = s.start.split("T")[0];
    const matchDay = showDay === chosenDayStr;
    const matchFmt = selectedFormat === "All" || s.format === selectedFormat;
    return matchDay && matchFmt;
  });

  // Group shows by Theatre
  const theatreMap = {};
  filteredShows.forEach((s) => {
    const key = `${s.theatre} • ${s.city}`;
    if (!theatreMap[key]) {
      theatreMap[key] = {
        theatre_id: s.theatre_id,
        theatre: s.theatre,
        city: s.city,
        amenities: s.amenities || [],
        cancellation: s.cancellation,
        shows: []
      };
    }
    theatreMap[key].shows.push(s);
  });

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-10">
      
      {/* Hero Backdrop Banner */}
      <div className="relative rounded-3xl overflow-hidden min-h-[420px] flex items-end p-6 md:p-12 border border-white/10 shadow-2xl">
        {movie.backdrop_url ? (
          <img
            src={movie.backdrop_url}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.4]"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full"
            style={{ background: `linear-gradient(135deg, ${movie.c1 || "#0f172a"}, ${movie.c2 || "#4f7cff"})` }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d1a] via-[#0a0d1a]/60 to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-end w-full">
          {/* Poster image */}
          <div className="w-36 md:w-52 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 hidden sm:block bg-slate-900">
            <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-[#4f7cff] text-white text-xs font-bold font-mono">
                {movie.certificate}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/60 text-amber-400 text-xs font-bold border border-white/10">
                <Star size={13} fill="currentColor" />
                <span>{movie.rating} / 10</span>
              </div>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Clock size={12} /> {movie.minutes} mins
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-300">{movie.language}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
              {movie.title}
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {movie.synopsis || movie.blurb}
            </p>

            {/* Genres & Director */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div>
                <span className="text-slate-400">Genres:</span>{" "}
                <span className="text-white font-medium">{(movie.genres || []).join(", ")}</span>
              </div>
              {movie.director && (
                <div>
                  <span className="text-slate-400">Director:</span>{" "}
                  <span className="text-white font-medium">{movie.director}</span>
                </div>
              )}
            </div>

            {/* Cast Chips */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="flex items-center gap-2 text-xs overflow-x-auto py-1">
                <span className="text-slate-400 shrink-0">Cast:</span>
                {movie.cast.map((actor) => (
                  <span key={actor} className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-[11px] shrink-0">
                    {actor}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <a
                href="#showtimes-section"
                className="px-6 py-3 rounded-xl bg-[#4f7cff] hover:bg-[#3d6ae8] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_4px_20px_rgba(79,124,255,0.4)] transition-all"
              >
                <Calendar size={15} />
                <span>Book Tickets</span>
              </a>

              {movie.trailer_url && (
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Watch Trailer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {trailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <button
              onClick={() => setTrailerOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            <div className="w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailer_url.split("v=")[1] || "Way9Dexny3w"}?autoplay=1`}
                title="Trailer"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Showtimes Section */}
      <section id="showtimes-section" className="flex flex-col gap-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>Showtimes in</span>
              <span className="text-[#4f7cff] flex items-center gap-1">
                <MapPin size={20} /> {city}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Select a showtime to inspect seats in 3D</p>
          </div>

          {/* Format Filters */}
          <div className="flex items-center gap-2">
            {["All", "IMAX 3D", "3D", "2D"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedFormat === fmt
                    ? "bg-[#4f7cff] text-white shadow"
                    : "bg-[#0f1424] text-slate-400 border border-white/5 hover:text-white"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* 7-Day Horizontal Date Strip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {next7Days.map((dItem, idx) => (
            <button
              key={dItem.isoDay}
              onClick={() => setSelectedDateIdx(idx)}
              className={`flex flex-col items-center min-w-[76px] py-2.5 px-3 rounded-2xl border transition-all cursor-pointer ${
                selectedDateIdx === idx
                  ? "bg-[#4f7cff] border-[#4f7cff] text-white shadow-[0_4px_16px_rgba(79,124,255,0.4)]"
                  : "bg-[#0f1424] border-white/5 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              <span className="text-[11px] font-medium uppercase">{dItem.dayStr}</span>
              <span className="text-lg font-bold my-0.5">{dItem.dateNum}</span>
              <span className="text-[10px] uppercase font-mono">{dItem.monthStr}</span>
            </button>
          ))}
        </div>

        {/* Theatres & Showtime Pills */}
        <div className="flex flex-col gap-4">
          {Object.keys(theatreMap).length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0f1424] border border-white/5 text-center text-slate-400 text-xs">
              No shows available on {next7Days[selectedDateIdx].dayStr}, {next7Days[selectedDateIdx].dateNum} {next7Days[selectedDateIdx].monthStr} for the selected format.
            </div>
          ) : (
            Object.values(theatreMap).map((theatreGroup) => (
              <div
                key={theatreGroup.theatre}
                className="p-5 rounded-2xl bg-[#0f1424] border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#4f7cff]/30 transition-all"
              >
                {/* Theatre info */}
                <div className="flex flex-col gap-2 max-w-sm">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{theatreGroup.theatre}</h3>
                    {theatreGroup.cancellation && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Cancellation Available
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {theatreGroup.amenities.map((amenity) => (
                      <span key={amenity} className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Showtime Pills */}
                <div className="flex flex-wrap items-center gap-3">
                  {theatreGroup.shows.map((s) => {
                    const timeStr = new Date(s.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
                      <Link
                        key={s.id}
                        to={`/show/${s.id}`}
                        className="flex flex-col items-center px-4 py-2 rounded-xl bg-[#141b2e] border border-white/10 hover:border-[#4f7cff] hover:bg-[#4f7cff]/10 text-white transition-all group"
                      >
                        <span className="text-xs font-bold group-hover:text-[#4f7cff]">{timeStr}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-emerald-400">₹{s.price}</span>
                          <span className="text-[9px] px-1 rounded bg-white/10 text-slate-300">{s.format}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

