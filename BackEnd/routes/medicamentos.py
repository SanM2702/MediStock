from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload 
from sqlalchemy import select 
from typing import List, Optional
from database import get_db
from models import Medicamento, Inventario, Farmacia, HistorialActividad, Usuario
from schemas import ( 
    MedicamentoCreate, 
    MedicamentoResponse, 
    MedicamentoConInventarioResponse, 
    MedicamentoUpdate
) 
from auth import get_current_user_depends, get_admin_user, get_farmaceutico_user
import unicodedata 
import json

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
    db: Session = Depends(get_db) 
): 
    """
    Lista todos los medicamentos con su inventario y farmacias.
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
    current_user: Optional[Usuario] = Depends(get_current_user_depends),
): 
    """
    Obtiene un medicamento por ID con su inventario.
    Registra la actividad si el usuario está autenticado.
    """
    stmt = select(Medicamento).options( 
        selectinload(Medicamento.inventarios).selectinload(Inventario.farmacia) 
    ).where(Medicamento.id == med_id, Medicamento.activo == True) 
    med = db.execute(stmt).scalar_one_or_none() 
    if not med: 
        raise HTTPException(status_code=404, detail="Medicamento no encontrado") 
    
    # Registrar actividad de consulta de medicamento
    if current_user:
        try:
            from routes.historial import registrar_actividad
            registrar_actividad(
                db=db,
                usuario_id=current_user.id,
                tipo="medicamento_consultado",
                descripcion=f"Consulta del medicamento: {med.nombre}",
                metadata={"medicamento_id": med.id, "medicamento_nombre": med.nombre},
            )
        except Exception:
            pass  # No fallar si el registro de historial falla
    
    return med 

@router.post("", response_model=MedicamentoResponse, status_code=201) 
async def crear_medicamento( 
    med: MedicamentoCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_farmaceutico_user)
): 
    nuevo = Medicamento(**med.model_dump()) 
    db.add(nuevo) 
    db.commit() 
    db.refresh(nuevo) 
    return nuevo 

@router.put("/{med_id}", response_model=MedicamentoResponse) 
async def actualizar_medicamento( 
    med_id: int, 
    med_data: MedicamentoUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_farmaceutico_user) 
): 
    med = db.get(Medicamento, med_id) 
    if not med: 
        raise HTTPException(status_code=404, detail="Medicamento no encontrado") 
    for k, v in med_data.model_dump(exclude_unset=True).items(): 
        setattr(med, k, v) 
    db.commit() 
    db.refresh(med) 
    return med
