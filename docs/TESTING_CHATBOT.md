# Testing Chatbot Groq - Checklist

## 🧪 Verificaciones Previas

### Backend

- [ ] Verificar que `GROQ_API_KEY` está en `BackEnd/.env`
- [ ] Verificar que `openai` está instalado:
  ```bash
  pip list | grep openai
  ```
- [ ] Verificar que `BackEnd/services/ai.py` existe
- [ ] Verificar que `BackEnd/routes/chat.py` existe
- [ ] Verificar que `BackEnd/main.py` importa el router de chat

### Frontend

- [ ] Verificar que `src/services/chatbot.ts` existe
- [ ] Verificar que `src/components/chatbot/Chatbot.tsx` existe
- [ ] Verificar que `src/components/chatbot/Chatbot.css` existe

---

## 🚀 Testing Local

### 1. Iniciar Backend

```bash
cd BackEnd
python -m uvicorn main:app --reload
```

**Verificar que dice:**
```
INFO:     Application startup complete
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 2. Health Check

```bash
curl http://localhost:8000/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-20T...",
  "requests_totales": 1
}
```

### 3. Test Chat Anónimo

```bash
curl -X POST "http://localhost:8000/api/chat/anonymous" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola"}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "response": "Hola, ¿en qué puedo ayudarte? Tengo información sobre medicamentos, farmacias y salud básica.",
  "tokens_used": 20,
  "time_ms": 1250
}
```

**Si falla, verificar:**
- [ ] `GROQ_API_KEY` en `.env` es válida
- [ ] Conexión a internet funciona
- [ ] Logs del servidor muestran errores

### 4. Verificar Logs del Backend

Buscar en los logs:
```
[msg_1234567890] Chat request recibida
[msg_1234567890] Enviando a Groq | attempt=1/3
[msg_1234567890] ✓ Respuesta exitosa | tokens=20 | time_ms=1250
```

### 5. Iniciar Frontend

```bash
npm run dev
```

**Verificar que dice:**
```
VITE v... ready in ... ms

➜  Local:   http://localhost:5173/
```

### 6. Navegar a la Página del Chat

- [ ] Abrir http://localhost:5173/chat
- [ ] Debería ver la interfaz del chatbot
- [ ] Ver que dice "○ Anónimo" (sin autenticación)

### 7. Enviar un Mensaje

- [ ] Escribir: "¿Qué es ibuprofeno?"
- [ ] Presionar Enter o click en "Enviar"
- [ ] Verificar que:
  - [ ] El mensaje aparece como usuario (azul)
  - [ ] Aparece un loading (puntos animados)
  - [ ] Llega respuesta del bot (gris)
  - [ ] Aparece tiempo y tokens en gris pequeño

### 8. Developer Tools

**Abriendo F12, verificar:**

**Console:**
- [ ] No hay errores rojos
- [ ] No hay warnings graves

**Network (XHR):**
- [ ] POST /api/chat/anonymous
- [ ] Status: 200
- [ ] Response tiene `success: true`

### 9. Test con Autenticación

Si tienes cuenta:
- [ ] Hacer login
- [ ] Debería decir "✓ Autenticado" en lugar de "○ Anónimo"
- [ ] Enviar mensaje a `/api/chat` (autenticado)
- [ ] Funciona igual que anónimo

---

## 🐛 Troubleshooting

### Error: "Timeout"

```
Solución:
1. Verificar conexión a internet
2. Verificar que GROQ_API_KEY es válida
3. Esperar 5 segundos y reintentar
```

### Error: "Error de conexión"

```
Verificar:
1. curl http://localhost:8000/health
2. Backend está corriendo (localhost:8000)
3. No hay firewall bloqueando
```

### Error: "Mensaje inválido"

```
Causas posibles:
1. Mensaje vacío
2. Mensaje > 500 caracteres
3. Mensaje no es texto

Verificar en console del navegador
```

### No aparece respuesta

```
Verificar:
1. F12 > Network > XHR > POST /api/chat/anonymous
2. Status: 200 = OK, otro = error
3. Response muestra "success": true o false
4. Si false, leer el campo "error"
```

---

## 📊 Test de Carga

Para probar que aguanta múltiples requests:

```bash
# Instalar Apache Bench
# Linux: sudo apt-get install apache2-utils
# macOS: brew install httpd
# Windows: descargar de apachehouse.org

# Test: 10 requests, 5 concurrentes
ab -n 10 -c 5 -p payload.json -T application/json \
  http://localhost:8000/api/chat/anonymous
```

**Crear payload.json:**
```json
{"message": "test"}
```

---

## ✅ Test de Producción (Render)

### 1. Deploy a Render

```bash
# Asegúrate que GROQ_API_KEY está en Render > Environment
# Render debe tener: DATABASE_URL y GROQ_API_KEY
```

### 2. Test del Health Check

```bash
curl https://your-api.render.com/health
```

### 3. Test del Chat

```bash
curl -X POST "https://your-api.render.com/api/chat/anonymous" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### 4. Verificar Logs en Render

En Render Dashboard > Logs:
```
✓ Respuesta exitosa | tokens=20 | time_ms=1250
```

---

## 📈 Performance Expected

| Métrica | Esperado | Alerta |
|---------|----------|--------|
| Tiempo respuesta | < 2s | > 3s |
| Tokens por respuesta | 15-30 | > 80 |
| Success rate | > 95% | < 90% |
| Errores de conexión | < 1% | > 5% |

---

## 🎯 Checklist Final

- [ ] Backend responde a GET /health
- [ ] Backend responde a POST /api/chat/anonymous
- [ ] Frontend carga sin errores
- [ ] Chatbot envía mensaje exitosamente
- [ ] Respuesta aparece correctamente formateada
- [ ] Network tab muestra status 200
- [ ] Logs muestran "✓ Respuesta exitosa"
- [ ] Tiempo de respuesta < 3 segundos
- [ ] En Render también funciona

---

## 🚀 Ready for Production?

```bash
# Checklist final
✅ GROQ_API_KEY en .env
✅ openai>=1.40 en requirements.txt
✅ Todos los archivos creados existen
✅ Backend responde correctamente
✅ Frontend carga sin errores
✅ Chat funciona end-to-end
✅ Logs muestran información
✅ Deploy en Render funcionando
✅ CORS configurado correctamente
✅ No hay API keys en código fuente
```

Si todas las casillas están marcadas, ¡está listo para producción!

---

**Última actualización:** Mayo 20, 2026
