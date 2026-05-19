from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
import secrets

from database import get_db
from models import Usuario
from schemas import (
    UsuarioResponse,
    UsuarioRegistro,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from auth import (
    hash_password,
    verify_password,
    crear_token,
    crear_token_scoped,
    verificar_token_scoped,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

# Tokens cortos por flujo
ACTIVATION_TOKEN_TTL_MIN = 60 * 24 * 2  # 48 h
RESET_TOKEN_TTL_MIN = 60                # 1 h

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
    """
    usuario = db.query(Usuario).filter(Usuario.cedula == cedula).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cédula o contraseña incorrectos",
        )

    if not verify_password(password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cédula o contraseña incorrectos",
        )

    if not usuario.activo:
        # ADVERTENCIA: Usuario no activado pero permitimos el login en desarrollo.
        # En producción, cambiar status_code a 403 y lanzar HTTPException.
        print(f"[ADVERTENCIA] Usuario {usuario.id} intentó login sin activar cuenta")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta aún no está activada. Revisa tu correo para activarla.",
        )

    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = crear_token(
        data={"sub": usuario.id},
        expires_delta=expires_delta,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": UsuarioResponse.model_validate(usuario).model_dump(),
    }


@router.post("/registro")
def registro(
    datos: UsuarioRegistro,
    db: Session = Depends(get_db),
):
    """
    Registra un nuevo usuario. La cuenta nace INACTIVA hasta que el usuario
    confirma su correo desde el enlace de activación.

    Retorna:
    - **codigo_activacion**: código corto (6 caracteres) para activar la cuenta.
      El frontend lo incluye en el enlace: http://localhost:5173/activar/{codigo}
    - **usuario**: datos básicos del usuario recién creado.
    """
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

    # Generar código único de 6 caracteres
    codigo_activacion = secrets.token_urlsafe(6)
    
    # Validar que el código sea único (muy raro que se repita, pero por seguridad)
    while db.query(Usuario).filter(Usuario.codigo_activacion == codigo_activacion).first():
        codigo_activacion = secrets.token_urlsafe(6)

    nuevo_usuario = Usuario(
        cedula=datos.cedula,
        nombre=datos.nombre,
        apellido=datos.apellido,
        email=datos.email,
        eps=datos.eps,
        hashed_password=hash_password(datos.password),
        rol="paciente",
        activo=False,
        codigo_activacion=codigo_activacion,
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return {
        "codigo_activacion": codigo_activacion,
        "usuario": UsuarioResponse.model_validate(nuevo_usuario).model_dump(),
    }


@router.post("/activar/{codigo}")
def activar_cuenta(
    codigo: str,
    db: Session = Depends(get_db),
):
    """
    Activa una cuenta a partir del código recibido por correo.
    Idempotente: si la cuenta ya estaba activa, devuelve éxito igual.
    """
    try:
        # Buscar el usuario por código de activación
        usuario = db.query(Usuario).filter(Usuario.codigo_activacion == codigo).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Código de activación inválido o no encontrado",
            )

        # Activar la cuenta si no está ya activada
        if not usuario.activo:
            usuario.activo = True
            usuario.codigo_activacion = None  # Limpiar el código después de usarlo
            db.commit()
            db.refresh(usuario)

        return {
            "message": "Cuenta activada correctamente",
            "usuario": UsuarioResponse.model_validate(usuario).model_dump(),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error inesperado en /activar: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error activando la cuenta: {str(e)}",
        )


@router.post("/forgot-password")
def forgot_password(
    datos: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Genera un token de reseteo de contraseña.

    El frontend envía el correo con EmailJS usando el `reset_token` retornado.
    Por seguridad, esto idealmente se enviaría desde el servidor; el cliente
    queda expuesto al token devuelto. Aceptable para un entorno académico.
    """
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario:
        # Para no filtrar qué emails existen, podríamos siempre devolver 200.
        # Pero como el envío del correo lo hace el cliente con EmailJS,
        # necesitamos indicarle si hay token o no.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos una cuenta con ese correo.",
        )

    reset_token = crear_token_scoped(
        usuario_id=usuario.id,
        scope="reset",
        ttl_minutes=RESET_TOKEN_TTL_MIN,
    )

    return {
        "reset_token": reset_token,
        "nombre": usuario.nombre,
    }


@router.post("/reset-password")
def reset_password(
    datos: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Establece una nueva contraseña usando el token recibido por correo."""
    usuario_id = verificar_token_scoped(datos.token, scope_esperado="reset")

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    usuario.hashed_password = hash_password(datos.password)
    db.commit()

    return {"message": "Contraseña actualizada correctamente"}


@router.get("/me", response_model=UsuarioResponse)
def obtener_usuario_actual(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Obtiene la información del usuario autenticado.
    Requiere un JWT token válido en el header Authorization.
    """
    token = credentials.credentials
    try:
        usuario = get_current_user(token=token, db=db)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return usuario
