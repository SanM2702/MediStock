"""
Servicio centralizado para registrar actividades del usuario en el historial.
Proporciona funciones para registrar diferentes tipos de eventos sin duplicar código.
"""
from sqlalchemy.orm import Session
from models import HistorialActividad
import logging

logger = logging.getLogger("medistock")


def registrar_actividad(
    db: Session,
    usuario_id: int,
    tipo: str,
    titulo: str,
    descripcion: str = None,
    metadata_json: str = None,
):
    """
    Registra una actividad en el historial del usuario.
    
    Args:
        db: Sesión de la base de datos
        usuario_id: ID del usuario
        tipo: Tipo de actividad (consulta_medicamento, turno_agendado, etc.)
        titulo: Título descriptivo de la actividad
        descripcion: Descripción más detallada (opcional)
        metadata_json: JSON con datos adicionales (opcional)
    
    Raises:
        Exception: Si hay error al registrar la actividad
    """
    try:
        actividad = HistorialActividad(
            usuario_id=usuario_id,
            tipo=tipo,
            titulo=titulo,
            descripcion=descripcion,
            metadata_json=metadata_json
        )
        db.add(actividad)
        db.commit()
        logger.info(f"Actividad registrada: usuario_id={usuario_id}, tipo={tipo}")
        return actividad
    except Exception as e:
        db.rollback()
        logger.error(f"Error registrando actividad: {e}")
        # No lanzamos la excepción para no romper el flujo principal
        # El historial es una funcionalidad secundaria
        return None
