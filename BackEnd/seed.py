from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from database import engine, SessionLocal
from models import (
    Base, Usuario, Medicamento, Farmacia, Inventario,
    HistorialConsulta, AlertaStock, Notificacion,
    EPS, HorarioDisponible,
)
from auth import hash_password
import sys
import random


def reset_database():
    """Borra todas las tablas y vuelve a crearlas."""
    print("\n🧹 Reiniciando base de datos...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✓ Tablas recreadas.")


# ==================== DATOS DE REFERENCIA ====================
EPS_LIST = [
    "Sanitas", "Sura", "Nueva EPS", "Compensar", "Famisanar",
    "Coosalud", "Salud Total", "Aliansalud", "Mutual Ser", "Emssanar",
    "SOS", "Capital Salud", "Savia Salud", "Medimás", "Asmet Salud",
    "Cafesalud", "Humana Vivir", "Colsanitas", "Axxess", "Salud Mía",
    "EPS San José", "Convida", "Dusakawi", "Famisanar EPS", "Kronos",
    "Saludcoop", "Comfenalco", "Cajacopi", "Cajamag", "Solsalud"
]

NOMBRES_COLOMBIANOS = [
    "Carlos", "Juan", "José", "Luis", "Miguel", "Andrés", "Alejandro",
    "Fernando", "Roberto", "Ricardo", "Jorge", "Pedro", "Manuel",
    "Daniel", "David", "Santiago", "Sebastián", "Mateo", "Samuel",
    "María", "Ana", "Laura", "Carmen", "Patricia", "Sandra", "Claudia",
    "Andrea", "Natalia", "Valentina", "Sofía", "Isabella", "Camila",
    "Daniela", "Martha", "Beatriz", "Elizabeth", "Rosa", "Luz"
]

APELLIDOS_COLOMBIANOS = [
    "García", "Rodríguez", "Martínez", "López", "González", "Pérez",
    "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez",
    "Díaz", "Cruz", "Morales", "Reyes", "Jiménez", "Muñoz",
    "Herrera", "Castro", "Ortiz", "Álvarez", "Romero", "Vargas",
    "Fernández", "Silva", "Rojas", "Benítez", "Mendoza", "Navarro"
]

CIUDADES_SABANA = [
    "Bogotá", "Soacha", "Chía", "Zipaquirá", "Facatativá",
    "Mosquera", "Funza", "Madrid", "Cajicá", "Cota"
]

NOMBRES_FARMACIAS = [
    "Cruz Verde", "Farmatodo", "La Rebaja", "Colsubsidio", "Olímpica",
    "Drogas La Economía", "Farmacenter", "Droguería Central", "Farmacia Vida",
    "Droguería SaludPlus", "Farmacia Ahorro", "Droguería Popular",
    "Farmacia San Jorge", "Droguería El Faro", "Farmacia Bienestar"
]

CATEGORIAS_MEDICAMENTOS = [
    "analgesico", "antibiotico", "antiinflamatorio", "antihistaminico",
    "cardiovascular", "antidiabetico", "gastrointestinal", "vitamina",
    "dermatologico", "respiratorio"
]

