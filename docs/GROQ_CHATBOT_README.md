# Chatbot Groq - Documentación Completa

## 📋 Resumen

Se ha implementado un **chatbot con Groq Cloud** en MediStock que:

- ✅ Usa el modelo **llama-3.1-8b-instant**
- ✅ Respuestas cortas (~80 tokens / ~300 caracteres)
- ✅ Manejo robusto de errores y retries
- ✅ Seguridad: API key protegida en backend
- ✅ Soporta usuarios autenticados y anónimos
- ✅ Logs detallados y métricas
- ✅ Optimizado para Render y Vercel

---

## 🚀 Inicio Rápido

### 1. Backend Setup

#### Instalar dependencia:
```bash
pip install openai
```

#### Configurar .env:
```env
GROQ_API_KEY=
```

#### Iniciar servidor:
```bash
python -m uvicorn main:app --reload
```

### 2. Frontend Setup

#### El chatbot está en:
```typescript
src/components/chatbot/Chatbot.tsx
src/pages/ChatbotPage.tsx
```

#### Para usar en tu app:
```typescript
import Chatbot from "@/components/chatbot";

export function App() {
  return <Chatbot />;
}
```

#### Iniciar dev server:
```bash
npm run dev
```

---

## 📁 Archivos Creados

### Backend:

```
BackEnd/
├── services/
│   ├── __init__.py          # Nuevo: inicializador
│   └── ai.py               # Nuevo: servicio de Groq
├── routes/
│   └── chat.py             # Nuevo: endpoints de chat
└── main.py                 # Modificado: agrega router chat
```

### Frontend:

```
src/
├── components/
│   └── chatbot/
│       ├── Chatbot.tsx     # Nuevo: componente principal
│       ├── Chatbot.css     # Nuevo: estilos
│       └── index.ts        # Nuevo: exportador
├── services/
│   └── chatbot.ts          # Nuevo: cliente API
└── pages/
    ├── ChatbotPage.tsx     # Nuevo: página completa
    └── ChatbotPage.css     # Nuevo: estilos página
```

### Configuración:

```
BackEnd/
├── requirements.txt        # Modificado: agrega openai
├── .env                    # Modificado: Groq config
└── .env.example            # Modificado: ejemplo
```

---

## 🔌 API Endpoints

### Endpoint Autenticado

```http
POST /api/chat
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "message": "¿Qué medicamento es bueno para la gripe?"
}
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "response": "Para la gripe, el paracetamol o ibuprofeno son opciones comunes. Consulta con tu farmacéutico.",
  "tokens_used": 25,
  "time_ms": 1250
}
```

**Respuesta Error:**
```json
{
  "success": false,
  "error": "Error de conexión con el servidor de IA"
}
```

### Endpoint Anónimo

```http
POST /api/chat/anonymous
Content-Type: application/json

{
  "message": "¿Dónde encuentro una farmacia cerca?"
}
```

---

## 🔒 Seguridad

### ✅ Protecciones Implementadas:

1. **API Key en Backend**
   - Nunca se expone al frontend
   - Cargada desde .env
   - No incluida en código fuente

2. **Validación de Entrada**
   - Máximo 500 caracteres por mensaje
   - Validación de tipo (string)
   - Trimming automático

3. **Autenticación Opcional**
   - Endpoint autenticado: `/api/chat` (JWT)
   - Endpoint anónimo: `/api/chat/anonymous`
   - Rate limiting en producción recomendado

4. **Error Handling**
   - No expone stack traces
   - Mensajes genéricos al usuario
   - Logs internos detallados

---

## ⚙️ Configuración Groq

### Parámetros de Respuesta:

```python
# En services/ai.py
MAX_TOKENS = 80           # ~300 caracteres
TEMPERATURE = 0.7         # Creatividad balanceada
REQUEST_TIMEOUT = 30      # segundos
```

### Parámetros de Resiliencia:

```python
MAX_RETRIES = 3           # Intentos máximos
RETRY_DELAY = 1           # Espera exponencial
HTTP_429_RETRY_DELAY = 5  # Para rate limit
```

### System Prompt:

```
"Eres un asistente de salud especializado en medicamentos y farmacias.
- Responde SIEMPRE en MÁXIMO 80 palabras
- Responde SOLO en español
- Enfócate en medicamentos, farmacias, salud básica
- NUNCA inventes información médica
- Recomienda profesionales cuando sea necesario"
```

---

## 📊 Logs y Monitoreo

### Ejemplo de Logs:

```
[msg_1234567890_1] Chat request recibida | message_length=25 | user=user123
[msg_1234567890_1] Enviando a Groq | attempt=1/3
[msg_1234567890_1] ✓ Respuesta exitosa | tokens=25 | time_ms=1250
```

### Información por Solicitud:

- `request_id`: Identificador único
- `tokens_used`: Tokens consumidos
- `time_ms`: Tiempo de respuesta
- `attempt`: Número de intento
- Errores con detalles completos

---

## 🛠️ Uso en React

### Componente Básico:

