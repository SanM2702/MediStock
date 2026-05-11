from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta

from database import get_db
from models import Usuario
from schemas import UsuarioResponse
from auth import (
    hash_password,
    verify_password,
    crear_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["autenticación"],
)

security = HTTPBearer()


@router.post("/login")
def login(
    cedula: str,
    password: str,
    db: Session = Depends(get_db),
):
    """
    Inicia sesión con cédula y contraseña.
    Retorna un JWT token válido por 480 minutos.
    
    Parámetros:
    - **cedula**: Cédula del usuario
    - **password**: Contraseña en texto plano
    
    Retorna:
    - **access_token**: JWT token para usar en Authorization header
    - **token_type**: Tipo de token (Bearer)
    - **usuario**: Información del usuario autenticado
    """
    # Buscar usuario por cédula
    usuario = db.query(Usuario).filter(Usuario.cedula == cedula).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cédula o contraseña incorrectos",
        )
    
    # Verificar contraseña
    if not verify_password(password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cédula o contraseña incorrectos",
        )
    
    # Verificar que el usuario está activo
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )
    
    # Crear JWT token
    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = crear_token(
        data={"sub": usuario.id},
        expires_delta=expires_delta,
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": UsuarioResponse.model_validate(usuario),
    }


@router.get("/me", response_model=UsuarioResponse)
def obtener_usuario_actual(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Obtiene la información del usuario autenticado.
    Requiere un JWT token válido en el header Authorization.
    
    Header:
    - **Authorization**: Bearer {token}
    
    Retorna:
    - Información completa del usuario autenticado
    """
    token = credentials.credentials
    
    # Verificar token y obtener usuario
    try:
        usuario = get_current_user(token=token, db=db)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return usuario
