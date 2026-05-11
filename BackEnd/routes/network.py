from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import asyncio
import json

from database import get_db
from auth import get_admin_user, verificar_token
from models import Usuario, SesionRed
from schemas import SesionRedResponse
from websockets.network_monitor import monitor

router = APIRouter(
    prefix="/api/network",
    tags=["network"],
)


@router.get("/metrics")
def obtener_metricas_actuales(
    current_user: Usuario = Depends(get_admin_user),
):
    """
    Obtiene las métricas actuales del sistema en tiempo real.
    Requiere rol de administrador.
    
    Retorna:
    - CPU, memoria, octetos enviados/recibidos
    - Conexiones activas, requests totales
    - Requests por segundo, latencia
    """
    return monitor.get_metrics()


@router.get("/history", response_model=List[SesionRedResponse])
def obtener_historial_red(
    current_user: Usuario = Depends(get_admin_user),
    db: Session = Depends(get_db),
    limit: int = 100,
):
    """
    Obtiene el historial de sesiones de red (últimas entradas en DB).
    Requiere rol de administrador.
    
    Query params:
    - **limit**: Número máximo de registros a retornar (default 100)
    
    Retorna:
    - Últimas N lecturas almacenadas en la base de datos
    """
    sesiones = db.query(SesionRed).order_by(
        SesionRed.timestamp.desc()
    ).limit(limit).all()
    
    return sesiones


class ConnectionManager:
    """Gestor de conexiones WebSocket para el monitor de red."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Acepta y registra una nueva conexión WebSocket."""
        await websocket.accept()
        self.active_connections.append(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        """Desconecta y remueve una conexión WebSocket."""
        self.active_connections.remove(websocket)
    
    async def broadcast(self, data: dict):
        """Envía datos a todos los clientes conectados."""
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                # Si hay error, remover conexión
                await self.disconnect(connection)


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_network_monitor(websocket: WebSocket):
    """
    WebSocket para monitoreo en tiempo real de métricas de red.
    Emite métricas cada 2 segundos en formato JSON.
    Endpoint: ws://localhost:8000/api/network/ws
    
    Los clientes pueden conectarse sin autenticación.
    Se envían automáticamente las métricas actuales.
    
    Ejemplo JSON recibido:
    {
        "timestamp": "2025-05-07T10:30:45.123456",
        "cpu_percent": 25.5,
        "memoria_usada_mb": 4096.2,
        "memoria_total_mb": 8192.0,
        "memoria_percent": 50.0,
        "bytes_enviados": 1024000,
        "bytes_recibidos": 2048000,
        "conexiones_activas": 5,
        "total_requests": 150,
        "requests_por_segundo": 2.5,
        "latencia_ms": 0.5
    }
    """
    await manager.connect(websocket)
    
    try:
        while True:
            # Obtener métricas actuales
            metricas = monitor.get_metrics()
            
            # Enviar a todos los clientes
            await manager.broadcast(metricas)
            
            # Esperar 2 segundos antes de la siguiente lectura
            await asyncio.sleep(2)
            
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        await manager.disconnect(websocket)


@router.post("/guardar")
def guardar_sesion_red(
    current_user: Usuario = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Guarda las métricas actuales en la base de datos.
    Requiere rol de administrador.
    
    Retorna:
    - ID de la sesión guardada
    """
    metricas = monitor.get_metrics()
    
    sesion = SesionRed(
        timestamp=metricas["timestamp"],
        latencia_ms=metricas["latencia_ms"],
        cpu_percent=metricas["cpu_percent"],
        bytes_enviados=metricas["bytes_enviados"],
        bytes_recibidos=metricas["bytes_recibidos"],
        conexiones_activas=metricas["conexiones_activas"],
    )
    
    db.add(sesion)
    db.commit()
    db.refresh(sesion)
    
    return {
        "id": sesion.id,
        "mensaje": "Sesión de red guardada exitosamente",
    }
