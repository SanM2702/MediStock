"""
Ejemplos de uso del chatbot con Groq

Requiere que el servidor FastAPI esté corriendo en localhost:8000
"""

import requests
import json
import time

# ==================== CONFIGURACIÓN ====================

API_BASE_URL = "http://localhost:8000/api"
CHAT_ENDPOINT = f"{API_BASE_URL}/chat"
CHAT_ANONYMOUS_ENDPOINT = f"{API_BASE_URL}/chat/anonymous"

# ==================== EJEMPLO 1: Chat Anónimo ====================

def ejemplo_chat_anonimo():
    """
    Envía un mensaje sin autenticación.
    """
    print("=" * 60)
    print("📤 Ejemplo 1: Chat Anónimo")
    print("=" * 60)

    mensaje = "¿Qué medicamento es bueno para la gripe?"

    payload = {
        "message": mensaje
    }

    print(f"\n📝 Mensaje: {mensaje}\n")

    try:
        response = requests.post(
            CHAT_ANONYMOUS_ENDPOINT,
            json=payload,
            timeout=30
        )

        print(f"Status Code: {response.status_code}\n")

        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))

        if data.get("success"):
            print(f"\n✅ Respuesta recibida en {data.get('time_ms')}ms")
            print(f"📊 Tokens utilizados: {data.get('tokens_used')}")
        else:
            print(f"\n❌ Error: {data.get('error')}")

    except Exception as e:
        print(f"❌ Error: {str(e)}")

    print("\n")


# ==================== EJEMPLO 2: Chat con Autenticación ====================

def ejemplo_chat_autenticado(token):
    """
    Envía un mensaje con autenticación JWT.

    Args:
        token: Token JWT obtenido al hacer login
    """
    print("=" * 60)
    print("📤 Ejemplo 2: Chat Autenticado")
    print("=" * 60)

    mensaje = "¿Cuál es la dosis recomendada del ibuprofeno?"

    payload = {
        "message": mensaje
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print(f"\n📝 Mensaje: {mensaje}\n")

    try:
        response = requests.post(
            CHAT_ENDPOINT,
            json=payload,
            headers=headers,
            timeout=30
        )

        print(f"Status Code: {response.status_code}\n")

        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))

        if data.get("success"):
            print(f"\n✅ Respuesta recibida en {data.get('time_ms')}ms")
            print(f"📊 Tokens utilizados: {data.get('tokens_used')}")
        else:
            print(f"\n❌ Error: {data.get('error')}")

    except Exception as e:
        print(f"❌ Error: {str(e)}")

    print("\n")


# ==================== EJEMPLO 3: Múltiples Mensajes ====================

def ejemplo_multiples_mensajes():
    """
    Envía varios mensajes seguidos y mide el rendimiento.
    """
    print("=" * 60)
    print("📤 Ejemplo 3: Múltiples Mensajes")
    print("=" * 60)

    mensajes = [
        "Tengo dolor de cabeza, ¿qué me recomiendas?",
        "¿Dónde encuentro una farmacia?",
        "¿El paracetamol es seguro para niños?",
    ]

    times = []
    total_tokens = 0

    for i, mensaje in enumerate(mensajes, 1):
        print(f"\n📝 Mensaje {i}: {mensaje}")

        payload = {"message": mensaje}

        try:
            start = time.time()
            response = requests.post(
                CHAT_ANONYMOUS_ENDPOINT,
                json=payload,
                timeout=30
            )
            elapsed = time.time() - start

            data = response.json()

            if data.get("success"):
                print(f"✅ Respuesta: {data.get('response')[:80]}...")
                print(f"⏱️  Tiempo: {data.get('time_ms')}ms")
                times.append(data.get('time_ms', 0))
                total_tokens += data.get('tokens_used', 0)
            else:
                print(f"❌ Error: {data.get('error')}")

        except Exception as e:
            print(f"❌ Error: {str(e)}")

    # Estadísticas
    if times:
        print("\n" + "=" * 60)
        print("📊 Estadísticas:")
        print("=" * 60)
        print(f"Total de mensajes: {len(mensajes)}")
        print(f"Tiempo promedio: {sum(times) / len(times):.0f}ms")
        print(f"Tiempo mínimo: {min(times):.0f}ms")
        print(f"Tiempo máximo: {max(times):.0f}ms")
        print(f"Total de tokens: {total_tokens}")

    print("\n")


# ==================== EJEMPLO 4: Manejo de Errores ====================

def ejemplo_manejo_errores():
    """
    Demuestra el manejo de errores.
    """
    print("=" * 60)
    print("📤 Ejemplo 4: Manejo de Errores")
    print("=" * 60)

    # Test 1: Mensaje vacío
    print("\n🔴 Test 1: Mensaje vacío")
    try:
        response = requests.post(
            CHAT_ANONYMOUS_ENDPOINT,
            json={"message": ""},
            timeout=30
        )
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {str(e)}")

    # Test 2: Mensaje muy largo
    print("\n🔴 Test 2: Mensaje muy largo")
    try:
        response = requests.post(
            CHAT_ANONYMOUS_ENDPOINT,
            json={"message": "a" * 600},
            timeout=30
        )
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {str(e)}")

    # Test 3: Token inválido
    print("\n🔴 Test 3: Token inválido")
    try:
        headers = {"Authorization": "Bearer token_invalido"}
        response = requests.post(
            CHAT_ENDPOINT,
            json={"message": "Hola"},
            headers=headers,
            timeout=30
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {str(e)}")

    print("\n")


# ==================== MAIN ====================

if __name__ == "__main__":
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 12 + "EJEMPLOS DE USO - CHATBOT GROQ" + " " * 16 + "║")
    print("╚" + "=" * 58 + "╝")

    # Ejecutar ejemplos
    ejemplo_chat_anonimo()

    # Para probar el chat autenticado, necesitas un token válido
    # Descomenta esto y proporciona un token JWT válido:
    # ejemplo_chat_autenticado("tu_token_jwt_aqui")

    ejemplo_multiples_mensajes()
    ejemplo_manejo_errores()

    print("=" * 60)
    print("✨ Ejemplos completados")
    print("=" * 60)
