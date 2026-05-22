/**
 * Home — Página principal de MediStock
 * Secciones: Hero banner | Categorías | Disponibles ahora |
 *            Farmacias Sabana Centro | Stock limitado
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, ChevronRight, AlertTriangle, Package, Loader2 } from 'lucide-react';
import { useMedicamentos } from '../hooks/useMedicamentos';
import { farmacias } from '../data/farmacias';
import { categorias } from '../data/categorias';
import MedCard from '../components/MedCard';

export default function Home() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');
  
  // ── Cargar datos reales de la API ───────────────────────────────────────────
  const { data: medsData, loading } = useMedicamentos();
  const medicamentos = medsData || [];

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroQuery.trim()) navigate(`/buscar?q=${encodeURIComponent(heroQuery.trim())}`);
    else navigate('/buscar');
  };

  // Medicamentos con stock limitado
  const stockLimitado = useMemo(() => 
    medicamentos.filter((m) => m.inventarios?.some((f) => f.estado === 'limitado'))
  , [medicamentos]);

  // Medicamentos disponibles (al menos una farmacia disponible)
  const disponibles = useMemo(() => 
    medicamentos.filter((m) => m.inventarios?.some((f) => f.estado === 'disponible'))
  , [medicamentos]);

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 1 — Banner Hero
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-blue-600 dark:from-slate-900 dark:via-primary-900 dark:to-blue-900 text-white overflow-hidden">
        {/* Decoración fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 text-[120px] leading-none select-none">💊</div>
          <div className="absolute bottom-2 left-4 text-[80px] leading-none select-none">🏥</div>
        </div>

        <div className="relative max-w-2xl mx-auto px-4 py-12 lg:py-16 text-center">
          {/* Etiqueta */}
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            🇨🇴 Sabana Centro · Cundinamarca
          </span>

          {/* Título */}
          <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-3">
            Consulta tus
            <br />
            medicamentos EPS
          </h1>
          <p className="text-white/80 text-base mb-8">
            Disponibilidad en tiempo real · Sin colas · Gratis
          </p>

          {/* Barra de búsqueda integrada */}
          <form
            onSubmit={handleHeroSearch}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-xl max-w-lg mx-auto"
          >
            <Search size={18} className="ml-2 text-slate-400 flex-shrink-0" />
            <input
              id="hero-search"
              type="text"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              placeholder="¿Qué medicamento necesitas?"
              className="flex-1 py-2 text-sm text-slate-800 dark:text-slate-200 bg-transparent placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-primary-500 dark:bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-600 dark:hover:bg-emerald-600 active:scale-95 transition-all flex-shrink-0"
            >
              Buscar
            </button>
          </form>

          {/* Tags rápidos */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['Acetaminofén', 'Metformina', 'Losartán', 'Omeprazol'].map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/buscar?q=${tag}`)}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 2 — Categorías
      ═══════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-8 max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Categorías</h2>
          <button
            onClick={() => navigate('/buscar')}
            className="text-sm text-primary-500 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
          >
            Ver todas <ChevronRight size={14} />
          </button>
        </div>

        {/* Grid 4 cols desktop / 2 mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              id={`cat-${cat.id}`}
              onClick={() => navigate(`/buscar?cat=${encodeURIComponent(cat.nombre)}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md active:scale-95 transition-all group"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: cat.bgColor }}
              >
                {cat.icono}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
                {cat.nombre}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{cat.count} med.</span>
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 3 — Disponibles ahora (Scroll horizontal)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Package className="text-emerald-600 dark:text-emerald-400" size={18} />
            </div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Disponibles ahora</h2>
          </div>
          <button
            onClick={() => navigate('/buscar')}
            className="text-sm font-semibold text-primary-600 dark:text-emerald-400 flex items-center gap-0.5 hover:underline"
          >
            Ver todos <ChevronRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x">
            {disponibles.length > 0 ? (
              disponibles.slice(0, 8).map((med) => (
                <div key={`home-disp-${med.id}`} className="w-64 flex-shrink-0 snap-start">
                  <MedCard med={med} />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-10 text-center w-full">No hay medicamentos disponibles en este momento.</p>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 4 — Farmacias en Sabana Centro
      ═══════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-8 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-700/50">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Farmacias en Sabana Centro</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{farmacias.length} farmacias registradas</p>
            </div>
            <button
              onClick={() => navigate('/farmacias')}
              className="text-sm text-primary-500 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {farmacias.slice(0, 3).map((farm) => (
              <div
                key={farm.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{farm.nombre}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <MapPin size={11} />
                      <span>{farm.municipio} · {farm.distancia}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      farm.abierto
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {farm.abierto ? '● Abierto' : '○ Cerrado'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Clock size={11} />
                    <span>{farm.horario}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-emerald-400 font-semibold">
                    <Package size={11} />
                    <span>{farm.medicamentosDisponibles} medicamentos disponibles</span>
                  </div>
                </div>

                {/* EPS */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {farm.eps.slice(0, 3).map((e) => (
                    <span
                      key={e}
                      className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 5 — Stock limitado (Advertencia)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-8 bg-orange-50/50 dark:bg-orange-900/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertTriangle className="text-orange-600 dark:text-orange-400" size={18} />
            </div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Stock limitado</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x">
            {stockLimitado.length > 0 ? (
              stockLimitado.slice(0, 8).map((med) => (
                <div key={`home-lim-${med.id}`} className="w-64 flex-shrink-0 snap-start">
                  <MedCard med={med} />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-10 text-center w-full">No hay medicamentos con stock crítico.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