```typescript
import Chatbot from "@/components/chatbot";

export function ChatPage() {
  return <Chatbot />;
}
```

### Usar Hook de Auth:

```typescript
import { useAuth } from "@/hooks/useAuth";
import Chatbot from "@/components/chatbot";

export function ProtectedChat() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <p>Por favor, inicia sesión</p>;
  }

  return <Chatbot />;
}
```

### Integrar en Rutas:

```typescript
// En tu router
import ChatbotPage from "@/pages/ChatbotPage";

const routes = [
  // ... otras rutas
  { path: "/chat", element: <ChatbotPage /> },
];
```

---

## 🌍 Deploy - Render (Backend)

### 1. Variables de Entorno en Render:

```env
GROQ_API_KEY=gsk_your_production_key_here
```

### 2. Verificar Build:

```bash
# Render detectará automáticamente:
# - requirements.txt
# - runtime.txt (Python versión)
```

### 3. Health Check:

```
GET https://your-api.render.com/health
```

---

## 🌍 Deploy - Vercel (Frontend)

### 1. Variables de Entorno:

```env
VITE_API_URL=https://your-api.render.com/api
```

### 2. Build Command:

```bash
npm run build
```

### 3. CORS Automático:

Ya está configurado en main.py para Vercel.

---

## 🧪 Testing

### Test Local Backend:

```bash
# Desde BackEnd/

# 1. Iniciar server
python -m uvicorn main:app --reload

# 2. En otra terminal, probar:
curl -X POST "http://localhost:8000/api/chat/anonymous" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola"}'
```

### Test Local Frontend:

```bash
# Desde raíz del proyecto

npm run dev

# Ir a http://localhost:5173/chat
```

---

## 📈 Optimizaciones

### ✅ Ya Implementadas:

- [x] Async/await en todo
- [x] Tipado completo TypeScript
- [x] Reutilización de cliente Groq
- [x] Pool de conexiones HTTP
- [x] Exponential backoff retry
- [x] Manejo HTTP 429
- [x] Manejo timeout
- [x] Logs estructurados
- [x] Request/Response tracking

### 🚀 Futuras Optimizaciones:

- [ ] Rate limiting por IP/usuario
- [ ] Caché de respuestas similares
- [ ] Queue de mensajes
- [ ] Análisis de sentimientos
- [ ] Historial de chat (BD)
- [ ] WebSocket para real-time

---

## ❓ Troubleshooting

### Error: "GROQ_API_KEY no está configurada"

```bash
# Solución:
1. Verifica que .env tenga GROQ_API_KEY
2. Reinicia el servidor
3. En Render, agrega la variable en Settings > Environment
```

### Error: "Timeout: Groq tardó demasiado"

```
- Causas:
  - Servidor Groq lento
  - Conexión de internet lenta
  - Región geográfica lejana
  
- Soluciones:
  - Reintentar (automático)
  - Aumentar REQUEST_TIMEOUT si es necesario
```

### Error: "HTTP 429 Rate Limit"

```
- Significa: Demasiadas requests
- Soluciones:
  - Esperar (el sistema reintenta automáticamente)
  - En producción, agregar rate limiting
  - Upgrade a plan Groq con más límites
```

### El Chatbot no Responde:

```bash
# Debug:
1. Abre Developer Tools (F12)
2. Ve a Network > XHR
3. Busca POST /api/chat
4. Mira la respuesta completa
5. Revisa los logs del servidor backend
```

---

## 📚 Referencias

- [Groq API Docs](https://console.groq.com/docs)
- [Groq Console](https://console.groq.com)
- [OpenAI Python Client](https://github.com/openai/openai-python)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)

---

## ✅ Checklist de Implementación

- [x] Servicio AI en BackEnd/services/ai.py
- [x] Router de chat en BackEnd/routes/chat.py
- [x] Integración en BackEnd/main.py
- [x] Actualización de requirements.txt
- [x] Componente React Chatbot.tsx
- [x] Estilos Chatbot.css
- [x] Servicio API chatbot.ts
- [x] Página ChatbotPage.tsx
- [x] Actualización .env
- [x] Documentación .env.example
- [x] Sistema de logs
- [x] Manejo de errores
- [x] Manejo de retries
- [x] Manejo de timeout
- [x] Seguridad (sin API key al frontend)
- [x] Tipado TypeScript completo

---

## 🎯 Próximos Pasos

1. **Agregar Rate Limiting** (opcional):
   ```python
   # Instalar: pip install slowapi
   # En main.py: limiter = Limiter(key_func=get_remote_address)
   ```

2. **Historial de Chat** (opcional):
   ```python
   # Agregar tabla ChatMessage en models.py
   # Guardar conversaciones en BD
   ```

3. **Análisis de Sentimientos** (opcional):
   ```python
   # Usar transformers para análisis
   ```

---

## 📞 Soporte

Para más información o problemas:

1. Revisa los logs en terminal
2. Consulta la documentación de Groq
3. Verifica GROQ_API_KEY en .env
4. Asegúrate de tener openai>=1.40 instalado

---

**Última actualización:** Mayo 20, 2026