LABORATORIOS = [
    "Tecnoquímicas", "Genfar", "Procaps", "Lafrancol", "Mk (Tecnoquímicas)",
    "Pfizer Colombia", "Bansira", "Roche Colombia", "GlaxoSmithKline",
    "Novo Nordisk", "Bayer", "Boehringer Ingelheim", "Sanofi",
    "Abbott", "Merck Sharp & Dohme", "Novartis", "Eli Lilly",
    "AstraZeneca", "Janssen", "GSK", "Bristol-Myers Squibb"
]

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
        
        # ==================== CREAR USUARIOS (100) ====================
        print("\n📝 Creando 100 usuarios...")
        
        usuarios = []
        cedulas_usadas = set()
        emails_usados = set()
        
        # 5 Administradores
        for i in range(5):
            cedula = f"{10000000 + i}"
            nombre = random.choice(NOMBRES_COLOMBIANOS)
            apellido = random.choice(APELLIDOS_COLOMBIANOS)
            email = f"{nombre.lower()}.{apellido.lower()}{i}@admin.medistock.com"
            
            usuario = Usuario(
                cedula=cedula,
                nombre=nombre,
                apellido=apellido,
                email=email,
                rol="admin",
                eps=None,
                telefono=f"300{random.randint(1000000, 9999999)}",
                hashed_password=hash_password("admin123"),
                activo=True,
                codigo_activacion=None
            )
            db.add(usuario)
            db.flush()
            usuarios.append(usuario)
            cedulas_usadas.add(cedula)
            emails_usados.add(email)
            print(f"  ✓ {nombre} {apellido} (admin)")
        
        # 15 Farmacéuticos
        for i in range(15):
            cedula = f"{20000000 + i}"
            nombre = random.choice(NOMBRES_COLOMBIANOS)
            apellido = random.choice(APELLIDOS_COLOMBIANOS)
            email = f"{nombre.lower()}.{apellido.lower()}{i}@farma.medistock.com"
            eps = random.choice(EPS_LIST)
            
            usuario = Usuario(
                cedula=cedula,
                nombre=nombre,
                apellido=apellido,
                email=email,
                rol="farmaceutico",
                eps=eps,
                telefono=f"310{random.randint(1000000, 9999999)}",
                hashed_password=hash_password("farma123"),
                activo=True,
                codigo_activacion=None
            )
            db.add(usuario)
            db.flush()
            usuarios.append(usuario)
            cedulas_usadas.add(cedula)
            emails_usados.add(email)
            print(f"  ✓ {nombre} {apellido} (farmacéutico)")
        
        # 80 Pacientes
        for i in range(80):
            cedula = f"{30000000 + i}"
            nombre = random.choice(NOMBRES_COLOMBIANOS)
            apellido = random.choice(APELLIDOS_COLOMBIANOS)
            email = f"{nombre.lower()}.{apellido.lower()}{i}@paciente.medistock.com"
            eps = random.choice(EPS_LIST)
            
            usuario = Usuario(
                cedula=cedula,
                nombre=nombre,
                apellido=apellido,
                email=email,
                rol="paciente",
                eps=eps,
                telefono=f"320{random.randint(1000000, 9999999)}",
                hashed_password=hash_password("paciente123"),
                activo=True,
                codigo_activacion=None
            )
            db.add(usuario)
            db.flush()
            usuarios.append(usuario)
            cedulas_usadas.add(cedula)
            emails_usados.add(email)
        
        db.commit()
        print(f"  ✓ Total usuarios creados: {len(usuarios)}")
        
        # ==================== CREAR MEDICAMENTOS (500) ====================
        print("\n💊 Creando 500 medicamentos...")
        
        medicamentos_base = [
            ("Acetaminofén", "Paracetamol", "analgesico", "comprimido", "💊"),
            ("Ibuprofeno", "Ibuprofen", "antiinflamatorio", "comprimido", "🔵"),
            ("Amoxicilina", "Amoxicillin", "antibiotico", "cápsula", "🧬"),
            ("Losartán", "Losartan Potasio", "cardiovascular", "comprimido", "❤️"),
            ("Metformina", "Metformin HCl", "antidiabetico", "comprimido", "🩸"),
            ("Omeprazol", "Omeprazole", "gastrointestinal", "cápsula", "🟢"),
            ("Loratadina", "Loratadina", "antihistaminico", "comprimido", "🤧"),
            ("Salbutamol", "Albuterol", "respiratorio", "inhalador", "💨"),
            ("Atorvastatina", "Atorvastatin Calcium", "cardiovascular", "comprimido", "🫀"),
            ("Enalapril", "Enalapril Maleato", "cardiovascular", "comprimido", "💙"),
            ("Clonazepam", "Clonazepam", "neurologico", "comprimido", "🧠"),
            ("Insulina NPH", "Insulina Isófana", "antidiabetico", "vial", "💉"),
            ("Diclofenaco", "Diclofenac Sodium", "antiinflamatorio", "comprimido", "🔴"),
            ("Ciprofloxacino", "Ciprofloxacin", "antibiotico", "tableta", "🧬"),
            ("Metoclopramida", "Metoclopramide", "gastrointestinal", "comprimido", "🟡"),
            ("Prednisona", "Prednisone", "antiinflamatorio", "comprimido", "🟠"),
            ("Furosemida", "Furosemide", "cardiovascular", "comprimido", "💧"),
            ("Ranitidina", "Ranitidine", "gastrointestinal", "comprimido", "🟣"),
            ("Cetirizina", "Cetirizine", "antihistaminico", "comprimido", "🌸"),
            ("Glibenclamida", "Glibenclamide", "antidiabetico", "comprimido", "💊"),
            ("Naproxeno", "Naproxen", "antiinflamatorio", "comprimido", "🔵"),
            ("Azitromicina", "Azithromycin", "antibiotico", "cápsula", "🧬"),
            ("Dipirona", "Metamizole", "analgesico", "comprimido", "💊"),
            ("Clorfenamina", "Chlorphenamine", "antihistaminico", "comprimido", "🤧"),
            ("Hidroclorotiazida", "Hydrochlorothiazide", "cardiovascular", "comprimido", "💧"),
            ("Gemfibrozilo", "Gemfibrozil", "cardiovascular", "comprimido", "❤️"),
            ("Cimetidina", "Cimetidine", "gastrointestinal", "comprimido", "🟢"),
            ("Ketorolaco", "Ketorolac", "analgesico", "comprimido", "🔴"),
            ("Amoxicilina + Ácido Clavulánico", "Amoxicillin Clavulanate", "antibiotico", "comprimido", "🧬"),
            ("Enoxaparina", "Enoxaparin", "cardiovascular", "inyectable", "💉"),
            ("Insulina Glargina", "Insulin Glargine", "antidiabetico", "inyectable", "💉"),
            ("Sitagliptina", "Sitagliptin", "antidiabetico", "comprimido", "🩸"),
            ("Pantoprazol", "Pantoprazole", "gastrointestinal", "comprimido", "🟢"),
            ("Montelukast", "Montelukast", "respiratorio", "comprimido", "💨"),
            ("Fexofenadina", "Fexofenadine", "antihistaminico", "comprimido", "🌸"),
            ("Carvedilol", "Carvedilol", "cardiovascular", "comprimido", "❤️"),
            ("Pioglitazona", "Pioglitazone", "antidiabetico", "comprimido", "🩸"),
            ("Esomeprazol", "Esomeprazole", "gastrointestinal", "comprimido", "🟢"),
            ("Desloratadina", "Desloratadine", "antihistaminico", "comprimido", "🌸"),
            ("Amlodipino", "Amlodipine", "cardiovascular", "comprimido", "💙"),
            ("Metoprolol", "Metoprolol", "cardiovascular", "comprimido", "❤️"),
            ("Glimepirida", "Glimepiride", "antidiabetico", "comprimido", "🩸"),
            ("Rabeprazol", "Rabeprazole", "gastrointestinal", "comprimido", "🟢"),
            ("Budesonida", "Budesonide", "respiratorio", "inhalador", "💨"),
            ("Levotiroxina", "Levothyroxine", "hormonal", "comprimido", "💊"),
            ("Diazepam", "Diazepam", "neurologico", "comprimido", "🧠"),
            ("Alprazolam", "Alprazolam", "neurologico", "comprimido", "🧠"),
            ("Fluoxetina", "Fluoxetine", "neurologico", "cápsula", "🧠"),
            ("Sertralina", "Sertraline", "neurologico", "comprimido", "🧠"),
            ("Venlafaxina", "Venlafaxine", "neurologico", "comprimido", "🧠"),
            ("Vitamina C", "Ascorbic Acid", "vitamina", "comprimido", "🍊"),
            ("Vitamina D3", "Cholecalciferol", "vitamina", "cápsula", "☀️"),
            ("Ácido Fólico", "Folic Acid", "vitamina", "comprimido", "🍃"),
            ("Hierro", "Ferrous Sulfate", "vitamina", "comprimido", "🩸"),
            ("Calcio", "Calcium Carbonate", "vitamina", "comprimido", "🦴"),
            ("Omega 3", "Omega-3", "vitamina", "cápsula", "🐟"),
            ("Zinc", "Zinc Sulfate", "vitamina", "comprimido", "💊"),
            ("Magnesio", "Magnesium", "vitamina", "comprimido", "💊"),
            ("Biotina", "Biotin", "vitamina", "comprimido", "💊"),
            ("Coenzima Q10", "Coenzyme Q10", "vitamina", "cápsula", "❤️"),
            ("Miconazol", "Miconazole", "dermatologico", "crema", "🧴"),
            ("Clotrimazol", "Clotrimazole", "dermatologico", "crema", "🧴"),
            ("Hidrocortisona", "Hydrocortisone", "dermatologico", "crema", "🧴"),
            ("Benzocaína", "Benzocaine", "analgesico", "gel", "🔵"),
            ("Lidocaína", "Lidocaine", "analgesico", "gel", "🔵"),
            ("Neomicina", "Neomycin", "antibiotico", "pomada", "🧬"),
            ("Bacitracina", "Bacitracin", "antibiotico", "pomada", "🧬"),
            ("Retinol", "Retinol", "dermatologico", "crema", "✨"),
            ("Ácido Salicílico", "Salicylic Acid", "dermatologico", "loción", "🧴"),
            ("Peróxido de Benzoilo", "Benzoyl Peroxide", "dermatologico", "gel", "🧴"),
            ("Ketoconazol", "Ketoconazole", "dermatologico", "shampoo", "🧴"),
            ("Clobetasol", "Clobetasol", "dermatologico", "crema", "🧴"),
            ("Betametasona", "Betamethasone", "dermatologico", "crema", "🧴"),
            ("Dexametasona", "Dexamethasone", "antiinflamatorio", "inyectable", "💉"),
            ("Morfina", "Morphine", "analgesico", "inyectable", "💉"),
            ("Tramadol", "Tramadol", "analgesico", "comprimido", "💊"),
            ("Codeína", "Codeine", "analgesico", "comprimido", "💊"),
            ("Oxicodona", "Oxycodone", "analgesico", "comprimido", "💊"),
            ("Fentanilo", "Fentanyl", "analgesico", "parche", "💊"),
            ("Gabapentina", "Gabapentin", "neurologico", "cápsula", "🧠"),
            ("Pregabalina", "Pregabalin", "neurologico", "cápsula", "🧠"),
            ("Duloxetina", "Duloxetine", "neurologico", "cápsula", "🧠"),
            ("Bupropión", "Bupropion", "neurologico", "comprimido", "🧠"),
            ("Trazodona", "Trazodone", "neurologico", "comprimido", "🧠"),
            ("Quetiapina", "Quetiapine", "neurologico", "comprimido", "🧠"),
            ("Risperidona", "Risperidone", "neurologico", "comprimido", "🧠"),
            ("Olanzapina", "Olanzapine", "neurologico", "comprimido", "🧠"),
            ("Haloperidol", "Haloperidol", "neurologico", "comprimido", "🧠"),
            ("Lithium", "Lithium Carbonate", "neurologico", "comprimido", "🧠"),
            ("Valproato", "Valproic Acid", "neurologico", "comprimido", "🧠"),
            ("Lamotrigina", "Lamotrigine", "neurologico", "comprimido", "🧠"),
            ("Topiramato", "Topiramate", "neurologico", "comprimido", "🧠"),
            ("Levetiracetam", "Levetiracetam", "neurologico", "comprimido", "🧠"),
            ("Fenitoína", "Phenytoin", "neurologico", "comprimido", "🧠"),
            ("Carbamazepina", "Carbamazepine", "neurologico", "comprimido", "🧠"),
            ("Donepezilo", "Donepezil", "neurologico", "comprimido", "🧠"),
            ("Memantina", "Memantine", "neurologico", "comprimido", "🧠"),
            ("Rivastigmina", "Rivastigmine", "neurologico", "parche", "🧠"),
            ("Galantamina", "Galantamine", "neurologico", "comprimido", "🧠"),
            ("Prasugrel", "Prasugrel", "cardiovascular", "comprimido", "❤️"),
            ("Ticagrelor", "Ticagrelor", "cardiovascular", "comprimido", "❤️"),
            ("Clopidogrel", "Clopidogrel", "cardiovascular", "comprimido", "❤️"),
            ("Warfarina", "Warfarin", "cardiovascular", "comprimido", "💉"),
            ("Dabigatrán", "Dabigatran", "cardiovascular", "cápsula", "💉"),
            ("Rivaroxabán", "Rivaroxaban", "cardiovascular", "comprimido", "💉"),
            ("Apixabán", "Apixaban", "cardiovascular", "comprimido", "💉"),
            ("Digoxina", "Digoxin", "cardiovascular", "comprimido", "❤️"),
            ("Diltiazem", "Diltiazem", "cardiovascular", "comprimido", "❤️"),
            ("Verapamilo", "Verapamil", "cardiovascular", "comprimido", "❤️"),
            ("Nifedipino", "Nifedipine", "cardiovascular", "comprimido", "❤️"),
            ("Felodipino", "Felodipine", "cardiovascular", "comprimido", "❤️"),
            ("Isosorbide", "Isosorbide Dinitrate", "cardiovascular", "comprimido", "❤️"),
            ("Nitroglicerina", "Nitroglycerin", "cardiovascular", "parche", "❤️"),
            ("Espironolactona", "Spironolactone", "cardiovascular", "comprimido", "💧"),
            ("Triamtereno", "Triamterene", "cardiovascular", "comprimido", "💧"),
            ("Indapamida", "Indapamide", "cardiovascular", "comprimido", "💧"),
            ("Clonidina", "Clonidine", "cardiovascular", "comprimido", "💙"),
            ("Moxonidina", "Moxonidine", "cardiovascular", "comprimido", "💙"),
            ("Doxazosina", "Doxazosin", "cardiovascular", "comprimido", "💙"),
            ("Prazosina", "Prazosin", "cardiovascular", "comprimido", "💙"),
            ("Tamsulosina", "Tamsulosin", "urologico", "cápsula", "💊"),
            ("Alfuzosina", "Alfuzosin", "urologico", "comprimido", "💊"),
            ("Silodosina", "Silodosin", "urologico", "cápsula", "💊"),
            ("Finasterida", "Finasteride", "urologico", "comprimido", "💊"),
            ("Dutasterida", "Dutasteride", "urologico", "cápsula", "💊"),
            ("Tadalafilo", "Tadalafil", "urologico", "comprimido", "💊"),
            ("Sildenafilo", "Sildenafil", "urologico", "comprimido", "💊"),
            ("Vardenafilo", "Vardenafil", "urologico", "comprimido", "💊"),
            ("Avanafilo", "Avanafil", "urologico", "comprimido", "💊"),
            ("Misoprostol", "Misoprostol", "gastrointestinal", "comprimido", "🟢"),
            ("Sucralfato", "Sucralfate", "gastrointestinal", "comprimido", "🟢"),
            ("Lansoprazol", "Lansoprazole", "gastrointestinal", "cápsula", "🟢"),
            ("Dexlansoprazol", "Dexlansoprazole", "gastrointestinal", "cápsula", "🟢"),
            ("Famotidina", "Famotidine", "gastrointestinal", "comprimido", "🟢"),
            ("Nizatidina", "Nizatidine", "gastrointestinal", "comprimido", "🟢"),
            ("Dimenhidrinato", "Dimenhydrinate", "gastrointestinal", "comprimido", "🟢"),
            ("Meclizina", "Meclizine", "gastrointestinal", "comprimido", "🟢"),
            ("Escopolamina", "Scopolamine", "gastrointestinal", "parche", "🟢"),
            ("Loperamida", "Loperamide", "gastrointestinal", "comprimido", "🟢"),
            ("Bismuto", "Bismuth Subsalicylate", "gastrointestinal", "líquido", "🟢"),
            ("Simeticona", "Simethicone", "gastrointestinal", "comprimido", "🟢"),
            ("Polietilenglicol", "Polyethylene Glycol", "gastrointestinal", "polvo", "🟢"),
            ("Lactulosa", "Lactulose", "gastrointestinal", "líquido", "🟢"),
            ("Senna", "Senna", "gastrointestinal", "comprimido", "🟢"),
            ("Bisacodilo", "Bisacodyl", "gastrointestinal", "comprimido", "🟢"),
            ("Docusato", "Docusate Sodium", "gastrointestinal", "comprimido", "🟢"),
            ("Psyllium", "Psyllium Husk", "gastrointestinal", "polvo", "🟢"),
            ("Metilcelulosa", "Methylcellulose", "gastrointestinal", "comprimido", "🟢"),
            ("Colestiramina", "Cholestyramine", "cardiovascular", "polvo", "💊"),
            ("Colestipol", "Colestipol", "cardiovascular", "polvo", "💊"),
            ("Ezetimiba", "Ezetimibe", "cardiovascular", "comprimido", "💊"),
            ("Fenofibrato", "Fenofibrate", "cardiovascular", "comprimido", "💊"),
            ("Niacina", "Niacin", "vitamina", "comprimido", "💊"),
            ("Ácido Nicotínico", "Nicotinic Acid", "vitamina", "comprimido", "💊"),
            ("Rosuvastatina", "Rosuvastatin", "cardiovascular", "comprimido", "💊"),
            ("Pitavastatina", "Pitavastatin", "cardiovascular", "comprimido", "💊"),
            ("Pravastatina", "Pravastatin", "cardiovascular", "comprimido", "💊"),
            ("Simvastatina", "Simvastatin", "cardiovascular", "comprimido", "💊"),
            ("Lovastatina", "Lovastatin", "cardiovascular", "comprimido", "💊"),
            ("Fluvastatina", "Fluvastatin", "cardiovascular", "comprimido", "💊"),
            ("Ácido Ursodesoxicólico", "Ursodeoxycholic Acid", "gastrointestinal", "comprimido", "💊"),
            ("Ursodiol", "Ursodiol", "gastrointestinal", "comprimido", "💊"),
            ("Metoclopramida", "Metoclopramide", "gastrointestinal", "comprimido", "🟢"),
            ("Domperidona", "Domperidone", "gastrointestinal", "comprimido", "🟢"),
            ("Cisaprida", "Cisapride", "gastrointestinal", "comprimido", "🟢"),
            ("Itoprida", "Itopride", "gastrointestinal", "comprimido", "🟢"),
            ("Mosaprida", "Mosapride", "gastrointestinal", "comprimido", "🟢"),
            ("Tegaserod", "Tegaserod", "gastrointestinal", "comprimido", "🟢"),
            ("Prucaloprida", "Prucalopride", "gastrointestinal", "comprimido", "🟢"),
            ("Linaclotida", "Linaclotide", "gastrointestinal", "cápsula", "🟢"),
            ("Plecanatida", "Plecanatide", "gastrointestinal", "comprimido", "🟢"),
            ("Lubiprostona", "Lubiprostone", "gastrointestinal", "cápsula", "🟢"),
            ("Alosetrón", "Alosetron", "gastrointestinal", "comprimido", "🟢"),
            ("Rifaximina", "Rifaximin", "antibiotico", "comprimido", "🧬"),
            ("Bacitracina", "Bacitracin", "antibiotico", "pomada", "🧬"),
            ("Neomicina", "Neomycin", "antibiotico", "pomada", "🧬"),
            ("Polimixina B", "Polymyxin B", "antibiotico", "pomada", "🧬"),
            ("Gentamicina", "Gentamicin", "antibiotico", "pomada", "🧬"),
            ("Mupirocina", "Mupirocin", "antibiotico", "pomada", "🧬"),
            ("Retapamulina", "Retapamulin", "antibiotico", "pomada", "🧬"),
            ("Fusidato", "Fusidic Acid", "antibiotico", "pomada", "🧬"),
            ("Ácido Fusídico", "Fusidic Acid", "antibiotico", "pomada", "🧬"),
            ("Eritromicina", "Erythromycin", "antibiotico", "pomada", "🧬"),
            ("Clindamicina", "Clindamycin", "antibiotico", "pomada", "🧬"),
            ("Tetraciclina", "Tetracycline", "antibiotico", "pomada", "🧬"),
            ("Doxiciclina", "Doxycycline", "antibiotico", "comprimido", "🧬"),
            ("Minociclina", "Minocycline", "antibiotico", "comprimido", "🧬"),
            ("Tigeciclina", "Tigecycline", "antibiotico", "inyectable", "🧬"),
            ("Linezolid", "Linezolid", "antibiotico", "comprimido", "🧬"),
            ("Daptomicina", "Daptomycin", "antibiotico", "inyectable", "🧬"),
            ("Vancomicina", "Vancomycin", "antibiotico", "inyectable", "🧬"),
            ("Teicoplanina", "Teicoplanin", "antibiotico", "inyectable", "🧬"),
            ("Cefazolina", "Cefazolin", "antibiotico", "inyectable", "🧬"),
            ("Ceftriaxona", "Ceftriaxone", "antibiotico", "inyectable", "🧬"),
            ("Cefotaxima", "Cefotaxime", "antibiotico", "inyectable", "🧬"),
            ("Ceftazidima", "Ceftazidime", "antibiotico", "inyectable", "🧬"),
            ("Cefepima", "Cefepime", "antibiotico", "inyectable", "🧬"),
            ("Meropenem", "Meropenem", "antibiotico", "inyectable", "🧬"),
            ("Imipenem", "Imipenem", "antibiotico", "inyectable", "🧬"),
            ("Ertapenem", "Ertapenem", "antibiotico", "inyectable", "🧬"),
            ("Doripenem", "Doripenem", "antibiotico", "inyectable", "🧬"),
            ("Piperacilina/Tazobactam", "Piperacillin Tazobactam", "antibiotico", "inyectable", "🧬"),
            ("Ampicilina/Sulbactam", "Ampicillin Sulbactam", "antibiotico", "inyectable", "🧬"),
            ("Amoxicilina/Ácido Clavulánico", "Amoxicillin Clavulanate", "antibiotico", "comprimido", "🧬"),
            ("Ticarcilina/Ácido Clavulánico", "Ticarcillin Clavulanate", "antibiotico", "inyectable", "🧬"),
            ("Sultamicilina", "Sultamicillin", "antibiotico", "comprimido", "🧬"),
            ("Cefuroxima", "Cefuroxime", "antibiotico", "comprimido", "🧬"),
            ("Cefdinir", "Cefdinir", "antibiotico", "cápsula", "🧬"),
            ("Cefixima", "Cefixime", "antibiotico", "comprimido", "🧬"),
            ("Cefpodoxima", "Cefpodoxime", "antibiotico", "comprimido", "🧬"),
            ("Cefprozil", "Cefprozil", "antibiotico", "comprimido", "🧬"),
            ("Cefaclor", "Cefaclor", "antibiotico", "cápsula", "🧬"),
            ("Cefadroxilo", "Cefadroxil", "antibiotico", "comprimido", "🧬"),
            ("Cefalexina", "Cephalexin", "antibiotico", "cápsula", "🧬"),
            ("Penicilina V", "Phenoxymethylpenicillin", "antibiotico", "comprimido", "🧬"),
            ("Penicilina G", "Benzylpenicillin", "antibiotico", "inyectable", "🧬"),
            ("Oxacilina", "Oxacillin", "antibiotico", "inyectable", "🧬"),
            ("Nafcilina", "Nafcillin", "antibiotico", "inyectable", "🧬"),
            ("Dicloxacilina", "Dicloxacillin", "antibiotico", "comprimido", "🧬"),
            ("Cloxacilina", "Cloxacillin", "antibiotico", "comprimido", "🧬"),
            ("Flucloxacilina", "Flucloxacillin", "antibiotico", "comprimido", "🧬"),
            ("Meticilina", "Methicillin", "antibiotico", "inyectable", "🧬"),
            ("Aztreonam", "Aztreonam", "antibiotico", "inyectable", "🧬"),
            ("Colistina", "Colistin", "antibiotico", "inyectable", "🧬"),
            ("Polimixina B", "Polymyxin B", "antibiotico", "inyectable", "🧬"),
            ("Fosfomicina", "Fosfomycin", "antibiotico", "comprimido", "🧬"),
            ("Nitrofurantoína", "Nitrofurantoin", "antibiotico", "cápsula", "🧬"),
            ("Furazolidona", "Furazolidone", "antibiotico", "comprimido", "🧬"),
            ("Metronidazol", "Metronidazole", "antibiotico", "comprimido", "🧬"),
            ("Tinidazol", "Tinidazole", "antibiotico", "comprimido", "🧬"),
            ("Ornidazol", "Ornidazole", "antibiotico", "comprimido", "🧬"),
            ("Secnidazol", "Secnidazole", "antibiotico", "comprimido", "🧬"),
            ("Cloroquina", "Chloroquine", "antiparasitario", "comprimido", "🦠"),
            ("Hidroxicloroquina", "Hydroxychloroquine", "antiparasitario", "comprimido", "🦠"),
            ("Primaquina", "Primaquine", "antiparasitario", "comprimido", "🦠"),
            ("Mefloquina", "Mefloquine", "antiparasitario", "comprimido", "🦠"),
            ("Artemeter", "Artemether", "antiparasitario", "inyectable", "🦠"),
            ("Lumefantrina", "Lumefantrine", "antiparasitario", "comprimido", "🦠"),
            ("Atovaquona", "Atovaquone", "antiparasitario", "comprimido", "🦠"),
            ("Proguanil", "Proguanil", "antiparasitario", "comprimido", "🦠"),
            ("Pirimetamina", "Pyrimethamine", "antiparasitario", "comprimido", "🦠"),
            ("Sulfadoxina", "Sulfadoxine", "antiparasitario", "comprimido", "🦠"),
            ("Ivermectina", "Ivermectin", "antiparasitario", "comprimido", "🦠"),
            ("Albendazol", "Albendazole", "antiparasitario", "comprimido", "🦠"),
            ("Mebendazol", "Mebendazole", "antiparasitario", "comprimido", "🦠"),
            ("Pirantel", "Pyrantel", "antiparasitario", "comprimido", "🦠"),
            ("Piperazina", "Piperazine", "antiparasitario", "comprimido", "🦠"),
            ("Dietilcarbamazina", "Diethylcarbamazine", "antiparasitario", "comprimido", "🦠"),
            ("Suramina", "Suramin", "antiparasitario", "inyectable", "🦠"),
            ("Melarsoprol", "Melarsoprol", "antiparasitario", "inyectable", "🦠"),
            ("Eflornitina", "Eflornithine", "antiparasitario", "inyectable", "🦠"),
            ("Nifurtimox", "Nifurtimox", "antiparasitario", "comprimido", "🦠"),
            ("Benznidazol", "Benznidazole", "antiparasitario", "comprimido", "🦠"),
            ("Praziquantel", "Praziquantel", "antiparasitario", "comprimido", "🦠"),
            ("Oxamniquina", "Oxamniquine", "antiparasitario", "comprimido", "🦠"),
            ("Metrifonato", "Metrifonate", "antiparasitario", "comprimido", "🦠"),
        ]
        
        # Expandir a 500 medicamentos generando variaciones
        presentaciones = ["comprimido", "cápsula", "tableta", "inyectable", "jarabe", "gotas", "pomada", "crema", "gel", "loción", "shampoo", "parche", "polvo", "líquido", "vial", "inhalador", "spray"]
        concentraciones = ["5 mg", "10 mg", "20 mg", "50 mg", "100 mg", "200 mg", "500 mg", "1 g", "2.5 mg", "5 mg", "10 mg", "20 mg", "40 mg", "80 mg", "160 mg", "250 mg", "500 mg", "1 g", "125 mg", "250 mg", "500 mg", "1 g", "2 g"]
        
        medicamentos = []
        medicamentos_map = {}
        
        # Primero agregar los medicamentos base
        for nombre, generico, categoria, unidad, icono in medicamentos_base:
            medicamento = Medicamento(
                nombre=f"{nombre} {random.choice(concentraciones)}",
                nombre_generico=generico,
                laboratorio=random.choice(LABORATORIOS),
                categoria=categoria,
                precio=random.uniform(500, 50000),
                unidad=unidad,
                icono=icono,
                requiere_formula=random.choice([True, False]),
                activo=True
            )
            db.add(medicamento)
            db.flush()
            medicamentos.append(medicamento)
            medicamentos_map[generico] = medicamento
        
        # Generar medicamentos adicionales para llegar a 500
        while len(medicamentos) < 500:
            nombre, generico, categoria, unidad, icono = random.choice(medicamentos_base)
            concentracion = random.choice(concentraciones)
            laboratorio = random.choice(LABORATORIOS)
            
            medicamento = Medicamento(
                nombre=f"{nombre} {concentracion}",
                nombre_generico=generico,
                laboratorio=laboratorio,
                categoria=categoria,
                precio=random.uniform(500, 50000),
                unidad=random.choice(presentaciones),
                icono=icono,
                requiere_formula=random.choice([True, False]),
                activo=True
            )
            db.add(medicamento)
            db.flush()
            medicamentos.append(medicamento)
        
        db.commit()
        print(f"  ✓ Total medicamentos creados: {len(medicamentos)}")
        
        # ==================== CREAR FARMACIAS (80) ====================
        print("\n🏥 Creando 80 farmacias...")
        
        farmacias = []
        direcciones_tipicas = [
            "Carrera 7 #", "Calle 1 #", "Avenida #", "Diagonal #", "Transversal #",
            "Carrera 15 #", "Calle 10 #", "Avenida Simons #", "Calle 5 #", "Carrera 20 #"
        ]
        
        for i in range(80):
            nombre_base = random.choice(NOMBRES_FARMACIAS)
            ciudad = random.choice(CIUDADES_SABANA)
            direccion = f"{random.choice(direcciones_tipicas)}{random.randint(1, 200)}-{random.randint(1, 99)}, {random.choice(['Centro', 'Norte', 'Sur', 'Occidente', 'Oriente', 'Barrio principal', 'Zona industrial'])}"
            telefono = f"{random.randint(1000000, 9999999)}"
            horario_apertura = f"{random.randint(6, 9):02d}:00"
            horario_cierre = f"{random.randint(18, 22):02d}:00"
            
            # Seleccionar 3-5 EPS aleatorias para convenio
            eps_convenio = ", ".join(random.sample(EPS_LIST, random.randint(3, 5)))
            
            farmacia = Farmacia(
                nombre=f"{nombre_base} {ciudad} #{i+1}",
                municipio=ciudad,
                direccion=direccion,
                telefono=telefono,
                horario_apertura=horario_apertura,
                horario_cierre=horario_cierre,
                eps_convenio=eps_convenio,
                activo=True
            )
            db.add(farmacia)
            db.flush()
            farmacias.append(farmacia)
        
        db.commit()
        print(f"  ✓ Total farmacias creadas: {len(farmacias)}")
        
        # ==================== CREAR INVENTARIO (8,000+) ====================
        print("\n📦 Creando 8,000+ registros de inventario...")
        
        inventario_creado = 0
        inventario_items = []
        
        # Crear inventario cruzado: cada farmacia tiene un subconjunto de medicamentos
        # Para 80 farmacias y 500 medicamentos, necesitamos ~8,000 registros
        # Esto significa ~100 medicamentos por farmacia en promedio
        
        for farmacia in farmacias:
            # Cada farmacia tiene entre 80 y 120 medicamentos
            num_meds_por_farmacia = random.randint(80, 120)
            medicamentos_farmacia = random.sample(medicamentos, min(num_meds_por_farmacia, len(medicamentos)))
            
            for medicamento in medicamentos_farmacia:
                # Generar stock con distribución variada según regla unificada:
                # stock <= 0 → agotado
                # stock 1-5 → limitado
                # stock > 5 → disponible
                # Distribución: 20% agotado, 30% limitado, 50% disponible

                rand_val = random.random()
                if rand_val < 0.20:
                    stock = 0
                    estado = "agotado"
                elif rand_val < 0.50:
                    stock = random.randint(1, 5)
                    estado = "limitado"
                else:
                    stock = random.randint(6, 500)
                    estado = "disponible"
                
                # Fecha de vencimiento entre 30 y 730 días
                dias_vencimiento = random.randint(30, 730)
                fecha_vencimiento = date.today() + timedelta(days=dias_vencimiento)
                
                # 15% próximos a vencer (menos de 90 días)
                if random.random() < 0.15:
                    dias_vencimiento = random.randint(30, 90)
                    fecha_vencimiento = date.today() + timedelta(days=dias_vencimiento)
                
                lote = f"LT-{random.randint(2024, 2026)}-{random.randint(10000, 99999)}"
                
                item = Inventario(
                    medicamento_id=medicamento.id,
                    farmacia_id=farmacia.id,
                    stock=stock,
                    estado=estado,
                    lote=lote,
                    fecha_vencimiento=fecha_vencimiento
                )
                inventario_items.append(item)
                inventario_creado += 1
                
                # Commit en bloques de 500 para mejor rendimiento
                if len(inventario_items) >= 500:
                    db.bulk_save_objects(inventario_items)
                    db.commit()
                    inventario_items = []
        
        # Commit remaining items
        if inventario_items:
            db.bulk_save_objects(inventario_items)
            db.commit()
        
        print(f"  ✓ Total registros de inventario creados: {inventario_creado}")
        
        # ==================== CREAR HISTORIAL DE CONSULTAS (1,000) ====================
        print("\n📋 Creando 1,000 registros de historial de consultas...")
        
        historial_creado = 0
        historial_items = []
        pacientes = [u for u in usuarios if u.rol == "paciente"]
        
        for _ in range(1000):
            paciente = random.choice(pacientes)
            medicamento = random.choice(medicamentos)
            
            # Fecha aleatoria en los últimos 90 días
            dias_aleatorios = random.randint(0, 90)
            fecha_consulta = datetime.now() - timedelta(days=dias_aleatorios)
            
            historial = HistorialConsulta(
                usuario_id=paciente.id,
                medicamento_id=medicamento.id,
                fecha_consulta=fecha_consulta
            )
            historial_items.append(historial)
            historial_creado += 1
            
            # Commit en bloques
            if len(historial_items) >= 200:
                db.bulk_save_objects(historial_items)
                db.commit()
                historial_items = []
        
        if historial_items:
            db.bulk_save_objects(historial_items)
            db.commit()
        
        print(f"  ✓ Total registros de historial creados: {historial_creado}")
        
        # ==================== CREAR ALERTAS DE STOCK (500) ====================
        print("\n⚠️  Creando 500 alertas de stock...")
        
        alertas_creadas = 0
        alertas_items = []
        
        # Obtener inventario con stock bajo o agotado
        inventario_critico = []
        for farmacia in farmacias:
            for medicamento in medicamentos:
                # Simular búsqueda de inventario crítico
                if random.random() < 0.1:  # 10% de probabilidad de tener alerta
                    stock = random.randint(0, 10)
                    estado = "agotado" if stock == 0 else "limitado"
                    
                    # Crear item de inventario temporal para la alerta
                    inv_temp = Inventario(
                        medicamento_id=medicamento.id,
                        farmacia_id=farmacia.id,
                        stock=stock,
                        estado=estado
                    )
                    inventario_critico.append(inv_temp)
        
        # Crear alertas basadas en inventario crítico
        for _ in range(500):
            if not inventario_critico:
                # Si no hay suficiente inventario crítico, crear alertas genéricas
                farmacia = random.choice(farmacias)
                medicamento = random.choice(medicamentos)
                tipo_alerta = random.choice(["stock_bajo", "agotado", "vencimiento_proximo"])
            else:
                inv = random.choice(inventario_critico)
                farmacia_id = inv.farmacia_id
                medicamento_id = inv.medicamento_id
                
                # Obtener objetos reales
                farmacia = next(f for f in farmacias if f.id == farmacia_id)
                medicamento = next(m for m in medicamentos if m.id == medicamento_id)
                
                if inv.stock == 0:
                    tipo_alerta = "agotado"
                elif inv.stock < 10:
                    tipo_alerta = "stock_bajo"
                else:
                    tipo_alerta = "vencimiento_proximo"
            
            mensajes = {
                "stock_bajo": f"Stock bajo de {medicamento.nombre} en {farmacia.nombre}",
                "agotado": f"Producto agotado: {medicamento.nombre} en {farmacia.nombre}",
                "vencimiento_proximo": f"Vencimiento próximo: {medicamento.nombre} en {farmacia.nombre}"
            }
            
            alerta = AlertaStock(
                inventario_id=random.randint(1, max(1, inventario_creado)),  # Referencia a inventario existente
                tipo_alerta=tipo_alerta,
                mensaje=mensajes[tipo_alerta],
                resuelta=random.choice([True, False])
            )
            alertas_items.append(alerta)
            alertas_creadas += 1
            
            if len(alertas_items) >= 100:
                db.bulk_save_objects(alertas_items)
                db.commit()
                alertas_items = []
        
        if alertas_items:
            db.bulk_save_objects(alertas_items)
            db.commit()
        
        print(f"  ✓ Total alertas creadas: {alertas_creadas}")
        
        # ==================== CREAR NOTIFICACIONES (1,000) ====================
        print("\n🔔 Creando 1,000 notificaciones...")
        
        notificaciones_creadas = 0
        notificaciones_items = []
        
        tipos_notificacion = ["info", "warning", "success", "error"]
        titulos = [
            "Bienvenido a MediStock",
            "Recordatorio de medicamento",
            "Stock disponible",
            "Pedido procesado",
            "Actualización de sistema",
            "Nueva farmacia cercana",
            "Oferta especial",
            "Recordatorio de cita",
            "Confirmación de registro",
            "Alerta de vencimiento"
        ]
        mensajes_base = [
            "Tu cuenta ha sido creada exitosamente.",
            "Recuerda tomar tu medicamento a la hora indicada.",
            "El medicamento que buscas está disponible en tu farmacia cercana.",
            "Tu pedido ha sido procesado y está en camino.",
            "Hemos actualizado nuestro sistema con nuevas funcionalidades.",
            "Una nueva farmacia se ha registrado en tu zona.",
            "Aprovecha nuestras ofertas especiales en medicamentos.",
            "Tienes una cita programada para mañana.",
            "Tu registro ha sido confirmado correctamente.",
            "Algunos de tus medicamentos están próximos a vencer."
        ]
        
        for _ in range(1000):
            usuario = random.choice(usuarios)
            tipo = random.choice(tipos_notificacion)
            titulo = random.choice(titulos)
            mensaje = random.choice(mensajes_base)
            leida = random.choice([True, False])
            
            notificacion = Notificacion(
                usuario_id=usuario.id,
                titulo=titulo,
                mensaje=mensaje,
                tipo=tipo,
                leida=leida,
                fecha_lectura=datetime.now() if leida else None
            )
            notificaciones_items.append(notificacion)
            notificaciones_creadas += 1
            
            if len(notificaciones_items) >= 200:
                db.bulk_save_objects(notificaciones_items)
                db.commit()
                notificaciones_items = []
        
        if notificaciones_items:
            db.bulk_save_objects(notificaciones_items)
            db.commit()
        
        print(f"  ✓ Total notificaciones creadas: {notificaciones_creadas}")
        
        # ==================== CREAR EPS (catálogo) ====================
        print("\n🏥 Creando catálogo de EPS...")

        eps_creadas = 0
        for nombre_eps in EPS_LIST:
            # Evitar duplicados si el seed se ejecuta parcialmente
            existente = db.query(EPS).filter(EPS.nombre == nombre_eps).first()
            if not existente:
                nueva_eps = EPS(nombre=nombre_eps, activo=True)
                db.add(nueva_eps)
                eps_creadas += 1

        db.commit()
        print(f"  ✓ Total EPS creadas: {eps_creadas}")

        # ==================== CREAR HORARIOS DISPONIBLES ====================
        print("\n🕐 Creando horarios disponibles para las primeras 10 farmacias...")

        from datetime import timedelta as td

        horarios_creados = 0
        franjas = [
            ("08:00", "08:30"),
            ("08:30", "09:00"),
            ("09:00", "09:30"),
            ("09:30", "10:00"),
            ("10:00", "10:30"),
            ("10:30", "11:00"),
            ("14:00", "14:30"),
            ("14:30", "15:00"),
            ("15:00", "15:30"),
            ("15:30", "16:00"),
        ]

        from datetime import time as dtime

        # Crear horarios para los próximos 7 días en las primeras 10 farmacias
        for farmacia in farmacias[:10]:
            for dias_adelante in range(1, 8):
                fecha_horario = date.today() + td(days=dias_adelante)
                for hora_ini_str, hora_fin_str in franjas:
                    h_ini = dtime(*map(int, hora_ini_str.split(":")))
                    h_fin = dtime(*map(int, hora_fin_str.split(":")))
                    horario = HorarioDisponible(
                        farmacia_id=farmacia.id,
                        fecha=fecha_horario,
                        hora_inicio=h_ini,
                        hora_fin=h_fin,
                        capacidad_maxima=random.randint(1, 3),
                        turnos_agendados=0,
                        activo=True,
                    )
                    db.add(horario)
                    horarios_creados += 1

        db.commit()
        print(f"  ✓ Total horarios disponibles creados: {horarios_creados}")

        # ==================== RESUMEN ====================
        print("\n" + "="*60)
        print("✅ SEED COMPLETADO EXITOSAMENTE")
        print("="*60)
        print(f"\n📊 Estadísticas:")
        print(f"   • EPS disponibles: {len(EPS_LIST)}")
        print(f"   • Usuarios: {len(usuarios)}")
        print(f"     - Administradores: 5")
        print(f"     - Farmacéuticos: 15")
        print(f"     - Pacientes: 80")
        print(f"   • Medicamentos: {len(medicamentos)}")
        print(f"   • Farmacias: {len(farmacias)}")
        print(f"   • Registros de inventario: {inventario_creado}")
        print(f"   • Historial de consultas: {historial_creado}")
        print(f"   • Alertas de stock: {alertas_creadas}")
        print(f"   • Notificaciones: {notificaciones_creadas}")
        print(f"\n👤 Credenciales de prueba:")
        print(f"   • Admin: cedula=10000000, password=admin123")
        print(f"   • Farmacéutico: cedula=20000000, password=farma123")
        print(f"   • Paciente: cedula=30000000, password=paciente123")
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
