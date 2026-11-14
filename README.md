# 🎬 CINE360 — Immersive 3D Cinema Booking Ecosystem

<p align="center">
  <strong>Your Cinema. Your View. Your Seat.</strong>
</p>

<p align="center">
  A next-generation, 3D-first cinema booking platform that transforms traditional ticket reservation into an immersive spatial experience.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20Application-477BFF?style=for-the-badge" />
  <img src="https://img.shields.io/badge/3D-Three.js-black?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge" />
</p>

---

## 🌌 Overview

**CINE360** is an immersive 3D cinema booking and management ecosystem designed to redefine how people discover movies, explore cinema auditoriums and reserve their seats.

Traditional cinema booking platforms primarily rely on conventional 2D seating charts, which provide limited information about the actual viewing experience from individual seats.

CINE360 addresses this limitation through an interactive 3D auditorium environment where customers can explore cinema spaces, navigate seating sections, inspect individual seats and preview the screen perspective before making a booking.

Beyond customer ticketing, CINE360 introduces an integrated cinema management ecosystem featuring administrative analytics, theatre configuration, staff ticket verification and digital ticketing workflows.

The platform combines **3D spatial visualization, real-time seat availability, reservation concurrency protection and digital ticket management** into one connected experience.

> **Don't Just Book a Seat. Experience It Before You Sit.**

---

## ✨ Core Features

### 🎥 1. Interactive 3D Cinema Experience

- Real-time 3D auditorium rendering using Three.js and React Three Fiber.
- Interactive cinema seating environment.
- Raycasting-based seat selection.
- Dynamic camera navigation and spatial exploration.
- Switch between interactive 3D auditorium and conventional 2D seat-map views.
- Visual seat availability indicators.
- First-person viewing perspective from selected seats.

### 🪑 2. Spatial Seat Visualization & Seat Intelligence

CINE360 introduces a more informative approach to cinema seat selection.

- Individual interactive 3D seats.
- First-person View-From-Seat experience.
- Screen distance calculations.
- Horizontal viewing-angle analysis.
- Vertical viewing-angle analysis.
- Off-axis deviation measurements.
- Neck-tilt considerations.
- Algorithmic seat evaluation from 0–100.
- Dynamic seating heatmaps.
- Multiple seating categories.
- Live availability indicators.

Seat evaluation is based on spatial measurements and the configured auditorium geometry.

### 🎞️ 3. Movie & Theatre Discovery

A cinema discovery experience inspired by modern ticket-booking platforms.

- City-based theatre discovery.
- Movie details and information.
- Movie backdrop and poster presentation.
- Trailer modal.
- Cast and director information.
- Movie certification details.
- Seven-day horizontal date selector.
- Theatre and showtime browsing.
- Multiple ticket categories.
- Availability indicators.

Supported demonstration city filters include:

- Chennai
- Bengaluru
- Hyderabad
- Mumbai
- Delhi

### 🎟️ 4. Cinema Booking & Commerce

A complete ticket reservation workflow.

- Multi-tier ticket pricing:
  - Normal
  - Executive
  - Premium
- Seat availability tracking:
  - Available
  - Filling Fast
  - Almost Full
- Food and beverage add-ons:
  - Popcorn
  - Combos
  - Nachos
  - Beverages
- Promotional discount codes.
- Transparent pricing breakdown.
- Convenience fee calculation.
- GST calculation on convenience fees.
- Ten-minute temporary seat-hold countdown.
- Booking summary and checkout workflow.

**Supported demonstration promo codes:**

| Promo Code | Discount |
|---|---|
| `WELCOME50` | 50% off, up to ₹150 |
| `CINE20` | 20% off, up to ₹100 |
| `IMAX100` | ₹100 off |

### 💳 5. Payment Integration

Multiple payment options within the checkout experience.

- UPI.
- Dynamic QR-based payment interface.
- Credit and debit cards.
- Net banking.
- Digital wallets.
- Razorpay test-mode integration.
- Mock payment fallback for demonstration.

The payment experience supports testing successful and declined transactions.

### 📱 6. Digital Tickets & QR Verification

Digitally generated cinema passes with secure ticket validation.

- High-resolution QR-code e-tickets.
- Cryptographically signed JWT HMAC tokens.
- Ticket reference generation.
- Add to Google Calendar.
- Print and download PDF.
- Web Share API integration.
- Upcoming and past ticket management.
- Ticket cancellation workflow.
- Post-movie rating and review functionality.

### 🚪 7. Theatre Staff Scanner

A dedicated staff interface available at `/staff`.

- Camera-based QR scanning.
- Manual booking-reference lookup.
- Backend ticket verification.
- One-time ticket check-in.
- Duplicate redemption prevention.
- Ticket validation status.

### 📊 8. Administrator Dashboard

A centralized cinema administration interface available at `/admin`.

**Key performance indicators:**

- Total Box Office.
- Tickets Sold.
- Occupancy Percentage.
- Active Screenings.

**Analytics and management:**

- Interactive revenue trajectory.
- Seven-day revenue analytics.
- Seats-sold distribution.
- Theatre management.
- Interactive 3D theatre-layout JSON editor.
- Live spatial layout preview.
- Screening scheduler.
- Upcoming show management.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, TypeScript |
| Styling & UI | CSS, Tailwind CSS, Lucide Icons |
| Animations | Framer Motion |
| 3D Rendering | Three.js, React Three Fiber |
| 3D Components | Drei |
| Backend | Python, FastAPI |
| API Validation | Pydantic |
| Database | PostgreSQL |
| Caching & Coordination | Redis |
| Authentication | JWT-based authentication |
| Payments | Razorpay |
| Ticket Security | JWT HMAC |
| QR Generation | QR-code generation and scanning |
| Analytics | Recharts |
| Containerization | Docker, Docker Compose |

