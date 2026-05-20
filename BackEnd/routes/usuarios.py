from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import cloudinary
import cloudinary.uploader
from io import BytesIO

from database import get_db
from models import Usuario
from schemas import (
    UsuarioResponse,
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioProfileUpdate,
    ChangePasswordRequest,
)
from auth import get_current_user, hash_password, verify_password

router = APIRouter(
    prefix="/api/usuarios",
    tags=["usuarios"],
)

security = HTTPBearer()

# Configurar Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


def _require_admin(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
) -> Usuario:
    """Valida el token y exige rol admin. Devuelve el usuario actual."""
    try:
        usuario_actual = get_current_user(token=credentials.credentials, db=db)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador",
        )

    return usuario_actual


# ==================== ENDPOINTS DE PERFIL DEL USUARIO ====================

@router.get("/me", response_model=UsuarioResponse)
def obtener_perfil(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Obtiene el perfil del usuario autenticado.
    GET /api/usuarios/me
    """
    try:
        usuario = get_current_user(token=credentials.credentials, db=db)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return usuario


@router.put("/me", response_model=UsuarioResponse)
def actualizar_perfil(
    datos: UsuarioProfileUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Actualiza el perfil del usuario autenticado.
    El usuario solo puede actualizar: nombre, apellido, email, eps, telefono.
    PUT /api/usuarios/me
    """
    try:
        usuario = get_current_user(token=credentials.credentials, db=db)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    update_data = datos.model_dump(exclude_unset=True)
    
    # Validar email único si se está cambiando
    if "email" in update_data:
        email_existente = db.query(Usuario).filter(
            Usuario.email == update_data["email"],
            Usuario.id != usuario.id,
        ).first()
        if email_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un usuario con ese email",
            )
    
    for campo, valor in update_data.items():
        setattr(usuario, campo, valor)
    
    db.commit()
    db.refresh(usuario)
    
    return usuario


@router.put("/me/password")
def cambiar_contrasena(
    datos: ChangePasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Cambia la contraseña del usuario autenticado.
    Requiere la contraseña actual como validación.
    PUT /api/usuarios/me/password
    """
    try:
        usuario = get_current_user(token=credentials.credentials, db=db)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar que la contraseña actual es correcta
    if not verify_password(datos.password_actual, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña actual incorrecta",
        )
    
    # Validar que la nueva contraseña sea diferente
    if datos.password_actual == datos.password_nueva:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente a la actual",
        )
    
    # Actualizar contraseña
    usuario.hashed_password = hash_password(datos.password_nueva)
    db.commit()
    db.refresh(usuario)
    
    return {
        "message": "Contraseña actualizada exitosamente",
        "usuario": UsuarioResponse.model_validate(usuario),
    }


@router.post("/me/foto", response_model=UsuarioResponse)
async def subir_foto_perfil(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Sube una foto de perfil a Cloudinary y la asocia al usuario.
    
    POST /api/usuarios/me/foto
    
    Parámetros:
    - file: Archivo de imagen (JPG, PNG, WebP, máx 5MB)
    
    Retorna:
    - UsuarioResponse con foto_url actualizada
    
    Errores:
    - 401: Token inválido o expirado
    - 400: Archivo no válido o muy grande
    - 500: Error al procesar imagen
    """
    # 1. Validar autenticación
    try:
        usuario = get_current_user(token=credentials.credentials, db=db)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Validar que sea una imagen
    TIPOS_VALIDOS = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
    if not file.content_type or file.content_type not in TIPOS_VALIDOS:
        tipos_aceptados = ", ".join(TIPOS_VALIDOS)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no válido. Acepta: {tipos_aceptados}. Recibido: {file.content_type}",
        )
    
    # 3. Validar nombre del archivo
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe tener un nombre",
        )
    
    # 4. Validar tamaño máximo (5MB)
    MAX_SIZE = 5 * 1024 * 1024  # 5MB
    contenido = await file.read()
    
    if len(contenido) > MAX_SIZE:
        tamaño_mb = len(contenido) / 1024 / 1024
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La imagen no puede superar 5MB. Tamaño actual: {tamaño_mb:.2f}MB",
        )
    
    # 5. Resetear el pointer del archivo para lectura posterior
    await file.seek(0)
    
    # 6. Verificar que Cloudinary esté configurado
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    
    if not cloud_name or not api_key or not api_secret:
        print("⚠️  ADVERTENCIA: Cloudinary no está configurado correctamente")
        print(f"   CLOUDINARY_CLOUD_NAME: {'✓' if cloud_name else '✗'}")
        print(f"   CLOUDINARY_API_KEY: {'✓' if api_key else '✗'}")
        print(f"   CLOUDINARY_API_SECRET: {'✓' if api_secret else '✗'}")
        
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de almacenamiento de imágenes no disponible. "
                   "Por favor, contacta con el administrador.",
        )
    
    try:
        # 7. Subir a Cloudinary
        print(f"Subiendo imagen de {usuario.nombre} {usuario.apellido} a Cloudinary...")
        
        # Convertir bytes a BytesIO para Cloudinary
        file_obj = BytesIO(contenido)
        
        upload_result = cloudinary.uploader.upload(
            file_obj,
            folder="medistock/perfiles",
            public_id=f"usuario_{usuario.id}",
            overwrite=True,
            crop="limit",
            width=400,
            height=400,
            quality=85,
            resource_type="auto",
        )
        
        # 8. Actualizar usuario con la URL
        foto_url = upload_result.get("secure_url")
        if not foto_url:
            raise ValueError("No se obtuvo URL segura de Cloudinary")
        
        usuario.foto_url = foto_url
        db.commit()
        db.refresh(usuario)
        
        print(f"✓ Imagen subida correctamente: {foto_url}")
        return usuario
        
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        print(f"❌ Error al subir imagen a Cloudinary: {error_msg}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la imagen: {error_msg}",
        )


