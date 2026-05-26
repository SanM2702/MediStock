from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload 
from sqlalchemy import select 
from typing import List, Optional 
from database import get_db 
from models import Medicamento, Inventario, Farmacia 
from schemas import ( 
    MedicamentoCreate, 
    MedicamentoResponse, 
    MedicamentoConInventarioResponse, 
    MedicamentoUpdate
) 
from auth import get_current_user_depends, get_admin_user, get_farmaceutico_user, get_current_user, get_current_user_required
from historial_service import registrar_actividad
import unicodedata
import json
import logging

logger = logging.getLogger("medistock") 

router = APIRouter(
    prefix="/api/medicamentos",
    tags=["medicamentos"],
) 

def normalizar(texto: str) -> str: 
    if not texto: 
        return "" 
    texto = texto.lower().strip() 
    return ''.join( 
        c for c in unicodedata.normalize('NFD', texto) 
        if unicodedata.category(c) != 'Mn' 
    ) 

@router.get("", response_model=List[MedicamentoConInventarioResponse]) 
async def listar_medicamentos( 
    busqueda: Optional[str] = None, 
    categoria: Optional[str] = None, 
    estado: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_depends)
): 
    """
    Lista todos los medicamentos con su inventario y farmacias.
    Si se proporciona un término de búsqueda, se registra en el historial.
    """
    # 1. Obtener todos los activos con su inventario y farmacia relacionada
    stmt = select(Medicamento).options( 
        selectinload(Medicamento.inventarios).selectinload(Inventario.farmacia) 
    ).where(Medicamento.activo == True) 
    
    resultados = db.execute(stmt).scalars().all() 
    
    # 2. Filtrar por búsqueda (Python - Insensible a acentos y multi-palabra)
    if busqueda and busqueda.strip():
        terminos = normalizar(busqueda).split()
        def matches_search(m):
            target = normalizar(f"{m.nombre} {m.nombre_generico} {m.laboratorio}")
            return all(t in target for t in terminos)
        resultados = [m for m in resultados if matches_search(m)]
        
        # Registrar búsqueda en historial si el usuario está autenticado
        if current_user:
            registrar_actividad(
                db=db,
                usuario_id=current_user.id,
                tipo="busqueda",
                titulo=f'Buscó "{busqueda}"',
                metadata_json=json.dumps({"query": busqueda, "resultados": len(resultados)})
            )

    # 3. Filtrar por categoria (Python)
    if categoria and categoria.strip(): 
        cat_norm = normalizar(categoria) 
        resultados = [m for m in resultados if normalizar(m.categoria) == cat_norm] 
    
    # 4. Filtrar por estado (Python)
    if estado and estado.strip(): 
        resultados = [ 
            m for m in resultados 
            if any(inv.estado == estado for inv in m.inventarios) 
        ] 
    
    return resultados 

@router.get("/{med_id}", response_model=MedicamentoConInventarioResponse) 
async def obtener_medicamento(
    med_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_depends)
): 
    """
    Obtiene un medicamento por ID con su inventario.
    Registra la consulta en el historial del usuario si está autenticado.
    """
    stmt = select(Medicamento).options( 
        selectinload(Medicamento.inventarios).selectinload(Inventario.farmacia) 
    ).where(Medicamento.id == med_id, Medicamento.activo == True) 
    med = db.execute(stmt).scalar_one_or_none() 
    if not med: 
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
    
    # Registrar consulta en historial si el usuario está autenticado
    if current_user:
        registrar_actividad(
            db=db,
            usuario_id=current_user.id,
            tipo="consulta_medicamento",
            titulo=f"Consultó {med.nombre}",
            descripcion="Verificó disponibilidad en farmacias",
            metadata_json=json.dumps({
                "medicamento_id": med.id,
                "medicamento_nombre": med.nombre,
                "categoria": med.categoria
            })
        )
    
    return med 

@router.post("", response_model=MedicamentoResponse, status_code=status.HTTP_201_CREATED) 
async def crear_medicamento( 
    med_data: MedicamentoCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_admin_user) 
): 
    """Solo administradores pueden crear medicamentos"""
    nuevo_med = Medicamento(**med_data.model_dump())
    db.add(nuevo_med)
    db.commit()
    db.refresh(nuevo_med)
    return nuevo_med

@router.put("/{med_id}", response_model=MedicamentoResponse) 
async def actualizar_medicamento( 
    med_id: int, 
    med_data: MedicamentoUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_farmaceutico_user) 
): 
    """Farmacéuticos y Admins pueden actualizar medicamentos"""
    stmt = select(Medicamento).where(Medicamento.id == med_id)
    med = db.execute(stmt).scalar_one_or_none()
    
    if not med:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
        
    for key, value in med_data.model_dump(exclude_unset=True).items():
        setattr(med, key, value)
        
    db.commit()
    db.refresh(med)
    return med

@router.delete("/{med_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_medicamento(
    med_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    """Solo administradores pueden eliminar (desactivar) medicamentos"""
    stmt = select(Medicamento).where(Medicamento.id == med_id)
    med = db.execute(stmt).scalar_one_or_none()
    
    if not med:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
        
    med.activo = False
    db.commit()
    return None
