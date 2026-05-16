/**
 * 🔍 ANÁLISIS DE EMAILJS - "The recipients address is empty"
 * 
 * Este archivo diagnóstica exactamente el problema con los correos
 */

// ════════════════════════════════════════════════════════════════
// PROBLEMA IDENTIFICADO
// ════════════════════════════════════════════════════════════════

/*
Error: "The recipients address is empty"

CAUSA RAÍZ:
EmailJS tiene dos lugares diferentes para configurar el destinatario:

1. Campo "To Email" (Configuración del Template)
   └─ Este es OBLIGATORIO y debe estar configurado en EmailJS Dashboard
   └─ Puede usar una variable: {{to_email}}
   
2. Variables del template ({{to_email}}, {{to_name}}, etc.)
   └─ Estas se envían en templateParams desde el código
   └─ Se usan para reemplazar contenido EN el cuerpo del email

El problema es que el campo "To Email" del template NO ESTÁ configurado
para recibir el valor de {{to_email}}.
*/

// ════════════════════════════════════════════════════════════════
// QUÉ ESTÁ SIENDO ENVIADO ACTUALMENTE
// ════════════════════════════════════════════════════════════════

export const CURRENT_EMAIL_PARAMS = {
  descripcion: 'Lo que enviamos en sendPasswordResetEmail()',
  
  templateParams: {
    to_email: 'usuario@example.com',      // ← El correo que queremos enviar
    to_name: 'Juan Pérez',                // ← Nombre del usuario
    reply_to: 'usuario@example.com',      // ← Para respuestas
    user_name: 'Juan Pérez',
    reset_link: 'https://...',
    expiration_time: '2 horas',
    timestamp: '14/5/2026 10:30:45',
    message_html: '<h2>...</h2>'
  },
  
  problema: `
    El código ENVÍA la variable to_email correctamente,
    pero el TEMPLATE DE EMAILJS no está configurado para recibirla.
    
    EmailJS Dashboard debería tener el campo "To Email" configurado como:
    {{to_email}}
    
    Si está configurado como algo diferente, los correos no se envían.
  `
};

// ════════════════════════════════════════════════════════════════
// SOLUCIÓN: CONFIGURACIÓN CORRECTA EN EMAILJS DASHBOARD
// ════════════════════════════════════════════════════════════════

export const EMAILJS_DASHBOARD_CONFIG = {
  paso1: {
    titulo: 'Ir a Email Templates',
    url: 'https://dashboard.emailjs.com/admin/templates',
    accion: 'Haz clic en template_qx9d5eg (Restaurar Contraseña)'
  },
  
  paso2: {
    titulo: 'Buscar el campo "To Email"',
    ubicacion: 'En la parte superior o derecha del editor',
    que_debe_decir: '{{to_email}}',
    importante: '✓ DEBE SER EXACTAMENTE {{to_email}}'
  },
  
  paso3: {
    titulo: 'Verificar que en el cuerpo (Body) use variables',
    ejemplo_correcto: `
      <h2>Recuperar tu contraseña</h2>
      <p>Hola {{to_name}},</p>
      <p>Haz clic: <a href="{{reset_link}}">Restaurar</a></p>
      <p>Válido por: {{expiration_time}}</p>
    `,
    nota: 'Las variables en {{}} se reemplazan con lo que envía el código'
  },
  
  paso4: {
    titulo: 'Guardar cambios',
    accion: 'Clic en Save o Update'
  }
};

// ════════════════════════════════════════════════════════════════
// VISUAL: QUÉ DEBE VERSE EN EMAILJS DASHBOARD
// ════════════════════════════════════════════════════════════════

