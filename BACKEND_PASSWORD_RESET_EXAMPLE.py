"""
Ejemplo de integración de recuperación de contraseña con EmailJS en el Backend

Este archivo muestra cómo implementar la recuperación de contraseña en FastAPI
para completar la integración con EmailJS en el frontend.

IMPORTANTE: Este es un ejemplo. Debes adaptarlo a tu estructura de BD y modelos.
"""

from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, EmailStr
import secrets
from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session

# ════════════════════════════════════════════════════════════════
# MODELOS
# ════════════════════════════════════════════════════════════════

class PasswordResetRequest(BaseModel):
    """Solicitud de restauración de contraseña"""
    email: str

class PasswordReset(BaseModel):
    """Restauración de contraseña con token"""
    token: str
    new_password: str

# ════════════════════════════════════════════════════════════════
# BASE DE DATOS - AGREGAR A TU MODELO DE USUARIO
# ════════════════════════════════════════════════════════════════

# En tu modelo Usuario (models.py), agrega estos campos:
"""
class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True)
    cedula = Column(String, unique=True)
    email = Column(String, unique=True)
    password_hash = Column(String)
    nombre = Column(String)
    apellido = Column(String)
    eps = Column(String)
    telefono = Column(String, nullable=True)
    activo = Column(Boolean, default=False)
    
    # Campos para recuperación de contraseña
    reset_token = Column(String, nullable=True, unique=True)
    reset_token_expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
"""

# ════════════════════════════════════════════════════════════════
# FUNCIONES AUXILIARES
# ════════════════════════════════════════════════════════════════

def generate_reset_token() -> str:
    """Generar token seguro para recuperación de contraseña"""
    return secrets.token_urlsafe(32)

def is_token_valid(token_expires_at: Optional[datetime]) -> bool:
    """Verificar si el token aún es válido"""
    if not token_expires_at:
        return False
    return datetime.utcnow() < token_expires_at

# ════════════════════════════════════════════════════════════════
# RUTAS - AGREGAR A tu router de autenticación
# ════════════════════════════════════════════════════════════════

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    db: Session
):
    """
    Solicitar recuperación de contraseña
    
    1. Busca el usuario por email
    2. Genera token único
    3. Guarda token en BD con expiración
    4. Devuelve mensaje de éxito
    
    NOTA: El envío del correo se hace desde el FRONTEND con EmailJS
    Este endpoint solo gestiona el token en BD.
    """
    try:
        # Buscar usuario por email
        usuario = db.query(Usuario).filter(Usuario.email == request.email).first()
        
        if not usuario:
            # NO revelar si el email existe por seguridad
            return {
                "message": "Si el email existe en nuestros registros, recibirás un correo de recuperación",
                "status": "check_email"
            }
        
        # Generar token
        reset_token = generate_reset_token()
        
        # Establecer expiración (2 horas)
        expires_at = datetime.utcnow() + timedelta(hours=2)
        
        # Guardar en BD
        usuario.reset_token = reset_token
        usuario.reset_token_expires_at = expires_at
        db.commit()
        
        # Devolver token al frontend para enviar correo con EmailJS
        return {
            "message": "Token de recuperación generado",
            "status": "success",
            "token": reset_token,
            "reset_link": f"https://tudominio.com/reset-password/{reset_token}",
            "expires_in_hours": 2
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar solicitud"
        )

@router.post("/reset-password")
async def reset_password(
    request: PasswordReset,
    db: Session
):
    """
    Restaurar contraseña usando token
    
    1. Busca usuario por token
    2. Valida que el token no haya expirado
    3. Actualiza la contraseña
    4. Invalida el token
    """
    try:
        from schemas import usuario_schemas
        from database import get_password_hash
        
        # Buscar usuario por token
        usuario = db.query(Usuario).filter(
            Usuario.reset_token == request.token
        ).first()
        
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido o expirado"
            )
        
        # Validar que el token no haya expirado
        if not is_token_valid(usuario.reset_token_expires_at):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token expirado. Solicita uno nuevo."
            )
        
        # Validar contraseña
        if len(request.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña debe tener al menos 6 caracteres"
            )
        
        # Actualizar contraseña
        usuario.password_hash = get_password_hash(request.new_password)
        usuario.reset_token = None
        usuario.reset_token_expires_at = None
        db.commit()
        
        return {
            "message": "Contraseña restaurada exitosamente",
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error en reset_password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al restaurar contraseña"
        )

