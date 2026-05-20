/**
 * AppointmentCard — Tarjeta compacta de turno para listados
 */
import { Calendar, Clock, MapPin, Pill, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import type { Turno } from '../../types/turnos';

interface Props {
  turno: Turno;
}

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d} ${meses[parseInt(m) - 1]} ${y}`;
}

function formatHora(hora: string) {
  return hora.slice(0, 5); // HH:MM
}

export default function AppointmentCard({ turno }: Props) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/turnos/${turno.id}`)}
      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md dark:hover:border-slate-600 active:scale-[0.99] transition-all text-left group"
    >
      {/* Número de turno */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex flex-col items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
        <span className="text-[9px] text-white/80 font-semibold leading-none">N°</span>
        <span className="text-lg font-black text-white leading-none">{turno.numero_turno}</span>
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
            {turno.farmacia?.nombre ?? `Farmacia #${turno.farmacia_id}`}
          </span>
          <AppointmentStatusBadge estado={turno.estado} size="sm" />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatFecha(turno.fecha)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatHora(turno.hora)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {turno.farmacia?.municipio ?? '—'}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 dark:text-slate-500">
          <Pill size={11} />
          <span>
            {turno.medicamentos.length} medicamento{turno.medicamentos.length !== 1 ? 's' : ''}
            {turno.eps_obj ? ` · ${turno.eps_obj.nombre}` : ''}
          </span>
        </div>
      </div>

      <ChevronRight
        size={16}
        className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0"
      />
    </button>
  );
}
