"""
UrbanHarvest Core API
======================

FastAPI backend service for the UrbanHarvest platform, which evaluates the
viability of converting unused urban spaces into food-producing or
solar-energy-generating assets.

This module exposes endpoints to:
    - Analyze a geographic plot's suitability for solar energy generation
      and/or crop cultivation using live weather data and computer-vision
      based imagery analysis.
    - Persist user-selected plots to the database for later retrieval.
    - Retrieve all previously saved plots.

Dependencies:
    - FastAPI for the web framework and routing.
    - SQLAlchemy for ORM-based database access.
    - Pydantic for request body validation.
    - Open-Meteo public API for live weather data.
    - ai_engine.viability_analyzer for computer-vision plot analysis.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from sqlalchemy.orm import Session
from ai_engine.viability_analyzer import UrbanHarvestAnalyzer
from database import engine, Base, SessionLocal, SavedPlot, User

# Initialize database schemas
# Creates all tables defined on Base's metadata if they do not already exist,
# ensuring the database is ready before the app starts serving requests.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UrbanHarvest Core API", version="1.0.0")

# Dependency for database session
def get_db():
    """Provide a scoped SQLAlchemy database session for a single request.

    This is used as a FastAPI dependency (via `Depends`) so that each
    request gets its own session, which is guaranteed to be closed after
    the request completes, even if an exception occurs.

    Yields:
        Session: An active SQLAlchemy ORM session bound to `engine`.
    """
    db = SessionLocal()
    try:
        # Hand the session off to the endpoint function for the duration
        # of the request.
        yield db
    finally:
        # Always close the session afterwards to release the underlying
        # database connection back to the pool, regardless of success/error.
        db.close()

# Cross-Origin Resource Sharing configuration for local dev and Vercel hosting environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    """Request payload for the `/api/analyze` endpoint.

    Attributes:
        latitude (float): Latitude of the plot to analyze, in decimal degrees.
        longitude (float): Longitude of the plot to analyze, in decimal degrees.
        area_m2 (float): Total usable area of the plot in square meters.
        mode (str): Evaluation mode requested by the client. One of
            "solar", "crops", or "hybrid".
    """
    latitude: float
    longitude: float
    area_m2: float
    mode: str  # "solar" | "crops" | "hybrid"

@app.post("/api/analyze")
async def analyze_location(payload: AnalysisRequest):
    """Analyze a geographic plot for solar and crop-growing viability.

    Combines live weather data from Open-Meteo with computer-vision based
    plot analytics (vegetation density, structural obstruction, and
    suitability scores) to produce financial and yield projections for
    both solar energy generation and crop cultivation.

    Args:
        payload (AnalysisRequest): The plot's coordinates, area, and the
            evaluation mode requested by the client.

    Returns:
        dict: A structured response containing:
            - coordinates: The latitude/longitude evaluated.
            - area_provided: The original area supplied by the client.
            - mode_evaluated: The mode requested by the client.
            - climate_snapshot: Ambient temperature and CV-derived
              vegetation/obstruction percentages.
            - financial_projections: Solar and crop suitability scores
              along with estimated generation, savings, yield, and
              market value figures.
    """
    # 1. Fetch live Open-Meteo macro conditions
    meteo_url = f"https://api.open-meteo.com/v1/forecast?latitude={payload.latitude}&longitude={payload.longitude}&current_weather=true&daily=rain_sum&timezone=auto"
    
    try:
        # Use a short timeout so a slow/unresponsive weather API does not
        # block the analysis endpoint for an unacceptable amount of time.
        meteo_res = requests.get(meteo_url, headers={"User-Agent": "UrbanHarvestCore/1.0"}, timeout=5)
        meteo_data = meteo_res.json() if meteo_res.status_code == 200 else {}
    except Exception:
        # Network/API failures should not crash the analysis; fall back to
        # an empty dict so downstream `.get()` calls degrade gracefully.
        meteo_data = {}

    # Default to a reasonable ambient temperature if the weather API did
    # not return usable data, so calculations further down never fail.
    current_temp = meteo_data.get("current_weather", {}).get("temperature", 22.0)
    
    # 2. Extract CV computer-vision analytics from raw Sentinel imagery
    cv_analytics = UrbanHarvestAnalyzer.analyze_plot_viability(payload.latitude, payload.longitude)
    
    # 3. Calculate Strategy Metrics based on physical constraint inputs
    # Scale down the raw plot area by the solar suitability score, since
    # only a fraction of the plot is actually usable for panel placement
    # (e.g. due to shading or structural obstructions).
    usable_area = payload.area_m2 * (cv_analytics["calculated_scores"]["solar_suitability"] / 100.0)
    
    # Simple, highly defensible open formulas
    # Energy yield estimate: usable area * panel wattage density * average
    # daily sun hours * system efficiency factor (accounts for inverter
    # losses, wiring losses, etc.).
    estimated_annual_kwh = usable_area * 150 * 4.5 * 0.75  # area * panel_watts * sun_hours * system_efficiency
    # Convert generated energy into a dollar value using a fixed local
    # utility offset rate.
    financial_savings_usd = estimated_annual_kwh * 0.12     # $0.12 per kWh local offset constant
    
    # Crop yield estimate: full plot area * crop suitability score *
    # an empirically-derived average annual yield density.
    estimated_kg_yield = payload.area_m2 * (cv_analytics["calculated_scores"]["crop_suitability"] / 100.0) * 4.2 # ~4.2kg per m2 annual variance
    
    return {
        "coordinates": {"lat": payload.latitude, "lng": payload.longitude},
        "area_provided": payload.area_m2,
        "mode_evaluated": payload.mode,
        "climate_snapshot": {
            "ambient_temperature_c": current_temp,
            "vegetation_index_pct": cv_analytics["vegetation_density"],
            "structural_obstruction_pct": cv_analytics["structural_obstruction"]
        },
        "financial_projections": {
            "solar": {
                "suitability_score": cv_analytics["calculated_scores"]["solar_suitability"],
                "annual_generation_kwh": round(estimated_annual_kwh, 2),
                "annual_savings_usd": round(financial_savings_usd, 2)
            },
            "crops": {
                "suitability_score": cv_analytics["calculated_scores"]["crop_suitability"],
                "estimated_yield_kg": round(estimated_kg_yield, 2),
                "market_value_usd": round(estimated_kg_yield * 2.5, 2) # Weighted crop average pricing index
            }
        }
    }

class SavedPlotCreate(BaseModel):
    """Request payload for the `/api/plots` POST endpoint (creating a saved plot).

    Attributes:
        user_id (int): ID of the user who owns this plot. Defaults to 1
            (a stub/default user) when not provided.
        address_string (str): Human-readable address or description of the plot.
        center_lat (float): Latitude of the plot's center point.
        center_lng (float): Longitude of the plot's center point.
        total_area_sqmeters (float): Total area of the plot in square meters.
        chosen_mode (str): The evaluation/usage mode chosen by the user
            (e.g. "solar", "crops", "hybrid").
        monthly_consumption (int, optional): User's monthly energy
            consumption, used for solar sizing calculations. Defaults to None.
    """
    user_id: int = 1
    address_string: str
    center_lat: float
    center_lng: float
    total_area_sqmeters: float
    chosen_mode: str
    monthly_consumption: int = None

@app.post("/api/plots")
async def save_plot(payload: SavedPlotCreate, db: Session = Depends(get_db)):
    """Persist a new saved plot to the database.

    Creates a default stub user if the referenced `user_id` does not yet
    exist, then stores the plot details linked to that user.

    Args:
        payload (SavedPlotCreate): The plot details to save, including
            owning user ID, address, coordinates, area, and chosen mode.
        db (Session): Database session injected via the `get_db` dependency.

    Returns:
        dict: A confirmation payload containing the new plot's status,
            database ID, address, mode, and area.
    """
    # Create default user if it does not exist
    # Ensures the foreign key constraint on SavedPlot.user_id is satisfied
    # even when no real user registration flow has been completed yet.
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        default_user = User(id=payload.user_id, email="default@urbanharvest.org", password_hash="stub")
        db.add(default_user)
        db.commit()
        
    db_plot = SavedPlot(
        user_id=payload.user_id,
        address_string=payload.address_string,
        center_lat=payload.center_lat,
        center_lng=payload.center_lng,
        total_area_sqmeters=payload.total_area_sqmeters,
        chosen_mode=payload.chosen_mode,
        monthly_consumption=payload.monthly_consumption
    )
    db.add(db_plot)
    db.commit()
    # Refresh to populate auto-generated fields (e.g. the primary key `id`)
    # assigned by the database upon insertion.
    db.refresh(db_plot)
    return {
        "status": "success",
        "id": db_plot.id,
        "address": db_plot.address_string,
        "mode": db_plot.chosen_mode,
        "area": db_plot.total_area_sqmeters
    }

@app.get("/api/plots")
async def get_plots(db: Session = Depends(get_db)):
    """Retrieve all saved plots from the database.

    Args:
        db (Session): Database session injected via the `get_db` dependency.

    Returns:
        list[dict]: A list of plot records, each containing the plot's ID,
            owning user ID, address, coordinates, area, mode, and monthly
            consumption.
    """
    plots = db.query(SavedPlot).all()
    return [{
        "id": p.id,
        "user_id": p.user_id,
        "address": p.address_string,
        "lat": p.center_lat,
        "lng": p.center_lng,
        "area": p.total_area_sqmeters,
        "mode": p.chosen_mode,
        "monthly_consumption": p.monthly_consumption
    } for p in plots]
