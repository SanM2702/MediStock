# Requirements Document

## Introduction

Este documento define los requisitos para la integración completa del chatbot GroqCloud en MediStock, una aplicación de gestión de inventario de medicamentos y farmacias. La integración reemplaza cualquier referencia previa a Google Generative AI / Gemini y establece Groq Cloud API (modelo `llama-3.1-8b-instant`) como el único proveedor de IA. El sistema expone un endpoint `POST /api/chat` en FastAPI que el frontend React consume de forma segura, sin exponer la API key al cliente.

## Glossary

- **Groq_Client**: Servicio Python (`services/ai.py`) que encapsula la comunicación con la Groq Cloud API usando el cliente `AsyncOpenAI` apuntando a `https://api.groq.com/openai/v1`.
- **Chat_Router**: Módulo FastAPI (`routes/chat.py`) que expone los endpoints `/api/chat` y `/api/chat/anonymous`.
- **Chatbot_Service**: Módulo TypeScript (`src/services/chatbot.ts`) que encapsula las llamadas HTTP al backend desde el frontend.
- **Chatbot_UI**: Componente React (`src/components/chatbot/Chatbot.tsx`) que renderiza la interfaz de chat.
- **System_Prompt**: Instrucción de sistema enviada a Groq en cada request para delimitar el dominio del asistente.
- **GROQ_API_KEY**: Variable de entorno cargada desde `.env` en el backend; nunca se transmite al frontend.
- **Rate_Limit_Error**: Error HTTP 429 devuelto por la Groq API cuando se supera el límite de solicitudes.
- **Retry_Policy**: Estrategia de reintento con backoff exponencial aplicada por el Groq_Client ante fallos transitorios.
- **JWT_Token**: Token de autenticación emitido por FastAPI y enviado por el frontend en el header `Authorization: Bearer`.

---

## Requirements

### Requirement 1: Servicio AI con cliente Groq reutilizable

**User Story:** Como desarrollador backend, quiero un servicio AI centralizado y reutilizable, para que toda la lógica de comunicación con Groq esté encapsulada en un único módulo y sea fácil de mantener.

#### Acceptance Criteria

1. THE Groq_Client SHALL inicializarse con `base_url="https://api.groq.com/openai/v1"` y `api_key` leída exclusivamente desde la variable de entorno `GROQ_API_KEY`.
2. THE Groq_Client SHALL usar el modelo `llama-3.1-8b-instant` en todas las solicitudes de completado de chat.
3. THE Groq_Client SHALL limitar las respuestas a un máximo de 80 tokens por solicitud (`max_tokens=80`).
4. WHEN la variable de entorno `GROQ_API_KEY` no está definida al iniciar la aplicación, THE Groq_Client SHALL lanzar un `ValueError` con un mensaje descriptivo antes de aceptar solicitudes.
5. THE Groq_Client SHALL exponer una única instancia global reutilizable obtenida mediante la función `get_ai_client()`.
6. THE Groq_Client SHALL incluir el System_Prompt en cada solicitud como mensaje con `role="system"`.

---

### Requirement 2: System Prompt orientado a salud y medicamentos

**User Story:** Como administrador del sistema, quiero que el asistente responda únicamente sobre medicamentos, farmacias y salud básica, para que los usuarios reciban información relevante y segura.

#### Acceptance Criteria

1. THE System_Prompt SHALL instruir al Groq_Client a responder en español en un máximo de 80 palabras por respuesta.
2. THE System_Prompt SHALL restringir el dominio de respuestas a medicamentos comunes, ubicación de farmacias y consejos de salud básica.
3. THE System_Prompt SHALL instruir al Groq_Client a no inventar información médica y a indicar "No tengo información sobre eso" cuando no disponga de datos.
4. THE System_Prompt SHALL instruir al Groq_Client a recomendar consultar a un profesional de salud cuando la consulta lo requiera.

---

### Requirement 3: Manejo de errores y resiliencia (Retry Policy)

**User Story:** Como usuario, quiero que el chatbot maneje fallos de red y límites de tasa de forma transparente, para que mis consultas se completen aunque haya problemas transitorios.

#### Acceptance Criteria

1. WHEN una solicitud a la Groq API supera 30 segundos sin respuesta, THE Groq_Client SHALL cancelar la solicitud y retornar `{"success": false, "error": "Timeout: Groq tardó demasiado en responder"}`.
2. WHEN la Groq API devuelve un Rate_Limit_Error (HTTP 429), THE Groq_Client SHALL esperar 5 segundos antes de reintentar, hasta un máximo de 3 intentos.
3. WHEN la Groq API devuelve un error de conexión (`APIConnectionError`), THE Groq_Client SHALL reintentar con backoff exponencial (1s, 2s, 4s) hasta un máximo de 3 intentos.
4. WHEN se agotan todos los reintentos sin éxito, THE Groq_Client SHALL retornar `{"success": false, "error": "<mensaje descriptivo>", "time_ms": <entero>}`.
5. WHEN una solicitud es exitosa, THE Groq_Client SHALL retornar `{"success": true, "response": "<texto>", "tokens_used": <entero>, "time_ms": <entero>}`.

