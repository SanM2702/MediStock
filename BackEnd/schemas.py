from pydantic import BaseModel, Field, field_validator, ConfigDict, model_validator
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal
import re


# ==================== USUARIO SCHEMAS ====================


class UsuarioBase(BaseModel):
    """Schema base para Usuario"""
    cedula: str = Field(..., min_length=1, max_length=50)
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., description="Email del usuario")
    rol: str = Field(..., description="paciente, farmaceutico o admin")
    eps: Optional[str] = Field(None, max_length=100)

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Email inválido')
        return v

    @field_validator('rol')
    @classmethod
    def validate_rol(cls, v: str) -> str:
        if v not in ['paciente', 'farmaceutico', 'admin']:
            raise ValueError('El rol debe ser: paciente, farmaceutico o admin')
        return v


class UsuarioCreate(UsuarioBase):
    """Schema para crear un Usuario"""
    password: str = Field(..., min_length=6, max_length=255)


class UsuarioUpdate(BaseModel):
    """Schema para actualizar un Usuario"""
    nombre: Optional[str] = Field(None, max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None)
    eps: Optional[str] = Field(None, max_length=100)
    activo: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=255)

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Email inválido')
        return v


class UsuarioResponse(UsuarioBase):
    """Schema de respuesta para Usuario"""
    id: int
    activo: bool
    creado_en: datetime
    actualizado_en: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== MEDICAMENTO SCHEMAS ====================


class MedicamentoBase(BaseModel):
    """Schema base para Medicamento"""
    nombre: str = Field(..., min_length=1, max_length=200)
    nombre_generico: str = Field(..., min_length=1, max_length=200)
    laboratorio: str = Field(..., min_length=1, max_length=150)
    categoria: str = Field(..., min_length=1, max_length=100)
    precio: Decimal = Field(..., gt=0, decimal_places=2, max_digits=10)
    unidad: str = Field(..., min_length=1, max_length=50)
    icono: Optional[str] = Field(None, max_length=20)
    requiere_formula: bool = False


class MedicamentoCreate(MedicamentoBase):
    """Schema para crear un Medicamento"""
    pass


class MedicamentoUpdate(BaseModel):
    """Schema para actualizar un Medicamento"""
    nombre: Optional[str] = Field(None, max_length=200)
    nombre_generico: Optional[str] = Field(None, max_length=200)
    laboratorio: Optional[str] = Field(None, max_length=150)
    categoria: Optional[str] = Field(None, max_length=100)
    precio: Optional[Decimal] = Field(None, gt=0, decimal_places=2, max_digits=10)
    unidad: Optional[str] = Field(None, max_length=50)
    icono: Optional[str] = Field(None, max_length=20)
    requiere_formula: Optional[bool] = None
    activo: Optional[bool] = None


class MedicamentoResponse(MedicamentoBase):
    """Schema de respuesta para Medicamento"""
    id: int
    activo: bool
    creado_en: datetime
    actualizado_en: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== FARMACIA SCHEMAS ====================


class FarmaciaBase(BaseModel):
    """Schema base para Farmacia"""
    nombre: str = Field(..., min_length=1, max_length=150)
    municipio: str = Field(..., min_length=1, max_length=100)
    direccion: str = Field(..., min_length=1, max_length=255)
    telefono: str = Field(..., min_length=1, max_length=20)
    horario_apertura: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    horario_cierre: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    eps_convenio: Optional[str] = Field(None, max_length=500)

    @field_validator('horario_apertura', 'horario_cierre')
    @classmethod
    def validate_horario(cls, v: str) -> str:
        try:
            h, m = map(int, v.split(':'))
            if not (0 <= h < 24 and 0 <= m < 60):
                raise ValueError('Hora inválida (debe estar entre 00:00 y 23:59)')
        except (ValueError, AttributeError):
            raise ValueError('Formato inválido (debe ser HH:MM)')
        return v


class FarmaciaCreate(FarmaciaBase):
    """Schema para crear una Farmacia"""
    pass


class FarmaciaUpdate(BaseModel):
    """Schema para actualizar una Farmacia"""
    nombre: Optional[str] = Field(None, max_length=150)
    municipio: Optional[str] = Field(None, max_length=100)
    direccion: Optional[str] = Field(None, max_length=255)
    telefono: Optional[str] = Field(None, max_length=20)
    horario_apertura: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    horario_cierre: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    eps_convenio: Optional[str] = Field(None, max_length=500)
    activo: Optional[bool] = None


