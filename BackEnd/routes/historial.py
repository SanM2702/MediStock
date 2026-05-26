"""
Router para gestionar el historial de actividades del usuario.
Endpoints para obtener, filtrar, eliminar y limpiar el historial.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime, date
from typing import List, Optional
import json
import logging

from database import get_db
from auth import get_current_user_depends, get_current_user_required
from models import HistorialActividad, Usuario

logger = logging.getLogger("medistock")

router = APIRouter(prefix="/api/historial", tags=["historial"])


# ==================== SCHEMAS ====================

class HistorialActividadResponse:
    """Schema para responder historial de actividades"""
    def __init__(self, actividad: HistorialActividad):
        self.id = actividad.id
        self.tipo = actividad.tipo
        self.titulo = actividad.titulo
        self.descripcion = actividad.descripcion
        self.metadata_json = actividad.metadata_json
        self.creado_en = actividad.creado_en


# ==================== ENDPOINTS ====================

@router.get("", response_model=dict)
def obtener_historial(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de actividad"),
    fecha_desde: Optional[str] = Query(None, description="Filtrar desde (YYYY-MM-DD)"),
    fecha_hasta: Optional[str] = Query(None, description="Filtrar hasta (YYYY-MM-DD)"),
    limite: int = Query(50, ge=1, le=200, description="Número de registros")
):
    """
    Obtiene el historial de actividades del usuario autenticado.
    
    Parámetros:
    - tipo: filtrar por tipo de actividad (opcional)
    - fecha_desde: fecha mínima en formato YYYY-MM-DD (opcional)
    - fecha_hasta: fecha máxima en formato YYYY-MM-DD (opcional)
    - limite: número máximo de registros (1-200, default 50)
    
    Retorna actividades ordenadas por fecha descendente, agrupadas por fecha.
    """
    try:
        query = db.query(HistorialActividad).filter(
            HistorialActividad.usuario_id == current_user.id
        )
        
        # Filtro por tipo
        if tipo:
            query = query.filter(HistorialActividad.tipo == tipo)
        
        # Filtro por fecha desde
        if fecha_desde:
            try:
                fecha_desde_obj = datetime.strptime(fecha_desde, "%Y-%m-%d").date()
                query = query.filter(
                    HistorialActividad.creado_en >= datetime.combine(fecha_desde_obj, datetime.min.time())
                )
            except ValueError:
                raise HTTPException(status_code=400, detail="Formato de fecha_desde inválido: usar YYYY-MM-DD")
        
        # Filtro por fecha hasta
        if fecha_hasta:
            try:
                fecha_hasta_obj = datetime.strptime(fecha_hasta, "%Y-%m-%d").date()
                query = query.filter(
                    HistorialActividad.creado_en <= datetime.combine(fecha_hasta_obj, datetime.max.time())
                )
            except ValueError:
                raise HTTPException(status_code=400, detail="Formato de fecha_hasta inválido: usar YYYY-MM-DD")
        
        # Ordenar por fecha descendente y aplicar límite
        actividades = query.order_by(desc(HistorialActividad.creado_en)).limit(limite).all()
        
        # Agrupar por fecha
        historial_agrupado = {}
        for actividad in actividades:
            fecha_str = actividad.creado_en.strftime("%Y-%m-%d")
            if fecha_str not in historial_agrupado:
                historial_agrupado[fecha_str] = []
            
            historial_agrupado[fecha_str].append({
                "id": actividad.id,
                "tipo": actividad.tipo,
                "titulo": actividad.titulo,
                "descripcion": actividad.descripcion,
                "metadata_json": actividad.metadata_json,
                "creado_en": actividad.creado_en.isoformat()
            })
        
        return {
            "total": len(actividades),
            "historial_agrupado": historial_agrupado,
            "actividades": [
                {
                    "id": a.id,
                    "tipo": a.tipo,
                    "titulo": a.titulo,
                    "descripcion": a.descripcion,
                    "metadata_json": a.metadata_json,
                    "creado_en": a.creado_en.isoformat()
                }
                for a in actividades
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo historial: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener el historial")


@router.get("/resumen", response_model=dict)
def obtener_resumen_historial(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required)
):
    """
    Obtiene un resumen del historial con conteos por tipo de actividad.
    
    Retorna:
    {
        "consultas": número de consultas de medicamentos,
        "turnos": número de turnos agendados,
        "busquedas": número de búsquedas,
        "chats": número de chats con IA,
        "cambios_perfil": número de cambios en el perfil,
        "logins": número de inicios de sesión,
        "otros": otras actividades
    }
    """
    try:
        actividades = db.query(HistorialActividad).filter(
            HistorialActividad.usuario_id == current_user.id
        ).all()
        
        resumen = {
            "consultas": 0,
            "turnos": 0,
            "busquedas": 0,
            "chats": 0,
            "cambios_perfil": 0,
            "logins": 0,
            "otros": 0
        }
        
        tipo_mapping = {
            "consulta_medicamento": "consultas",
            "turno_agendado": "turnos",
            "turno_cancelado": "turnos",
            "busqueda": "busquedas",
            "chat_ia": "chats",
            "cambio_perfil": "cambios_perfil",
            "login": "logins"
        }
        
        for actividad in actividades:
            clave = tipo_mapping.get(actividad.tipo, "otros")
            resumen[clave] += 1
        
        return resumen
    
    except Exception as e:
        logger.error(f"Error obteniendo resumen: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener el resumen")


@router.delete("/{actividad_id}")
def eliminar_actividad(
    actividad_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required)
):
    """
    Elimina una entrada específica del historial.
    Solo el dueño puede eliminar su propia actividad.
    """
    try:
        actividad = db.query(HistorialActividad).filter(
            HistorialActividad.id == actividad_id
        ).first()
        
        if not actividad:
            raise HTTPException(status_code=404, detail="Actividad no encontrada")
        
        if actividad.usuario_id != current_user.id:
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta actividad")
        
        db.delete(actividad)
        db.commit()
        
        logger.info(f"Actividad {actividad_id} eliminada por usuario {current_user.id}")
        return {"mensaje": "Actividad eliminada correctamente"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error eliminando actividad: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar la actividad")


@router.delete("")
def limpiar_historial(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user_required),
    confirmar: bool = Query(False, description="Debe ser true para confirmar")
):
    """
    Limpia todo el historial del usuario autenticado.
    Requiere confirmación con el parámetro: ?confirmar=true
    """
    if not confirmar:
        raise HTTPException(
            status_code=400,
            detail="Debes confirmar la acción con el parámetro ?confirmar=true"
        )
    
    try:
        db.query(HistorialActividad).filter(
            HistorialActividad.usuario_id == current_user.id
        ).delete()
        
        db.commit()
        
        logger.info(f"Historial limpiado para usuario {current_user.id}")
        return {"mensaje": "Historial limpiado correctamente"}
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error limpiando historial: {e}")
        raise HTTPException(status_code=500, detail="Error al limpiar el historial")
