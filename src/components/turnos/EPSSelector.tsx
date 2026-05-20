/**
 * EPSSelector — Paso 2 del wizard: seleccionar EPS
 */
import { CheckCircle2, Loader2, AlertCircle, Shield } from 'lucide-react';
import { useEPS } from '../../hooks/useEPS';

interface Props {
  selectedId: number | null;
  onSelect: (id: number, nombre?: string) => void;
}

export default function EPSSelector({ selectedId, onSelect }: Props) {
  const { data: epsList, loading, error } = useEPS();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 animate-pulse">Cargando EPS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">Error al cargar EPS</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {epsList.map((eps) => {
        const isSelected = selectedId === eps.id;
        return (
          <button
            key={eps.id}
            onClick={() => onSelect(eps.id, eps.nombre)}
            className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
            }`}
          >
            {isSelected && (
              <CheckCircle2
                size={16}
                className="absolute top-2.5 right-2.5 text-blue-500"
              />
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
              isSelected ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-slate-100 dark:bg-slate-700'
            }`}>
              <Shield size={18} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
            </div>
            <p className={`font-semibold text-sm leading-tight ${
              isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
            }`}>
              {eps.nombre}
            </p>
            {eps.codigo && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{eps.codigo}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
