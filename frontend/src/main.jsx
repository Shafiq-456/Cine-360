import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import SeatsPage from "./pages/SeatsPage.jsx";
import MyTickets from "./pages/MyTickets.jsx";
import TheatresPage from "./pages/TheatresPage.jsx";
import ConfirmationPage from "./pages/ConfirmationPage.jsx";
import StaffScanner from "./pages/StaffScanner.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Login from "./pages/Login.jsx";
import "./styles.css";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col justify-between bg-[#0a0d1a]">
        <div>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/show/:id" element={<SeatsPage />} />
            <Route path="/theatres" element={<TheatresPage />} />
            <Route path="/bookings" element={<MyTickets />} />
            <Route path="/booking/confirmed/:ref" element={<ConfirmationPage />} />
            <Route path="/staff" element={<StaffScanner />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<App />);
