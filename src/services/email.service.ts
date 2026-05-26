/**
 * email.service.ts — Servicio centralizado para envío de correos via EmailJS
 */

import emailjs from '@emailjs/browser';

// Interface para los datos requeridos por el template de EmailJS
export interface AppointmentEmailData {
  nombre_paciente: string;
  email: string;
  fecha_turno: string;
  hora_turno: string;
  nombre_farmacia: string;
  direccion_farmacia: string;
  nombre_medicamento?: string | null;
  codigo_confirmacion: string;
  appointment_url: string;
  unsubscribe_url: string;
}

// Configuración de EmailJS desde variables de entorno
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Inicializa EmailJS con la clave pública
 */
export function initializeEmailJS(): void {
  if (!EMAILJS_PUBLIC_KEY) {
    console.warn('EmailJS public key not found in environment variables');
    return;
  }
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

/**
 * Envía un correo de confirmación de turno
 * @param data - Datos del turno para el template de EmailJS
 * @returns Promise con el resultado del envío
 */
export async function sendAppointmentConfirmation(
  data: AppointmentEmailData
): Promise<{ status: number; text: string }> {
  // Validar que las credenciales estén configuradas
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error(
      'EmailJS credentials not configured. Please check your .env.local file.'
    );
  }

  // Validar datos requeridos
  if (!data.nombre_paciente || !data.email || !data.fecha_turno || !data.hora_turno) {
    throw new Error('Missing required email data fields');
  }

  // Si nombre_medicamento es null o undefined, pasar string vacío
  const emailData = {
    to_email: data.email,
    nombre_paciente: data.nombre_paciente,
    fecha_turno: data.fecha_turno,
    hora_turno: data.hora_turno,
    nombre_farmacia: data.nombre_farmacia,
    direccion_farmacia: data.direccion_farmacia,
    nombre_medicamento: data.nombre_medicamento || '',
    codigo_confirmacion: data.codigo_confirmacion,
    appointment_url: data.appointment_url,
    unsubscribe_url: data.unsubscribe_url,
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      emailData
    );

    return response;
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to send confirmation email'
    );
  }
}
