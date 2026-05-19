/**
 * 📋 VALIDADOR DE TEMPLATES - EmailJS
 * 
 * Este archivo te ayuda a verificar que tus templates en EmailJS
 * están configurados correctamente con las variables que espera el código.
 */

// ════════════════════════════════════════════════════════════════
// CONFIGURACIÓN ACTUAL EN TU CÓDIGO
// ════════════════════════════════════════════════════════════════

export const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'AZl3ElhhiWkKCbYLw',
  SERVICE_ID: 'service_4fkq7by',
  TEMPLATE_ID_BIENVENIDA: 'template_jha15ik',
  TEMPLATE_ID_RESTAURAR: 'template_qx9d5eg',
};

// ════════════════════════════════════════════════════════════════
// VARIABLES ESPERADAS EN CADA TEMPLATE
// ════════════════════════════════════════════════════════════════

/**
 * Template: template_jha15ik (BIENVENIDA)
 * 
 * ¿QUÉ ES?
 * Se envía cuando un usuario se registra por primera vez
 * 
 * ¿QUÉ VARIABLES NECESITA?
 * Estas variables deben estar en tu template de EmailJS como {{nombre}}
 */
export const TEMPLATE_BIENVENIDA_VARS = {
  // REQUERIDAS - Sin estas NO funcionará
  required: {
    'to_email': 'Email del destinatario (ej: juan@example.com)',
    'to_name': 'Nombre del destinatario para el saludo (ej: Juan)',
    'user_name': 'Nombre del usuario registrado',
    'activation_link': 'Link para activar la cuenta (ej: https://medistock.app/activate/123)',
  },
  
  // OPCIONALES - El email funcionará sin estas
  optional: {
    'user_cedula': 'Cédula del usuario para referencia',
    'timestamp': 'Fecha y hora del registro (ej: 14/5/2026 10:30:45)',
    'message_html': 'Contenido HTML de fallback',
    'reply_to': 'Email para respuestas (generalmente igual a to_email)',
  },

  // EJEMPLO DE HTML QUE DEBERÍA TENER TU TEMPLATE
  exampleHTML: `
    <h2>¡Bienvenido a MediStock!</h2>
    <p>Hola {{to_name}},</p>
    
    <p>Tu cuenta ha sido creada exitosamente.</p>
    <p>Documento: {{user_cedula}}</p>
    
    <a href="{{activation_link}}" style="background: green; color: white; padding: 10px; border-radius: 5px; text-decoration: none;">
      Activar tu cuenta
    </a>
    
    <p><small>{{timestamp}}</small></p>
  `,

  // CHECKLIST
  checklist: [
    '□ ¿Tiene {{to_email}}?',
    '□ ¿Tiene {{to_name}}?',
    '□ ¿Tiene {{user_name}}?',
    '□ ¿Tiene {{activation_link}}?',
    '□ ¿El link está en un <a href="{{activation_link}}">?',
  ]
};

/**
 * Template: template_qx9d5eg (RESTAURAR CONTRASEÑA)
 * 
 * ¿QUÉ ES?
 * Se envía cuando un usuario solicita recuperar su contraseña
 * 
 * ¿QUÉ VARIABLES NECESITA?
 * Estas variables deben estar en tu template de EmailJS como {{nombre}}
 */
