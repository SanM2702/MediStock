/**
 * MedicineSelector — Paso 3 del wizard: buscar y seleccionar medicamentos
 */
import { useState } from 'react';
import { Search, Plus, Minus, X, Loader2, AlertCircle, Pill } from 'lucide-react';
import { useMedicamentos } from '../../hooks/useMedicamentos';

interface SelectedMed {
  medicamento_id: number;
  cantidad: number;
  nombre: string;
  icono?: string;
}

interface Props {
  selected: SelectedMed[];
  onChange: (meds: SelectedMed[]) => void;
}

export default function MedicineSelector({ selected, onChange }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const { data: medicamentos, loading, error } = useMedicamentos(
    busqueda.length >= 2 ? { busqueda } : undefined
  );

  const addMed = (med: { id: number; nombre: string; icono?: string }) => {
    if (selected.some((s) => s.medicamento_id === med.id)) return;
    onChange([...selected, { medicamento_id: med.id, cantidad: 1, nombre: med.nombre, icono: med.icono }]);
  };

  const removeMed = (id: number) => {
    onChange(selected.filter((s) => s.medicamento_id !== id));
  };

  const updateCantidad = (id: number, delta: number) => {
    onChange(
      selected.map((s) =>
        s.medicamento_id === id
          ? { ...s, cantidad: Math.max(1, s.cantidad + delta) }
          : s
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Seleccionados */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Seleccionados ({selected.length})
          </p>
          {selected.map((s) => (
            <div
              key={s.medicamento_id}
              className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3"
            >
              <span className="text-xl flex-shrink-0">{s.icono ?? '💊'}</span>
              <p className="flex-1 text-sm font-semibold text-emerald-800 dark:text-emerald-300 truncate">
                {s.nombre}
              </p>
              {/* Cantidad */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateCantidad(s.medicamento_id, -1)}
                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="w-5 text-center text-sm font-bold text-slate-800 dark:text-slate-200">
                  {s.cantidad}
                </span>
                <button
                  onClick={() => updateCantidad(s.medicamento_id, 1)}
                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
              <button
                onClick={() => removeMed(s.medicamento_id)}
                className="text-slate-400 hover:text-red-500 transition-colors ml-1"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar medicamento (mín. 2 caracteres)..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-600 text-slate-800 dark:text-slate-200 placeholder-slate-400"
        />
      </div>

      {/* Resultados */}
      {busqueda.length >= 2 && (
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm py-4 justify-center">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {!loading && !error && medicamentos.length === 0 && (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <Pill size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin resultados para "{busqueda}"</p>
            </div>
          )}
          {!loading && medicamentos.map((med) => {
            const yaSeleccionado = selected.some((s) => s.medicamento_id === med.id);
            return (
              <button
                key={med.id}
                onClick={() => addMed(med)}
                disabled={yaSeleccionado}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  yaSeleccionado
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 opacity-60 cursor-default'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm'
                }`}
              >
                <span className="text-xl flex-shrink-0">{med.icono ?? '💊'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{med.nombre}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{med.nombre_generico} · {med.laboratorio}</p>
                </div>
                {yaSeleccionado ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex-shrink-0">✓ Agregado</span>
                ) : (
                  <Plus size={16} className="text-emerald-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {busqueda.length === 0 && selected.length === 0 && (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <Pill size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Escribe el nombre del medicamento para buscarlo</p>
        </div>
      )}
    </div>
  );
}
