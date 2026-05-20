/**
 * ScheduleSelector — Paso 4 del wizard: seleccionar fecha y horario
 */
import { ChevronLeft, ChevronRight, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useHorarios } from '../../hooks/useHorarios';
import type { HorarioDisponible } from '../../types/turnos';

interface Props {
  farmaciaId: number | null;
  selectedHorarioId: number | null;
  selectedFecha: string | null;
  onSelect: (horario: HorarioDisponible) => void;
}

function formatFechaLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

export default function ScheduleSelector({ farmaciaId, selectedHorarioId, selectedFecha, onSelect }: Props) {
  // Generar los próximos 7 días
  const today = new Date();
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return toDateStr(d);
  });

  const [fecha, setFecha] = useState<string>(selectedFecha ?? dias[0]);
  const { data: horarios, loading, error } = useHorarios(farmaciaId, fecha);

  const handleFechaChange = (dir: -1 | 1) => {
    const idx = dias.indexOf(fecha);
    const next = idx + dir;
    if (next >= 0 && next < dias.length) setFecha(dias[next]);
  };

  return (
    <div className="space-y-5">
      {/* Selector de fecha */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Selecciona una fecha
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFechaChange(-1)}
            disabled={dias.indexOf(fecha) === 0}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {dias.map((d) => {
              const isSelected = d === fecha;
              const label = formatFechaLabel(d);
              return (
                <button
                  key={d}
                  onClick={() => setFecha(d)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleFechaChange(1)}
            disabled={dias.indexOf(fecha) === dias.length - 1}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horarios disponibles */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Horarios disponibles
        </p>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm py-6 justify-center">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && horarios.length === 0 && (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500">
            <Clock size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay horarios disponibles para esta fecha</p>
          </div>
        )}

        {!loading && !error && horarios.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {horarios.map((h) => {
              const isSelected = selectedHorarioId === h.id && selectedFecha === fecha;
              const cupoRestante = h.capacidad_maxima - h.turnos_agendados;
              return (
                <button
                  key={h.id}
                  onClick={() => onSelect({ ...h, fecha })}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={13} className={isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                    <span className={`font-bold text-sm ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {formatHora(h.hora_inicio)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    hasta {formatHora(h.hora_fin)}
                  </p>
                  <p className={`text-[10px] font-semibold mt-1 ${
                    cupoRestante <= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {cupoRestante} cupo{cupoRestante !== 1 ? 's' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