# ==================== ENDPOINTS DE ADMINISTRACIÓN ====================
@router.get("", response_model=List[UsuarioResponse])
def listar_usuarios(
    rol: Optional[str] = None,
    eps: Optional[str] = None,
    activo: Optional[bool] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Lista todos los usuarios del sistema. Requiere rol admin.
    """
    _require_admin(credentials, db)

    query = db.query(Usuario)

    if rol:
        query = query.filter(Usuario.rol == rol)
    if eps:
        query = query.filter(Usuario.eps == eps)
    if activo is not None:
        query = query.filter(Usuario.activo == activo)

    return query.all()


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    datos: UsuarioCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Crea un usuario con el rol indicado. Requiere rol admin.
    A diferencia de /auth/registro, este endpoint permite asignar cualquier rol.
    """
    _require_admin(credentials, db)

    if db.query(Usuario).filter(Usuario.cedula == datos.cedula).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con esa cédula",
        )

    if db.query(Usuario).filter(Usuario.email == datos.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese email",
        )

    nuevo = Usuario(
        cedula=datos.cedula,
        nombre=datos.nombre,
        apellido=datos.apellido,
        email=datos.email,
        rol=datos.rol,
        eps=datos.eps,
        hashed_password=hash_password(datos.password),
        activo=True,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(
    usuario_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Obtiene un usuario por ID. Requiere rol admin."""
    _require_admin(credentials, db)

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return usuario


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    datos: UsuarioUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Actualiza un usuario existente. Requiere rol admin."""
    _require_admin(credentials, db)

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    update_data = datos.model_dump(exclude_unset=True)

    if "email" in update_data:
        email_existente = db.query(Usuario).filter(
            Usuario.email == update_data["email"],
            Usuario.id != usuario_id,
        ).first()
        if email_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un usuario con ese email",
            )

    if "password" in update_data:
        usuario.hashed_password = hash_password(update_data.pop("password"))

    for campo, valor in update_data.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)

    return usuario


@router.delete("/{usuario_id}")
def eliminar_usuario(
    usuario_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Elimina un usuario del sistema. Requiere rol admin."""
    usuario_actual = _require_admin(credentials, db)

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if usuario.id == usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario",
        )

    db.delete(usuario)
    db.commit()

    return {"message": "Usuario eliminado exitosamente"}
