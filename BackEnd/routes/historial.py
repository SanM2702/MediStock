"""
Módulo de Historial de Actividades - Registro de actividades del usuario.

Tipos de actividad:
- medicamento_consultado
- turno_agendado
- turno_cancelado
- chat_ia
- busqueda
- perfil_actualizado
"""

from datetime import datetime
from typing import List, Optional
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import HistorialActividad, Usuario
from schemas import HistorialActividadResponse, HistorialResumenResponse
from auth import get_current_user_depends

router = APIRouter(
    prefix="/api/historial",
    tags=["historial"],
)

# Tipos de actividad válidos
TIPOS_ACTIVIDAD = {
    "medicamento_consultado",
    "turno_agendado",
    "turno_cancelado",
    "chat_ia",
    "busqueda",
    "perfil_actualizado",
}


def registrar_actividad(
    db: Session,
    usuario_id: int,
    tipo: str,
    descripcion: str,
    metadata: Optional[dict] = None,
) -> HistorialActividad:
    """
    Registra una actividad en el historial.
    
    Args:
        db: Sesión de base de datos
        usuario_id: ID del usuario
        tipo: Tipo de actividad (debe estar en TIPOS_ACTIVIDAD)
        descripcion: Descripción de la actividad
        metadata: Diccionario opcional con metadata adicional
        
    Returns:
        HistorialActividad: Registro creado
    """
    import json
    
    if tipo not in TIPOS_ACTIVIDAD:
        raise ValueError(f"Tipo de actividad inválido: {tipo}")
    
    metadata_json = json.dumps(metadata) if metadata else None
    
    actividad = HistorialActividad(
        usuario_id=usuario_id,
        tipo=tipo,
        descripcion=descripcion,
        metadata_json=metadata_json,
    )
    
    db.add(actividad)
    db.commit()
    db.refresh(actividad)
    
    return actividad


@router.get("", response_model=List[HistorialActividadResponse])
async def listar_historial(
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de actividad"),
    limite: int = Query(50, ge=1, le=200, description="Número máximo de registros a devolver"),
    current_user: Usuario = Depends(get_current_user_depends),
    db: Session = Depends(get_db),
):
    """
    Lista el historial de actividades del usuario autenticado.
    
    - Solo muestra las actividades del usuario actual
    - Opcionalmente filtra por tipo de actividad
    - Ordenado por fecha descendente (más reciente primero)
    """
    # Validar tipo si se proporciona
    if tipo and tipo not in TIPOS_ACTIVIDAD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de actividad inválido. Tipos permitidos: {', '.join(TIPOS_ACTIVIDAD)}",
        )
    
    stmt = (
        select(HistorialActividad)
        .where(HistorialActividad.usuario_id == current_user.id)
        .order_by(desc(HistorialActividad.fecha))
        .limit(limite)
    )
    
    if tipo:
        stmt = stmt.where(HistorialActividad.tipo == tipo)
    
    resultados = db.execute(stmt).scalars().all()
    return resultados


@router.get("/resumen", response_model=HistorialResumenResponse)
async def obtener_resumen(
    current_user: Usuario = Depends(get_current_user_depends),
    db: Session = Depends(get_db),
):
    """
    Obtiene un resumen de las actividades del usuario autenticado.
    
    Incluye:
    - Total de actividades
    - Conteo de actividades por tipo
    - Fecha de la última actividad
    """
    # Total de actividades
    stmt_total = select(func.count(HistorialActividad.id)).where(
        HistorialActividad.usuario_id == current_user.id
    )
    total = db.execute(stmt_total).scalar() or 0
    
    # Actividades por tipo
    stmt_tipos = select(
        HistorialActividad.tipo, 
        func.count(HistorialActividad.id)
    ).where(
        HistorialActividad.usuario_id == current_user.id
    ).group_by(HistorialActividad.tipo)
    
    resultados_tipos = db.execute(stmt_tipos).all()
    actividades_por_tipo = {tipo: count for tipo, count in resultados_tipos}
    
    # Última actividad
    stmt_ultima = select(func.max(HistorialActividad.fecha)).where(
        HistorialActividad.usuario_id == current_user.id
    )
    ultima_actividad = db.execute(stmt_ultima).scalar()
    
    return HistorialResumenResponse(
        total_actividades=total,
        actividades_por_tipo=actividades_por_tipo,
        ultima_actividad=ultima_actividad,
    )
