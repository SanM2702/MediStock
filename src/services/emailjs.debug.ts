/**
 * Debug Helper para EmailJS
 * 
 * Usa este archivo para diagnosticar problemas con EmailJS
 * 
 * INSTRUCCIONES:
 * 1. Copia este código en tu navegador (F12 > Console)
 * 2. Ejecuta las funciones de prueba
 * 3. Observa los logs para ver exactamente qué se envía
 * 4. Compara con la estructura de tus templates en EmailJS
 */

import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTestEmail,
  verifyEmailJSConfig
} from '../services/emailjs';

// ════════════════════════════════════════════════════════════════
// 1. VERIFICAR CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════

export const debugCheckConfig = () => {
  console.group('🔍 Verificando configuración de EmailJS');
  
  const isConfigured = verifyEmailJSConfig();
  
  console.log('✓ Configuración válida:', isConfigured);
  console.log('Public Key:', 'AZl3ElhhiWkKCbYLw');
  console.log('Service ID:', 'service_4fkq7by');
  console.log('Template (Bienvenida):', 'template_jha15ik');
  console.log('Template (Restaurar):', 'template_qx9d5eg');
  
  console.groupEnd();
};

// ════════════════════════════════════════════════════════════════
// 2. ENVIAR CORREO DE PRUEBA
// ════════════════════════════════════════════════════════════════

export const debugSendTest = async (testEmail: string = 'test@example.com') => {
  console.group('🧪 Enviando correo de prueba');
  console.log('Email de prueba:', testEmail);
  
  try {
    await sendTestEmail(testEmail);
    console.log('✓ Correo de prueba enviado exitosamente');
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    console.error('Status:', error.status);
    console.error('Detalles:', error);
  }
  
  console.groupEnd();
};

// ════════════════════════════════════════════════════════════════
// 3. SIMULAR ENVÍO DE BIENVENIDA
// ════════════════════════════════════════════════════════════════

export const debugSendWelcome = async () => {
  console.group('👋 Simulando envío de bienvenida');
  
  const testData = {
    email: 'usuario@example.com',
    nombre: 'Juan Pérez',
    cedula: '1234567890',
    activationLink: 'https://medistock.app/activate/12345'
  };
  
  console.log('Datos de prueba:', testData);
  
  try {
    await sendWelcomeEmail(
      testData.email,
      testData.nombre,
      testData.cedula,
      testData.activationLink
    );
    console.log('✓ Correo de bienvenida enviado');
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    console.error('Status:', error.status);
  }
  
  console.groupEnd();
};

// ════════════════════════════════════════════════════════════════
// 4. SIMULAR ENVÍO DE RESTAURACIÓN
// ════════════════════════════════════════════════════════════════

export const debugSendPasswordReset = async () => {
  console.group('🔑 Simulando envío de restauración');
  
  const testData = {
    email: 'usuario@example.com',
    nombre: 'Juan Pérez',
    resetLink: 'https://medistock.app/reset-password/abc123token',
    expirationTime: '2 horas'
  };
  
  console.log('Datos de prueba:', testData);
  
  try {
    await sendPasswordResetEmail(
      testData.email,
      testData.nombre,
      testData.resetLink,
      testData.expirationTime
    );
    console.log('✓ Correo de restauración enviado');
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    console.error('Status:', error.status);
  }
  
  console.groupEnd();
};

// ════════════════════════════════════════════════════════════════
// 5. DIAGNÓSTICO COMPLETO
// ════════════════════════════════════════════════════════════════

export const debugFullDiagnosis = async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔧 DIAGNÓSTICO COMPLETO DE EMAILJS');
  console.log('═══════════════════════════════════════════════════════════');
  
  // 1. Verificar config
  debugCheckConfig();
  
  console.log('\n');
  
  // 2. Enviar test
  console.log('💡 Tip: Si EmailJS falla con error 422, significa que:');
  console.log('   • Los nombres de las variables no coinciden con el template');
  console.log('   • Faltan variables requeridas en el template');
  console.log('   • El template ID es incorrecto');
  console.log('\n📋 VARIABLES ESPERADAS EN TEMPLATES:\n');
  
  console.log('Template Bienvenida (template_jha15ik):');
  console.log('  ✓ to_email (correo destino)');
  console.log('  ✓ to_name (nombre para saludo)');
  console.log('  ✓ user_name (nombre del usuario)');
  console.log('  ✓ user_cedula (cédula del usuario)');
  console.log('  ✓ activation_link (link de activación)');
  console.log('  ✓ timestamp (fecha/hora)');
  console.log('  ? message_html (fallback para HTML)');
  
  console.log('\nTemplate Restaurar (template_qx9d5eg):');
  console.log('  ✓ to_email (correo destino)');
  console.log('  ✓ to_name (nombre para saludo)');
  console.log('  ✓ user_name (nombre del usuario)');
  console.log('  ✓ reset_link (link de restauración)');
  console.log('  ✓ expiration_time (tiempo de expiración)');
  console.log('  ✓ timestamp (fecha/hora)');
  console.log('  ? message_html (fallback para HTML)');
  
  console.log('\n═══════════════════════════════════════════════════════════');
};

// ════════════════════════════════════════════════════════════════
// CÓMO USAR EN LA CONSOLA DEL NAVEGADOR
// ════════════════════════════════════════════════════════════════

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        🚀 GUÍA DE DEBUGGING PARA EMAILJS ERROR 422           ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║ PASO 1: Verificar configuración                              ║
║ > debugCheckConfig()                                          ║
║                                                               ║
║ PASO 2: Enviar correo de prueba                              ║
║ > debugSendTest('tunombre@example.com')                      ║
║                                                               ║
║ PASO 3: Simular envío de bienvenida                          ║
║ > debugSendWelcome()                                          ║
║                                                               ║
║ PASO 4: Simular envío de restauración                        ║
║ > debugSendPasswordReset()                                    ║
║                                                               ║
║ PASO 5: Diagnóstico completo                                 ║
║ > debugFullDiagnosis()                                        ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║ 🔍 Si el error 422 persiste:                                 ║
║                                                               ║
║ 1. Abre EmailJS Dashboard                                    ║
║ 2. Ve a Templates                                            ║
║ 3. Abre template_jha15ik y template_qx9d5eg                 ║
║ 4. Verifica que las variables {{...}} usen estos nombres:    ║
║    - {{to_email}} o {{to_recipient}}                        ║
║    - {{to_name}} o {{user_name}}                            ║
║    - {{user_cedula}} (en bienvenida)                        ║
║    - {{reset_link}} (en restauración)                       ║
║                                                               ║
║ 5. Si están diferentes, actualiza src/services/emailjs.ts   ║
║                                                               ║
║ 6. Vuelve a ejecutar debugFullDiagnosis()                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
