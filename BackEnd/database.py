from pathlib import Path
import tempfile

from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os

# Configurar la URL de la base de datos.
# En Render se puede usar, por ejemplo:
# DATABASE_URL=sqlite:////var/data/medistock.db
DEFAULT_DB_PATH = Path(__file__).resolve().parent / "medistock.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}").strip()


def _ensure_sqlite_directory(database_url: str) -> None:
    if not database_url.startswith("sqlite:///"):
        return

    db_path = database_url.replace("sqlite:///", "", 1)
    if not db_path or db_path == ":memory:":
        return

    Path(db_path).expanduser().parent.mkdir(parents=True, exist_ok=True)


try:
    _ensure_sqlite_directory(DATABASE_URL)
except OSError as exc:
    fallback_path = Path(tempfile.gettempdir()) / "medistock.db"
    print(
        f"WARNING: Could not prepare SQLite directory for {DATABASE_URL}: {exc}. "
        f"Using sqlite:///{fallback_path}"
    )
    DATABASE_URL = f"sqlite:///{fallback_path}"
    _ensure_sqlite_directory(DATABASE_URL)

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    engine_kwargs["poolclass"] = StaticPool

engine: Engine = create_engine(
    DATABASE_URL,
    **engine_kwargs,
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
