import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  TrendingUp, Ticket, Users, Film, Plus, Edit2, Trash2, Box, Save, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";
import { api, getCurrentUser } from "../api";
import Theatre3D from "../Theatre3D.jsx";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState("overview"); // overview, movies, theatres, shows
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Entities state
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);

  // Modal / Editor State
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [theatreJson, setTheatreJson] = useState("");
  const [theatreJsonError, setTheatreJsonError] = useState("");
  const [liveLayout, setLiveLayout] = useState(null);

  // New Show State
  const [newShow, setNewShow] = useState({
    movie_id: "",
    theatre_id: "",
    start: "",
    price: 280,
    format: "3D",
    language: "English"
  });
  const [showStatus, setShowStatus] = useState("");

  useEffect(() => {
    const cur = getCurrentUser();
    setUser(cur);
    if (!cur || cur.role !== "admin") {
      navigate("/");
      return;
    }

    loadDashboard();
    api("/movies").then(setMovies).catch(() => {});
    api("/theatres").then(setTheatres).catch(() => {});
  }, [navigate]);

  const loadDashboard = () => {
    setLoading(true);
    api("/admin/dashboard")
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setLoading(false);
      });
  };

  const handleEditTheatreLayout = (t) => {
    setEditingTheatre(t);
    const jsonStr = JSON.stringify(t.layout, null, 2);
    setTheatreJson(jsonStr);
    setLiveLayout(t.layout);
    setTheatreJsonError("");
  };

  const handleJsonChange = (val) => {
    setTheatreJson(val);
    try {
      const parsed = JSON.parse(val);
      setLiveLayout(parsed);
      setTheatreJsonError("");
    } catch (e) {
      setTheatreJsonError("Invalid JSON syntax: " + e.message);
    }
  };

  const saveTheatreLayout = async () => {
    if (theatreJsonError || !liveLayout) return;
    try {
      await api(`/admin/theatres/${editingTheatre.id}`, {
        method: "PUT",
        body: {
          name: editingTheatre.name,
          city: editingTheatre.city,
          amenities: editingTheatre.amenities || [],
          formats_supported: editingTheatre.formats || [],
          layout: liveLayout
        }
      });
      setShowStatus("Theatre layout updated successfully!");
      setEditingTheatre(null);
      api("/theatres").then(setTheatres);
    } catch (err) {
      setTheatreJsonError(err.message || "Failed to save theatre layout");
    }
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    setShowStatus("");
    try {
      await api("/admin/shows", {
        method: "POST",
        body: {
          movie_id: Number(newShow.movie_id),
          theatre_id: Number(newShow.theatre_id),
          start: newShow.start,
          price: Number(newShow.price),
          format: newShow.format,
          language: newShow.language
        }
      });
      setShowStatus("Show scheduled successfully!");
      setNewShow({ ...newShow, start: "" });
      loadDashboard();
    } catch (err) {
      setShowStatus("Error: " + err.message);
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center text-white">
        Loading Command Center Analytics...
      </div>
    );
  }

  const kpi = data?.kpi || { revenue: 0, tickets: 0, occupancy: 0, bookings_count: 0 };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-[10px] font-mono text-[#4f7cff] font-bold uppercase tracking-wider">
            ADMINISTRATOR OS
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Cinema Ecosystem Command Center
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#141b2e] rounded-xl border border-white/5 text-xs font-semibold">
          {[
            { id: "overview", label: "Overview & Charts" },
            { id: "theatres", label: "3D Layout Editor" },
            { id: "shows", label: "Show Scheduler" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id ? "bg-[#4f7cff] text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {showStatus && (
        <div className="p-3.5 rounded-2xl bg-[#4f7cff]/10 border border-[#4f7cff]/30 text-white text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#4f7cff]" />
          <span>{showStatus}</span>
        </div>
      )}

      {/* Overview Tab: KPI Cards & Charts */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-8">
          
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0f1424] border border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Total Box Office</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">₹{kpi.revenue.toLocaleString()}</h3>
                <span className="text-[10px] text-emerald-400 font-mono">● Confirmed receipts</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#4f7cff]/10 text-[#4f7cff] flex items-center justify-center">
                <TrendingUp size={22} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0f1424] border border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Tickets Sold</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">{kpi.tickets}</h3>
                <span className="text-[10px] text-slate-400 font-mono">Across {kpi.bookings_count} bookings</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Ticket size={22} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0f1424] border border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Auditorium Occupancy</span>
                <h3 className="text-2xl font-extrabold text-[#4f7cff] mt-1">{kpi.occupancy}%</h3>
                <span className="text-[10px] text-slate-400 font-mono">Seat filling density</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Users size={22} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0f1424] border border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Active Screenings</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">{movies.length} Movies</h3>
                <span className="text-[10px] text-slate-400 font-mono">{theatres.length} Theatres configured</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Film size={22} />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Revenue Trend Area Chart */}
            <div className="p-6 rounded-3xl bg-[#0f1424] border border-white/[0.06] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Daily Revenue Trajectory</h3>
                  <p className="text-[11px] text-slate-400">7-day gross box office turnover (₹)</p>
                </div>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.revenue_trend || []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f7cff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f7cff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#141b2e", borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#4f7cff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bookings per Movie Bar Chart */}
            <div className="p-6 rounded-3xl bg-[#0f1424] border border-white/[0.06] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Seats Sold by Title</h3>
                  <p className="text-[11px] text-slate-400">Audience distribution across current catalogue</p>
                </div>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.bookings_per_movie || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="movie" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split(" ")[0]} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#141b2e", borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                    <Bar dataKey="seats" fill="#2ec4b6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theatres & 3D Layout Editor Tab */}
      {activeTab === "theatres" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {theatres.map((t) => (
              <div key={t.id} className="p-5 rounded-2xl bg-[#0f1424] border border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{t.name}</h3>
                  <p className="text-xs text-slate-400">{t.city} • {t.layout?.rows?.length || 10} Rows</p>
                </div>
                <button
                  onClick={() => handleEditTheatreLayout(t)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d6ae8] text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Edit2 size={13} />
                  <span>Edit Layout</span>
                </button>
              </div>
            ))}
          </div>

          {/* JSON Layout Editor & Live 3D Preview Modal */}
          {editingTheatre && (
            <div className="p-6 rounded-3xl bg-[#0f1424] border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">
                    Editing 3D Geometry: {editingTheatre.name}
                  </h3>
                  <p className="text-xs text-slate-400">Modify screen aspect ratio, curvature, rake angle, and aisle offsets.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTheatre(null)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTheatreLayout}
                    disabled={!!theatreJsonError}
                    className="px-4 py-1.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d6ae8] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save size={13} /> Save Layout
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* JSON Textarea */}
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={16}
                    value={theatreJson}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-[#0a0d1a] border border-white/10 text-xs font-mono text-emerald-400 focus:outline-none focus:border-[#4f7cff]"
                  />
                  {theatreJsonError && (
                    <div className="text-xs text-red-400">{theatreJsonError}</div>
                  )}
                </div>

                {/* Live 3D Preview */}
                <div className="h-80 rounded-2xl overflow-hidden border border-white/10 bg-[#080a14]">
                  {liveLayout && liveLayout.rows ? (
                    <Theatre3D
                      seats={[]}
                      screen={liveLayout.screen || { width: 14, height: 6, bottom: 1.6 }}
                      movie={{ title: "LIVE 3D PREVIEW", genre: "GEOMETRY TEST", minutes: 120, c1: "#0f172a", c2: "#4f7cff" }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">Invalid layout JSON</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shows Scheduler Tab */}
      {activeTab === "shows" && (
        <div className="p-6 rounded-3xl bg-[#0f1424] border border-white/[0.06] flex flex-col gap-6 max-w-2xl">
          <h3 className="text-base font-bold text-white">Schedule New Screening</h3>

          <form onSubmit={handleCreateShow} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Movie</label>
              <select
                required
                value={newShow.movie_id}
                onChange={(e) => setNewShow({ ...newShow, movie_id: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#141b2e] border border-white/10 text-white"
              >
                <option value="">Select Movie</option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Theatre</label>
              <select
                required
                value={newShow.theatre_id}
                onChange={(e) => setNewShow({ ...newShow, theatre_id: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#141b2e] border border-white/10 text-white"
              >
                <option value="">Select Theatre</option>
                {theatres.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Showtime (YYYY-MM-DDTHH:MM)</label>
              <input
                required
                type="datetime-local"
                value={newShow.start}
                onChange={(e) => setNewShow({ ...newShow, start: e.target.value })}
                className="w-full p-2 rounded-xl bg-[#141b2e] border border-white/10 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Base Price (₹)</label>
              <input
                required
                type="number"
                value={newShow.price}
                onChange={(e) => setNewShow({ ...newShow, price: e.target.value })}
                className="w-full p-2 rounded-xl bg-[#141b2e] border border-white/10 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Format</label>
              <select
                value={newShow.format}
                onChange={(e) => setNewShow({ ...newShow, format: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#141b2e] border border-white/10 text-white"
              >
                <option value="IMAX 3D">IMAX 3D</option>
                <option value="3D">3D</option>
                <option value="2D">2D</option>
              </select>
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#4f7cff] hover:bg-[#3d6ae8] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                Publish Showtime
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

