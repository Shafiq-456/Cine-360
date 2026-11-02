# CINE360 - 3D Cinema Ecosystem

> **The next-generation cinema operating ecosystem powered by real-time 3D spatial seat visualization, distributed concurrency safety, and BookMyShow-style commerce.**

---

## 🌟 Key Features

- **Spatial 3D Auditorium:** Real-time Three.js / React Three Fiber interactive 3D theatre rendering, dynamic camera raycasting, and 2D classic flat seat-map toggle.
- **Sightline Metrics & Score:** Algorithmic seat rating (0–100) based on horizontal screen viewing angle, neck tilt, off-axis deviation, and distance, plus dynamic heatmaps.
- **View-From-Seat:** Instant first-person camera positioning from any selected seat with look-around capabilities.
- **BookMyShow-Style Commerce Flow:**
  - City selection (Chennai, Bengaluru, Hyderabad, Mumbai, Delhi) filtering theatres and showtimes.
  - Movie Details with backdrop hero, trailer modal, cast, director, certificate, and 7-day horizontal date strip.
  - Multi-tier pricing (Normal, Executive, Premium) with availability tracking (Available, Filling Fast, Almost Full).
  - Food & Beverage add-ons (Popcorn, Combos, Nachos, Beverages).
  - Promo code discounts (`WELCOME50`, `CINE20`, `IMAX100`).
  - Transparent pricing breakdown: Ticket subtotal, 3% convenience fee, 18% GST on convenience fee, and discounts.
  - 10-minute hold countdown timer matching seat hold expiration.
- **Multiple Payment Gateways:** UPI (ID + dynamic QR), Cards (pre-filled test sandbox), Net Banking, Digital Wallets, and Razorpay test mode integration with mock fallback.
- **Digital Passes & Gate Verification:**
  - High-resolution QR code e-ticket powered by cryptographically signed JWT HMAC tokens.
  - Add to Google Calendar, Print/Download PDF, and Web Share API integration.
  - Turnstile & Gate Staff Scanner (`/staff`) supporting camera QR scanning and manual reference lookup with one-time check-in and duplicate reuse prevention.
- **Self-Service Ticketing & Ratings:** Upcoming vs Past ticket management, 100% refund cancellation up to 2 hours before showtime, and post-movie user rating reviews.
- **Administrator OS (`/admin`):**
  - KPI metric cards (Total Box Office, Tickets Sold, Occupancy %, Active Screenings).
  - Recharts interactive analytics: 7-day daily revenue trajectory area chart and seats sold distribution bar chart.
  - Interactive Theatres 3D Layout JSON Editor with live spatial preview.
  - Screening scheduler for upcoming shows.

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Documentation will be live at: **http://localhost:8000/docs**

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Interactive Web App will be live at: **http://localhost:5173**

---

## 🐳 Docker Deployment
Run PostgreSQL, Redis, and the FastAPI backend together:
```bash
docker compose up --build
```

---

## 🔑 Demo Accounts & Credentials

Log in instantly using the **"SELECT ROLE"** dropdown in the top navigation bar, or enter these credentials:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **User** | `user@cine.dev` | `demo123` | Book tickets, 3D seat picker, view passes, cancel tickets |
| **Admin** | `admin@cine.dev` | `demo123` | Box office KPIs, Recharts graphs, 3D layout editor, scheduler |
| **Staff** | `staff@cine.dev` | `demo123` | Gate QR scanner, turnstile admittance, check-in validation |
| *(Legacy)* | `demo@cine.dev` | `demo123` | Standard user account |

### Test Payment & Cards
- **Successful Payment:** Card `4242 4242 4242 4242` (Expiry: any future date, CVV: `123`)
- **Simulate Declined Payment:** Card `4000 0000 0000 0002`
- **Promo Codes:** `WELCOME50` (50% off up to ₹150), `CINE20` (20% off up to ₹100), `IMAX100` (₹100 off)
