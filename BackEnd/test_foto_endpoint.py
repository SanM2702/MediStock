#!/usr/bin/env python3
"""
Script de prueba para validar la funcionalidad de subida de fotos en MediStock
Uso: python test_foto_endpoint.py
"""

import requests
import json
import sys
from pathlib import Path

# Colores para output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

# Configuración
API_BASE_URL = "http://127.0.0.1:8000/api"
TEST_USER_CEDULA = "111222"
TEST_USER_PASSWORD = "pass123"
TEST_IMAGE_PATH = "test_image.jpg"  # Crear una imagen de prueba

def crear_imagen_prueba():
    """Crea una pequeña imagen de prueba si no existe"""
    try:
        from PIL import Image
        import io
        
        # Crear imagen RGB simple (1x1 pixel rojo)
        img = Image.new('RGB', (100, 100), color='red')
        img.save(TEST_IMAGE_PATH)
        print_success(f"Imagen de prueba creada: {TEST_IMAGE_PATH}")
        return True
    except ImportError:
        print_warning("PIL no está instalado. Descargando imagen de prueba...")
        try:
            # Intenta descargar una imagen de prueba
            import urllib.request
            url = "https://via.placeholder.com/100x100/FF0000/FF0000"
            urllib.request.urlretrieve(url, TEST_IMAGE_PATH)
            print_success(f"Imagen de prueba descargada: {TEST_IMAGE_PATH}")
            return True
        except:
            print_error("No se pudo crear imagen de prueba")
            return False

def test_health_check():
    """Verifica que el backend está disponible"""
    print_header("1. Health Check - ¿Está el backend en línea?")
    try:
        response = requests.get(f"http://127.0.0.1:8000/health", timeout=5)
        if response.status_code == 200:
            print_success("Backend está en línea")
            data = response.json()
            print_info(f"Estado: {data.get('status')}")
            print_info(f"Timestamp: {data.get('timestamp')}")
            return True
        else:
            print_error(f"Backend retornó: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("No se puede conectar al backend en http://127.0.0.1:8000")
        print_warning("Asegúrate de que el backend está ejecutándose: python BackEnd/main.py")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_login():
    """Obtiene un token JWT válido"""
    print_header("2. Login - Obtener token JWT")
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={
                "cedula": TEST_USER_CEDULA,
                "password": TEST_USER_PASSWORD
            },
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print_success(f"Login exitoso")
            print_info(f"Token: {token[:20]}...")
            return token
        else:
            print_error(f"Login fallido: {response.status_code}")
            print_info(f"Respuesta: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error en login: {str(e)}")
        return None

def test_get_profile(token):
    """Obtiene el perfil del usuario"""
    print_header("3. Get Profile - Obtener datos del usuario")
    try:
        response = requests.get(
            f"{API_BASE_URL}/usuarios/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        
        if response.status_code == 200:
            user = response.json()
            print_success("Perfil obtenido exitosamente")
            print_info(f"Usuario: {user.get('nombre')} {user.get('apellido')}")
            print_info(f"Email: {user.get('email')}")
            print_info(f"Foto actual: {user.get('foto_url') or 'Sin foto'}")
            return user
        else:
            print_error(f"Error al obtener perfil: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

def test_upload_foto(token):
    """Sube una foto de perfil"""
    print_header("4. Upload Foto - Subir foto de perfil")
    
    # Crear imagen de prueba si no existe
    if not Path(TEST_IMAGE_PATH).exists():
        if not crear_imagen_prueba():
            print_error("No se pudo crear imagen de prueba")
            return False
    
    try:
        with open(TEST_IMAGE_PATH, 'rb') as f:
            files = {'file': ('test_image.jpg', f, 'image/jpeg')}
            
            response = requests.post(
                f"{API_BASE_URL}/usuarios/me/foto",
                headers={"Authorization": f"Bearer {token}"},
                files=files,
                timeout=10
            )
        
        if response.status_code == 200:
            user = response.json()
            print_success("Foto subida exitosamente")
            print_info(f"Nueva URL: {user.get('foto_url')}")
            return True
        elif response.status_code == 503:
            print_error("Servicio no disponible (503)")
            data = response.json()
            print_warning(f"Detalle: {data.get('detail')}")
            print_warning("\n💡 Solución: Configura las variables de Cloudinary en BackEnd/.env")
            print_warning("   CLOUDINARY_CLOUD_NAME=...")
            print_warning("   CLOUDINARY_API_KEY=...")
            print_warning("   CLOUDINARY_API_SECRET=...")
            return False
        else:
            print_error(f"Error al subir foto: {response.status_code}")
            data = response.json()
            print_info(f"Detalle: {data.get('detail')}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def run_all_tests():
    """Ejecuta todos los tests"""
    print(f"\n{Colors.BOLD}{Colors.OKCYAN}")
    print("╔═══════════════════════════════════════════════════════╗")
    print("║     MEDISTOCK - Test de Subida de Foto de Perfil     ║")
    print("╚═══════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}")
    
    print_info(f"API Base URL: {API_BASE_URL}")
    print_info(f"Usuario de prueba: Cédula {TEST_USER_CEDULA}")
    
    # Test 1: Health Check
    if not test_health_check():
        print_error("\n⛔ El backend no está disponible. Detiene aquí.")
        return False
    
    # Test 2: Login
    token = test_login()
    if not token:
        print_error("\n⛔ No se pudo autenticar. Detiene aquí.")
        return False
    
    # Test 3: Get Profile
    user = test_get_profile(token)
    if not user:
        print_error("\n⛔ No se pudo obtener perfil. Detiene aquí.")
        return False
    
    # Test 4: Upload Foto
    if test_upload_foto(token):
        print_header("✅ TODOS LOS TESTS PASARON")
        print_success("La funcionalidad de foto de perfil está funcionando correctamente")
        return True
    else:
        print_header("❌ ALGUNOS TESTS FALLARON")
        print_error("Revisa los mensajes de error arriba")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
