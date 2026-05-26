"""
Módulo de Agendamiento de Turnos
Endpoints para redes farmacéuticas, sedes, slots disponibles y gestión de turnos.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from datetime import date, datetime, timedelta, time

from database import get_db
from models import RedFarmaceutica, SedeFarmaceutica, EpsRedConvenio, Turno, Usuario
from auth import get_current_user_depends

router = APIRouter(
    prefix="/api/turnos",
    tags=["turnos"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────────────────────────────────────

class RedFarmaceuticaResponse(BaseModel):
    id: int
    nombre: str
    slug: str
    logo_url: Optional[str] = None
    activo: bool

    class Config:
        from_attributes = True

class SedeFarmaceuticaResponse(BaseModel):
    id: int
    red_id: int
    nombre: str
    municipio: str
    direccion: str
    telefono: Optional[str] = None
    horario_apertura: str
    horario_cierre: str
    atiende_sabado: bool
    atiende_domingo: bool
    horario_sabado_apertura: Optional[str] = None
    horario_sabado_cierre: Optional[str] = None
    activo: bool

    class Config:
        from_attributes = True

class SlotResponse(BaseModel):
    hora: str
    disponible: bool

class TurnoCreate(BaseModel):
    sede_id: int
    eps_solicitante: str
    numero_afiliado: Optional[str] = None
    fecha: date
    hora_inicio: str
    hora_fin: str
    medicamentos: Optional[List[Dict[str, Any]]] = None
    notas: Optional[str] = None

class TurnoResponse(BaseModel):
    id: int
    usuario_id: int
    sede_id: int
    eps_solicitante: str
    numero_afiliado: Optional[str] = None
    fecha: date
    hora_inicio: str
    hora_fin: str
    codigo_turno: str
    estado: str
    medicamentos_json: Optional[str] = None
    notas: Optional[str] = None
    creado_en: datetime
    sede: Optional[SedeFarmaceuticaResponse] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/redes", response_model=List[RedFarmaceuticaResponse])
def get_redes(db: Session = Depends(get_db)):
    """Lista todas las redes farmacéuticas activas."""
    return db.query(RedFarmaceutica).filter(RedFarmaceutica.activo == True).all()

@router.get("/eps/{eps_nombre}/redes", response_model=List[RedFarmaceuticaResponse])
def get_redes_por_eps(eps_nombre: str, db: Session = Depends(get_db)):
    """Devuelve las redes que atienden una EPS en Cundinamarca."""
    # Búsqueda insensible a mayúsculas/minúsculas y espacios
    query = (
        db.query(RedFarmaceutica)
        .join(EpsRedConvenio, EpsRedConvenio.red_id == RedFarmaceutica.id)
        .filter(
            func.lower(EpsRedConvenio.eps_nombre) == eps_nombre.lower().strip(),
            RedFarmaceutica.activo == True
        )
    )
    return query.all()

@router.get("/sedes", response_model=List[SedeFarmaceuticaResponse])
def get_sedes(
    red_id: Optional[int] = Query(None),
    municipio: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Lista sedes filtradas por red y/o municipio.
    Si se busca por Cogua, Sopó, Tabio, Tenjo, Cajicá y no hay sede directa,
    se devuelven las sedes de remisión según corresponda.
    """
    query = db.query(SedeFarmaceutica).filter(SedeFarmaceutica.activo == True)
    
    if red_id is not None:
        query = query.filter(SedeFarmaceutica.red_id == red_id)
        
    if municipio:
        mun_norm = municipio.strip().lower()
        # Mapeo de remisiones específicas para Sabana Centro
        if mun_norm in ["cogua", "sopó", "sopo"]:
            # Remiten a Zipaquirá
            query = query.filter(
                (func.lower(SedeFarmaceutica.municipio) == mun_norm) |
                (func.lower(SedeFarmaceutica.municipio) == "zipaquirá") |
                (func.lower(SedeFarmaceutica.municipio) == "zipaquira")
            )
        elif mun_norm in ["tabio", "tenjo", "cajicá", "cajica"]:
            # Remiten a Chía
            query = query.filter(
                (func.lower(SedeFarmaceutica.municipio) == mun_norm) |
                (func.lower(SedeFarmaceutica.municipio) == "chía") |
                (func.lower(SedeFarmaceutica.municipio) == "chia")
            )
        else:
            query = query.filter(func.lower(SedeFarmaceutica.municipio) == mun_norm)
            
    return query.all()

