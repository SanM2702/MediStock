import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Enlace inválido
          </h1>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full py-3 bg-primary-500 dark:bg-emerald-500 text-white font-semibold rounded-xl hover:bg-primary-600 dark:hover:bg-emerald-600 transition-all"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2500);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 dark:bg-emerald-500 flex items-center justify-center shadow-lg mb-3">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Nueva contraseña
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Elige una contraseña para tu cuenta.
          </p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Contraseña actualizada
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Te llevamos al inicio para que puedas iniciar sesión.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-9 pr-10 py-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassConfirm ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full pl-9 pr-10 py-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 dark:bg-emerald-500 text-white font-semibold rounded-xl hover:bg-primary-600 dark:hover:bg-emerald-600 active:scale-95 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando…' : 'Actualizar contraseña'}
            </button>

            <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-2">
              El enlace expira a las 2 horas de haber sido enviado.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
