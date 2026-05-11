/**
 * LoginModal — Modal de autenticación
 * Aparece sobre el contenido actual con overlay semitransparente.
 * NO navega a otra página.
 */
import { useEffect, useRef, useState } from 'react';
import { X, Eye, EyeOff, Lock, CreditCard, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await login(cedula, password);
      setSuccess(true);
      
      // Si no es admin, cerrar modal tras 1s
      if (loggedUser.rol !== 'admin') {
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  // Cerrar al hacer clic en el overlay (fuera del card)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    /* Overlay */
    <div
      id="login-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
    >
      {/* Card del modal */}
      <div
        ref={cardRef}
        id="login-modal-card"
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 animate-slide-up relative border border-slate-200 dark:border-slate-700"
      >
        {/* Botón cerrar */}
        <button
          id="btn-close-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        {/* ── Logo y encabezado ────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 dark:bg-emerald-500 flex items-center justify-center shadow-lg mb-3">
            <span className="text-white font-black text-3xl leading-none">+</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Accede a tu cuenta
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consulta tus medicamentos EPS
          </p>
        </div>

        {/* ── Formulario ──────────────────────────────────────────── */}
        {success ? (
          <div className="py-8 text-center animate-scale-in">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">¡Bienvenido!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sesión iniciada correctamente
            </p>
            {user?.rol === 'admin' && (
              <button
                onClick={() => {
                  navigate('/red-admin');
                  onClose();
                  setSuccess(false);
                }}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-all"
              >
                Ir a Panel de Red
                <ExternalLink size={16} />
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-shake">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            {/* Cédula */}
            <div className="relative">
              <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-cedula"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Número de documento (cédula)"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Contraseña */}
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-password"
                type={showPass ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Botón ingresar */}
            <button
              id="btn-ingresar"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 dark:bg-emerald-500 text-white font-semibold rounded-xl hover:bg-primary-600 dark:hover:bg-emerald-600 active:scale-95 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        )}

        {/* ── Divisor ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-400">o</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Continuar sin cuenta */}
        <button
          id="btn-sin-cuenta"
          onClick={onClose}
          className="w-full py-3 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all text-sm"
        >
          Continuar sin cuenta
        </button>

        {/* Acceso farmacéutico */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
          ¿Eres farmacéutico?{' '}
          <button className="text-primary-500 dark:text-emerald-400 font-semibold hover:underline">
            Ingresa aquí
          </button>
        </p>
      </div>
    </div>
  );
}
