/**
 * MisTurnos — Historial y próximos turnos del usuario
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Loader2, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTurnos } from '../hooks/useTurnos';
import AppointmentCard from '../components/turnos/AppointmentCard';
import AppointmentStatusBadge from '../components/turnos/AppointmentStatusBadge';
import type { EstadoTurno } from '../types/turnos';

const ESTADOS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Confirmado', label: 'Confirmado' },
  { value: 'Cancelado', label: 'Cancelado' },
  { value: 'Completado', label: 'Completado' },
];

export default function MisTurnos() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const { data: turnos, loading, error, refresh } = useTurnos(
    estadoFiltro ? { estado: estadoFiltro } : undefined
  );

  if (!isAuthenticated) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
        <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Inicia sesión para ver tus turnos
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Necesitas una cuenta activa para gestionar tus turnos.
          </p>
        </div>
      </div>
    );
  }

  // Separar próximos vs pasados
  const hoy = new Date().toISOString().slice(0, 10);
  const proximos = turnos.filter(
    (t) => t.fecha >= hoy && (t.estado === 'Pendiente' || t.estado === 'Confirmado')
  );
  const historial = turnos.filter(
    (t) => !(t.fecha >= hoy && (t.estado === 'Pendiente' || t.estado === 'Confirmado'))
  );

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="max-w-screen-xl mx-auto px-4">

        {/* Encabezado */}
        <div className="py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Mis Turnos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {loading ? 'Cargando...' : `${turnos.length} turno${turnos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-500' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => navigate('/agendar-turno')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all"
            >
              <CalendarPlus size={15} />
              <span className="hidden sm:inline">Nuevo turno</span>
            </button>
          </div>
        </div>

        {/* Filtros de estado */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {ESTADOS.map(({ value, label }) => {
            const isActive = estadoFiltro === value;
            return (
              <button
                key={value}
                onClick={() => setEstadoFiltro(value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {value ? (
                  <span className="flex items-center gap-1.5">
                    <AppointmentStatusBadge estado={value as EstadoTurno} size="sm" />
                  </span>
                ) : label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 animate-pulse">Cargando turnos...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Error al cargar turnos</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Sin turnos */}
        {!loading && !error && turnos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="font-bold text-lg text-slate-700 dark:text-slate-300">Sin turnos</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              {estadoFiltro
                ? `No tienes turnos con estado "${estadoFiltro}".`
                : 'Aún no has agendado ningún turno.'}
            </p>
            <button
              onClick={() => navigate('/agendar-turno')}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all"
            >
              <CalendarPlus size={15} /> Agendar turno
            </button>
          </div>
        )}

        {/* Próximos turnos */}
        {!loading && !error && proximos.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={15} className="text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Próximos ({proximos.length})
              </h2>
            </div>
            <div className="space-y-2">
              {proximos.map((t) => <AppointmentCard key={t.id} turno={t} />)}
            </div>
          </section>
        )}

        {/* Historial */}
        {!loading && !error && historial.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={15} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Historial ({historial.length})
              </h2>
            </div>
            <div className="space-y-2">
              {historial.map((t) => <AppointmentCard key={t.id} turno={t} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