export const TEMPLATE_RESTAURAR_VARS = {
  // REQUERIDAS - Sin estas NO funcionará
  required: {
    'to_email': 'Email del destinatario',
    'to_name': 'Nombre del destinatario para el saludo',
    'user_name': 'Nombre del usuario',
    'reset_link': 'Link para restaurar contraseña (ej: https://medistock.app/reset-password/token123)',
  },

  // OPCIONALES
  optional: {
    'expiration_time': 'Tiempo de expiración del link (ej: 2 horas)',
    'timestamp': 'Fecha y hora de la solicitud',
    'message_html': 'Contenido HTML de fallback',
    'reply_to': 'Email para respuestas',
  },

  // EJEMPLO DE HTML QUE DEBERÍA TENER TU TEMPLATE
  exampleHTML: `
    <h2>Recuperar tu contraseña</h2>
    <p>Hola {{to_name}},</p>
    
    <p>Has solicitado restaurar tu contraseña de MediStock.</p>
    <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
    
    <a href="{{reset_link}}" style="background: blue; color: white; padding: 10px; border-radius: 5px; text-decoration: none;">
      Restaurar mi contraseña
    </a>
    
    <p><strong>Importante:</strong> Este enlace caduca en {{expiration_time}}</p>
    <p>Si no solicitaste esto, ignora este correo.</p>
    
    <p><small>{{timestamp}}</small></p>
  `,

  // CHECKLIST
  checklist: [
    '□ ¿Tiene {{to_email}}?',
    '□ ¿Tiene {{to_name}}?',
    '□ ¿Tiene {{user_name}}?',
    '□ ¿Tiene {{reset_link}}?',
    '□ ¿El link está en un <a href="{{reset_link}}">?',
    '□ ¿Tiene {{expiration_time}} para mostrar tiempo?',
  ]
};

// ════════════════════════════════════════════════════════════════
// FUNCIÓN PARA IMPRIMIR CHECKLIST EN CONSOLA
// ════════════════════════════════════════════════════════════════

export const printValidationChecklist = () => {
  console.clear();
  console.log('%c📋 VALIDACIÓN DE TEMPLATES EN EMAILJS', 'font-size: 16px; font-weight: bold; color: blue');
  console.log('\n');
  
  console.group('✉️ Template Bienvenida (template_jha15ik)');
  console.log('Variables requeridas:');
  Object.entries(TEMPLATE_BIENVENIDA_VARS.required).forEach(([key, desc]) => {
    console.log(`  {{${key}}} - ${desc}`);
  });
  console.log('\nVariables opcionales:');
  Object.entries(TEMPLATE_BIENVENIDA_VARS.optional).forEach(([key, desc]) => {
    console.log(`  {{${key}}} - ${desc}`);
  });
  console.log('\nChecklist:');
  TEMPLATE_BIENVENIDA_VARS.checklist.forEach(item => console.log(item));
  console.groupEnd();
  
  console.log('\n');
  
  console.group('🔑 Template Restaurar (template_qx9d5eg)');
  console.log('Variables requeridas:');
  Object.entries(TEMPLATE_RESTAURAR_VARS.required).forEach(([key, desc]) => {
    console.log(`  {{${key}}} - ${desc}`);
  });
  console.log('\nVariables opcionales:');
  Object.entries(TEMPLATE_RESTAURAR_VARS.optional).forEach(([key, desc]) => {
    console.log(`  {{${key}}} - ${desc}`);
  });
  console.log('\nChecklist:');
  TEMPLATE_RESTAURAR_VARS.checklist.forEach(item => console.log(item));
  console.groupEnd();
  
  console.log('\n');
  console.log('%c🔗 PRÓXIMOS PASOS:', 'font-weight: bold; color: green');
  console.log('1. Abre https://dashboard.emailjs.com/');
  console.log('2. Ve a Email Templates');
  console.log('3. Haz clic en template_jha15ik y template_qx9d5eg');
  console.log('4. Verifica que TODOS los {{variables}} arriba estén en tu template');
  console.log('5. Si falta algo, agrégalo a tu template en EmailJS');
  console.log('6. Si cambias nombres, actualiza src/services/emailjs.ts');
};

// ════════════════════════════════════════════════════════════════
// DETECTAR VARIABLES FALTANTES
// ════════════════════════════════════════════════════════════════

/**
 * Compara lo que ESTÁ EN el código vs lo que DEBERÍA estar
 */
