"""
Servicio de IA para chatbot con Groq Cloud.

Características:
- Usa modelo llama-3.1-8b-instant
- Respuestas cortas (~80 tokens)
- Manejo de errores robusto
- Retry simple con exponential backoff
- Timeouts configurables
- Logs detallados
"""

import os
import logging
import asyncio
from typing import Optional
from datetime import datetime
import time

from openai import AsyncOpenAI, RateLimitError, APIConnectionError, APIError

logger = logging.getLogger("medistock.ai")

# ==================== CONFIGURACIÓN ====================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_API_BASE = "https://api.groq.com/openai/v1"

# Parámetros de respuesta
MAX_TOKENS = 60
TEMPERATURE = 0.3

# Parámetros de resiliencia
REQUEST_TIMEOUT = 30  # segundos
MAX_RETRIES = 3
RETRY_DELAY = 1  # segundo (exponencial)
HTTP_429_RETRY_DELAY = 5  # segundos para rate limit


# ==================== VALIDACIONES ====================

def _validate_config():
    """Valida que la configuración esté correcta."""
    if not GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY no está configurada. Agregala a tu archivo .env"
        )
    logger.info("✓ Configuración de Groq validada")


# ==================== SYSTEM PROMPT ====================

SYSTEM_PROMPT = """Eres el asistente oficial de MediStock.

FUNCIÓN: Responder sobre disponibilidad de medicamentos, stock, farmacias, EPS atendidas, ubicación, inventario y horarios.

REGLAS ESTRICTAS:
1. Responde en MÁXIMO 1-2 frases (~300 caracteres)
2. Nunca des explicaciones largas ni párrafos extensos
3. Nunca actúes como doctor ni des consejos médicos
4. Nunca inventes información
5. Usa lenguaje corto y natural en español
6. Si no hay datos: "No encontré disponibilidad para ese medicamento."
7. Si la pregunta no es de MediStock: "Solo puedo ayudar con medicamentos, farmacias y disponibilidad."

EJEMPLOS:
- "Hay acetaminofén?" → "Sí. Hay 24 unidades en Farmacia Central Chía."
- "Donde atienden Nueva EPS?" → "Nueva EPS es atendida en Farmacia Vida Chía y FarmaCenter Cajicá."
- "Hay ibuprofeno en Cajicá?" → "Sí. FarmaCenter Cajicá tiene stock limitado de ibuprofeno."

PRIORIDAD: respuesta corta, información útil, velocidad."""


# ==================== CLIENTE GROQ ====================

