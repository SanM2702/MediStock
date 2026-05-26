/**
 * MedCard — Tarjeta de medicamento estilo e-commerce
 * Diseño enriquecido: imagen grande, badge prominente, precio COP,
 * farmacia más cercana y expansión con detalle por farmacia
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Phone, Package } from 'lucide-react';
import type { MedicamentoConFarmacias, EstadoStock } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useHistorial } from '../hooks/useHistorial';

interface MedCardProps {
  med: MedicamentoConFarmacias;
  /** Modo de visualización: tarjeta (grid) o fila (list) */
  modo?: 'card' | 'list';
}

// ── Config visual por estado ───────────────────────────────────────────────
const estadoCfg: Record<EstadoStock, { label: string; card: string; dot: string; bar: string }> = {
  disponible: {
    label: 'Disponible',
    card: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
  },
  limitado: {
    label: 'Stock bajo',
    card: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    dot: 'bg-amber-500',
    bar: 'bg-amber-400',
  },
  agotado: {
    label: 'Agotado',
    card: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    dot: 'bg-red-500',
    bar: 'bg-red-400',
  },
};

function StatusBadge({ estado }: { estado: EstadoStock }) {
  const c = estadoCfg[estado];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.card}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function bestEstado(inventarios: MedicamentoConFarmacias['inventarios']): EstadoStock {
  if (!inventarios || inventarios.length === 0) return 'agotado';
  if (inventarios.some((f) => f.estado === 'disponible')) return 'disponible';
  if (inventarios.some((f) => f.estado === 'limitado')) return 'limitado';
  return 'agotado';
}

/** Formatea precio al estilo colombiano: $1.800 */
function formatCOP(precio: number) {
  return `$${precio.toLocaleString('es-CO')}`;
}

export default function MedCard({ med, modo = 'card' }: MedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const { registrarActividad } = useHistorial();

  const globalEstado = bestEstado(med.inventarios);
  const farmMasCercana = med.inventarios?.[0];

  const handleExpandClick = async () => {
    const isExpanding = !expanded;
    setExpanded(isExpanding);

    // Registrar consulta de medicamento si el usuario expande y está autenticado
    if (isExpanding && user?.id) {
      try {
        await registrarActividad({
          tipo: 'consulta_medicamento',
          titulo: `Consultó ${med.nombre}`,
          descripcion: 'Verificó disponibilidad en farmacias',
          metadata_json: JSON.stringify({
            medicamento_id: med.id,
            medicamento_nombre: med.nombre,
            categoria: med.categoria,
          }),
        });
      } catch (err) {
        // No interferir si falla el registro del historial
        console.warn('No se pudo registrar la consulta:', err);
      }
    }
  };

  // ── Vista lista (compacta) ─────────────────────────────────────────────
  if (modo === 'list') {
    return (
      <article
        id={`med-list-${med.id}`}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl mb-2 overflow-hidden transition-all hover:shadow-md dark:hover:border-slate-600"
      >
        <div
          className="flex items-center gap-3 p-4 cursor-pointer"
          onClick={() => handleExpandClick()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleExpandClick()}
          aria-expanded={expanded}
        >
          {/* Icono */}
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
            {med.icono || '💊'}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{med.nombre}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{med.nombre_generico} · {med.laboratorio}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge estado={globalEstado} />
              {farmMasCercana && (
                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                  <MapPin size={10} /> {farmMasCercana.farmacia_municipio}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="font-bold text-primary-600 dark:text-emerald-400 text-sm">{formatCOP(med.precio)}</span>
            {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </div>
        {expanded && <FarmaciaDetail inventarios={med.inventarios} />}
      </article>
    );
  }

  // ── Vista tarjeta (grid) ───────────────────────────────────────────────
  return (
    <article
      id={`med-card-${med.id}`}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all hover:shadow-lg dark:hover:border-slate-600 flex flex-col"
    >
      {/* ── Imagen / ícono ─────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 h-32 flex items-center justify-center">
        <span className="text-6xl select-none">{med.icono || '💊'}</span>
        {/* Badge de estado superpuesto */}
        <div className="absolute top-2 right-2">
          <StatusBadge estado={globalEstado} />
        </div>
        {/* Badge EPS */}
        {med.epsCobertura && med.epsCobertura.length > 0 && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
              EPS
            </span>
          </div>
        )}
      </div>

      {/* ── Cuerpo ─────────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Nombre y laboratorio */}
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
          {med.nombre}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{med.nombre_generico}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{med.laboratorio}</p>

        {/* Categoría */}
        <span className="mt-2 inline-block text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium self-start">
          {med.categoria}
        </span>

        {/* Precio */}
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-xl font-bold text-primary-600 dark:text-emerald-400">
            {formatCOP(med.precio)}
          </span>
          <span className="text-xs text-slate-400">/ tab</span>
        </div>

        {/* Farmacia más cercana */}
        {farmMasCercana && (
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MapPin size={11} />
            <span>{farmMasCercana.farmacia_nombre} · {farmMasCercana.farmacia_municipio}</span>
          </div>
        )}

        {/* Botón ver disponibilidad */}
        <button
          id={`btn-expand-${med.id}`}
          onClick={() => handleExpandClick()}
          className="mt-4 w-full py-2.5 border border-primary-500 dark:border-emerald-500 text-primary-600 dark:text-emerald-400 text-sm font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          {expanded ? (
            <><ChevronUp size={15} /> Ocultar farmacias</>
          ) : (
            <><Package size={15} /> Ver disponibilidad</>
          )}
        </button>
      </div>

      {/* ── Detalle expandido ──────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          <FarmaciaDetail inventarios={med.inventarios} />
        </div>
      )}
    </article>
  );
}

// ── Sub-componente: detalle de farmacias ──────────────────────────────────
function FarmaciaDetail({ inventarios }: { inventarios: MedicamentoConFarmacias['inventarios'] }) {
  if (!inventarios || !Array.isArray(inventarios) || inventarios.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
        No hay disponibilidad registrada en farmacias.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-slide-up">
      {inventarios.map((f) => {
        return (
          <div
            key={f.farmacia_id}
            className={`rounded-xl p-3 border ${
              f.estado === 'agotado'
                ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 opacity-60'
                : 'bg-white dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{f.farmacia_nombre}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <MapPin size={10} />
                  <span>{f.farmacia_municipio}</span>
                </div>
              </div>
              <StatusBadge estado={f.estado} />
            </div>

            {/* Info adicional */}
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Package size={11} />
                  <span>{f.stock} unidades</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={11} />
                  <span>{f.farmacia_direccion}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
