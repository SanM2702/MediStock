import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { api } from '../services/api';

type Estado = 'cargando' | 'exito' | 'error';

export default function ActivateAccount() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [mensaje, setMensaje] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setEstado('error');
      setMensaje('Enlace inválido.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await api.activarCuenta(token);
        if (cancelled) return;
        setEstado('exito');
        setMensaje(data?.message || 'Cuenta activada correctamente');
      } catch (err: any) {
        if (cancelled) return;
        setEstado('error');
        setMensaje(err?.message || 'No pudimos activar tu cuenta.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-500 dark:bg-emerald-500 flex items-center justify-center shadow-lg mx-auto mb-4">
          <Mail size={28} className="text-white" />
        </div>

        {estado === 'cargando' && (
          <>
            <Loader2 size={36} className="mx-auto text-primary-500 dark:text-emerald-400 animate-spin mb-3" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Activando tu cuenta…
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Espera un momento, esto solo toma unos segundos.
            </p>
          </>
        )}

        {estado === 'exito' && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              ¡Cuenta activada!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {mensaje} Ya puedes iniciar sesión con tu cédula y contraseña.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full py-3 bg-primary-500 dark:bg-emerald-500 text-white font-semibold rounded-xl hover:bg-primary-600 dark:hover:bg-emerald-600 active:scale-95 transition-all shadow-sm"
            >
              Ir a iniciar sesión
            </button>
          </>
        )}

        {estado === 'error' && (
          <>
            <XCircle size={48} className="mx-auto text-red-500 mb-3" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No pudimos activar la cuenta
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {mensaje}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              El enlace puede haber expirado. Intenta registrarte de nuevo o contacta al administrador.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full py-3 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
