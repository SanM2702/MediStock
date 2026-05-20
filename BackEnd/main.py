from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect
import time
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Cargar variables de entorno desde archivo .env
load_dotenv()

# Importar database y modelos
from database import engine
from models import Base

# Importar routers
from routes import auth as auth_router
from routes import usuarios as usuarios_router
from routes import medicamentos as medicamentos_router
from routes import farmacias as farmacias_router
from routes import inventario as inventario_router
from routes import network as network_router

# Importar utilidades
from seed import seed_database
from websockets.network_monitor import monitor

# ==================== CONFIGURACIÓN DE FASTAPI ====================

app = FastAPI(
    title="MediStock API",
    description="Backend para sistema de búsqueda de medicamentos en farmacias",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ==================== CORS ====================

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://medi-stock-kx97dc394-santim-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        
    except Exception as e:
        latencia = time.time() - start_time
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers={"X-Process-Time": str(latencia)},
        )


# ==================== ROUTERS ====================

# Incluir routers con prefix /api
app.include_router(auth_router.router)
app.include_router(usuarios_router.router)
app.include_router(medicamentos_router.router)
app.include_router(farmacias_router.router)
app.include_router(inventario_router.router)
app.include_router(network_router.router)

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


# ==================== STARTUP ====================


@app.on_event("startup")
async def startup_event():
    """
    Eventos que se ejecutan al iniciar la aplicación:
    - Crear tablas en la BD
    - Ejecutar seed si la BD está vacía
    - Imprimir mensajes de bienvenida
    """
    print("\n" + "="*70)
    print("🚀 INICIANDO MEDISTOCK API")
    print("="*70)
    
    # Crear tablas si no existen
    print("\n📦 Creando tablas en base de datos...")
    Base.metadata.create_all(bind=engine)
    print("   ✓ Tablas listas")
    
    # Ejecutar seed
    print("\n🌱 Verificando datos iniciales...")
    seed_database()
    
    # Iniciar monitor de red en background
    print("\n📡 Iniciando monitor de red...")
    asyncio.create_task(monitor.start(intervalo=2.0))
    print("   ✓ Monitor en marcha (cada 2 segundos)")
    
    # Mensaje de bienvenida
    print("\n" + "✅ MediStock API corriendo en http://localhost:8000")
    print("📚 Docs en http://localhost:8000/docs")
    print("🔄 ReDoc en http://localhost:8000/redoc")
    print("🔌 WebSocket en ws://localhost:8000/api/network/ws")
    print("="*70 + "\n")


@app.on_event("shutdown")
async def shutdown_event():
    """Eventos que se ejecutan al apagar la aplicación."""
    monitor.stop()
    print("\n🛑 MediStock API detenido")


# ==================== ERROR HANDLERS ====================


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Manejador global de excepciones."""
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
