from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario

# Configuraciones de seguridad
SECRET_KEY = "medistock-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

# Configuración de hash con bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security_http = HTTPBearer()


def hash_password(password: str) -> str:
    """
    Hashea una contraseña usando bcrypt.
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        str: Contraseña hasheada
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica que una contraseña coincida con su hash.
    
    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Contraseña hasheada
        
    Returns:
        bool: True si coinciden, False en caso contrario
    """
    return pwd_context.verify(plain_password, hashed_password)


def crear_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un JWT token.
    
    Args:
        data: Datos a incluir en el payload del token
        expires_delta: Tiempo de expiración personalizado
        
    Returns:
        str: Token JWT codificado
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verificar_token(token: str) -> dict:
    """
    Verifica y decodifica un JWT token.
    
    Args:
        token: Token JWT a verificar
        
    Returns:
        dict: Payload del token
        
    Raises:
        HTTPException: Si el token es inválido o ha expirado
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id: Optional[int] = payload.get("sub")
        
        if usuario_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    token: str,
    db: Session,
) -> Usuario:
    """
    Obtiene el usuario actual desde el token JWT.
    Función auxiliar (no es Depends).
    
    Args:
        token: Token JWT del header Authorization
        db: Sesión de base de datos
        
    Returns:
        Usuario: Objeto Usuario de la base de datos
        
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = verificar_token(token)
    usuario_id = payload.get("sub")
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    if not usuario or not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
        )
    
    return usuario


def get_current_user_depends(
    credentials: HTTPAuthorizationCredentials = Depends(security_http),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Dependency injection para obtener usuario autenticado.
    Valida el token Bearer del header Authorization.
    
    Returns:
        Usuario: Usuario autenticado
    """
    token = credentials.credentials
    return get_current_user(token, db)


def get_admin_user(
    current_user: Usuario = Depends(get_current_user_depends),
) -> Usuario:
    """
    Obtiene el usuario actual si tiene rol de admin.
    
    Args:
        current_user: Usuario actual obtenido de autenticación
        
    Returns:
        Usuario: Usuario con rol admin
        
    Raises:
        HTTPException: Si el usuario no es admin
    """
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador",
        )
    
    return current_user


def get_farmaceutico_user(
    current_user: Usuario = Depends(get_current_user_depends),
) -> Usuario:
    """
    Obtiene el usuario actual si tiene rol de farmacéutico o admin.
    
    Args:
        current_user: Usuario actual obtenido de autenticación
        
    Returns:
        Usuario: Usuario con rol farmacéutico o admin
        
    Raises:
        HTTPException: Si el usuario no es farmacéutico o admin
    """
    if current_user.rol not in ["farmaceutico", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de farmacéutico o administrador",
        )
    
    return current_user
