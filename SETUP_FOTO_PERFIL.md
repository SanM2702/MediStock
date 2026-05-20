# 📸 Setup: Subida de Foto de Perfil en MediStock

## Descripción General
Esta guía te ayudará a configurar correctamente la funcionalidad de subida de fotos de perfil en MediStock.

---

## 1. Configurar Cloudinary

### 1.1 Crear una cuenta en Cloudinary
1. Ve a [https://cloudinary.com/console](https://cloudinary.com/console)
2. Crea una cuenta gratuita (o inicia sesión si ya tienes una)
3. En el Dashboard, busca tus credenciales:
   - **Cloud Name** (nombre de la nube)
   - **API Key** (clave API)
   - **API Secret** (secreto API)

### 1.2 Configurar variables de entorno

#### Para desarrollo local:

En `BackEnd/.env`, reemplaza los valores:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Ejemplo:**
```env
CLOUDINARY_CLOUD_NAME=my-company-cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

> ⚠️ **IMPORTANTE**: Nunca compartas tu `CLOUDINARY_API_SECRET` en público. Añade `.env` a tu `.gitignore`.

---

## 2. Instalar dependencias

### Backend
```bash
cd BackEnd

# Instalar dependencias (incluyendo python-dotenv)
pip install -r requirements.txt

# O actualizar si ya tienes las dependencias
pip install python-dotenv --upgrade
```

### Frontend
```bash
# Las dependencias del frontend ya están configuradas
npm install
```

---

## 3. Estructura de carpetas en Cloudinary

Cuando subas una foto, se guardará en:
```
medistock/perfiles/usuario_<ID>.jpg
```

Ejemplo: `medistock/perfiles/usuario_1.jpg`

---

## 4. Iniciar los servidores

### Backend
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

### Frontend
```bash
npm run dev
```

---

## 5. Probar la funcionalidad

### 5.1 Acceder a la página de perfil
1. Abre [http://localhost:5173](http://localhost:5173) en tu navegador
2. Inicia sesión con:
   - **Cédula**: 111222
   - **Contraseña**: pass123

### 5.2 Subir una foto
1. Ve a la página de perfil
2. Haz clic en "Cambiar foto de perfil"
3. Selecciona una imagen (JPG, PNG, WebP o GIF)
4. La imagen debe ser:
   - Máximo **5MB**
   - Formato válido (image/jpeg, image/png, etc.)

### 5.3 Verificar el resultado
- La foto debería aparecer en el perfil
- En Cloudinary Dashboard, deberías ver la imagen en `medistock/perfiles/`

---

## 6. Solución de problemas

### Error 503: "Servicio de almacenamiento no disponible"
**Causa**: Variables de Cloudinary no configuradas

**Solución**:
```bash
# Verifica que BackEnd/.env existe
ls BackEnd/.env

# Verifica que tiene los valores correctos
cat BackEnd/.env | grep CLOUDINARY

# Reinicia el servidor backend
python BackEnd/main.py
```

### Error 404: Ruta no encontrada
**Causa**: El servidor backend no se reinició después de los cambios

**Solución**:
```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia
python BackEnd/main.py
```

### Error 401: Token inválido
**Causa**: No estás autenticado o tu token expiró

**Solución**:
1. Cierra sesión
2. Vuelve a iniciar sesión
3. Intenta de nuevo

### La foto no se guarda en Cloudinary
**Verificar**:
1. Las credenciales de Cloudinary son correctas en `.env`
2. Cloudinary está respondiendo correctamente
3. Los logs del backend muestran el proceso de subida

```bash
# En los logs del backend deberías ver:
# Subiendo imagen de [Nombre] [Apellido] a Cloudinary...
# ✓ Imagen subida correctamente: https://res.cloudinary.com/...
```

---

## 7. Endpoints API

### POST /api/usuarios/me/foto

Sube una foto de perfil.

**Headers:**
```
Authorization: Bearer <tu_token_jwt>
Content-Type: multipart/form-data
```

**Body:**
```
file: <archivo_imagen>
```

**Respuesta exitosa (200):**
```json
{
  "id": 3,
  "cedula": "111222",
  "nombre": "Pedro",
  "apellido": "Paciente",
  "email": "paciente@medistock.com",
  "rol": "paciente",
  "eps": "EPS SANITAS",
  "telefono": null,
  "foto_url": "https://res.cloudinary.com/...",
  "activo": true,
  "creado_en": "2026-01-15T10:30:00",
  "actualizado_en": "2026-05-19T14:45:22"
}
```

**Errores:**
- `400 Bad Request`: Archivo no válido
- `401 Unauthorized`: Token inválido
- `503 Service Unavailable`: Cloudinary no configurado

---

## 8. Tamaños y límites

| Límite | Valor |
|--------|-------|
| Tamaño máximo | 5 MB |
| Formatos | JPG, PNG, WebP, GIF |
| Ancho en Cloudinary | 400px |
| Alto en Cloudinary | 400px |
| Calidad | 85% |

---

## 9. Integración con la base de datos

La foto se almacena en la columna `foto_url` de la tabla `usuarios`:

```sql
SELECT id, nombre, apellido, foto_url FROM usuarios WHERE id = 3;
```

---

## 10. Referencia Rápida

### Variables de entorno necesarias:
```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### Archivos clave:
- `BackEnd/routes/usuarios.py` - Endpoint `/me/foto`
- `BackEnd/main.py` - Carga de `.env`
- `BackEnd/.env` - Configuración local
- `BackEnd/requirements.txt` - Dependencias
- `src/pages/ProfilePage.tsx` - Frontend

---

## 11. Soporte

Si encuentras problemas:
1. Verifica los logs del servidor backend
2. Revisa la consola del navegador (F12)
3. Asegúrate de que todas las variables de entorno están configuradas
4. Intenta con una imagen más pequeña o diferente formato

---

**Última actualización**: Mayo 19, 2026