@router.post("/validate-reset-token")
async def validate_reset_token(
    token: str,
    db: Session
):
    """
    Validar que un token de recuperación es válido
    """
    usuario = db.query(Usuario).filter(
        Usuario.reset_token == token
    ).first()
    
    if not usuario or not is_token_valid(usuario.reset_token_expires_at):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )
    
    return {
        "valid": True,
        "email": usuario.email,
        "expires_at": usuario.reset_token_expires_at
    }

# ════════════════════════════════════════════════════════════════
# MIGRACIONES - CREAR TABLA (si usas Alembic)
# ════════════════════════════════════════════════════════════════

"""
# En tu archivo de migración (alembic/versions/xxx_add_password_reset.py):

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('usuarios', sa.Column('reset_token', sa.String(), nullable=True))
    op.add_column('usuarios', sa.Column('reset_token_expires_at', sa.DateTime(), nullable=True))
    op.create_unique_constraint('uq_usuarios_reset_token', 'usuarios', ['reset_token'])

def downgrade():
    op.drop_constraint('uq_usuarios_reset_token', 'usuarios')
    op.drop_column('usuarios', 'reset_token_expires_at')
    op.drop_column('usuarios', 'reset_token')
"""

# ════════════════════════════════════════════════════════════════
# FLUJO COMPLETO DE RECUPERACIÓN
# ════════════════════════════════════════════════════════════════

"""
1. USUARIO - Hace clic en "¿Olvidaste tu contraseña?"
   └─> Se abre formulario de recuperación

2. USUARIO - Ingresa su email
   └─> Frontend: POST /api/auth/forgot-password
       └─> Backend: Genera token, lo guarda en BD
       └─> Backend: Devuelve token al frontend
   
3. FRONTEND - Recibe token del backend
   └─> EmailJS: Envía correo con link de recuperación
       Link: https://tudominio.com/reset-password/{token}
       └─> Correo llega al usuario

4. USUARIO - Hace clic en link del correo
   └─> Frontend: Abre página de reset-password con {token}
   └─> Frontend: Valida token con POST /api/auth/validate-reset-token
   
5. USUARIO - Ingresa nueva contraseña
   └─> Frontend: POST /api/auth/reset-password
       └─> Backend: Valida token, actualiza contraseña
       └─> Backend: Invalida token
   
6. USUARIO - Contraseña restaurada
   └─> Frontend: Redirige a login
   └─> USUARIO: Puede iniciar sesión con nueva contraseña
"""

# ════════════════════════════════════════════════════════════════
# INTEGRACIÓN CON API (src/services/api.ts)
# ════════════════════════════════════════════════════════════════

"""
// Agregar a src/services/api.ts:

export const api = {
  // ... otros métodos ...
  
  forgotPassword: (email: string) => {
    return fetcher<{ token: string; reset_link: string }>(
      '/auth/forgot-password',
      'POST',
      { email }
    );
  },

  validateResetToken: (token: string) => {
    return fetcher<{ valid: boolean; email: string }>(
      '/auth/validate-reset-token',
      'POST',
      { token }
    );
  },

  resetPassword: (token: string, newPassword: string) => {
    return fetcher<{ message: string }>(
      '/auth/reset-password',
      'POST',
      { token, new_password: newPassword }
    );
  },
};
"""

# ════════════════════════════════════════════════════════════════
# SEGURIDAD - CONSIDERACIONES
# ════════════════════════════════════════════════════════════════

"""
1. RATE LIMITING: Limita intentos de solicitud de reset
   - Máximo 3 solicitudes por email cada 5 minutos
   - Implementar con Redis o similar

2. TOKENS: Usa tokens seguros
   - secrets.token_urlsafe(32) ✓
   - NO usar UUIDs o números simples ✗

3. EXPIRACIÓN: Los tokens deben expirar
   - Por defecto: 2 horas
   - Considera 1 hora para mayor seguridad

4. VALIDACIÓN: Valida todo en backend
   - Longitud mínima de contraseña
   - Caracteres especiales recomendados
   - NO reutilizar contraseña anterior

5. AUDITORÍA: Registra cambios de contraseña
   - Logging de acceso a reset
   - Email de confirmación de cambio

6. COMUNICACIÓN: Usa HTTPS siempre
   - Los links en correos deben ser HTTPS
   - Datos sensibles en POST, no GET
"""
