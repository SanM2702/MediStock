from database import SessionLocal
from models import Usuario, Medicamento, Farmacia, Inventario, HistorialConsulta, AlertaStock, Notificacion

db = SessionLocal()
try:
    print("\n" + "="*60)
    print("VERIFICANDO DATOS DE SEED")
    print("="*60)
    print(f"\n📊 Estadísticas actuales:")
    print(f"   • Usuarios: {db.query(Usuario).count()}")
    print(f"   • Medicamentos: {db.query(Medicamento).count()}")
    print(f"   • Farmacias: {db.query(Farmacia).count()}")
    print(f"   • Inventario: {db.query(Inventario).count()}")
    print(f"   • Historial: {db.query(HistorialConsulta).count()}")
    print(f"   • Alertas: {db.query(AlertaStock).count()}")
    print(f"   • Notificaciones: {db.query(Notificacion).count()}")
    print("\n" + "="*60 + "\n")
finally:
    db.close()
