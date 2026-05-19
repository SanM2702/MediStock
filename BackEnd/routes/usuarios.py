from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional

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