---

### Requirement 4: Endpoint POST /api/chat (autenticado)

**User Story:** Como usuario autenticado de MediStock, quiero enviar mensajes al chatbot a través de un endpoint seguro, para que mis consultas sean procesadas con mi identidad verificada.

#### Acceptance Criteria

1. THE Chat_Router SHALL exponer el endpoint `POST /api/chat` que acepta un body JSON con el campo `message` (string, 1–500 caracteres).
2. WHEN el endpoint `POST /api/chat` recibe una solicitud sin JWT_Token válido, THE Chat_Router SHALL retornar HTTP 401.
3. WHEN el endpoint `POST /api/chat` recibe un `message` vacío o que supera 500 caracteres, THE Chat_Router SHALL retornar HTTP 422.
4. WHEN el endpoint `POST /api/chat` procesa una solicitud exitosa, THE Chat_Router SHALL retornar HTTP 200 con `{"success": true, "response": "<texto>"}`.
5. IF el Groq_Client retorna `success=false`, THEN THE Chat_Router SHALL retornar HTTP 200 con `{"success": false, "error": "<mensaje>"}`.
6. THE Chat_Router SHALL registrar en logs el identificador del usuario autenticado, el resultado (`success`) y el tiempo de respuesta (`time_ms`) de cada solicitud.

---

### Requirement 5: Endpoint POST /api/chat/anonymous (sin autenticación)

**User Story:** Como visitante no autenticado, quiero poder usar el chatbot sin iniciar sesión, para que pueda obtener información básica sobre medicamentos sin necesidad de registro.

#### Acceptance Criteria

1. THE Chat_Router SHALL exponer el endpoint `POST /api/chat/anonymous` que acepta el mismo body que `POST /api/chat` sin requerir JWT_Token.
2. WHEN el endpoint `POST /api/chat/anonymous` procesa una solicitud exitosa, THE Chat_Router SHALL retornar HTTP 200 con `{"success": true, "response": "<texto>"}`.
3. IF el Groq_Client retorna `success=false`, THEN THE Chat_Router SHALL retornar HTTP 200 con `{"success": false, "error": "<mensaje>"}`.
4. THE Chat_Router SHALL registrar en logs el resultado y el tiempo de respuesta de cada solicitud anónima sin incluir datos de identidad del usuario.

---

### Requirement 6: Seguridad — protección de la API key

**User Story:** Como administrador de seguridad, quiero que la GROQ_API_KEY nunca sea expuesta al frontend, para que las credenciales del servicio de IA permanezcan seguras.

#### Acceptance Criteria

1. THE Groq_Client SHALL leer `GROQ_API_KEY` únicamente desde variables de entorno del servidor, nunca desde parámetros de request ni desde el frontend.
2. THE Chat_Router SHALL procesar todas las solicitudes al Groq_Client en el servidor; el frontend no SHALL recibir ni transmitir la GROQ_API_KEY en ningún momento.
3. THE Chat_Router SHALL incluir configuración CORS que permita únicamente los orígenes autorizados (`localhost:5173`, `medi-stock.vercel.app` y subdominios `*.vercel.app`).
4. THE Groq_Client SHALL sanitizar el mensaje de entrada truncándolo a 500 caracteres antes de enviarlo a la Groq API.

---

### Requirement 7: Logging estructurado

**User Story:** Como desarrollador, quiero logs claros y estructurados en el backend, para que pueda diagnosticar problemas de rendimiento y errores en producción.

#### Acceptance Criteria

1. THE Groq_Client SHALL registrar un log de nivel INFO al recibir cada request, incluyendo la longitud del mensaje y el identificador de usuario.
2. THE Groq_Client SHALL registrar un log de nivel INFO al completar cada request exitoso, incluyendo el número de tokens usados y el tiempo de respuesta en milisegundos.
3. WHEN ocurre un Rate_Limit_Error, THE Groq_Client SHALL registrar un log de nivel WARNING con el número de intento actual.
4. WHEN ocurre un error de conexión o error de API, THE Groq_Client SHALL registrar un log de nivel ERROR con el mensaje de error y el número de intento.
5. WHEN se realiza un reintento, THE Groq_Client SHALL registrar un log de nivel INFO indicando el tiempo de espera antes del siguiente intento.

---

### Requirement 8: Servicio frontend — Chatbot_Service

