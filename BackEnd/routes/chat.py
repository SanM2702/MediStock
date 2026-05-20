"""
Rutas para el chatbot con Groq.

Endpoint:
    POST /api/chat - Envía un mensaje al chatbot
"""

from typing import Union
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
import logging
from sqlalchemy.orm import Session

from auth import get_current_user_depends
from models import Usuario
from services.ai import get_ai_client
from database import get_db

logger = logging.getLogger("medistock.chat")

router = APIRouter(
    prefix="/api/chat",
    tags=["chatbot"],
)


# ==================== SCHEMAS ====================

class ChatRequest(BaseModel):
    """Solicitud de chat."""
    message: str = Field(..., min_length=1, max_length=500)

    class Config:
        json_schema_extra = {
            "example": {
                "message": "¿Qué medicamento es bueno para la gripe?"
            }
        }


class ChatResponse(BaseModel):
    """Respuesta exitosa del chat."""
    success: bool
    response: str
    tokens_used: int = None
    time_ms: int = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "response": "Para la gripe, el paracetamol o ibuprofeno son opciones comunes. Consulta con tu farmacéutico.",
                "tokens_used": 25,
                "time_ms": 1250
            }
        }


class ChatErrorResponse(BaseModel):
    """Respuesta de error del chat."""
    success: bool
    error: str

    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": "Error de conexión con el servidor de IA"
            }
        }


# ==================== ENDPOINTS ====================

@router.post("/", response_model=Union[ChatResponse, ChatErrorResponse])
async def chat(
    data: ChatRequest,
    current_user: Usuario = Depends(get_current_user_depends),
    db: Session = Depends(get_db),
):
    """
    Envía un mensaje al chatbot y obtiene una respuesta.

    Autenticación: Requiere JWT token válido
    
    Args:
        data: Objeto con campo 'message' (str)
        db: Sesión de base de datos
        current_user: Usuario autenticado

    Returns:
        {
            "success": true,
            "response": "respuesta del chatbot",
            "tokens_used": 25,
            "time_ms": 1250
        }

    Errores:
        401: No autenticado
        422: Mensaje inválido
        500: Error del servidor de IA
    """
    try:
        # Obtener cliente de IA
        ai_client = get_ai_client()

        # Enviar mensaje a Groq
        result = await ai_client.chat(
            message=data.message,
            user_id=current_user.id,
        )

        # Registrar actividad de chat_ia
        try:
            from routes.historial import registrar_actividad
            registrar_actividad(
                db=db,
                usuario_id=current_user.id,
                tipo="chat_ia",
                descripcion=f"Chat IA: {data.message[:100]}",
                metadata={"mensaje": data.message, "tokens_used": result.get("tokens_used")},
            )
        except Exception:
            pass  # No fallar si el registro de historial falla

        # Log
        logger.info(
            f"Chat completado | usuario={current_user.cedula} | "
            f"success={result['success']} | time_ms={result.get('time_ms')}"
        )

        return result

    except Exception as e:
        logger.exception(f"Error inesperado en endpoint chat: {str(e)}")
        return {
            "success": False,
            "error": "Error interno del servidor",
        }


@router.post("/anonymous", response_model=Union[ChatResponse, ChatErrorResponse])
async def chat_anonymous(
    data: ChatRequest,
):
    """
    Envía un mensaje al chatbot (sin autenticación).

    Nota: En producción, puede ser limitado por rate limiting.

    Args:
        data: Objeto con campo 'message' (str)

    Returns:
        {
            "success": true,
            "response": "respuesta del chatbot",
            "tokens_used": 25,
            "time_ms": 1250
        }

    Errores:
        422: Mensaje inválido
        429: Rate limit (demasiadas solicitudes)
        500: Error del servidor de IA
    """
    try:
        # Obtener cliente de IA
        ai_client = get_ai_client()

        # Enviar mensaje a Groq
        result = await ai_client.chat(
            message=data.message,
            user_id="anonymous",
        )

        # Log
        logger.info(
            f"Chat anónimo completado | "
            f"success={result['success']} | time_ms={result.get('time_ms')}"
        )

        return result

    except Exception as e:
        logger.exception(f"Error inesperado en endpoint chat anónimo: {str(e)}")
        return {
            "success": False,
            "error": "Error interno del servidor",
        }
