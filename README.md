# AeroShield - AI Powered Heavy Vehicle Dust Mitigation Dashboard

AeroShield is a modern, enterprise-grade full-stack web application designed to monitor dust emissions from mineral transport vehicles and control AeroShield dust suppression hardware along the Raipur–Durg–Bhilai industrial corridor (National Highway 53, Chhattisgarh, India).

The system models heavy mineral trucks traveling between major nodes like Siltara, Urla, and Bhilai Steel Plant, calculating telemetry in real time and streaming metrics to the user-facing React dashboard.

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Leaflet.js (Mapping), Chart.js (Data Analytics), Framer Motion (Animations).
- **Backend:** Node.js with Express & WebSockets (`ws`) to stream real-time updates directly to client browsers.
- **Database:** SQLite (SQL schema matching production PostgreSQL, running out-of-the-box local files).
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs role protection claims.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js (v18+)** and **npm** installed on your system.

### One-Command Quickstart

1. Open a terminal at this root directory (`C:\Users\reete\.gemini\antigravity\scratch\aeroshield`).
2. Install all dependencies for both backend and frontend by running:
   ```bash
   npm run install:all
   ```
3. Boot both the Express backend and Vite frontend dev servers simultaneously by running:
   ```bash
   npm start
   ```
4. Access the web interface in your browser:
   👉 **`http://localhost:5173`**

---

## 🔐 Multi-Role Sandbox Credentials

To test the application's different permissions, use these pre-seeded sandbox accounts or register your own:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@aeroshield.com` | `password123` | View all data, add/edit/delete trucks, trigger manual overrides, resolve alerts. |
| **Fleet Manager** | `manager@aeroshield.com` | `password123` | View all data, trigger manual overrides, compile and download compliance reports, resolve alerts. |
| **Public User** | `public@aeroshield.com` | `password123` | View AQI averages, interactive map, health impact statistics, and health advisories. |

---

## 📡 Telemetry Simulation Engine

When the backend starts, a background simulation loop triggers:
- **GPS Coordinates:** Moves active trucks along NH-53 routes linking Raipur, Urla, Siltara, Bhilai, and Durg.
- **Dynamic Emissions:** Computes dust emissions based on payload weight, speed, cargo type (e.g. coal, iron ore), cover status, and AeroShield operation.
- **Low Water & Speed Alarms:** Triggers alerts when a truck speeds (exceeds 60 km/h) or water tank levels drop. Broadcasts warnings to connected clients via WebSockets.
- **AQI Fluctuations:** Simulates changing air quality values at station hubs relative to passing traffic volume.

---

## 🔌 API Documentation

### REST Endpoints

- `POST /api/register` - Create user profile.
- `POST /api/login` - Authenticate credentials and receive JWT.
- `GET /api/dashboard` - Return summary statistics and current station values.
- `GET /api/vehicles` - List all registered fleet vehicles.
- `PUT /api/vehicle` - Add/Update vehicle config (Admin only).
- `DELETE /api/vehicle` - Delete vehicle (Admin only).
- `GET /api/alerts` - List active and historical warnings.
- `POST /api/alerts/resolve` - Resolve active alarms (Admin/Manager only).
- `GET /api/predictions` - Return AI prediction forecasts.
- `POST /api/prediction` - Recalculate AI prediction confidence logs (Admin/Manager only).
- `POST /api/sensor` - Public IoT telemetry ingestion.

### WebSocket Stream

Connect client to `ws://localhost:5000` to receive live JSON telemetry broadcast frames:
```json
{
  "type": "TELEMETRY_UPDATE",
  "data": {
    "vehicles": [...],
    "stations": [...]
  }
}
```