export const EMAILJS_UI_GUIDE = `
╔══════════════════════════════════════════════════════════════════╗
║             EMAILJS DASHBOARD - Template Configuration           ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Template Name: Restaurar Contraseña                            ║
║  Template ID: template_qx9d5eg                                  ║
║                                                                  ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │ Email Settings:                                            │ ║
║  │ ┌──────────────────────────────────────────────────────┐  │ ║
║  │ │ To Email:     [{{to_email}}]              ✓ CORRECTO │  │ ║
║  │ │ To Name:      [{{to_name}}] (opcional)               │  │ ║
║  │ │ Reply To:     [{{reply_to}}] (opcional)              │  │ ║
║  │ │ Subject:      [Recuperar tu contraseña - MediStock]  │  │ ║
║  │ └──────────────────────────────────────────────────────┘  │ ║
║  │                                                            │ ║
║  │ Email Body:                                                │ ║
║  │ ┌──────────────────────────────────────────────────────┐  │ ║
║  │ │ <h2>Recuperar Contraseña</h2>                        │  │ ║
║  │ │ <p>Hola {{to_name}},</p>                             │  │ ║
║  │ │ <p>Haz clic para restaurar:</p>                      │  │ ║
║  │ │ <a href="{{reset_link}}">Restaurar Contraseña</a>    │  │ ║
║  │ │ <p>Válido por: {{expiration_time}}</p>               │  │ ║
║  │ └──────────────────────────────────────────────────────┘  │ ║
║  └────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  [SAVE]                                                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`;

// ════════════════════════════════════════════════════════════════
// COMPROBACIÓN: QUÉ VERIFICA EMAILJS
// ════════════════════════════════════════════════════════════════

export const EMAILJS_VALIDATION_FLOW = `
Cuando envías un correo, EmailJS hace esto:

1. ¿El campo "To Email" está configurado?
   ✓ Sí: El campo tiene un valor fijo o una variable
   ✗ No: ERROR - "The recipients address is empty"

2. ¿El campo "To Email" tiene {{to_email}}?
   ✓ Sí: Busca la variable to_email en templateParams
   ✗ No: Usa el valor fijo (si tiene)

3. ¿La variable to_email existe en templateParams?
   ✓ Sí: Reemplaza {{to_email}} con el valor
   ✗ No: ERROR - "The recipients address is empty"

4. ¿El valor de to_email es válido?
   ✓ Sí: Email válido, se envía
   ✗ No: ERROR - "Invalid email format"

════════════════════════════════════════════════════════════════

EN TU CASO:

El paso 1 está FALLANDO porque:
→ El campo "To Email" del template NO tiene {{to_email}}
→ Está vacío o configurado incorrectamente

SOLUCIÓN:
→ Ve a EmailJS Dashboard
→ Template: template_qx9d5eg
→ Configura "To Email" como: {{to_email}}
→ Guarda
`;

// ════════════════════════════════════════════════════════════════
// VERIFICACIÓN: PARÁMETROS CORRECTOS DEL CÓDIGO
// ════════════════════════════════════════════════════════════════

export const CODE_VERIFICATION = {
  titulo: 'Lo que enviamos en src/services/emailjs.ts',
  
  sendPasswordResetEmail: {
    entrada: `
      email: "usuario@example.com"
      nombre: "Juan Pérez"
      resetLink: "https://medistock.app/reset-password/token123"
      expirationTime: "2 horas"
    `,
    
    templateParams: {
      to_email: 'email',                    // ← CORRECTO: contiene el correo
      to_name: 'nombre',                    // ← CORRECTO: contiene el nombre
      reply_to: 'email',                    // ← CORRECTO: para respuestas
      user_name: 'nombre',                  // ← Para el body del email
      reset_link: 'resetLink',              // ← Para el link en el email
      expiration_time: 'expirationTime',    // ← Para mostrar tiempo
      timestamp: 'fecha/hora actual',       // ← Para timestamp
      message_html: 'HTML fallback'         // ← Contenido alternativo
    },
    
    conclusion: `
      ✓ El código ESTÁ CORRECTO
      ✓ Está enviando to_email correctamente
      ✓ El problema es en la configuración de EmailJS Dashboard
    `
  }
};

// ════════════════════════════════════════════════════════════════
// ALTERNATIVA: Si el template no tiene campo "To Email"
// ════════════════════════════════════════════════════════════════

