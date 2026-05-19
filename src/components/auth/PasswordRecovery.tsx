/**
 * PasswordRecoveryModal — Modal de recuperación de contraseña
 * Permite al usuario solicitar un correo para restaurar su contraseña
 */
import { useState } from 'react';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface PasswordRecoveryModalProps {
  onBack: () => void;
}

export default function PasswordRecovery({ onBack }: PasswordRecoveryModalProps) {
  const { requestPasswordReset } = useAuth();
  
  // Estados
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Por favor ingresa un correo electrónico válido');
        setLoading(false);
        return;
      }

      await requestPasswordReset(email);
      setSuccess(true);

      // Volver a login después de 3 segundos
      setTimeout(() => {
        onBack();
        setSuccess(false);
        setEmail('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al solicitar recuperación de contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Botón volver ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      {success ? (
        // ══════════════════ VISTA ÉXITO ══════════════════
        <div className="py-8 text-center animate-scale-in">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Correo enviado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Revisa tu bandeja de entrada y sigue las instrucciones para restaurar tu contraseña.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            Redirigiendo a login...
          </p>
        </div>
      ) : (
        // ══════════════════ VISTA FORMULARIO ══════════════════
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Recuperar contraseña
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Te enviaremos un correo con instrucciones para restaurar tu contraseña
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-shake">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-recovery-email"
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Botón enviar */}
          <button
            id="btn-send-recovery"
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 bg-primary-500 dark:bg-emerald-500 text-white font-semibold rounded-xl hover:bg-primary-600 dark:hover:bg-emerald-600 active:scale-95 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </span>
            ) : (
              'Enviar enlace de recuperación'
            )}
          </button>

          {/* Nota de seguridad */}
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-2">
            Por seguridad, el enlace será válido por 2 horas
          </p>
        </form>
      )}
    </>
  );
}
