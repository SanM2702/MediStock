from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Cargar variables de entorno desde archivo .env
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medistock")

# Importar database y modelos
from database import engine, SessionLocal
from models import Base

# Importar routers
from routes import auth as auth_router
from routes import usuarios as usuarios_router
from routes import medicamentos as medicamentos_router
from routes import farmacias as farmacias_router
from routes import inventario as inventario_router
from routes import network as network_router
from routes import turnos as turnos_router
from routes import chat as chat_router 

# Importar utilidades
from seed import seed_database
from monitoring.network_monitor import monitor

# ==================== CONFIGURACIÓN DE FASTAPI ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Eventos que se ejecutan al iniciar y cerrar la aplicación:
    - Crear tablas en la BD
    - Ejecutar seed si la BD está vacía
    - Iniciar network monitor
    """
    logger.info("Starting MediStock API")
    
    try:
        logger.info("Creating database tables if needed")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables are ready")
    except Exception:
        logger.exception("Database initialization failed. API will continue in degraded mode.")
    
    try:
        logger.info("Checking initial seed data")
        # Solo seed si no hay usuarios
        db = SessionLocal()
        try:
            from models import Usuario
            count = db.query(Usuario).count()
            if count == 0:
                from seed import seed_database
                seed_database()
            else:
                logger.info("Database already contains data, skipping seed")
        finally:
            db.close()
    except Exception:
        logger.exception("seed_database() failed. Startup will continue without seed data.")
    
    try:
        logger.info("Starting network monitor task")
        asyncio.create_task(monitor.start(intervalo=2.0))
    except Exception:
        logger.exception("Network monitor could not be started. API will continue without monitor task.")
    
    logger.info("MediStock API startup completed")
    
    yield
    
    # Shutdown
    monitor.stop()
    logger.info("MediStock API shutdown completed")

app = FastAPI(
    title="MediStock API",
    description="Backend para sistema de búsqueda de medicamentos en farmacias",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ==================== CORS ====================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://medi-stock.vercel.app",
    "https://medi-stock-1scv3rq9k-santim-projects.vercel.app",
]

# Permitir cualquier preview deployment de Vercel
origin_regex = r"https://.*\.vercel\.app"

# ==================== MIDDLEWARE DE LATENCIA Y REQUESTS ====================


@app.middleware("http")
async def middleware_monitor(request: Request, call_next):
    """
    Middleware que mide la latencia de cada request
    y cuenta el número total de requests.
    """
    # Iniciar cronómetro
    start_time = time.time()
    
    # Incrementar contador de requests
    monitor.increment_request_counter()
    
    try:
        # Procesar request
        response = await call_next(request)
        
        # Calcular latencia
        latencia = time.time() - start_time
        
        # Añadir headers de información
        response.headers["X-Process-Time"] = str(latencia)
        response.headers["X-Total-Requests"] = str(monitor.contador_requests)
        
        return response
        
    except Exception:
        logger.exception("Unhandled error while processing request %s", request.url.path)
        latencia = time.time() - start_time
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers={"X-Process-Time": str(latencia)},
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ==================== ROUTERS ====================

# Incluir routers con prefix /api
app.include_router(auth_router.router)
app.include_router(usuarios_router.router)
app.include_router(medicamentos_router.router)
app.include_router(farmacias_router.router)
app.include_router(inventario_router.router)
app.include_router(network_router.router)
app.include_router(turnos_router.router)
app.include_router(chat_router.router)

# ==================== HEALTH CHECK ====================


@app.get("/health", tags=["health"])
def health_check():
    """Verificar que el servidor está funcionando."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "requests_totales": monitor.contador_requests,
    }


@app.get("/", tags=["root"])
def root():
    """Ruta raíz con información de la API."""
    return {
        "nombre": "MediStock API",
        "version": "1.0.0",
        "descripcion": "Backend para sistema de búsqueda de medicamentos en farmacias",
        "endpoints": {
            "documentación": "http://localhost:8000/docs",
            "redoc": "http://localhost:8000/redoc",
            "health": "http://localhost:8000/health",
        },
    }


# ==================== ERROR HANDLERS ====================


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Manejador global de excepciones."""
    logger.exception("Unhandled exception on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor",
            "error": str(exc),
        },
    )


# ==================== PUNTO DE ENTRADA ====================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