export const ALTERNATIVE_SOLUTIONS = {
  
  opcion1: {
    nombre: 'Configurar el campo "To Email" (RECOMENDADO)',
    pasos: [
      '1. Ve a: https://dashboard.emailjs.com/admin/templates',
      '2. Abre: template_qx9d5eg',
      '3. Busca: "To Email" field',
      '4. Configúralo como: {{to_email}}',
      '5. Guarda',
      '6. Prueba de nuevo en tu app'
    ]
  },
  
  opcion2: {
    nombre: 'Crear un template NUEVO (si es necesario)',
    pasos: [
      '1. En EmailJS Dashboard, haz clic: "Create New Template"',
      '2. Nombre: "Password Reset"',
      '3. En "To Email", escribe: {{to_email}}',
      '4. En Body, escribe tu HTML con {{variables}}',
      '5. Haz clic: Create',
      '6. Copia el nuevo Template ID',
      '7. Actualiza en src/services/emailjs.ts: TEMPLATE_ID_RESTAURAR',
      '8. Prueba de nuevo'
    ]
  },
  
  opcion3: {
    nombre: 'Usar un correo fijo (SOLO PARA TESTING)',
    pasos: [
      'Si quieres probar sin cambiar el template:',
      '1. En EmailJS Dashboard, ve a Template',
      '2. En "To Email", escribe: tucorreo@example.com',
      '3. Todos los correos irán a ese correo',
      '⚠️ NOTA: Esto es solo para probar, no para producción'
    ]
  }
};

// ════════════════════════════════════════════════════════════════
// CHECKLISTA FINAL
// ════════════════════════════════════════════════════════════════

export const FINAL_CHECKLIST = `
┌──────────────────────────────────────────────────────────────────┐
│  CHECKLIST: Error "The recipients address is empty"             │
└──────────────────────────────────────────────────────────────────┘

CONFIGURACIÓN EN EMAILJS DASHBOARD:
□ Accede a: https://dashboard.emailjs.com/admin/templates
□ Abre: template_qx9d5eg (Restaurar Contraseña)
□ Busca el campo "To Email"
□ DEBE DECIR: {{to_email}}
□ GUARDA los cambios

VERIFICACIÓN DEL CÓDIGO:
□ src/services/emailjs.ts tiene to_email: email en templateParams
□ La función recibe email como parámetro
□ El email no es null o undefined
□ Se envía con: await emailjs.send(..., templateParams, PUBLIC_KEY)

PRUEBA:
□ Abre DevTools (F12)
□ Ve a Console
□ Intenta enviar un correo de recuperación
□ DEBERÍAS VER en la consola:
   📧 Enviando correo de restauración: { email: "...", nombre: "..." }
   📋 Parámetros: { to_email: "...", to_name: "...", ... }

SI VES ESOS LOGS:
✓ El código está enviando correctamente
✓ El problema es 100% en EmailJS Dashboard
✓ Ve y configura "To Email" como {{to_email}}

SI NO VES ESOS LOGS:
✗ El código no está alcanzando ese punto
✗ Podría haber un error en otra parte
✗ Revisa el código completo de PasswordRecovery.tsx
`;

// ════════════════════════════════════════════════════════════════
// EXPORTAR PARA DEBUG
// ════════════════════════════════════════════════════════════════

export const printDiagnosis = () => {
  console.clear();
  console.log('%c🔍 DIAGNÓSTICO: "The recipients address is empty"', 'font-size: 16px; font-weight: bold; color: red');
  console.log('\n');
  console.log('EL PROBLEMA:');
  console.log('El campo "To Email" en EmailJS Dashboard NO está configurado como {{to_email}}');
  console.log('\n');
  console.log('LA SOLUCIÓN:');
  console.log('1. Ve a: https://dashboard.emailjs.com/admin/templates');
  console.log('2. Abre: template_qx9d5eg');
  console.log('3. Busca: "To Email"');
  console.log('4. Configúralo como: {{to_email}}');
  console.log('5. Guarda');
  console.log('6. Prueba');
  console.log('\n');
  console.log('PARÁMETROS QUE TU CÓDIGO ENVÍA:');
  console.table({
    'to_email': 'Email del usuario ← RECIBIDOR',
    'to_name': 'Nombre para saludo',
    'reset_link': 'Link de restauración',
    'expiration_time': 'Tiempo de expiración',
    'user_name': 'Nombre del usuario',
    'timestamp': 'Fecha/hora actual'
  });
  console.log('\n');
  console.log('%cTODO LO QUE NECESITAS HACER:', 'font-weight: bold; color: green; font-size: 14px');
  console.log('Ve a EmailJS Dashboard y configura el campo "To Email" como: {{to_email}}');
  console.log('\n');
};

if (typeof window !== 'undefined') {
  console.log('%c💡 Tip: Ejecuta printDiagnosis() en la consola', 'color: orange; font-style: italic');
}