class GroqAIClient:
    """Cliente reutilizable para Groq API con retry y error handling."""

    def __init__(self):
        """Inicializa el cliente de Groq."""
        _validate_config()
        self.client = AsyncOpenAI(
            api_key=GROQ_API_KEY,
            base_url=GROQ_API_BASE,
        )
        self.model = GROQ_MODEL
        self.max_tokens = MAX_TOKENS
        self.temperature = TEMPERATURE
        logger.info("✓ Cliente Groq inicializado")

    async def chat(
        self,
        message: str,
        user_id: Optional[str] = None,
    ) -> dict:
        """
        Envía un mensaje al chatbot y obtiene respuesta.

        Args:
            message: Mensaje del usuario
            user_id: ID del usuario (opcional, para logging)

        Returns:
            dict con estructura:
            {
                "success": bool,
                "response": str (respuesta del chatbot),
                "tokens_used": int,
                "time_ms": int,
                "error": str (solo si success=False)
            }
        """
        start_time = time.time()
        request_id = f"{user_id or 'anon'}_{int(start_time * 1000)}"

        logger.info(
            f"[{request_id}] Chat request recibida | "
            f"message_length={len(message)} | user={user_id}"
        )

        # Validar entrada
        if not message or not isinstance(message, str):
            logger.warning(f"[{request_id}] Mensaje inválido")
            return {
                "success": False,
                "error": "Mensaje debe ser texto no vacío",
                "time_ms": int((time.time() - start_time) * 1000),
            }

        message = message.strip()[:500]  # Limitar tamaño y limpiar

        # Intentar con retry
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logger.info(
                    f"[{request_id}] Enviando a Groq | "
                    f"attempt={attempt}/{MAX_RETRIES}"
                )

                response = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {
                                "role": "system",
                                "content": SYSTEM_PROMPT,
                            },
                            {
                                "role": "user",
                                "content": message,
                            },
                        ],
                        max_tokens=self.max_tokens,
                        temperature=self.temperature,
                    ),
                    timeout=REQUEST_TIMEOUT,
                )

                # Extraer respuesta
                ai_response = response.choices[0].message.content.strip()
                tokens_used = response.usage.total_tokens

                elapsed_ms = int((time.time() - start_time) * 1000)

                logger.info(
                    f"[{request_id}] ✓ Respuesta exitosa | "
                    f"tokens={tokens_used} | time_ms={elapsed_ms}"
                )

                return {
                    "success": True,
                    "response": ai_response,
                    "tokens_used": tokens_used,
                    "time_ms": elapsed_ms,
                }

            except asyncio.TimeoutError:
                elapsed_ms = int((time.time() - start_time) * 1000)
                logger.warning(
                    f"[{request_id}] Timeout después de {REQUEST_TIMEOUT}s | "
                    f"attempt={attempt}/{MAX_RETRIES}"
                )
                if attempt < MAX_RETRIES:
                    delay = RETRY_DELAY * (2 ** (attempt - 1))
                    logger.info(f"[{request_id}] Reintentando en {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    return {
                        "success": False,
                        "error": "Timeout: Groq tardó demasiado en responder",
                        "time_ms": elapsed_ms,
                    }

            except RateLimitError as e:
                elapsed_ms = int((time.time() - start_time) * 1000)
                logger.warning(
                    f"[{request_id}] HTTP 429 Rate Limit | "
                    f"attempt={attempt}/{MAX_RETRIES}"
                )
                if attempt < MAX_RETRIES:
                    logger.info(f"[{request_id}] Esperando {HTTP_429_RETRY_DELAY}s...")
                    await asyncio.sleep(HTTP_429_RETRY_DELAY)
                else:
                    return {
                        "success": False,
                        "error": "API límite de rate. Intenta de nuevo más tarde.",
                        "time_ms": elapsed_ms,
                    }

            except APIConnectionError as e:
                elapsed_ms = int((time.time() - start_time) * 1000)
                logger.error(
                    f"[{request_id}] Error de conexión: {str(e)} | "
                    f"attempt={attempt}/{MAX_RETRIES}"
                )
                if attempt < MAX_RETRIES:
                    delay = RETRY_DELAY * (2 ** (attempt - 1))
                    logger.info(f"[{request_id}] Reintentando en {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    return {
                        "success": False,
                        "error": "Error de conexión con el servidor de IA",
                        "time_ms": elapsed_ms,
                    }

            except APIError as e:
                elapsed_ms = int((time.time() - start_time) * 1000)
                logger.error(
                    f"[{request_id}] API Error: {str(e)} | "
                    f"attempt={attempt}/{MAX_RETRIES}"
                )
                if attempt < MAX_RETRIES:
                    delay = RETRY_DELAY * (2 ** (attempt - 1))
                    logger.info(f"[{request_id}] Reintentando en {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    return {
                        "success": False,
                        "error": f"Error de IA: {str(e)[:100]}",
                        "time_ms": elapsed_ms,
                    }

            except Exception as e:
                elapsed_ms = int((time.time() - start_time) * 1000)
                logger.exception(
                    f"[{request_id}] Error inesperado: {str(e)}"
                )
                if attempt < MAX_RETRIES:
                    delay = RETRY_DELAY * (2 ** (attempt - 1))
                    logger.info(f"[{request_id}] Reintentando en {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    return {
                        "success": False,
                        "error": "Error inesperado. Por favor intenta de nuevo.",
                        "time_ms": elapsed_ms,
                    }

        # No debería llegar aquí, pero por seguridad
        return {
            "success": False,
            "error": "Max retries alcanzado",
            "time_ms": int((time.time() - start_time) * 1000),
        }


# ==================== INSTANCIA GLOBAL ====================

# Se inicializa una única instancia para reutilizar
_ai_client: Optional[GroqAIClient] = None


def get_ai_client() -> GroqAIClient:
    """Obtiene o crea la instancia del cliente Groq."""
    global _ai_client
    if _ai_client is None:
        _ai_client = GroqAIClient()
    return _ai_client
