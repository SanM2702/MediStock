/**
 * Servicio de API para el chatbot con Groq
 *
 * - Requiere autenticación para /api/chat
 * - Endpoint anónimo disponible en /api/chat/anonymous
 * - Manejo de errores y timeout
 * - Tipado completo con TypeScript
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  tokens_used?: number;
  time_ms?: number;
  error?: string;
}

const CHAT_TIMEOUT = 30000; // 30 segundos
const MAX_MESSAGE_LENGTH = 500;

/**
 * Envía un mensaje al chatbot (requiere autenticación)
 *
 * @param message Mensaje del usuario
 * @param token Token JWT de autenticación
 * @returns Promesa con la respuesta del chatbot
 */
export async function sendChatMessage(
  message: string,
  token: string
): Promise<ChatResponse> {
  // Validar entrada
  if (!message || message.trim().length === 0) {
    return {
      success: false,
      error: "El mensaje no puede estar vacío",
    };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      error: `El mensaje no puede exceder ${MAX_MESSAGE_LENGTH} caracteres`,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: message.trim(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Manejar errores HTTP
      let errorMessage = "Error al conectar con el chatbot";

      if (response.status === 401) {
        errorMessage = "Sesión expirada. Por favor, inicia sesión de nuevo.";
      } else if (response.status === 429) {
        errorMessage = "Demasiadas solicitudes. Intenta de nuevo más tarde.";
      } else if (response.status === 422) {
        errorMessage = "Mensaje inválido. Por favor, revisa tu entrada.";
      } else if (response.status === 500) {
        errorMessage = "Error del servidor. Intenta de nuevo más tarde.";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    // Manejar errores de red y timeout
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: "Timeout: El servidor tardó demasiado en responder",
        };
      }
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      };
    }
    return {
      success: false,
      error: "Error desconocido al conectar con el chatbot",
    };
  }
}

/**
 * Envía un mensaje al chatbot (sin autenticación)
 *
 * @param message Mensaje del usuario
 * @returns Promesa con la respuesta del chatbot
 */
export async function sendChatMessageAnonymous(
  message: string
): Promise<ChatResponse> {
  // Validar entrada
  if (!message || message.trim().length === 0) {
    return {
      success: false,
      error: "El mensaje no puede estar vacío",
    };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      error: `El mensaje no puede exceder ${MAX_MESSAGE_LENGTH} caracteres`,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}/chat/anonymous`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message.trim(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Manejar errores HTTP
      let errorMessage = "Error al conectar con el chatbot";

      if (response.status === 429) {
        errorMessage = "Demasiadas solicitudes. Intenta de nuevo más tarde.";
      } else if (response.status === 422) {
        errorMessage = "Mensaje inválido. Por favor, revisa tu entrada.";
      } else if (response.status === 500) {
        errorMessage = "Error del servidor. Intenta de nuevo más tarde.";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    // Manejar errores de red y timeout
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: "Timeout: El servidor tardó demasiado en responder",
        };
      }
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      };
    }
    return {
      success: false,
      error: "Error desconocido al conectar con el chatbot",
    };
  }
}