---

## 🧠 System Architecture

CINE360 follows a frontend–backend architecture with a dedicated 3D rendering engine and supporting booking services.

```text
                    CINE360 PLATFORM
                           |
             +-------------+-------------+
             |                           |
       CUSTOMER APP                MANAGEMENT APP
             |                           |
      Movie Discovery             Admin Dashboard
      Theatre Discovery           Staff Scanner
      3D Auditorium               Theatre Management
      Seat Selection
      Checkout
             |
      REACT FRONTEND
             |
      THREE.JS / R3F
             |
       FASTAPI BACKEND
             |
    +--------+---------+
    |        |         |
 PostgreSQL Redis  Payment Service
    |        |         |
    +--------+---------+
             |
      BOOKING ENGINE
             |
       DIGITAL TICKETS
             |
       QR VERIFICATION
```

### Core architectural principles

- Separate physical auditorium seats from show-specific seat inventory.
- Maintain consistent seat identifiers between the 3D model and backend.
- Protect seat reservations against concurrent booking attempts.
- Keep booking and payment verification on the backend.
- Use real-time coordination for seat availability.
- Validate QR tickets before allowing entry.

---

## 🚀 Getting Started

Follow these steps to run CINE360 locally.

### Prerequisites

Install the following:

- Python 3.10+ (or a version supported by the backend dependencies).
- Node.js and npm.
- PostgreSQL.
- Redis.
- Git.
- Docker and Docker Compose (optional).

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd CINE360
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python3 -m venv .venv
```

Activate it.

**macOS / Linux:**

```bash
source .venv/bin/activate
```

**Windows:**

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI development server:

```bash
uvicorn main:app --reload --port 8000
```

Backend API:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

### 3. Frontend Setup

Open a separate terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend application:

```text
http://localhost:5173
```

### 4. Docker Setup

To start the services configured in Docker Compose:

```bash
docker compose up --build
```

To run in detached mode:

```bash
docker compose up --build -d
```

To stop the containers:

```bash
docker compose down
```

---

## 🔑 Demo Accounts & Credentials

CINE360 provides role-based demonstration accounts.

You can also select a role using the **SELECT ROLE** option in the application navigation bar.

| Role | Email | Password | Access |
|---|---|---|---|
| Customer | `user@cine.dev` | `demo123` | Movie discovery, bookings, 3D seat selection and tickets |
| Administrator | `admin@cine.dev` | `demo123` | Analytics, theatre management, 3D layout editor and scheduling |
| Staff | `staff@cine.dev` | `demo123` | QR scanning, ticket verification and check-in |
| Legacy User | `demo@cine.dev` | `demo123` | Standard customer access |

**Security note:** These are development/demo credentials. Never use publicly documented demo passwords in production. Change or disable demo accounts before deployment.

---

## 🧪 Test Payment Credentials

The following test card details are provided for payment-flow demonstrations.

| Scenario | Card Number |
|---|---|
| Successful payment | `4242 4242 4242 4242` |
| Declined payment | `4000 0000 0000 0002` |

Expiry: Any future date.

CVV: `123`.

Use these only with a compatible payment test environment. Other payment methods and sandbox requirements may depend on the configured gateway.

---

## 📁 Project Structure

```text
CINE360/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── docker-compose.yml
├── README.md
└── ...
```

The exact directory structure may evolve as the application grows.

---

## 🔒 Security & Booking Reliability

CINE360 is designed around several important booking-system principles:

- Backend validation of seat availability.
- Temporary seat reservation holds.
- Protection against duplicate seat reservations.
- Secure payment verification.
- Cryptographically signed digital tickets.
- One-time QR ticket validation.
- Role-based access control.
- Duplicate check-in prevention.

Redis is intended for temporary coordination and caching. Persistent booking state should remain protected by the database and transactional backend operations.

---

## 🗺️ Project Roadmap

The following are planned expansion areas, not claims that every feature is already implemented.

- [ ] Expand the verified theatre directory across Tamil Nadu.
- [ ] Integrate authorized live movie and showtime data providers.
- [ ] Add comprehensive city-based theatre discovery.
- [ ] Support multiple real-world auditorium models.
- [ ] Expand calibrated 3D seat geometry.
- [ ] Improve 360° first-person auditorium navigation.
- [ ] Introduce theatre-owner self-service registration.
- [ ] Build a complete Auditorium Builder.
- [ ] Integrate additional authorized cinema booking partners.
- [ ] Expand to more Indian cities.
- [ ] Add mobile application support.
- [ ] Explore VR and AR cinema experiences.
- [ ] Enhance geometry-based seat recommendations.

---

## ⚠️ Important Notes

- Payment integrations may operate in test or mock mode depending on configuration.
- Demonstration data should not be interpreted as verified live theatre inventory.
- Real-time showtimes and seat availability require authorized provider or theatre integrations.
- 3D auditorium accuracy depends on the availability of calibrated theatre geometry.
- Production deployment requires secure environment variables, configured database services, payment credentials and proper authorization.

---

## 👨‍💻 Done by:

**Mohammed Shafiq AS**

Project: CINE360 — Immersive 3D Cinema Booking Ecosystem.

---

## 🌟 Vision

CINE360 aims to bridge the gap between traditional cinema ticket booking and immersive spatial experiences.

By combining interactive 3D auditorium visualization, intelligent seat evaluation, reliable reservation workflows and digital cinema management, CINE360 reimagines how customers choose their cinema experience.

**We believe booking a cinema seat should be more than selecting a number on a flat chart. It should be an experience you can see before you buy.**

<p align="center">
  <strong>🎬 CINE360 — Your Cinema. Your View. Your Seat.</strong>
</p>
