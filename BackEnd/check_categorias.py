from database import SessionLocal
from models import Medicamento

db = SessionLocal()
try:
    meds = db.query(Medicamento).all()
    print("\n--- DIAGNÓSTICO DE CATEGORÍAS ---")
    for m in meds:
        print(f"ID:{m.id} | nombre:{m.nombre} | categoria:'{m.categoria}'")
    print("---------------------------------\n")
finally:
    db.close()
