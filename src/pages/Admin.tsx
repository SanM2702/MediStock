/**
 * Admin — Panel farmacéutico con estadísticas, tabla de inventario
 * y edición inline de stock con recálculo automático de estado
 */
import { useState, useMemo } from 'react';
import {
  PackageCheck, AlertTriangle, PackageX, RefreshCw,
  ChevronUp, ChevronDown, Save, X, TrendingUp,
  Users, Activity,
} from 'lucide-react';
import { medicamentos as initialMeds } from '../data/meds';
import type { MedicamentoConFarmacias, EstadoStock } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────
function calcEstado(stock: number): EstadoStock {
  if (stock === 0) return 'agotado';
  if (stock <= 10) return 'limitado';
  return 'disponible';
}

const estadoCls: Record<EstadoStock, string> = {
  disponible: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  limitado:   'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  agotado:    'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};

const estadoLabel: Record<EstadoStock, string> = {
  disponible: 'Disponible',
  limitado:   'Stock bajo',
  agotado:    'Agotado',
};

function EstadoBadge({ estado }: { estado: EstadoStock }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoCls[estado]}`}>
      {estadoLabel[estado]}
    </span>
  );
}

type SortKey = 'nombre' | 'stock' | 'municipio';

export default function Admin() {
  const [meds, setMeds] = useState<MedicamentoConFarmacias[]>(
    // Copia profunda para no mutar los datos originales
    initialMeds.map((m) => ({ ...m, farmacias: m.farmacias.map((f) => ({ ...f })) }))
  );
  const [editCell, setEditCell] = useState<{ medId: string; farmaciaId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [saved, setSaved]     = useState(false);

  // ── Estadísticas globales ─────────────────────────────────────────────
  const stats = useMemo(() => {
    let disponibles = 0, limitados = 0, agotados = 0, totalUnidades = 0;
    meds.forEach((m) =>
      m.farmacias.forEach((f) => {
        if (f.estado === 'disponible') disponibles++;
        else if (f.estado === 'limitado') limitados++;
        else agotados++;
        totalUnidades += f.stock;
      })
    );
    return { disponibles, limitados, agotados, totalUnidades };
  }, [meds]);

  // ── Filas aplanadas para la tabla ─────────────────────────────────────
  const rows = useMemo(() => {
    const flat = meds.flatMap((m) =>
      m.farmacias.map((f) => ({ med: m, farmacia: f }))
    );
    flat.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'nombre')    cmp = a.med.nombre.localeCompare(b.med.nombre);
      if (sortKey === 'stock')     cmp = a.farmacia.stock - b.farmacia.stock;
      if (sortKey === 'municipio') cmp = a.farmacia.municipio.localeCompare(b.farmacia.municipio);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return flat;
  }, [meds, sortKey, sortDir]);

  // ── Ordenar columna ───────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="inline-block ml-0.5" />
      : <ChevronDown size={11} className="inline-block ml-0.5" />;
  }

  // ── Edición inline ───────────────────────────────────────────────────
  const beginEdit = (medId: string, farmaciaId: string, current: number) => {
    setEditCell({ medId, farmaciaId });
    setEditValue(String(current));
  };

  const commitEdit = () => {
    if (!editCell) return;
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) { cancelEdit(); return; }

    setMeds((prev) =>
      prev.map((m) =>
        m.id !== editCell.medId ? m : {
          ...m,
          farmacias: m.farmacias.map((f) =>
            f.farmaciaId !== editCell.farmaciaId ? f
              : { ...f, stock: val, estado: calcEstado(val) }
          ),
        }
      )
    );
    setEditCell(null);
  };

  const cancelEdit = () => setEditCell(null);

  // ── Guardar cambios (demo) ────────────────────────────────────────────
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-screen-xl mx-auto px-4">

        {/* ── Encabezado ──────────────────────────────────────────────── */}
        <div className="py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Panel Farmacéutico
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Gestión de inventario · Sabana Centro
            </p>
          </div>
          <button
            id="btn-guardar-admin"
            onClick={handleSave}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm ${
              saved
                ? 'bg-emerald-500 text-white scale-95'
                : 'bg-primary-500 dark:bg-emerald-500 text-white hover:bg-primary-600 dark:hover:bg-emerald-600 active:scale-95'
            }`}
          >
            {saved
              ? <><PackageCheck size={16} /> Guardado</>
              : <><Save size={16} /> Guardar</>}
          </button>
        </div>

        {/* ── Tarjetas de estadísticas ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Disponibles */}
          <div className="card flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <PackageCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {stats.disponibles}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Disponibles</p>
            </div>
          </div>

          {/* Stock bajo */}
          <div className="card flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {stats.limitados}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Stock bajo</p>
            </div>
          </div>

          {/* Agotados */}
          <div className="card flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <PackageX size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {stats.agotados}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Agotados</p>
            </div>
          </div>

          {/* Total unidades */}
          <div className="card flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {stats.totalUnidades.toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unidades totales</p>
            </div>
          </div>
        </div>

        {/* ── Mini-métricas secundarias ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card p-4 flex items-center gap-3">
            <Users size={18} className="text-primary-500 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {initialMeds.length} medicamentos
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">En el sistema</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Activity size={18} className="text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">8 farmacias</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sabana Centro</p>
            </div>
          </div>
        </div>

        {/* ── Tabla de inventario ──────────────────────────────────────── */}
        <div className="card p-0 overflow-hidden mb-4">
          {/* Cabecera de la tabla */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Inventario por farmacia
            </h2>
            <button className="text-slate-400 hover:text-primary-500 dark:hover:text-emerald-400 transition-colors">
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Cabecera de columnas */}
          <div className="grid grid-cols-12 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <button
              className="col-span-4 flex items-center gap-0.5 text-left hover:text-primary-500 dark:hover:text-emerald-400 transition-colors"
              onClick={() => toggleSort('nombre')}
            >
              Medicamento <SortIcon col="nombre" />
            </button>
            <button
              className="col-span-3 flex items-center gap-0.5 justify-center hover:text-primary-500 dark:hover:text-emerald-400 transition-colors"
              onClick={() => toggleSort('municipio')}
            >
              Municipio <SortIcon col="municipio" />
            </button>
            <button
              className="col-span-2 flex items-center gap-0.5 justify-center hover:text-primary-500 dark:hover:text-emerald-400 transition-colors"
              onClick={() => toggleSort('stock')}
            >
              Stock <SortIcon col="stock" />
            </button>
            <span className="col-span-3 text-center">Estado</span>
          </div>

          {/* Filas */}
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {rows.map(({ med, farmacia }) => {
              const isEditing =
                editCell?.medId === med.id && editCell?.farmaciaId === farmacia.farmaciaId;

              return (
                <div
                  key={`${med.id}-${farmacia.farmaciaId}`}
                  className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  {/* Medicamento */}
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <span className="text-xl leading-none flex-shrink-0">{med.icono}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
                        {med.nombre}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {med.categoria}
                      </p>
                    </div>
                  </div>

                  {/* Municipio */}
                  <p className="col-span-3 text-xs text-slate-500 dark:text-slate-400 text-center truncate px-1">
                    {farmacia.municipio}
                  </p>

                  {/* Stock — editable al hacer clic */}
                  <div className="col-span-2 flex justify-center">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="w-14 text-xs text-center border border-primary-400 dark:border-emerald-500 rounded-lg px-1.5 py-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                        <button
                          onClick={commitEdit}
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-0.5"
                          title="Confirmar"
                        >
                          <Save size={13} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-400 hover:text-red-500 p-0.5"
                          title="Cancelar"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`stock-${med.id}-${farmacia.farmaciaId}`}
                        onClick={() => beginEdit(med.id, farmacia.farmaciaId, farmacia.stock)}
                        className="text-sm font-bold text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-emerald-400 transition-colors"
                        title="Clic para editar"
                      >
                        {farmacia.stock}
                      </button>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="col-span-3 flex justify-center">
                    <EstadoBadge estado={farmacia.estado} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tip de edición ───────────────────────────────────────────── */}
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-2xl p-4 mb-8">
          <p className="text-xs font-semibold text-primary-700 dark:text-emerald-400 mb-1">
            💡 Cómo actualizar el stock
          </p>
          <p className="text-xs text-primary-600 dark:text-primary-400 leading-relaxed">
            Toca cualquier número en la columna <strong>Stock</strong> para editarlo.
            Presiona <kbd className="bg-white dark:bg-slate-700 border border-primary-200 dark:border-slate-600 px-1 rounded text-[10px]">Enter</kbd> para
            confirmar o <kbd className="bg-white dark:bg-slate-700 border border-primary-200 dark:border-slate-600 px-1 rounded text-[10px]">Esc</kbd> para
            cancelar. El estado se recalcula automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