export const validateTemplateConfig = () => {
  console.group('🔍 Validación de Configuración');
  
  console.log('✓ PUBLIC_KEY configurada:', !!EMAILJS_CONFIG.PUBLIC_KEY);
  console.log('✓ SERVICE_ID configurada:', !!EMAILJS_CONFIG.SERVICE_ID);
  console.log('✓ TEMPLATE_ID_BIENVENIDA:', !!EMAILJS_CONFIG.TEMPLATE_ID_BIENVENIDA);
  console.log('✓ TEMPLATE_ID_RESTAURAR:', !!EMAILJS_CONFIG.TEMPLATE_ID_RESTAURAR);
  
  console.log('\n Variables esperadas en BIENVENIDA:');
  const bienvenidaRequiredCount = Object.keys(TEMPLATE_BIENVENIDA_VARS.required).length;
  console.log(`  → ${bienvenidaRequiredCount} variables requeridas`);
  
  console.log('\n Variables esperadas en RESTAURAR:');
  const restaurarRequiredCount = Object.keys(TEMPLATE_RESTAURAR_VARS.required).length;
  console.log(`  → ${restaurarRequiredCount} variables requeridas`);
  
  console.groupEnd();
};

// ════════════════════════════════════════════════════════════════
// MOSTRAR EJEMPLO DE PARÁMETROS A ENVIAR
// ════════════════════════════════════════════════════════════════

/**
 * Muestra exactamente qué parámetros enviará emailjs.ts
 */
export const showExampleParameters = () => {
  console.group('📤 Parámetros que se enviarán a EmailJS');
  
  const exampleBienvenida = {
    to_email: 'juan@example.com',
    to_name: 'Juan Pérez',
    reply_to: 'juan@example.com',
    user_cedula: '1234567890',
    user_name: 'Juan Pérez',
    activation_link: 'https://medistock.app/activate/user123',
    timestamp: new Date().toLocaleString('es-CO'),
    message_html: '<h2>¡Bienvenido!</h2>'
  };

  const exampleRestaurar = {
    to_email: 'juan@example.com',
    to_name: 'Juan Pérez',
    reply_to: 'juan@example.com',
    user_name: 'Juan Pérez',
    reset_link: 'https://medistock.app/reset-password/token123abc',
    expiration_time: '2 horas',
    timestamp: new Date().toLocaleString('es-CO'),
    message_html: '<h2>Recuperar contraseña</h2>'
  };

  console.group('Bienvenida:');
  console.table(exampleBienvenida);
  console.groupEnd();

  console.group('Restaurar:');
  console.table(exampleRestaurar);
  console.groupEnd();
  
  console.groupEnd();
};

// ════════════════════════════════════════════════════════════════
// EXPORTAR TODO COMO FUNCIÓN ÚNICA DE DIAGNÓSTICO
// ════════════════════════════════════════════════════════════════

export const emailjsDiagnostic = () => {
  console.clear();
  console.log('%c╔════════════════════════════════════════════════════╗', 'color: cyan; font-size: 12px');
  console.log('%c║   🔧 DIAGNÓSTICO DE EMAILJS - ERROR 422          ║', 'color: cyan; font-size: 12px; font-weight: bold');
  console.log('%c╚════════════════════════════════════════════════════╝', 'color: cyan; font-size: 12px');
  
  console.log('\n');
  
  validateTemplateConfig();
  
  console.log('\n');
  printValidationChecklist();
  
  console.log('\n');
  showExampleParameters();
  
  console.log('\n');
  console.log('%c✅ INSTRUCCIONES FINALES:', 'font-size: 14px; font-weight: bold; color: green');
  console.log(`
1. Abre: https://dashboard.emailjs.com/email-templates/${EMAILJS_CONFIG.TEMPLATE_ID_BIENVENIDA}
2. Verifica que ALL {{variables}} de arriba están en el template
3. Si algo falta, edita el template y agrega {{variable}}
4. Si cambias los nombres de {{variables}}, actualiza src/services/emailjs.ts
5. Vuelve a ejecutar emailjsDiagnostic() después de cambios
  `);
};

// ════════════════════════════════════════════════════════════════
// EXPORTAR PARA USO EN CONSOLA
// ════════════════════════════════════════════════════════════════

// Si estás en desarrollo, ejecuta automáticamente:
if (process.env.NODE_ENV === 'development') {
  console.log('%c💡 Tip: Ejecuta emailjsDiagnostic() en la consola para diagnóstico completo', 'color: orange; font-style: italic');
}
