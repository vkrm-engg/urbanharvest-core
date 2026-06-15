# UrbanHarvest Core 🗺️🌱

UrbanHarvest Core is a geospatial decision-support platform that helps urban property owners evaluate their roof or land area for **solar power generation**, **climate-resilient crop cultivation**, or a **hybrid co-located deployment**. Users trace their plot boundary on a live satellite map, choose a strategy, and receive a generated report combining live environmental data, energy yield estimates, and crop economics.

> ⚠️ **Hackathon MVP Notice**: This is a prototype built for a hackathon. Several modules (see *Known Limitations* below) use simplified models, placeholder formulas, or simulated data and are flagged accordingly. They represent the intended architecture for a production system, not finished production logic.

---

## 🚀 System Architecture

The frontend operates as a single-page state machine within `Dashboard.jsx`, guiding the user through three views:

```
┌─────────────────────────┐
│   1. LOGIN GATEWAY      │  Collects operator name + target address.
│   (Dashboard.jsx)       │  Geocodes the address via OSM Nominatim
└────────────┬────────────┘  to get center coordinates for the map.
             │
             ▼
┌─────────────────────────┐
│   2. SPATIAL MAP VIEW   │  OpenLayers canvas with Google Satellite
│   (Dashboard.jsx)       │  tiles. User traces a polygon over their
└────────────┬────────────┘  roof/land; area is computed via ol/sphere.
             │
             ▼
┌─────────────────────────┐
│   3. REPORT ANALYTICS   │  Sends coordinates, area, and chosen mode
│   (LocationReport.jsx)  │  to the FastAPI backend for calculations.
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   FASTAPI BACKEND       │  Fetches live weather/rainfall data,
│   (main.py)             │  computes solar sizing, grid offset, ROI,
└─────────────────────────┘  and crop yield/profit estimates.
```

---

## ✨ Core Features

- **Address Geocoding** — converts a human-readable address (e.g., "Chennai, Tamil Nadu, India") into coordinates via the free Nominatim API.
- **Satellite Polygon Tracing** — draw a boundary directly on satellite imagery using `ol/interaction/Draw`; area is computed in m² via `ol/sphere/getArea`.
- **Live Environmental Data** — fetches current temperature/humidity and historical annual rainfall + soil moisture (via Open-Meteo) for the selected coordinates.
- **Three Strategy Modes**:
  1. **Solar** — sizes a rooftop solar array, estimates daily/monthly/annual generation and savings (₹).
  2. **Crops** — suggests a seasonal planting schedule with estimated yield and net profit based on area.
  3. **Hybrid** — splits the area between solar and crops based on the household's energy demand.
---

## 🛠️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) (3.10+ recommended)

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:3000` (configured in `vite.config.js`).

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`.

### 3. Production Build
```bash
cd frontend
npm run build
```

---

## 📋 Step-by-Step Usage Guide

1. **Sign In**: Enter an operator name, target address, and access key on the login screen, then click **Initialize Local Mapping Grid**. (See *Known Limitations* — this step is currently a UI gate, not a real authentication system.)
2. **Locate Your Site**: The map centers on your address via geocoding.
3. **Trace Your Plot**: Click **Trace Area Loop**, then click points around your roof or land boundary on the satellite view. Double-click the final point to close the loop.
4. **Choose a Strategy**: A modal displays the traced area (m²) and lets you pick **Solar**, **Crops**, or **Hybrid**.
5. **View Report**: The report screen shows live environmental data, solar sizing/savings (if applicable), and a crop planting/yield schedule (if applicable).

---

## 📂 Project Structure

```
urbanharvest-core/
├── ai_engine/
│   └── viability_analyzer.py   # Structural viability heuristic (see Limitations)
├── backend/
│   ├── main.py                 # FastAPI app — location/report calculations
│   ├── database.py             # SQLAlchemy models (Postgres, not yet wired into main.py)
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── index.css
        ├── Dashboard.jsx        # Login, map, and state machine
        └── pages/
            └── LocationReport.jsx
```

---

## 📦 Key Dependencies

**Frontend** (`frontend/package.json`):
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "lucide-react": "^0.344.0",
    "ol": "^10.9.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1"
  }
}
```

**Backend** (`backend/requirements.txt`):
```
fastapi
uvicorn
pydantic
scipy
numpy
sqlalchemy
requests
```

---

## 🌍 External APIs Used

- **OSM Nominatim** — address-to-coordinate geocoding (no API key required).
- **Open-Meteo** — live weather, historical rainfall, and soil moisture data (no API key required).
- **Google Satellite Tiles** — basemap imagery for the map view.

These are free/public endpoints with rate limits — for live demos, consider caching responses or having fallback data ready.

---

## ⚠️ Known Limitations / Roadmap

This project is an MVP. The following areas are simplified and intended as a foundation for future work:

- **Viability analyzer (`ai_engine/viability_analyzer.py`)**: Currently generates a synthetic test image and computes a structural viability heuristic from it, rather than analyzing real satellite imagery of the user's traced plot. Planned: replace with computer-vision analysis of the actual satellite tile for the selected boundary.
- **Authentication**: The login screen collects credentials but does not validate them against a backend — it is currently a UI flow gate. A `User` model exists in `database.py` but is not yet connected. Planned: real auth + session persistence.
- **Database**: `database.py` defines `User` and `SavedPlot` models for Postgres but is not yet called from `main.py`. Planned: persist traced plots and reports per user.
- **Solar & crop formulas**: Generation rates (4.6 units/kWp/day), panel area ratio (7.2 m²/kWp), electricity tariff (₹8.50/unit), and crop yield/profit figures are estimated constants for demo purposes, not site-specific engineering calculations. See `backend/main.py` for the exact formulas used.

---

## 📄 License

This project is open-source software licensed under the **MIT License**. See the [LICENSE] file for the full text.