@router.get("/slots", response_model=List[SlotResponse])
def get_slots(sede_id: int, fecha: date, db: Session = Depends(get_db)):
    """
    Genera slots de 15 minutos disponibles para esa fecha en base al horario de la sede,
    excluyendo slots ya ocupados por turnos confirmados/pendientes.
    """
    sede = db.query(SedeFarmaceutica).filter(SedeFarmaceutica.id == sede_id, SedeFarmaceutica.activo == True).first()
    if not sede:
        raise HTTPException(status_code=404, detail="Sede farmacéutica no encontrada o inactiva")

    # Determinar horario de apertura y cierre para el día de la semana
    dia_semana = fecha.weekday() # 0 = Lunes, 5 = Sábado, 6 = Domingo
    
    apertura_str = None
    cierre_str = None
    
    if dia_semana == 6: # Domingo
        if not sede.atiende_domingo:
            return []
        apertura_str = sede.horario_apertura
        cierre_str = sede.horario_cierre
    elif dia_semana == 5: # Sábado
        if not sede.atiende_sabado:
            return []
        apertura_str = sede.horario_sabado_apertura or sede.horario_apertura
        cierre_str = sede.horario_sabado_cierre or sede.horario_cierre
    else: # Lunes a Viernes
        apertura_str = sede.horario_apertura
        cierre_str = sede.horario_cierre

    if not apertura_str or not cierre_str:
        return []

    # Generar todos los slots de 15 minutos
    try:
        h_ap, m_ap = map(int, apertura_str.split(":"))
        h_ci, m_ci = map(int, cierre_str.split(":"))
    except ValueError:
        h_ap, m_ap = 7, 0
        h_ci, m_ci = 19, 0

    slots_generados = []
    start_dt = datetime.combine(fecha, time(h_ap, m_ap))
    
    # Manejar cierre de 24h
    if h_ci == 23 and m_ci == 59:
        end_dt = datetime.combine(fecha, time(23, 45))
    else:
        end_dt = datetime.combine(fecha, time(h_ci, m_ci))

    current_dt = start_dt
    while current_dt < end_dt:
        hora_inicio = current_dt.strftime("%H:%M")
        slots_generados.append(hora_inicio)
        current_dt += timedelta(minutes=15)

    # Buscar turnos ya ocupados para esta sede y fecha
    turnos_ocupados = (
        db.query(Turno.hora_inicio)
        .filter(
            Turno.sede_id == sede_id,
            Turno.fecha == fecha,
            Turno.estado.in_(["pendiente", "confirmado"])
        )
        .all()
    )
    horas_ocupadas = {t.hora_inicio for t in turnos_ocupados}

    # Deshabilitar slots pasados si la fecha es hoy
    hoy = date.today()
    ahora = datetime.now()
    
    slots_finales = []
    for h in slots_generados:
        disponible = h not in horas_ocupadas
        
        # Validación de hora en el pasado
        if disponible and fecha == hoy:
            h_h, h_m = map(int, h.split(":"))
            slot_time = datetime.combine(fecha, time(h_h, h_m))
            if slot_time <= ahora:
                disponible = False
                
        slots_finales.append(SlotResponse(hora=h, disponible=disponible))

    return slots_finales

@router.post("", response_model=TurnoResponse, status_code=201)
def crear_turno(
    turno_data: TurnoCreate,
    current_user: Usuario = Depends(get_current_user_depends),
    db: Session = Depends(get_db)
):
    """
    Crea un turno nuevo.
    Genera un codigo_turno único de formato: MS-{año}-{id:04d}
    """
    # Verificar que la sede exista
    sede = db.query(SedeFarmaceutica).filter(SedeFarmaceutica.id == turno_data.sede_id, SedeFarmaceutica.activo == True).first()
    if not sede:
        raise HTTPException(status_code=404, detail="Sede farmacéutica no encontrada o inactiva")

    # Verificar disponibilidad del slot
    turno_existente = db.query(Turno).filter(
        Turno.sede_id == turno_data.sede_id,
        Turno.fecha == turno_data.fecha,
        Turno.hora_inicio == turno_data.hora_inicio,
        Turno.estado.in_(["pendiente", "confirmado"])
    ).first()
    if turno_existente:
        raise HTTPException(status_code=400, detail="El horario seleccionado ya no está disponible.")

    # Guardar en base de datos
    nuevo_turno = Turno(
        usuario_id=current_user.id,
        sede_id=turno_data.sede_id,
        eps_solicitante=turno_data.eps_solicitante,
        numero_afiliado=turno_data.numero_afiliado,
        fecha=turno_data.fecha,
        hora_inicio=turno_data.hora_inicio,
        hora_fin=turno_data.hora_fin,
        codigo_turno="TEMP", # Código temporal que se reemplazará al obtener el id
        estado="pendiente",
        medicamentos_json=json.dumps(turno_data.medicamentos) if turno_data.medicamentos else None,
        notas=turno_data.notas
    )

    db.add(nuevo_turno)
    db.flush() # Obtener el id auto-incremental de la base de datos

    # Generar código final
    nuevo_turno.codigo_turno = f"MS-{turno_data.fecha.year}-{nuevo_turno.id:04d}"
    db.commit()
    db.refresh(nuevo_turno)

    return nuevo_turno

@router.get("/mis-turnos", response_model=List[TurnoResponse])
def get_mis_turnos(
    current_user: Usuario = Depends(get_current_user_depends),
    db: Session = Depends(get_db)
):
    """Devuelve los turnos del usuario autenticado ordenados por fecha descendente."""
    return (
        db.query(Turno)
        .filter(Turno.usuario_id == current_user.id)
        .order_by(Turno.fecha.desc(), Turno.hora_inicio.desc())
        .all()
    )

@router.delete("/{id}", status_code=204)
def cancelar_turno(
    id: int,
    current_user: Usuario = Depends(get_current_user_depends),
    db: Session = Depends(get_db)
):
    """Cancela un turno del usuario (cambia su estado a 'cancelado')."""
    turno = db.query(Turno).filter(Turno.id == id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
        
    if turno.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para cancelar este turno")

    turno.estado = "cancelado"
    db.commit()
    return
