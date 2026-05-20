/**
 * PharmacySelector — Paso 1 del wizard: seleccionar farmacia
 */
import { MapPin, Clock, Shield, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useFarmacias } from '../../hooks/useFarmacias';

interface Props {
  selectedId: number | null;
  onSelect: (id: number, nombre?: string) => void;
}

export default function PharmacySelector({ selectedId, onSelect }: Props) {
  const { data: farmacias, loading, error } = useFarmacias();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 animate-pulse">Cargando farmacias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">Error al cargar farmacias</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {farmacias.map((farm) => {
        const isSelected = selectedId === farm.id;
        const eps: string[] = farm.eps_convenio
          ? farm.eps_convenio.split(',').map((s: string) => s.trim())
          : [];

        return (
          <button
            key={farm.id}
            onClick={() => onSelect(farm.id, farm.nombre)}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${
              isSelected
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-500/10'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  🏥
                </div>
                <div>
                  <p className={`font-bold text-sm leading-tight ${
                    isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {farm.nombre}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {farm.municipio}
                  </p>
                </div>
              </div>
              {isSelected && (
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              )}
            </div>

            <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="flex-shrink-0" />
                <span className="truncate">{farm.direccion}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="flex-shrink-0" />
                <span>{farm.horario_apertura} – {farm.horario_cierre}</span>
              </div>
            </div>

            {eps.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                <Shield size={10} className="text-slate-400 mt-0.5 flex-shrink-0" />
                {eps.slice(0, 3).map((e) => (
                  <span
                    key={e}
                    className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 px-1.5 py-0.5 rounded-full"
                  >
                    {e}
                  </span>
                ))}
                {eps.length > 3 && (
                  <span className="text-[10px] text-slate-400">+{eps.length - 3}</span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
