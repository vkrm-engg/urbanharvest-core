from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./urban_harvest.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserAssetProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    location_name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    allocation_choice = Column(String)  # "Photovoltaic Clean-Energy Asset" or "Controlled Environment Agro-Caloric Asset"
    calculated_solar_cover = Column(Float)

Base.metadata.create_all(bind=engine)