class FarmaciaResponse(FarmaciaBase):
    """Schema de respuesta para Farmacia"""
    id: int
    activo: bool
    creado_en: datetime
    actualizado_en: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== INVENTARIO SCHEMAS ====================


class InventarioBase(BaseModel):
    """Schema base para Inventario"""
    medicamento_id: int
    farmacia_id: int
    stock: int = Field(..., ge=0)
    estado: str = Field(..., description="disponible, limitado o agotado")
    lote: Optional[str] = Field(None, max_length=100)
    fecha_vencimiento: Optional[datetime] = None

    @field_validator('estado')
    @classmethod
    def validate_estado(cls, v: str) -> str:
        if v not in ['disponible', 'limitado', 'agotado']:
            raise ValueError('El estado debe ser: disponible, limitado o agotado')
        return v


class InventarioCreate(InventarioBase):
    """Schema para crear un Inventario"""
    pass


class InventarioUpdate(BaseModel):
    """Schema para actualizar un Inventario"""
    stock: Optional[int] = Field(None, ge=0)
    estado: Optional[str] = Field(None, description="disponible, limitado o agotado")
    lote: Optional[str] = Field(None, max_length=100)

    @field_validator('estado')
    @classmethod
    def validate_estado(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ['disponible', 'limitado', 'agotado']:
            raise ValueError('El estado debe ser: disponible, limitado o agotado')
        return v


class InventarioResponse(BaseModel):
    """Schema de respuesta para Inventario con datos de farmacia aplanados"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    medicamento_id: int
    farmacia_id: int
    stock: int
    estado: str
    lote: Optional[str] = None
    fecha_vencimiento: Optional[datetime] = None
    ultima_actualizacion: Optional[datetime] = None
    precio_local: Optional[Decimal] = None
    
    # Campos aplanados de la relación farmacia
    farmacia_nombre: str = ""
    farmacia_municipio: str = ""
    farmacia_direccion: str = ""

    @model_validator(mode='before')
    @classmethod
    def aplanar_farmacia(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Si ya es un dict, aplanamos si existe la llave 'farmacia'
            f = data.get('farmacia')
            if f:
                data['farmacia_nombre'] = f.get('nombre') if isinstance(f, dict) else getattr(f, 'nombre', "")
                data['farmacia_municipio'] = f.get('municipio') if isinstance(f, dict) else getattr(f, 'municipio', "")
                data['farmacia_direccion'] = f.get('direccion') if isinstance(f, dict) else getattr(f, 'direccion', "")
            return data
        
        # Si es un objeto ORM
        if hasattr(data, 'farmacia'):
            farmacia = data.farmacia
            # Creamos un dict con los datos del objeto + los de la farmacia
            # Esto evita modificar el objeto ORM original
            result = {
                "id": data.id,
                "medicamento_id": data.medicamento_id,
                "farmacia_id": data.farmacia_id,
                "stock": data.stock,
                "estado": data.estado,
                "lote": data.lote,
                "fecha_vencimiento": data.fecha_vencimiento,
                "ultima_actualizacion": data.ultima_actualizacion,
                "precio_local": getattr(data, 'precio_local', None),
                "farmacia_nombre": farmacia.nombre if farmacia else "",
                "farmacia_municipio": farmacia.municipio if farmacia else "",
                "farmacia_direccion": farmacia.direccion if farmacia else ""
            }
            return result
        return data


class MedicamentoConInventarioResponse(MedicamentoResponse):
    """Schema de respuesta para Medicamento con su inventario"""
    inventarios: List[InventarioResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ==================== SESIÓNRED SCHEMAS ====================


class SesionRedBase(BaseModel):
    """Schema base para SesionRed"""
    latencia_ms: float = Field(..., ge=0)
    cpu_percent: float = Field(..., ge=0, le=100)
    bytes_enviados: int = Field(..., ge=0)
    bytes_recibidos: int = Field(..., ge=0)
    conexiones_activas: int = Field(..., ge=0)


class SesionRedCreate(SesionRedBase):
    """Schema para crear una SesionRed"""
    pass


class SesionRedUpdate(BaseModel):
    """Schema para actualizar una SesionRed"""
    latencia_ms: Optional[float] = Field(None, ge=0)
    cpu_percent: Optional[float] = Field(None, ge=0, le=100)
    bytes_enviados: Optional[int] = Field(None, ge=0)
    bytes_recibidos: Optional[int] = Field(None, ge=0)
    conexiones_activas: Optional[int] = Field(None, ge=0)


class SesionRedResponse(SesionRedBase):
    """Schema de respuesta para SesionRed"""
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
