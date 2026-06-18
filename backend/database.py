"""
database.py - Database configuration and ORM model definitions for Urban Harvest.
 
This module is the single source of truth for all database concerns:
it reads the connection URL from the environment, configures the
SQLAlchemy engine with the correct driver options, and declares the
ORM models that map to the underlying relational tables.
 
All application code that needs database access should import
`SessionLocal` (to open a session) and the model classes defined here.
 
Typical usage:
    from backend.database import SessionLocal, User, SavedPlot
 
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "example@test.com").first()
    finally:
        db.close()
"""
import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
# ---------------------------------------------------------------------------
# Engine configuration
# ---------------------------------------------------------------------------
 
# Fall back to a local SQLite file so the app works out-of-the-box without
# any external database infrastructure (e.g., during local development).
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./urban_harvest.db")

# SQLite requires `check_same_thread=False` because SQLAlchemy's connection
# pool may hand the same connection to a different thread than the one that
# created it. This flag is SQLite-specific and must NOT be passed to other
# drivers (Postgres, MySQL, etc.), which handle thread safety differently.

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------
 
# `autocommit=False` keeps every operation inside an explicit transaction so
# callers can roll back on error. `autoflush=False` prevents SQLAlchemy from
# issuing a silent flush before every query, giving callers full control over
# when pending changes hit the database.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Shared declarative base that all ORM models must inherit from so SQLAlchemy
# can discover and register them in its internal metadata registry.

Base = declarative_base()
# ---------------------------------------------------------------------------
# ORM Models
# ---------------------------------------------------------------------------
 
class User(Base):
    s User(Base):
    """ORM model representing an authenticated application user.
 
    Maps to the ``users`` table. Stores the minimum identity information
    needed for authentication — email as the unique human-readable key and
    the bcrypt (or equivalent) hash of the user's password.
 
    Attributes:
        id (int): Auto-incremented surrogate primary key.
        email (str): Unique email address used as the login identifier.
            Indexed to support fast look-ups during authentication.
        password_hash (str): Hashed password string. The plaintext password
            is never persisted; only the hash produced by the chosen hashing
            algorithm is stored here.
    """
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)

class SavedPlot(Base):
    """ORM model representing a land plot saved by a user.
 
    Maps to the ``saved_plots`` table. Captures the geographic and
    configuration details of a plot that a user has analysed and chosen
    to persist — including its location, physical size, intended usage
    mode, and the household energy consumption used during the analysis.
 
    Attributes:
        id (int): Auto-incremented surrogate primary key.
        user_id (int): Foreign key referencing ``users.id``. Links each
            plot to its owning user, enabling per-user plot retrieval.
        address_string (str): Human-readable address or location label
            entered by the user (e.g., "12 Main St, Springfield").
        center_lat (float): Latitude of the plot's geographic centre,
            stored in decimal degrees (WGS-84).
        center_lng (float): Longitude of the plot's geographic centre,
            stored in decimal degrees (WGS-84).
        total_area_sqmeters (float): Total surface area of the plot
            measured in square metres, derived from the drawn polygon.
        chosen_mode (str): The analysis mode selected by the user.
            Must be one of ``'solar'``, ``'crops'``, or ``'hybrid'``.
        monthly_consumption (int): The household's monthly electricity
            consumption in kWh, used as a baseline for solar yield
            calculations.
    """
    __tablename__ = "saved_plots"
    id = Column(Integer, primary_key=True, index=True)
    # A plot belongs to exactly one user; deleting the user should be
    # handled at the application layer (cascade rules are not defined here).
    
    user_id = Column(Integer, ForeignKey("users.id"))
    address_string = Column(String)
     # Storing lat/lng as separate Float columns (rather than a composite
    # geometry type) keeps the schema portable across SQLite and Postgres
    # without requiring the PostGIS extension.
    center_lat = Column(Float)
    center_lng = Column(Float)
    total_area_sqmeters = Column(Float)
    
    # Constraining to a known set of string values ('solar', 'crops',
    # 'hybrid') is enforced at the application layer rather than via a
    # database CHECK constraint, preserving SQLite compatibility.
    
    chosen_mode = Column(String) # 'solar', 'crops', 'hybrid'
    
    monthly_consumption = Column(Integer)
