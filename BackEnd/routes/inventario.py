from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Inventario, Medicamento, Farmacia
from schemas import InventarioCreate, InventarioResponse, InventarioUpdate
from auth import get_farmaceutico_user
from models import Usuario

router = APIRouter(
    prefix="/api/inventario",
    tags=["inventario"],
)


def calcular_estado_inventario(stock: int) -> str:
    """
    Calcula automáticamente el estado del inventario según el stock.
    
    - stock > 20: disponible
    - 1 <= stock <= 20: limitado
    - stock == 0: agotado
    
    Args:
        stock: Cantidad en stock
        
    Returns:
        str: Estado calculado
    """
    if stock > 20:
        return "disponible"
    elif 1 <= stock <= 20:
        return "limitado"
    else:
        return "agotado"


@router.get("", response_model=List[InventarioResponse])
def listar_inventario(
    current_user: Usuario = Depends(get_farmaceutico_user),
    db: Session = Depends(get_db),
    farmacia_id: Optional[int] = Query(None, description="Filtrar por farmacia"),
    medicamento_id: Optional[int] = Query(None, description="Filtrar por medicamento"),
    estado: Optional[str] = Query(None, description="Filtrar por estado (disponible, limitado, agotado)"),
):
    """
    Lista el inventario con filtros opcionales.
    Requiere rol de farmacéutico o administrador.
    
    - **farmacia_id**: Filtra por farmacia específica
    - **medicamento_id**: Filtra por medicamento específico
    - **estado**: Filtra por estado del inventario
    """
    query = db.query(Inventario)
    
    if farmacia_id:
        query = query.filter(Inventario.farmacia_id == farmacia_id)
    
    if medicamento_id:
        query = query.filter(Inventario.medicamento_id == medicamento_id)
    
    if estado:
        query = query.filter(Inventario.estado == estado)
    
    inventario = query.all()
    return inventario


@router.get("/alertas", response_model=List[InventarioResponse])
def obtener_alertas_inventario(
    current_user: Usuario = Depends(get_farmaceutico_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene todos los medicamentos con stock limitado o agotado.
    Estos son los que requieren reorden.
    Requiere rol de farmacéutico o administrador.
    """
    alertas = db.query(Inventario).filter(
        Inventario.estado.in_(["limitado", "agotado"])
    ).all()
    
    return alertas


@router.post("", response_model=InventarioResponse, status_code=status.HTTP_201_CREATED)
def crear_inventario(
    inventario_data: InventarioCreate,
    current_user: Usuario = Depends(get_farmaceutico_user),
    db: Session = Depends(get_db),
):
    """
    Crea un nuevo registro de inventario.
    El estado se calcula automáticamente según el stock.
    Requiere rol de farmacéutico o administrador.
    """
    # Verificar que la farmacia existe
    farmacia = db.query(Farmacia).filter(Farmacia.id == inventario_data.farmacia_id).first()
    if not farmacia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmacia no encontrada",
        )
    
    # Verificar que el medicamento existe
    medicamento = db.query(Medicamento).filter(
        Medicamento.id == inventario_data.medicamento_id
    ).first()
    if not medicamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicamento no encontrado",
        )
    
    # Verificar que no existe inventario duplicado
    inventario_existente = db.query(Inventario).filter(
        (Inventario.medicamento_id == inventario_data.medicamento_id) &
        (Inventario.farmacia_id == inventario_data.farmacia_id)
    ).first()
    
    if inventario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un registro de inventario para este medicamento en esta farmacia",
        )
    
    # Calcular estado automáticamente
    estado_calculado = calcular_estado_inventario(inventario_data.stock)
    
    nuevo_inventario = Inventario(
        medicamento_id=inventario_data.medicamento_id,
        farmacia_id=inventario_data.farmacia_id,
        stock=inventario_data.stock,
        estado=estado_calculado,
        lote=inventario_data.lote,
    )
    
    db.add(nuevo_inventario)
    db.commit()
    db.refresh(nuevo_inventario)
    
    return nuevo_inventario


@router.put("/{inventario_id}", response_model=InventarioResponse)
def actualizar_inventario(
    inventario_id: int,
    inventario_update: InventarioUpdate,
    current_user: Usuario = Depends(get_farmaceutico_user),
    db: Session = Depends(get_db),
):
    """
    Actualiza un registro de inventario.
    Si se actualiza el stock, el estado se recalcula automáticamente.
    Requiere rol de farmacéutico o administrador.
    """
    inventario = db.query(Inventario).filter(Inventario.id == inventario_id).first()
    
    if not inventario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de inventario no encontrado",
        )
    
    # Actualizar datos
    update_data = inventario_update.model_dump(exclude_unset=True)
    
    # Si se actualiza el stock, recalcular el estado
    if "stock" in update_data:
        nuevo_stock = update_data["stock"]
        update_data["estado"] = calcular_estado_inventario(nuevo_stock)
    
    for field, value in update_data.items():
        setattr(inventario, field, value)
    
    db.commit()
    db.refresh(inventario)
    
    return inventario
