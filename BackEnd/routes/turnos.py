"""
Módulo Audifarma — Agendamiento de Turnos
Endpoints para gestión de turnos, EPS y horarios disponibles.
"""

from __future__ import annotations

import random
import string
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional

from auth import get_current_user_depends, get_admin_user, get_farmaceutico_user
from database import get_db
from models import (
    EPS,
    Farmacia,
    HorarioDisponible,
    Inventario,
    Medicamento,
    Turno,
    TurnoMedicamento,
    Usuario,
)
from schemas import (
    EPSCreate,
    EPSResponse,
    HorarioDisponibleCreate,
    HorarioDisponibleResponse,
    TurnoCreate,
    TurnoEstadoUpdate,
    TurnoResponse,
)

router = APIRouter(
    prefix="/api",
    tags=["turnos"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Constantes de negocio
# ─────────────────────────────────────────────────────────────────────────────

LIMITE_TURNOS_POR_USUARIO_POR_DIA = 3
ESTADOS_VALIDOS = {"Pendiente", "Confirmado", "Cancelado", "Completado"}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers internos
# ─────────────────────────────────────────────────────────────────────────────


def _generar_codigo_turno(db: Session) -> str:
    """Genera un código único alfanumérico de 8 caracteres para el turno."""
    while True:
        codigo = "T-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        existe = db.query(Turno).filter(Turno.codigo == codigo).first()
        if not existe:
            return codigo


def _siguiente_numero_turno(db: Session, farmacia_id: int, fecha: date) -> int:
    """Devuelve el siguiente número de turno correlativo para la farmacia en la fecha dada."""
    ultimo = (
        db.query(func.max(Turno.numero_turno))
        .filter(Turno.farmacia_id == farmacia_id, Turno.fecha == fecha)
        .scalar()
    )
    return (ultimo or 0) + 1


def _eps_atendida_por_farmacia(farmacia: Farmacia, eps_nombre: str) -> bool:
    """
    Verifica si la farmacia atiende la EPS indicada.
    El campo eps_convenio es una cadena separada por comas.
    """
    if not farmacia.eps_convenio:
        return False
    convenios = [e.strip().lower() for e in farmacia.eps_convenio.split(",")]
    return eps_nombre.strip().lower() in convenios


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/farmacias  (reexportado para el módulo de turnos — sin duplicar router)
# Se usa el router existente en routes/farmacias.py; aquí sólo se exponen los
# endpoints propios del módulo de turnos.
# ─────────────────────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────────────────────
# EPS
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/eps", response_model=List[EPSResponse], summary="Listar EPS disponibles")
async def listar_eps(
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
):
    """Devuelve el catálogo de EPS registradas en el sistema."""
    query = db.query(EPS)
    if activo is not None:
        query = query.filter(EPS.activo == activo)
    return query.order_by(EPS.nombre).all()


@router.post(
    "/eps",
    response_model=EPSResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear EPS (admin)",
)
async def crear_eps(
    eps_data: EPSCreate,
    current_user: Usuario = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Crea una nueva EPS en el catálogo. Requiere rol administrador."""
    existente = db.query(EPS).filter(EPS.nombre == eps_data.nombre).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una EPS con ese nombre.",
        )
    nueva = EPS(**eps_data.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


# ─────────────────────────────────────────────────────────────────────────────
# Horarios disponibles
# ─────────────────────────────────────────────────────────────────────────────


@router.get(
    "/horarios-disponibles",
    response_model=List[HorarioDisponibleResponse],
    summary="Listar horarios disponibles",
)
async def listar_horarios_disponibles(
    farmacia_id: Optional[int] = Query(None, description="Filtrar por farmacia"),
    fecha: Optional[date] = Query(None, description="Filtrar por fecha (YYYY-MM-DD)"),
    solo_disponibles: bool = Query(True, description="Solo horarios con cupo disponible"),
    db: Session = Depends(get_db),
):
    """
    Lista los horarios disponibles para agendamiento.
    Por defecto solo devuelve horarios con cupo disponible y activos.
    """
    query = db.query(HorarioDisponible).filter(HorarioDisponible.activo == True)

    if farmacia_id is not None:
        query = query.filter(HorarioDisponible.farmacia_id == farmacia_id)

    if fecha is not None:
        query = query.filter(HorarioDisponible.fecha == fecha)

    if solo_disponibles:
        # Horarios donde aún hay cupo
        query = query.filter(
            HorarioDisponible.turnos_agendados < HorarioDisponible.capacidad_maxima
        )

    return query.order_by(HorarioDisponible.fecha, HorarioDisponible.hora_inicio).all()


@router.post(
    "/horarios-disponibles",
    response_model=HorarioDisponibleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear horario disponible (farmacéutico/admin)",
)
async def crear_horario_disponible(
    horario_data: HorarioDisponibleCreate,
    current_user: Usuario = Depends(get_farmaceutico_user),
    db: Session = Depends(get_db),
):
    """Crea una franja horaria disponible para una farmacia. Requiere rol farmacéutico o admin."""
    farmacia = db.query(Farmacia).filter(
        Farmacia.id == horario_data.farmacia_id, Farmacia.activo == True
    ).first()
    if not farmacia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmacia no encontrada o inactiva.",
        )

    if horario_data.hora_inicio >= horario_data.hora_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La hora de inicio debe ser anterior a la hora de fin.",
        )

    nuevo = HorarioDisponible(**horario_data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ─────────────────────────────────────────────────────────────────────────────
# Turnos
# ─────────────────────────────────────────────────────────────────────────────


@router.post(
    "/turnos",
    response_model=TurnoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear turno",
)
async def crear_turno(
    turno_data: TurnoCreate,
    current_user: Usuario = Depends(get_current_user_depends),
    db: Session = Depends(get_db),
):
    """
    Agenda un nuevo turno para el usuario autenticado.

    Validaciones aplicadas:
    - La farmacia debe existir y estar activa.
    - La EPS debe existir y ser atendida por la farmacia.
    - El horario debe existir, estar activo y tener cupo disponible.
    - Cada medicamento solicitado debe tener stock suficiente en la farmacia.
    - El usuario no puede tener más de 3 turnos activos (Pendiente/Confirmado) en el mismo día.
    """

    # ── 1. Validar farmacia ──────────────────────────────────────────────────
    farmacia = db.query(Farmacia).filter(
        Farmacia.id == turno_data.farmacia_id, Farmacia.activo == True
    ).first()
    if not farmacia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmacia no encontrada o inactiva.",
        )

    # ── 2. Validar EPS ───────────────────────────────────────────────────────
    eps = db.query(EPS).filter(EPS.id == turno_data.eps_id, EPS.activo == True).first()
    if not eps:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="EPS no encontrada o inactiva.",
        )

    if not _eps_atendida_por_farmacia(farmacia, eps.nombre):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"La farmacia '{farmacia.nombre}' no atiende la EPS '{eps.nombre}'.",
        )

    # ── 3. Validar horario ───────────────────────────────────────────────────
    horario = db.query(HorarioDisponible).filter(
        HorarioDisponible.id == turno_data.horario_id,
        HorarioDisponible.farmacia_id == turno_data.farmacia_id,
        HorarioDisponible.activo == True,
    ).first()
    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado, inactivo o no pertenece a la farmacia indicada.",
        )

    if horario.turnos_agendados >= horario.capacidad_maxima:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El horario seleccionado ya no tiene cupo disponible.",
        )

    # ── 4. Límite de turnos por usuario por día ──────────────────────────────
    turnos_hoy = (
        db.query(func.count(Turno.id))
        .filter(
            Turno.usuario_id == current_user.id,
            Turno.fecha == horario.fecha,
            Turno.estado.in_(["Pendiente", "Confirmado"]),
        )
        .scalar()
    )
    if turnos_hoy >= LIMITE_TURNOS_POR_USUARIO_POR_DIA:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Has alcanzado el límite de {LIMITE_TURNOS_POR_USUARIO_POR_DIA} "
                f"turnos activos para el día {horario.fecha}."
            ),
        )

    # ── 5. Validar medicamentos y stock ──────────────────────────────────────
    items_validados: list[tuple[Inventario, int]] = []

    for item in turno_data.medicamentos:
        medicamento = db.query(Medicamento).filter(
            Medicamento.id == item.medicamento_id, Medicamento.activo == True
        ).first()
        if not medicamento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicamento con id={item.medicamento_id} no encontrado o inactivo.",
            )

        inventario = db.query(Inventario).filter(
            Inventario.medicamento_id == item.medicamento_id,
            Inventario.farmacia_id == turno_data.farmacia_id,
        ).first()

        if not inventario or inventario.stock < item.cantidad:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Stock insuficiente para '{medicamento.nombre}' en la farmacia seleccionada. "
                    f"Disponible: {inventario.stock if inventario else 0}, "
                    f"solicitado: {item.cantidad}."
                ),
            )

        items_validados.append((inventario, item.cantidad))

    # ── 6. Crear el turno (dentro de una transacción atómica) ────────────────
    codigo = _generar_codigo_turno(db)
    numero = _siguiente_numero_turno(db, turno_data.farmacia_id, horario.fecha)

    nuevo_turno = Turno(
        codigo=codigo,
        numero_turno=numero,
        usuario_id=current_user.id,
        farmacia_id=turno_data.farmacia_id,
        eps_id=turno_data.eps_id,
        horario_id=turno_data.horario_id,
        fecha=horario.fecha,
        hora=horario.hora_inicio,
        estado="Pendiente",
        observaciones=turno_data.observaciones,
    )
    db.add(nuevo_turno)
    db.flush()  # Obtener el id antes del commit

    # Agregar medicamentos al turno
    for item in turno_data.medicamentos:
        turno_med = TurnoMedicamento(
            turno_id=nuevo_turno.id,
            medicamento_id=item.medicamento_id,
            cantidad=item.cantidad,
        )
        db.add(turno_med)

    # Descontar stock temporalmente
    for inventario, cantidad in items_validados:
        inventario.stock -= cantidad
        # Actualizar estado del inventario según stock restante
        if inventario.stock == 0:
            inventario.estado = "agotado"
        elif inventario.stock <= 5:
            inventario.estado = "limitado"
        else:
            inventario.estado = "disponible"

    # Incrementar contador de turnos en el horario
    horario.turnos_agendados += 1

    db.commit()

    # Recargar con relaciones para la respuesta
    db.refresh(nuevo_turno)
    stmt = (
        select(Turno)
        .options(
            selectinload(Turno.farmacia),
            selectinload(Turno.eps_obj),
            selectinload(Turno.medicamentos).selectinload(TurnoMedicamento.medicamento),
        )
        .where(Turno.id == nuevo_turno.id)
    )
    turno_completo = db.execute(stmt).scalar_one()
    return turno_completo


@router.get(
    "/mis-turnos",
    response_model=List[TurnoResponse],
    summary="Listar mis turnos",
)
async def listar_mis_turnos(
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    fecha: Optional[date] = Query(None, description="Filtrar por fecha (YYYY-MM-DD)"),
    current_user: Usuario = Depends(get_current_user_depends),
    db: Session = Depends(get_db),
):
    """
    Devuelve todos los turnos del usuario autenticado,
    con datos de farmacia, EPS y medicamentos incluidos.
    """
    stmt = (
        select(Turno)
        .options(
            selectinload(Turno.farmacia),
            selectinload(Turno.eps_obj),
            selectinload(Turno.medicamentos).selectinload(TurnoMedicamento.medicamento),
        )
        .where(Turno.usuario_id == current_user.id)
    )

    if estado:
        if estado not in ESTADOS_VALIDOS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado inválido. Valores permitidos: {', '.join(ESTADOS_VALIDOS)}",
            )
        stmt = stmt.where(Turno.estado == estado)

    if fecha:
        stmt = stmt.where(Turno.fecha == fecha)

    stmt = stmt.order_by(Turno.fecha.desc(), Turno.hora.desc())
    return db.execute(stmt).scalars().all()


@router.get(
    "/turnos/{turno_id}",
    response_model=TurnoResponse,
    summary="Obtener turno por ID",
)
async def obtener_turno(
    turno_id: int,
    current_user: Usuario = Depends(get_current_user_depends),
    db: Session = Depends(get_db),
):
    """
    Devuelve el detalle de un turno.
    Los pacientes solo pueden ver sus propios turnos.
    Farmacéuticos y admins pueden ver cualquier turno.
    """
    stmt = (
        select(Turno)
        .options(
            selectinload(Turno.farmacia),
            selectinload(Turno.eps_obj),
            selectinload(Turno.medicamentos).selectinload(TurnoMedicamento.medicamento),
        )
        .where(Turno.id == turno_id)
    )
    turno = db.execute(stmt).scalar_one_or_none()

    if not turno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado.")

    # Pacientes solo ven sus propios turnos
    if current_user.rol == "paciente" and turno.usuario_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado.")

    return turno


@router.patch(
    "/turnos/{turno_id}/estado",
    response_model=TurnoResponse,
    summary="Actualizar estado de un turno (farmacéutico/admin)",
)
async def actualizar_estado_turno(
    turno_id: int,
    estado_data: TurnoEstadoUpdate,
    current_user: Usuario = Depends(get_farmaceutico_user),
    db: Session = Depends(get_db),
):
    """
    Actualiza el estado de un turno.
    Al cancelar un turno, el stock descontado se devuelve al inventario.
    Requiere rol farmacéutico o admin.
    """
    stmt = (
        select(Turno)
        .options(
            selectinload(Turno.farmacia),
            selectinload(Turno.eps_obj),
            selectinload(Turno.medicamentos).selectinload(TurnoMedicamento.medicamento),
        )
        .where(Turno.id == turno_id)
    )
    turno = db.execute(stmt).scalar_one_or_none()

    if not turno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado.")

    estado_anterior = turno.estado
    nuevo_estado = estado_data.estado

    # Si se cancela un turno activo, devolver stock y liberar cupo en horario
    if nuevo_estado == "Cancelado" and estado_anterior in ("Pendiente", "Confirmado"):
        for tm in turno.medicamentos:
            inventario = db.query(Inventario).filter(
                Inventario.medicamento_id == tm.medicamento_id,
                Inventario.farmacia_id == turno.farmacia_id,
            ).first()
            if inventario:
                inventario.stock += tm.cantidad
                if inventario.stock == 0:
                    inventario.estado = "agotado"
                elif inventario.stock <= 5:
                    inventario.estado = "limitado"
                else:
                    inventario.estado = "disponible"

        # Liberar cupo en el horario
        horario = db.query(HorarioDisponible).filter(
            HorarioDisponible.id == turno.horario_id
        ).first()
        if horario and horario.turnos_agendados > 0:
            horario.turnos_agendados -= 1

    turno.estado = nuevo_estado
    db.commit()
    db.refresh(turno)

    # Recargar con relaciones
    turno_actualizado = db.execute(stmt).scalar_one()
    return turno_actualizado


@router.delete(
    "/turnos/{turno_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancelar mi turno (paciente)",
)
async def cancelar_mi_turno(
    turno_id: int,
    current_user: Usuario = Depends(get_current_user_depends),
    db: Session = Depends(get_db),
):
    """
    Permite al paciente cancelar su propio turno si está en estado Pendiente.
    Devuelve el stock al inventario y libera el cupo en el horario.
    """
    turno = db.query(Turno).filter(
        Turno.id == turno_id, Turno.usuario_id == current_user.id
    ).first()

    if not turno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turno no encontrado o no te pertenece.",
        )

    if turno.estado != "Pendiente":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Solo se pueden cancelar turnos en estado Pendiente. Estado actual: {turno.estado}.",
        )

    # Devolver stock
    for tm in turno.medicamentos:
        inventario = db.query(Inventario).filter(
            Inventario.medicamento_id == tm.medicamento_id,
            Inventario.farmacia_id == turno.farmacia_id,
        ).first()
        if inventario:
            inventario.stock += tm.cantidad
            if inventario.stock == 0:
                inventario.estado = "agotado"
            elif inventario.stock <= 5:
                inventario.estado = "limitado"
            else:
                inventario.estado = "disponible"

    # Liberar cupo
    horario = db.query(HorarioDisponible).filter(
        HorarioDisponible.id == turno.horario_id
    ).first()
    if horario and horario.turnos_agendados > 0:
        horario.turnos_agendados -= 1

    turno.estado = "Cancelado"
    db.commit()
