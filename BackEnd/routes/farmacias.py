from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Farmacia, Inventario, Medicamento
from schemas import FarmaciaCreate, FarmaciaResponse, FarmaciaUpdate, MedicamentoResponse
from auth import get_admin_user
from models import Usuario

router = APIRouter(
    prefix="/api/farmacias",
    tags=["farmacias"],
)


@router.get("", response_model=List[FarmaciaResponse])
def listar_farmacias(
    db: Session = Depends(get_db),
    municipio: Optional[str] = Query(None, description="Filtrar por municipio"),
    eps: Optional[str] = Query(None, description="Filtrar por EPS"),
):
    """
    Lista todas las farmacias con filtros opcionales.
    
    - **municipio**: Filtra por municipio exacto
    - **eps**: Filtra por EPS convenio (búsqueda parcial)
    """
    query = db.query(Farmacia)
    
    if municipio:
        query = query.filter(Farmacia.municipio == municipio)
    
    if eps:
        eps_lower = f"%{eps.lower()}%"
        query = query.filter(Farmacia.eps_convenio.ilike(eps_lower))
    
    farmacias = query.filter(Farmacia.activo == True).all()
    return farmacias


@router.get("/{farmacia_id}", response_model=FarmaciaResponse)
def obtener_farmacia(
    farmacia_id: int,
    db: Session = Depends(get_db),
):
    """
    Obtiene los detalles de una farmacia específica.
    """
    farmacia = db.query(Farmacia).filter(Farmacia.id == farmacia_id).first()
    
    if not farmacia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmacia no encontrada",
        )
    
    return farmacia


@router.get("/{farmacia_id}/medicamentos", response_model=List[MedicamentoResponse])
def obtener_medicamentos_farmacia(
    farmacia_id: int,
    db: Session = Depends(get_db),
):
    """
    Obtiene todos los medicamentos disponibles en una farmacia específica.
    """
    farmacia = db.query(Farmacia).filter(Farmacia.id == farmacia_id).first()
    
    if not farmacia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmacia no encontrada",
        )
    
    # Obtener medicamentos que tienen inventario en esta farmacia
    medicamentos = db.query(Medicamento).join(
        Inventario,
        Medicamento.id == Inventario.medicamento_id
    ).filter(
        (Inventario.farmacia_id == farmacia_id) &
        (Medicamento.activo == True) &
        (Inventario.estado != "agotado")
    ).all()
    
    return medicamentos


@router.post("", response_model=FarmaciaResponse, status_code=status.HTTP_201_CREATED)
def crear_farmacia(
    farmacia_data: FarmaciaCreate,
    current_user: Usuario = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Crea una nueva farmacia.
    Requiere rol de administrador.
    """
    # Verificar si ya existe una farmacia con el mismo nombre en el mismo municipio
    farmacia_existente = db.query(Farmacia).filter(
        (Farmacia.nombre == farmacia_data.nombre) &
        (Farmacia.municipio == farmacia_data.municipio)
    ).first()
    
    if farmacia_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una farmacia con este nombre en este municipio",
        )
    
    nueva_farmacia = Farmacia(**farmacia_data.model_dump())
    db.add(nueva_farmacia)
    db.commit()
    db.refresh(nueva_farmacia)
    
    return nueva_farmacia


@router.put("/{farmacia_id}", response_model=FarmaciaResponse)
def actualizar_farmacia(
    farmacia_id: int,
    farmacia_update: FarmaciaUpdate,
    current_user: Usuario = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Actualiza una farmacia existente.
    Requiere rol de administrador.
    """
    farmacia = db.query(Farmacia).filter(Farmacia.id == farmacia_id).first()
    
    if not farmacia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmacia no encontrada",
        )
    
    # Actualizar solo los campos proporcionados
    update_data = farmacia_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(farmacia, field, value)
    
    db.commit()
    db.refresh(farmacia)
    
    return farmacia
