# ✅ Checklist de Verificación - Subida de Foto de Perfil

## Estado de la Configuración

### Backend - Archivos modificados ✓
- [x] `BackEnd/routes/usuarios.py` - Endpoint `/me/foto` corregido a `async`
  - Validación de autenticación
  - Validación de tipos de archivo (JPG, PNG, WebP, GIF)
  - Validación de tamaño (máx 5MB)
  - Integración con Cloudinary
  - Manejo robusto de errores

- [x] `BackEnd/main.py` - Carga de variables de entorno
  - `from dotenv import load_dotenv`
  - `load_dotenv()` al inicio

- [x] `BackEnd/requirements.txt` - Dependencias actualizadas
  - `python-dotenv==1.0.1` agregado

- [x] `BackEnd/.env.example` - Template de configuración
  - Guía de credenciales de Cloudinary

- [x] `BackEnd/.env` - Archivo de desarrollo local
  - Variables placeholder para desarrollo

### Frontend - Verificación ✓
- [x] `src/pages/ProfilePage.tsx` - Endpoint correcto
  - Envía a `/api/usuarios/me/foto` ✓
  - Usa `FormData` correctamente ✓
  - Token JWT en headers ✓

### Documentación ✓
- [x] `SETUP_FOTO_PERFIL.md` - Guía completa
  - Instrucciones de Cloudinary
  - Solución de problemas
  - Endpoints API
  - Variables de entorno

- [x] `BackEnd/test_foto_endpoint.py` - Script de prueba
  - Health check
  - Login
  - Get profile
  - Upload foto

---

## Pre-requisitos

### 1. Cuenta de Cloudinary
- [ ] Crear cuenta en https://cloudinary.com/console
- [ ] Obtener credenciales:
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`

### 2. Actualizar variables de entorno
```bash
# Editar BackEnd/.env
CLOUDINARY_CLOUD_NAME=tu_valor
CLOUDINARY_API_KEY=tu_valor
CLOUDINARY_API_SECRET=tu_valor
```

### 3. Instalar dependencias
```bash
cd BackEnd
pip install python-dotenv
# O reinstalar todo
pip install -r requirements.txt
```

---

## Pasos para Verificar

### Paso 1: Verificar Cloudinary está en .env
```bash
cat BackEnd/.env | grep CLOUDINARY
```
Debería mostrar 3 líneas con tus credenciales.

### Paso 2: Iniciar Backend
```bash
cd BackEnd
python main.py
```
Deberías ver:
```
✓ Tablas listas
🌱 Verificando datos iniciales...
✓ Base de datos lista
```

### Paso 3: Verificar en otra terminal que el servidor está corriendo
```bash
# En otra terminal, en la raíz del proyecto
curl http://127.0.0.1:8000/health
```
Debería retornar JSON con status "healthy"

### Paso 4: Ejecutar tests
```bash
# En el directorio BackEnd
python test_foto_endpoint.py
```

Esperado: Todos los tests pasan ✓

### Paso 5: Iniciar Frontend
```bash
npm run dev
```
Deberías ver:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Paso 6: Probar en el navegador
1. Ve a http://localhost:5173
2. Inicia sesión:
   - Cédula: 111222
   - Contraseña: pass123
3. Ve a `/perfil`
4. Haz clic en la cámara para cambiar foto
5. Selecciona una imagen
6. Espera a que se cargue

---

## Checklist de Errores Comunes

### ❌ Error 404: Ruta no encontrada
**Verificar:**
- [ ] Backend reiniciado después de cambios
- [ ] Puerto 8000 está disponible
- [ ] No hay firewall bloqueando

**Solución:**
```bash
# Reiniciar backend
cd BackEnd
python main.py
```

### ❌ Error 503: Servicio no disponible
**Verificar:**
- [ ] `BackEnd/.env` existe
- [ ] Variables de Cloudinary están configuradas
- [ ] `python-dotenv` está instalado

**Solución:**
```bash
pip install python-dotenv
# Editar BackEnd/.env con credenciales reales
# Reiniciar backend
```

### ❌ Error 401: No autorizado
**Verificar:**
- [ ] Token JWT es válido
- [ ] Token no está expirado
- [ ] Usuario está autenticado

**Solución:**
- Cierra sesión y vuelve a iniciar

### ❌ Error 400: Archivo no válido
**Verificar:**
- [ ] Archivo es imagen (JPG, PNG, WebP, GIF)
- [ ] Tamaño < 5MB
- [ ] Archivo no está corrupto

---

## Prueba Manual - Paso a Paso

### 1. Autenticar
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"111222","password":"pass123"}'
```

Copiar el `access_token`

### 2. Obtener perfil actual
```bash
curl -X GET http://127.0.0.1:8000/api/usuarios/me \
  -H "Authorization: Bearer <tu_token>"
```

### 3. Crear imagen de prueba
```bash
# Linux/Mac
curl -o test.jpg https://via.placeholder.com/100x100/FF0000/FF0000

# O usar imagen existente
```

### 4. Subir foto
```bash
curl -X POST http://127.0.0.1:8000/api/usuarios/me/foto \
  -H "Authorization: Bearer <tu_token>" \
  -F "file=@test.jpg"
```

Esperado: Retorna usuario con `foto_url` actualizada

---

## Verificar en la Base de Datos

```bash
# Conectar a SQLite
sqlite3 BackEnd/medistock.db

# Ver usuario con foto
SELECT id, nombre, foto_url FROM usuarios WHERE cedula = '111222';
```

Debería mostrar una URL de Cloudinary en `foto_url`

---

## Verificar en Cloudinary

1. Accede a https://cloudinary.com/console
2. Ve a "Media Library"
3. Busca carpeta `medistock/perfiles`
4. Deberías ver `usuario_3.jpg` (o tu usuario_id)

---

## Resumen de Cambios

### Archivos creados:
- `BackEnd/.env` - Configuración local
- `BackEnd/.env.example` - Template
- `BackEnd/test_foto_endpoint.py` - Tests
- `SETUP_FOTO_PERFIL.md` - Documentación
- `VERIFICATION_CHECKLIST.md` - Este archivo

### Archivos modificados:
- `BackEnd/routes/usuarios.py` - Endpoint mejorado
- `BackEnd/main.py` - Carga de .env
- `BackEnd/requirements.txt` - Agregado python-dotenv

### Cambios principales:
1. Función es `async` para manejar UploadFile correctamente
2. Validación robusta de archivos y tamaño
3. Mejor manejo de errores con mensajes descriptivos
4. Variables de entorno cargadas con python-dotenv
5. Documentación completa y tests

---

## Próximos Pasos

1. **Configurar Cloudinary**
   - Crear cuenta
   - Obtener credenciales
   - Actualizar `.env`

2. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

3. **Ejecutar tests**
   ```bash
   python BackEnd/test_foto_endpoint.py
   ```

4. **Probar en navegador**
   - Iniciar frontend
   - Acceder a `/perfil`
   - Subir foto

---

**Fecha**: Mayo 19, 2026
**Estado**: ✅ Listo para probar
