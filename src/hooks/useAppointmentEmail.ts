/**
 * useAppointmentEmail.ts — Hook reutilizable para envío de correos de confirmación
 */

import { useState, useCallback } from 'react';
import { sendAppointmentConfirmation, initializeEmailJS, type AppointmentEmailData } from '../services/email.service';

interface UseAppointmentEmailReturn {
  sendConfirmation: (data: AppointmentEmailData) => Promise<void>;
  loading: boolean;
  error: string | null;
  resetError: () => void;
}

export function useAppointmentEmail(): UseAppointmentEmailReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendConfirmation = useCallback(async (data: AppointmentEmailData) => {
    setLoading(true);
    setError(null);

    try {
      // Inicializar EmailJS si no está inicializado
      initializeEmailJS();

      // Enviar correo de confirmación
      await sendAppointmentConfirmation(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar correo de confirmación';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendConfirmation,
    loading,
    error,
    resetError,
  };
}
