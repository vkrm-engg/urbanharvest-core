from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from sqlalchemy.orm import Session
from ai_engine.viability_analyzer import UrbanHarvestAnalyzer
from database import engine, Base, SessionLocal, SavedPlot, User

# Initialize database schemas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UrbanHarvest Core API", version="1.0.0")

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
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
    latitude: float
    longitude: float
    area_m2: float
    mode: str  # "solar" | "crops" | "hybrid"

@app.post("/api/analyze")
async def analyze_location(payload: AnalysisRequest):
    # 1. Fetch live Open-Meteo macro conditions
    meteo_url = f"https://api.open-meteo.com/v1/forecast?latitude={payload.latitude}&longitude={payload.longitude}&current_weather=true&daily=rain_sum&timezone=auto"
    
    try:
        meteo_res = requests.get(meteo_url, headers={"User-Agent": "UrbanHarvestCore/1.0"}, timeout=5)
        meteo_data = meteo_res.json() if meteo_res.status_code == 200 else {}
    except Exception:
        meteo_data = {}

    current_temp = meteo_data.get("current_weather", {}).get("temperature", 22.0)
    
    # 2. Extract CV computer-vision analytics from raw Sentinel imagery
    cv_analytics = UrbanHarvestAnalyzer.analyze_plot_viability(payload.latitude, payload.longitude)
    
    # 3. Calculate Strategy Metrics based on physical constraint inputs
    usable_area = payload.area_m2 * (cv_analytics["calculated_scores"]["solar_suitability"] / 100.0)
    
    # Simple, highly defensible open formulas
    estimated_annual_kwh = usable_area * 150 * 4.5 * 0.75  # area * panel_watts * sun_hours * system_efficiency
    financial_savings_usd = estimated_annual_kwh * 0.12     # $0.12 per kWh local offset constant
    
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
    user_id: int = 1
    address_string: str
    center_lat: float
    center_lng: float
    total_area_sqmeters: float
    chosen_mode: str
    monthly_consumption: int = None

@app.post("/api/plots")
async def save_plot(payload: SavedPlotCreate, db: Session = Depends(get_db)):
    # Create default user if it does not exist
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