**User Story:** Como desarrollador frontend, quiero un servicio TypeScript tipado que encapsule las llamadas al backend, para que el componente de chat no gestione directamente la lógica HTTP.

#### Acceptance Criteria

1. THE Chatbot_Service SHALL exponer la función `sendChatMessage(message: string, token: string): Promise<ChatResponse>` para usuarios autenticados.
2. THE Chatbot_Service SHALL exponer la función `sendChatMessageAnonymous(message: string): Promise<ChatResponse>` para usuarios no autenticados.
3. THE Chatbot_Service SHALL aplicar un timeout de 30 segundos usando `AbortController`; WHEN el timeout se cumple, THE Chatbot_Service SHALL retornar `{success: false, error: "Timeout: El servidor tardó demasiado en responder"}`.
4. WHEN el servidor retorna HTTP 429, THE Chatbot_Service SHALL retornar `{success: false, error: "Demasiadas solicitudes. Intenta de nuevo más tarde."}`.
5. WHEN el servidor retorna HTTP 401, THE Chatbot_Service SHALL retornar `{success: false, error: "Sesión expirada. Por favor, inicia sesión de nuevo."}`.
6. THE Chatbot_Service SHALL validar que el mensaje no esté vacío y no supere 500 caracteres antes de realizar la solicitud HTTP.
7. THE Chatbot_Service SHALL leer la URL base del backend desde la variable de entorno `VITE_API_URL`, con fallback a `http://localhost:8000/api`.

---

### Requirement 9: Interfaz de usuario — Chatbot_UI

**User Story:** Como usuario final, quiero una interfaz de chat funcional y responsiva, para que pueda enviar mensajes y ver respuestas del asistente de forma clara.

#### Acceptance Criteria

1. THE Chatbot_UI SHALL mostrar un indicador de carga (loading) mientras espera la respuesta del backend, deshabilitando el botón de envío y el campo de texto durante ese período.
2. WHILE loading es verdadero, THE Chatbot_UI SHALL ignorar solicitudes adicionales de envío para evitar múltiples requests simultáneos.
3. WHEN el Chatbot_Service retorna `success=false`, THE Chatbot_UI SHALL mostrar el mensaje de error en la interfaz sin interrumpir la sesión de chat.
4. THE Chatbot_UI SHALL hacer scroll automático al último mensaje después de cada respuesta recibida.
5. WHEN el usuario presiona Enter sin Shift, THE Chatbot_UI SHALL enviar el mensaje; WHEN el usuario presiona Shift+Enter, THE Chatbot_UI SHALL insertar un salto de línea.
6. THE Chatbot_UI SHALL mostrar el estado de autenticación del usuario (autenticado / anónimo) en la interfaz.
7. THE Chatbot_UI SHALL limitar la entrada del usuario a 500 caracteres y mostrar un contador de caracteres en tiempo real.

---

### Requirement 10: Eliminación de referencias a Gemini / Google Generative AI

**User Story:** Como desarrollador, quiero que todas las referencias a Google Generative AI y Gemini sean eliminadas del proyecto, para que la base de código sea coherente y no genere confusión.

#### Acceptance Criteria

1. THE Groq_Client SHALL no contener ninguna importación ni referencia a `google.generativeai`, `gemini-2.0-flash` ni ningún modelo Gemini.
2. THE Chat_Router SHALL no contener ninguna importación ni referencia a librerías de Google AI.
3. THE Chatbot_Service SHALL no contener ninguna referencia a endpoints, modelos o configuraciones de Gemini.
4. THE Chatbot_UI SHALL no contener ninguna referencia a Gemini ni Google AI en comentarios, variables ni lógica.

---

### Requirement 11: Compatibilidad con despliegue en producción

**User Story:** Como DevOps, quiero que la integración sea compatible con Render (backend) y Vercel (frontend), para que el sistema funcione correctamente en producción sin configuración adicional.

#### Acceptance Criteria

1. THE Groq_Client SHALL funcionar correctamente cuando `GROQ_API_KEY` es inyectada como variable de entorno en Render, sin depender de archivos `.env` locales.
2. THE Chat_Router SHALL incluir configuración CORS que permita el dominio de producción de Vercel (`https://medi-stock.vercel.app` y el patrón `https://.*\.vercel\.app`).
3. THE Chatbot_Service SHALL funcionar correctamente cuando `VITE_API_URL` apunta al dominio de producción de Render.
4. THE Groq_Client SHALL usar operaciones `async/await` en todas las llamadas a la Groq API para ser compatible con el servidor ASGI de uvicorn en Render.
5. WHERE el archivo `requirements.txt` del backend es actualizado, THE Groq_Client SHALL requerir `openai>=1.0.0` y `python-dotenv>=1.0.0` como dependencias explícitas.
