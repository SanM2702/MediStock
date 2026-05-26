/**
 * AppointmentConfirmation.tsx — Componente para envío de correo de confirmación de turno
 */

import { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAppointmentEmail } from '../hooks/useAppointmentEmail';
import type { AppointmentEmailData } from '../services/email.service';

interface Props {
  emailData: AppointmentEmailData;
  onSendSuccess?: () => void;
  onError?: (error: string) => void;
  buttonText?: string;
  showSuccessMessage?: boolean;
}

export default function AppointmentConfirmation({
  emailData,
  onSendSuccess,
  onError,
  buttonText = 'Enviar confirmación por correo',
  showSuccessMessage = true,
}: Props) {
  const { sendConfirmation, loading, error, resetError } = useAppointmentEmail();
  const [success, setSuccess] = useState(false);

  const handleSendEmail = async () => {
    resetError();
    setSuccess(false);

    try {
      await sendConfirmation(emailData);
      setSuccess(true);
      onSendSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar correo';
      onError?.(errorMessage);
    }
  };

  return (
    <div className="space-y-3">
      {/* Botón de envío */}
      <button
        onClick={handleSendEmail}
        disabled={loading || success}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Enviando...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 size={16} />
            <span>Correo enviado</span>
          </>
        ) : (
          <>
            <Mail size={16} />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {/* Mensaje de éxito */}
      {success && showSuccessMessage && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
          <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Correo de confirmación enviado exitosamente a {emailData.email}
          </p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            <button
              onClick={resetError}
              className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
