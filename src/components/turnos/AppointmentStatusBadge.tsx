import type { EstadoTurno } from '../../types/turnos';

interface Props {
  estado: EstadoTurno;
  size?: 'sm' | 'md';
}

const cfg: Record<EstadoTurno, { label: string; classes: string; dot: string }> = {
  Pendiente:  { label: 'Pendiente',  dot: 'bg-amber-500',   classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
  Confirmado: { label: 'Confirmado', dot: 'bg-blue-500',    classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  Cancelado:  { label: 'Cancelado',  dot: 'bg-red-500',     classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  Completado: { label: 'Completado', dot: 'bg-emerald-500', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
};

export default function AppointmentStatusBadge({ estado, size = 'md' }: Props) {
  const { label, classes, dot } = cfg[estado] ?? cfg.Pendiente;
  const textSize = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${textSize} ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
