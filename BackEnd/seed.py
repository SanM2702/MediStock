from sqlalchemy.orm import Session
from datetime import datetime, date
from database import engine, SessionLocal
from models import Base, Usuario, Medicamento, Farmacia, Inventario
from auth import hash_password
import sys


def reset_database():
    """Borra todas las tablas y vuelve a crearlas."""
    print("\n🧹 Reiniciando base de datos...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✓ Tablas recreadas.")


def seed_database(reset=False):
    """
    Carga datos iniciales en la base de datos.
    """
    
    if reset:
        reset_database()
    else:
        # Crear todas las tablas si no existen
        Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Verificar si ya hay datos (si no se hizo reset)
        if not reset:
            usuarios_count = db.query(Usuario).count()
            if usuarios_count > 0:
                print("✓ Base de datos ya contiene datos. Omitiendo seed.")
                return
        
        print("\n" + "="*60)
        print("INICIANDO SEED DE BASE DE DATOS DE MEDISTOCK")
        print("="*60)
        
        # ==================== CREAR USUARIOS ====================
        print("\n📝 Creando usuarios...")
        
        usuarios_data = [
            {
                "cedula": "123456",
                "nombre": "Admin",
                "apellido": "Sistema",
                "email": "admin@medistock.com",
                "rol": "admin",
                "eps": None,
                "password": "admin123",
            },
            {
                "cedula": "654321",
                "nombre": "Juan",
                "apellido": "Farmacéutico",
                "email": "farmaceutico@medistock.com",
                "rol": "farmaceutico",
                "eps": "COOMEVA",
                "password": "farma123",
            },
            {
                "cedula": "111222",
                "nombre": "Pedro",
                "apellido": "Paciente",
                "email": "paciente@medistock.com",
                "rol": "paciente",
                "eps": "EPS SANITAS",
                "password": "pass123",
            },
        ]
        
        usuarios = []
        for u_data in usuarios_data:
            password = u_data.pop("password")
            usuario = Usuario(
                **u_data,
                hashed_password=hash_password(password),
            )
            db.add(usuario)
            db.flush() # Para obtener el ID
            usuarios.append(usuario)
            print(f"  ✓ {usuario.nombre} {usuario.apellido} ({usuario.rol})")
        
        # ==================== CREAR MEDICAMENTOS ====================
        print("\n💊 Creando medicamentos colombianos...")
        
        medicamentos_data = [
            {
                "nombre": "Acetaminofén 500 mg",
                "nombre_generico": "Paracetamol",
                "laboratorio": "Tecnoquímicas",
                "categoria": "analgesico",
                "precio": 1800.00,
                "unidad": "comprimido",
                "icono": "💊",
                "requiere_formula": False,
            },
            {
                "nombre": "Amoxicilina 500 mg",
                "nombre_generico": "Amoxicillin",
                "laboratorio": "Genfar",
                "categoria": "antibiotico",
                "precio": 4200.00,
                "unidad": "cápsula",
                "icono": "🧬",
                "requiere_formula": True,
            },
            {
                "nombre": "Metformina 850 mg",
                "nombre_generico": "Metformin HCl",
                "laboratorio": "Procaps",
                "categoria": "antidiabetico",
                "precio": 2600.00,
                "unidad": "comprimido",
                "icono": "🩸",
                "requiere_formula": True,
            },
            {
                "nombre": "Ibuprofeno 400 mg",
                "nombre_generico": "Ibuprofen",
                "laboratorio": "Lafrancol",
                "categoria": "antiinflamatorio",
                "precio": 1500.00,
                "unidad": "comprimido",
                "icono": "🔵",
                "requiere_formula": False,
            },
            {
                "nombre": "Losartán 50 mg",
                "nombre_generico": "Losartan Potasio",
                "laboratorio": "Mk (Tecnoquímicas)",
                "categoria": "cardioprotector",
                "precio": 3100.00,
                "unidad": "comprimido",
                "icono": "❤️",
                "requiere_formula": True,
            },
            {
                "nombre": "Atorvastatina 20 mg",
                "nombre_generico": "Atorvastatin Calcium",
                "laboratorio": "Pfizer Colombia",
                "categoria": "cardioprotector",
                "precio": 5800.00,
                "unidad": "comprimido",
                "icono": "🫀",
                "requiere_formula": True,
            },
            {
                "nombre": "Omeprazol 20 mg",
                "nombre_generico": "Omeprazole",
                "laboratorio": "Tecnoquímicas",
                "categoria": "gastrointestinal",
                "precio": 3400.00,
                "unidad": "cápsula",
                "icono": "🟢",
                "requiere_formula": True,
            },
            {
                "nombre": "Loratadina 10 mg",
                "nombre_generico": "Loratadina",
                "laboratorio": "Bansira",
                "categoria": "antihistaminico",
                "precio": 3800.00,
                "unidad": "comprimido",
                "icono": "🤧",
                "requiere_formula": False,
            },
            {
                "nombre": "Enalapril 10 mg",
                "nombre_generico": "Enalapril Maleato",
                "laboratorio": "Genfar",
                "categoria": "cardioprotector",
                "precio": 2200.00,
                "unidad": "comprimido",
                "icono": "💙",
                "requiere_formula": True,
            },
            {
                "nombre": "Clonazepam 0.5 mg",
                "nombre_generico": "Clonazepam",
                "laboratorio": "Roche Colombia",
                "categoria": "neurologico",
                "precio": 6100.00,
                "unidad": "comprimido",
                "icono": "🧠",
                "requiere_formula": True,
            },
            {
                "nombre": "Salbutamol Inhalador 100 mcg",
                "nombre_generico": "Albuterol",
                "laboratorio": "GlaxoSmithKline",
                "categoria": "respiratorio",
                "precio": 18500.00,
                "unidad": "inhalador",
                "icono": "💨",
                "requiere_formula": True,
            },
            {
                "nombre": "Insulina NPH 100 UI/mL",
                "nombre_generico": "Insulina Isófana",
                "laboratorio": "Novo Nordisk",
                "categoria": "antidiabetico",
                "precio": 42000.00,
                "unidad": "vial",
                "icono": "💉",
                "requiere_formula": True,
            },
        ]
        
        medicamentos_map = {} # Nombre Genérico -> Medicamento Obj
        for m_data in medicamentos_data:
            medicamento = Medicamento(**m_data)
            db.add(medicamento)
            db.flush()
            medicamentos_map[m_data["nombre_generico"]] = medicamento
            print(f"  ✓ {medicamento.nombre} ({medicamento.laboratorio})")
        
        # ==================== CREAR FARMACIAS ====================
        print("\n🏥 Creando farmacias de Sabana Centro...")
        
        farmacias_data = [
            {
                "nombre": "Farmacia Unida Chía",
                "municipio": "Chía",
                "direccion": "Carrera 7 #45-23, Centro",
                "telefono": "8617900",
                "horario_apertura": "08:00",
                "horario_cierre": "20:00",
                "eps_convenio": "COOMEVA, EPS SANITAS, FAMISANAR",
            },
            {
                "nombre": "Farmaideas Cajicá",
                "municipio": "Cajicá",
                "direccion": "Calle 1 #3-45, Barrio La Candelaria",
                "telefono": "8655432",
                "horario_apertura": "07:00",
                "horario_cierre": "21:00",
                "eps_convenio": "COOMEVA, CAPITALSALUD, FAMISANAR",
            },
            {
                "nombre": "Droguería Colsubsidio Zipaquirá",
                "municipio": "Zipaquirá",
                "direccion": "Avenida Simons #5-67, Centro",
                "telefono": "8521234",
                "horario_apertura": "08:30",
                "horario_cierre": "19:30",
                "eps_convenio": "EPS SANITAS, FAMISANAR, CAPITALSALUD",
            },
            {
                "nombre": "Farmatodo Nemocón",
                "municipio": "Nemocón",
                "direccion": "Diagonal 6 #8-90, Principal",
                "telefono": "8641111",
                "horario_apertura": "09:00",
                "horario_cierre": "18:00",
                "eps_convenio": "COOMEVA, EPS SANITAS",
            },
        ]
        
        farmacias_list = []
        for f_data in farmacias_data:
            farmacia = Farmacia(**f_data)
            db.add(farmacia)
            db.flush()
            farmacias_list.append(farmacia)
            print(f"  ✓ {farmacia.nombre} ({farmacia.municipio})")
        
        # ==================== CREAR INVENTARIO ====================
        print("\n📦 Creando inventario cruzado con stocks variados...")
        
        # Datos de stock por farmacia (indexado por farmacia_id y nombre_generico)
        # farmacia_id corresponde al orden en farmacias_list (1-indexed)
        stocks_config = {
            1: { # Chía
                "Paracetamol": (320, 'disponible'),
                "Amoxicillin": (45, 'disponible'),
                "Metformin HCl": (8, 'limitado'),
                "Ibuprofen": (0, 'agotado'),
                "Losartan Potasio": (120, 'disponible'),
                "Atorvastatin Calcium": (15, 'limitado'),
                "Omeprazole": (200, 'disponible'),
                "Loratadina": (0, 'agotado'),
                "Enalapril Maleato": (50, 'disponible'),
                "Clonazepam": (10, 'limitado'),
                "Albuterol": (25, 'disponible'),
                "Insulina Isófana": (5, 'limitado'),
            },
            2: { # Cajicá
                "Paracetamol": (0, 'agotado'),
                "Amoxicillin": (90, 'disponible'),
                "Metformin HCl": (150, 'disponible'),
                "Ibuprofen": (12, 'limitado'),
                "Losartan Potasio": (0, 'agotado'),
                "Atorvastatin Calcium": (60, 'disponible'),
                "Omeprazole": (5, 'limitado'),
                "Loratadina": (80, 'disponible'),
                "Enalapril Maleato": (0, 'agotado'),
                "Clonazepam": (40, 'disponible'),
                "Albuterol": (0, 'agotado'),
                "Insulina Isófana": (20, 'disponible'),
            },
            3: { # Zipaquirá
                "Paracetamol": (500, 'disponible'),
                "Amoxicillin": (0, 'agotado'),
                "Metformin HCl": (75, 'disponible'),
                "Ibuprofen": (200, 'disponible'),
                "Losartan Potasio": (30, 'disponible'),
                "Atorvastatin Calcium": (0, 'agotado'),
                "Omeprazole": (110, 'disponible'),
                "Loratadina": (18, 'limitado'),
                "Enalapril Maleato": (85, 'disponible'),
                "Clonazepam": (0, 'agotado'),
                "Albuterol": (15, 'limitado'),
                "Insulina Isófana": (0, 'agotado'),
            },
            4: { # Nemocón
                "Paracetamol": (45, 'disponible'),
                "Amoxicillin": (20, 'limitado'),
                "Metformin HCl": (0, 'agotado'),
                "Ibuprofen": (88, 'disponible'),
                "Losartan Potasio": (5, 'limitado'),
                "Atorvastatin Calcium": (40, 'disponible'),
                "Omeprazole": (0, 'agotado'),
                "Loratadina": (95, 'disponible'),
                "Enalapril Maleato": (12, 'limitado'),
                "Clonazepam": (30, 'disponible'),
                "Albuterol": (50, 'disponible'),
                "Insulina Isófana": (15, 'disponible'),
            }
        }
        
        inventario_creado = 0
        vencimiento = date(2027, 12, 31)

        for i, farmacia in enumerate(farmacias_list, 1):
            f_config = stocks_config.get(i, {})
            for med_nombre, (stock, estado) in f_config.items():
                medicamento = medicamentos_map.get(med_nombre)
                if medicamento:
                    lote = f"LT-2026-{farmacia.id}{medicamento.id}"
                    
                    item = Inventario(
                        medicamento_id=medicamento.id,
                        farmacia_id=farmacia.id,
                        stock=stock,
                        estado=estado,
                        lote=lote,
                        fecha_vencimiento=vencimiento
                    )
                    db.add(item)
                    inventario_creado += 1
        
        db.commit()
        print(f"  ✓ {inventario_creado} registros de inventario creados")
        
        # ==================== RESUMEN ====================
        print("\n" + "="*60)
        print("✅ SEED COMPLETADO EXITOSAMENTE")
        print("="*60)
        print(f"\n📊 Estadísticas:")
        print(f"   • Usuarios: {len(usuarios)}")
        print(f"   • Medicamentos: {len(medicamentos_data)}")
        print(f"   • Farmacias: {len(farmacias_data)}")
        print(f"   • Registros de inventario: {inventario_creado}")
        print(f"\n👤 Credenciales de prueba:")
        print(f"   • Admin: cedula=123456, password=admin123")
        print(f"   • Farmacéutico: cedula=654321, password=farma123")
        print(f"   • Paciente: cedula=111222, password=pass123")
        print("\n" + "="*60 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error durante seed: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    seed_database(reset=reset)
