from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import Index, ForeignKey, String, Integer, Float, Boolean, DateTime, Numeric, Date, Time, Table, Column, Text
from datetime import datetime, date, time
from decimal import Decimal
from typing import Optional, List


class Base(DeclarativeBase):
    """Base class para todos los modelos ORM"""
    pass


class Usuario(Base):
    """Modelo de Usuario - Pacientes, Farmacéuticos y Administradores"""
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cedula: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100))
    apellido: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    rol: Mapped[str] = mapped_column(String(20))  # paciente, farmaceutico, admin
    eps: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    telefono: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    foto_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # URL de foto de perfil en Cloudinary
    hashed_password: Mapped[str] = mapped_column(String(255))
    activo: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    codigo_activacion: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, unique=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Usuario(id={self.id}, cedula={self.cedula}, nombre={self.nombre})>"


class Medicamento(Base):
    """Modelo de Medicamento"""
    __tablename__ = "medicamentos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(200), index=True)
    nombre_generico: Mapped[str] = mapped_column(String(200))
    laboratorio: Mapped[str] = mapped_column(String(150))
    categoria: Mapped[str] = mapped_column(String(100), index=True)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    unidad: Mapped[str] = mapped_column(String(50))  # mg, ml, comprimido, etc.
    icono: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) # Emojis
    requiere_formula: Mapped[bool] = mapped_column(Boolean, default=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación con Inventario
    inventarios: Mapped[List["Inventario"]] = relationship(
        "Inventario",
        back_populates="medicamento",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Medicamento(id={self.id}, nombre={self.nombre}, laboratorio={self.laboratorio})>"


class Farmacia(Base):
    """Modelo de Farmacia"""
    __tablename__ = "farmacias"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), index=True)
    municipio: Mapped[str] = mapped_column(String(100), index=True)
    direccion: Mapped[str] = mapped_column(String(255))
    telefono: Mapped[str] = mapped_column(String(20))
    horario_apertura: Mapped[str] = mapped_column(String(10))  # HH:MM
    horario_cierre: Mapped[str] = mapped_column(String(10))    # HH:MM
    eps_convenio: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación con Inventario
    inventarios: Mapped[List["Inventario"]] = relationship(
        "Inventario",
        back_populates="farmacia",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Farmacia(id={self.id}, nombre={self.nombre}, municipio={self.municipio})>"


class Inventario(Base):
    """Modelo de Inventario - Stock de medicamentos en farmacias"""
    __tablename__ = "inventario"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    medicamento_id: Mapped[int] = mapped_column(ForeignKey("medicamentos.id"), index=True)
    farmacia_id: Mapped[int] = mapped_column(ForeignKey("farmacias.id"), index=True)
    stock: Mapped[int] = mapped_column()
    estado: Mapped[str] = mapped_column(String(20))  # disponible, limitado, agotado
    lote: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    fecha_vencimiento: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ultima_actualizacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    medicamento: Mapped["Medicamento"] = relationship("Medicamento", back_populates="inventarios")
    farmacia: Mapped["Farmacia"] = relationship("Farmacia", back_populates="inventarios")

    def __repr__(self):
        return f"<Inventario(medicamento_id={self.medicamento_id}, farmacia_id={self.farmacia_id}, stock={self.stock})>"


class SesionRed(Base):
    """Modelo de Sesión de Red - Monitoreo de conexiones y rendimiento"""
    __tablename__ = "sesiones_red"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    latencia_ms: Mapped[float] = mapped_column()
    cpu_percent: Mapped[float] = mapped_column()
    bytes_enviados: Mapped[int] = mapped_column()
    bytes_recibidos: Mapped[int] = mapped_column()
    conexiones_activas: Mapped[int] = mapped_column()

    def __repr__(self):
        return f"<SesionRed(id={self.id}, timestamp={self.timestamp}, latencia_ms={self.latencia_ms})>"


class HistorialConsulta(Base):
    """Modelo de Historial de Consultas de Medicamentos"""
    __tablename__ = "historial_consultas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    medicamento_id: Mapped[int] = mapped_column(ForeignKey("medicamentos.id"), index=True)
    fecha_consulta: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Relaciones
    usuario: Mapped["Usuario"] = relationship("Usuario")
    medicamento: Mapped["Medicamento"] = relationship("Medicamento")

    def __repr__(self):
        return f"<HistorialConsulta(usuario_id={self.usuario_id}, medicamento_id={self.medicamento_id}, fecha={self.fecha_consulta})>"


class AlertaStock(Base):
    """Modelo de Alertas de Stock"""
    __tablename__ = "alertas_stock"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    inventario_id: Mapped[int] = mapped_column(ForeignKey("inventario.id"), index=True)
    tipo_alerta: Mapped[str] = mapped_column(String(20))  # stock_bajo, agotado, vencimiento_proximo
    mensaje: Mapped[str] = mapped_column(String(500))
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    resuelta: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_resolucion: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relaciones
    inventario: Mapped["Inventario"] = relationship("Inventario")

    def __repr__(self):
        return f"<AlertaStock(inventario_id={self.inventario_id}, tipo={self.tipo_alerta}, resuelta={self.resuelta})>"


class Notificacion(Base):
    """Modelo de Notificaciones para Usuarios"""
    __tablename__ = "notificaciones"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    titulo: Mapped[str] = mapped_column(String(200))
    mensaje: Mapped[str] = mapped_column(String(1000))
    tipo: Mapped[str] = mapped_column(String(50))  # info, warning, success, error
    leida: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    fecha_lectura: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relaciones
    usuario: Mapped["Usuario"] = relationship("Usuario")

    def __repr__(self):
        return f"<Notificacion(usuario_id={self.usuario_id}, titulo={self.titulo}, leida={self.leida})>"


# ==================== MÓDULO AUDIFARMA — AGENDAMIENTO DE TURNOS ====================


class EPS(Base):
    """Catálogo de EPS disponibles en el sistema"""
    __tablename__ = "eps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    codigo: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, unique=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relaciones
    # Relaciones (Comentadas para evitar error de mapeo con nuevo Turno)
    # turnos: Mapped[List["Turno"]] = relationship("Turno", back_populates="eps_obj")

    def __repr__(self):
        return f"<EPS(id={self.id}, nombre={self.nombre})>"


class HorarioDisponible(Base):
    """Franjas horarias disponibles para agendamiento en cada farmacia"""
    __tablename__ = "horarios_disponibles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    farmacia_id: Mapped[int] = mapped_column(ForeignKey("farmacias.id"), index=True)
    fecha: Mapped[date] = mapped_column(Date, index=True)
    hora_inicio: Mapped[time] = mapped_column(Time)
    hora_fin: Mapped[time] = mapped_column(Time)
    capacidad_maxima: Mapped[int] = mapped_column(Integer, default=1)
    turnos_agendados: Mapped[int] = mapped_column(Integer, default=0)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relaciones
    farmacia: Mapped["Farmacia"] = relationship("Farmacia")
    # turnos: Mapped[List["Turno"]] = relationship("Turno", back_populates="horario")

    def __repr__(self):
        return (
            f"<HorarioDisponible(farmacia_id={self.farmacia_id}, "
            f"fecha={self.fecha}, hora={self.hora_inicio})>"
        )


# ==================== MÓDULO REDES Y TURNOS ACTUALIZADOS ====================

class RedFarmaceutica(Base):
    __tablename__ = "redes_farmaceuticas"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    # audifarma, cruz_verde, colsubsidio, cafam, farmatodo
    slug: Mapped[str] = mapped_column(String(50), unique=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    sedes: Mapped[List["SedeFarmaceutica"]] = relationship(back_populates="red")

class SedeFarmaceutica(Base):
    __tablename__ = "sedes_farmaceuticas"
    id: Mapped[int] = mapped_column(primary_key=True)
    red_id: Mapped[int] = mapped_column(ForeignKey("redes_farmaceuticas.id"))
    nombre: Mapped[str] = mapped_column(String(200))
    municipio: Mapped[str] = mapped_column(String(100))
    direccion: Mapped[str] = mapped_column(String(200))
    telefono: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    horario_apertura: Mapped[str] = mapped_column(String(5))  # "07:00"
    horario_cierre: Mapped[str] = mapped_column(String(5))   # "19:00"
    atiende_sabado: Mapped[bool] = mapped_column(Boolean, default=True)
    atiende_domingo: Mapped[bool] = mapped_column(Boolean, default=False)
    horario_sabado_apertura: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    horario_sabado_cierre: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    red: Mapped["RedFarmaceutica"] = relationship(back_populates="sedes")
    turnos: Mapped[List["Turno"]] = relationship(back_populates="sede")

class EpsRedConvenio(Base):
    __tablename__ = "eps_red_convenio"
    id: Mapped[int] = mapped_column(primary_key=True)
    eps_nombre: Mapped[str] = mapped_column(String(100))
    red_id: Mapped[int] = mapped_column(ForeignKey("redes_farmaceuticas.id"))
    es_principal: Mapped[bool] = mapped_column(Boolean, default=True)

class Turno(Base):
    __tablename__ = "turnos"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    sede_id: Mapped[int] = mapped_column(ForeignKey("sedes_farmaceuticas.id"))
    eps_solicitante: Mapped[str] = mapped_column(String(100))
    numero_afiliado: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    fecha: Mapped[date] = mapped_column(Date)
    hora_inicio: Mapped[str] = mapped_column(String(5))  # "09:00"
    hora_fin: Mapped[str] = mapped_column(String(5))     # "09:15"
    codigo_turno: Mapped[str] = mapped_column(String(20), unique=True)
    estado: Mapped[str] = mapped_column(String(20), default="pendiente")
    # pendiente, confirmado, cancelado, completado
    medicamentos_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notas: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    usuario: Mapped["Usuario"] = relationship()
    sede: Mapped["SedeFarmaceutica"] = relationship(back_populates="turnos")
