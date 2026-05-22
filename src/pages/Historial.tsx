/**
 * Historial — Placeholder de historial de consultas del usuario
 * Muestra consultas recientes (datos mock) con opción de filtrar
 */
import { Clock, Search, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Datos mock de historial ────────────────────────────────────────────────
const historialMock = [
  { id: 'h1', medNombre: 'Acetaminofén 500 mg', fecha: '07 may 2026 · 14:32', municipio: 'Chía' },
  { id: 'h2', medNombre: 'Metformina 850 mg',   fecha: '06 may 2026 · 09:15', municipio: 'Cajicá' },
  { id: 'h3', medNombre: 'Losartán 50 mg',      fecha: '05 may 2026 · 16:48', municipio: 'Zipaquirá' },
  { id: 'h4', medNombre: 'Omeprazol 20 mg',     fecha: '04 may 2026 · 11:20', municipio: 'Cajicá' },
  { id: 'h5', medNombre: 'Insulina NPH',        fecha: '01 may 2026 · 08:05', municipio: 'Chía' },
];

export default function Historial() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="max-w-screen-xl mx-auto px-4">

        {/* ── Encabezado ────────────────────────────────────────────── */}
        <div className="py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Historial</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Tus últimas consultas de disponibilidad
            </p>
          </div>
          {historialMock.length > 0 && (
            <button className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium transition-colors">
              <Trash2 size={14} />
              Borrar todo
            </button>
          )}
        </div>

        {/* ── Banner de inicio de sesión ────────────────────────────── */}
        <div className="bg-gradient-to-r from-primary-500 to-blue-600 dark:from-primary-700 dark:to-blue-800 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Inicia sesión para sincronizar</p>
            <p className="text-xs text-white/80 mt-0.5">
              Accede desde cualquier dispositivo a tu historial completo
            </p>
          </div>
          <button className="flex-shrink-0 bg-white text-primary-600 dark:text-primary-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-white/90 active:scale-95 transition-all">
            Entrar
          </button>
        </div>

        {/* ── Lista de historial ────────────────────────────────────── */}
        {historialMock.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="font-bold text-lg text-slate-700 dark:text-slate-300">Sin historial</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Aquí aparecerán los medicamentos que hayas consultado.
            </p>
            <button
              onClick={() => navigate('/buscar')}
              className="mt-5 btn-primary text-sm"
            >
              Buscar medicamentos
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {historialMock.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/buscar?q=${encodeURIComponent(item.medNombre)}`)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md dark:hover:border-slate-600 active:scale-[0.99] transition-all text-left group"
              >
                {/* Ícono */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
                  💊
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {item.medNombre}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {item.fecha}
                    </span>
                    <span className="flex items-center gap-1">
                      <Search size={10} /> {item.municipio}
                    </span>
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="text-slate-300 dark:text-slate-600 group-hover:text-primary-500 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0"
                />
              </button>
            ))}
          </div>
        )}

        {/* ── Footer informativo ────────────────────────────────────── */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-8 pb-2">
          El historial se almacena localmente en este dispositivo
        </p>
      </div>
    </div>
  );
}
