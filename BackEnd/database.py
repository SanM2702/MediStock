from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os

# Configurar la URL de la base de datos SQLite
DATABASE_URL = "sqlite:///./medistock.db"

# Crear el engine con configuración para SQLite
engine: Engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # Usar StaticPool para SQLite en single-threaded
)

# Crear la sesión
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Session:
    """
    Dependency injection para obtener una sesión de base de datos.
    
    Yields:
        Session: Sesión de SQLAlchemy
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
