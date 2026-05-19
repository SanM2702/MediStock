/**
 * Servicio de EmailJS
 * Gestiona el envío de correos de:
 * - Bienvenida/Activación de cuenta
 * - Restauración de contraseña
 */
import emailjs from '@emailjs/browser';

// Credenciales de EmailJS
const PUBLIC_KEY = 'AZl3ElhhiWkKCbYLw';
const SERVICE_ID = 'service_4fkq7by';
const TEMPLATE_ID_BIENVENIDA = 'template_jha15ik';
const TEMPLATE_ID_RESTAURAR = 'template_qx9d5eg';

// Inicializar EmailJS
emailjs.init(PUBLIC_KEY);

interface MailParams {
  [key: string]: any;
}

/**
 * Enviar correo de bienvenida/activación
 * @param email - Correo del usuario
 * @param nombre - Nombre del usuario
 * @param cedula - Cédula del usuario (para referencia)
 * @param eps - EPS del usuario (ej: "Sura", "Sanitas")
 * @param activationLink - Link de activación de cuenta (opcional)
 */
export const sendWelcomeEmail = async (
  email: string,
  nombre: string,
  cedula: string,
  eps: string,
  activationLink?: string
): Promise<boolean> => {
  try {
    // Validar parámetros requeridos
    if (!email || !nombre) {
      throw new Error('Email y nombre son requeridos');
    }

    const templateParams: MailParams = {
      // Variables estándar de EmailJS
      to_email: email,
      to_name: nombre,
      reply_to: email,

      // Variables específicas del template
      user_cedula: cedula || 'N/A',
      user_eps: eps || 'No especificada',  // ← ¿TIENES ESTA LÍNEA?
      user_name: nombre,

      activation_link: activationLink || `${window.location.origin}/activate`,
      timestamp: new Date().toLocaleString('es-CO'),
      
      // Parámetros de fallback por si el template tiene otras variables
      message_html: `
        <h2>¡Bienvenido a MediStock!</h2>
        <p>Hola ${nombre},</p>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <p><a href="${activationLink || `${window.location.origin}/activate`}">Activar cuenta</a></p>
      `
    };

    console.log('📧 Enviando correo de bienvenida:', { email, nombre });
    console.log('📋 Parámetros:', templateParams);

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID_BIENVENIDA,
      templateParams,
      PUBLIC_KEY // Pasar la key explícitamente
    );

    console.log('✓ Correo de bienvenida enviado:', response);
    return true;
  } catch (error: any) {
    console.error('✗ Error al enviar correo de bienvenida:', error);
    console.error('Error status:', error.status);
    console.error('Error text:', error.text);
    throw new Error(`No se pudo enviar el correo de bienvenida: ${error.message}`);
  }
};

/**
 * Enviar correo de restauración de contraseña
 * @param email - Correo del usuario
 * @param nombre - Nombre del usuario
 * @param resetLink - Link de restauración de contraseña
 * @param expirationTime - Tiempo de expiración del link (ej: "1 hora")
 */
export const sendPasswordResetEmail = async (
  email: string,
  nombre: string,
  resetLink: string,
  expirationTime: string = '1 hora'
): Promise<boolean> => {
  try {
    // Validar parámetros requeridos
    if (!email || !nombre || !resetLink) {
      throw new Error('Email, nombre y resetLink son requeridos');
    }

    const templateParams: MailParams = {
      // Variables estándar de EmailJS
      to_email: email,
      to_name: nombre,
      reply_to: email,
      
      // Variables específicas del template
      user_name: nombre,
      reset_link: resetLink,
      expiration_time: expirationTime,
      timestamp: new Date().toLocaleString('es-CO'),
      
      // Parámetros de fallback
      message_html: `
        <h2>Recuperar Contraseña</h2>
        <p>Hola ${nombre},</p>
        <p>Haz clic en el siguiente enlace para restaurar tu contraseña:</p>
        <p><a href="${resetLink}">Restaurar contraseña</a></p>
        <p><strong>Este enlace expira en ${expirationTime}</strong></p>
      `
    };

    console.log('📧 Enviando correo de restauración:', { email, nombre });
    console.log('📋 Parámetros:', templateParams);

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID_RESTAURAR,
      templateParams,
      PUBLIC_KEY // Pasar la key explícitamente
    );

    console.log('✓ Correo de restauración enviado:', response);
    return true;
  } catch (error: any) {
    console.error('✗ Error al enviar correo de restauración:', error);
    console.error('Error status:', error.status);
    console.error('Error text:', error.text);
    throw new Error(`No se pudo enviar el correo de restauración: ${error.message}`);
  }
};

/**
 * Enviar correo de prueba (para debugging)
 */
export const sendTestEmail = async (testEmail: string): Promise<boolean> => {
  try {
    const templateParams: MailParams = {
      to_email: testEmail,
      to_name: 'Usuario Prueba',
      reply_to: testEmail,
      user_name: 'Usuario Prueba',
      message_html: '<p>Este es un correo de prueba desde MediStock</p>'
    };

    console.log('📧 Enviando correo de prueba a:', testEmail);

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID_BIENVENIDA,
      templateParams,
      PUBLIC_KEY
    );

    console.log('✓ Correo de prueba enviado:', response);
    return true;
  } catch (error: any) {
    console.error('✗ Error en correo de prueba:', error);
    throw new Error(`Error en prueba: ${error.message}`);
  }
};

/**
 * Verificar si EmailJS está correctamente configurado
 */
export const verifyEmailJSConfig = (): boolean => {
  try {
    return !!(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID_BIENVENIDA && TEMPLATE_ID_RESTAURAR);
  } catch {
    return false;
  }
};
