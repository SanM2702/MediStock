#!/bin/bash

# ==================== SETUP GROQ CHATBOT ====================
# Script para configurar el chatbot con Groq en MediStock

echo "🚀 Instalando dependencias de Groq..."

# Instalar openai (cliente de Groq)
pip install openai

echo "✅ Dependencias instaladas"

echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Verifica que GROQ_API_KEY está en BackEnd/.env"
echo "2. Inicia el servidor backend:"
echo "   python -m uvicorn main:app --reload"
echo ""
echo "3. En otra terminal, inicia el frontend:"
echo "   npm run dev"
echo ""
echo "4. Accede a http://localhost:5173/chat"
echo ""
echo "✨ ¡Listo! Tu chatbot con Groq está configurado"
