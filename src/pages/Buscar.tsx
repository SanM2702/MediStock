/**
 * Buscar — Página de búsqueda avanzada de medicamentos
 * Filtros: texto | categoría | municipio | EPS | estado
 * Vista: grid o lista | Orden: disponibilidad | nombre | farmacia
 */
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, LayoutGrid, List, X, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { useMedicamentos } from '../hooks/useMedicamentos';
import { categorias as cats } from '../data/meds';
import { municipios, epsLista } from '../data/farmacias';
import MedCard from '../components/MedCard';
import type { EstadoStock } from '../types';

type Orden = 'disponibilidad' | 'nombre' | 'precio-asc' | 'precio-desc';
type Vista = 'grid' | 'list';

const TODAS = 'Todas';
const TODOS = 'Todos';

const CATEGORIAS = [
  { label: 'Todas', value: '' },
  { label: 'Analgésico', value: 'analgesico' },
  { label: 'Antibiótico', value: 'antibiotico' },
  { label: 'Antidiabético', value: 'antidiabetico' },
  { label: 'Antiinflamatorio', value: 'antiinflamatorio' },
  { label: 'Cardiovascular', value: 'cardioprotector' },
  { label: 'Gastrointestinal', value: 'gastrointestinal' },
  { label: 'Antihistamínico', value: 'antihistaminico' },
];

export default function Buscar() {
  const [searchParams] = useSearchParams();

  // Estados de filtros
  const [query, setQuery]             = useState(searchParams.get('q') ?? '');
  const [categoria, setCategoria]     = useState(searchParams.get('categoria') ?? '');
  const [municipio, setMunicipio]     = useState(TODOS);
  const [eps, setEps]                 = useState(TODOS);
  const [estado, setEstado]           = useState<EstadoStock | ''>('');
  const [orden, setOrden]             = useState<Orden>('disponibilidad');
  const [vista, setVista]             = useState<Vista>('grid');
  const [filtrosOpen, setFiltrosOpen] = useState(false);

  // ── Hook de Medicamentos ──────────────────────────────────────────────
  const { data: medicamentos, loading, error } = useMedicamentos({
    busqueda: query,
    categoria: categoria || undefined,
    estado: estado || undefined
  });

  // ── Filtrado y ordenamiento (Local para filtros no soportados por API) ──
  const resultados = useMemo(() => {
    let lista = [...medicamentos];

    // Filtro municipio
    if (municipio !== TODOS) {
      lista = lista.filter((m) => m.inventario?.some((f: any) => f.farmacia_municipio === municipio));
    }

    // Filtro EPS
    if (eps !== TODOS) {
      lista = lista.filter((m) => m.epsCobertura?.includes(eps));
    }

    // Filtro estado de stock
    if (estado !== '') {
      lista = lista.filter((m) => m.inventario?.some((f: any) => f.estado === estado));
    }

    // Ordenamiento
    lista.sort((a, b) => {
      if (orden === 'nombre') return a.nombre.localeCompare(b.nombre);
      if (orden === 'precio-asc') return a.precio - b.precio;
      if (orden === 'precio-desc') return b.precio - a.precio;
      // disponibilidad: disponible > limitado > agotado
      const prioridad = (m: any) => {
        if (m.inventario?.some((f: any) => f.estado === 'disponible')) return 0;
        if (m.inventario?.some((f: any) => f.estado === 'limitado')) return 1;
        return 2;
      };
      return prioridad(a) - prioridad(b);
    });

    return lista;
  }, [medicamentos, municipio, eps, estado, orden]);

  const limpiarFiltros = () => {
    setQuery(''); setCategoria(''); setMunicipio(TODOS);
    setEps(TODOS); setEstado(''); setOrden('disponibilidad');
  };

  const hayFiltrosActivos =
    query || categoria !== '' || municipio !== TODOS ||
    eps !== TODOS || estado !== '';

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="max-w-screen-xl mx-auto px-4">

        {/* ── Encabezado ────────────────────────────────────────────── */}
        <div className="py-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Buscar medicamentos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Barra de búsqueda ─────────────────────────────────────── */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="buscar-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, genérico, laboratorio..."
            className="w-full pl-9 pr-10 py-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xl leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* ── Chips de categoría (scroll horizontal) ────────────────── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoria(cat.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                categoria === cat.value
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Barra de controles ────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {/* Filtros avanzados toggle */}
          <button
            id="btn-filtros"
            onClick={() => setFiltrosOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border transition-all ${
              filtrosOpen || hayFiltrosActivos
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filtros
            {hayFiltrosActivos && (
              <span className="w-2 h-2 rounded-full bg-primary-500 dark:bg-emerald-400" />
            )}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {/* Orden */}
            <div className="relative">
              <select
                id="select-orden"
                value={orden}
                onChange={(e) => setOrden(e.target.value as Orden)}
                className="appearance-none text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer"
              >
                <option value="disponibilidad">Disponibilidad</option>
                <option value="nombre">A–Z</option>
                <option value="precio-asc">Precio ↑</option>
                <option value="precio-desc">Precio ↓</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Vista */}
            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <button
                id="btn-vista-grid"
                onClick={() => setVista('grid')}
                className={`p-2 transition-colors ${vista === 'grid' ? 'bg-primary-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                id="btn-vista-list"
                onClick={() => setVista('list')}
                className={`p-2 transition-colors ${vista === 'list' ? 'bg-primary-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Panel de filtros avanzados ────────────────────────────── */}
        {filtrosOpen && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-4 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Municipio */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  Municipio
                </label>
                <select
                  id="select-municipio"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
                >
                  <option value={TODOS}>Todos</option>
                  {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* EPS */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  EPS
                </label>
                <select
                  id="select-eps"
                  value={eps}
                  onChange={(e) => setEps(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
                >
                  <option value={TODOS}>Todas las EPS</option>
                  {epsLista.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  Estado de stock
                </label>
                <select
                  id="select-estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoStock | '')}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
                >
                  <option value="">Todos</option>
                  <option value="disponible">Disponible</option>
                  <option value="limitado">Stock bajo</option>
                  <option value="agotado">Agotado</option>
                </select>
              </div>
            </div>

            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={13} /> Limpiar todos los filtros
              </button>
            )}
          </div>
        )}

        {/* ── Resultados ────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="mt-4 text-slate-500 dark:text-slate-400 animate-pulse">Cargando medicamentos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="font-bold text-lg text-slate-700 dark:text-slate-300">Error de conexión</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{error}</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="font-bold text-lg text-slate-700 dark:text-slate-300">Sin resultados</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Intenta con otro nombre o ajusta los filtros para encontrar tu medicamento.
            </p>
            <button onClick={limpiarFiltros} className="mt-5 text-sm text-primary-500 dark:text-emerald-400 font-semibold hover:underline">
              Limpiar filtros
            </button>
          </div>
        ) : vista === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {resultados.map((med) => (
              <MedCard key={`med-grid-${med.id}`} med={med} modo="card" />
            ))}
          </div>
        ) : (
          <div className="pb-4">
            {resultados.map((med) => (
              <MedCard key={`med-list-${med.id}`} med={med} modo="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
