/**
 * Farmacias — Directorio de farmacias de Sabana Centro
 * Filtros: municipio | EPS | abierto
 */
import { useState, useMemo } from 'react';
import { MapPin, Clock, Phone, Package, Shield, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { useFarmacias } from '../hooks/useFarmacias';
import { municipios, epsLista } from '../data/farmacias';

const TODOS = 'Todos';
const TODAS = 'Todas';

export default function Farmacias() {
  const [municipio, setMunicipio] = useState(TODOS);
  const [eps, setEps]             = useState(TODAS);
  const [soloAbiertos, setSoloAbiertos] = useState(false);

  const { data: farmacias, loading, error } = useFarmacias({
    municipio: municipio === TODOS ? undefined : municipio,
    eps: eps === TODAS ? undefined : eps,
  });

  const filtradas = useMemo(() => {
    return farmacias.map(f => {
      // Adaptación de datos del backend a la UI
      const ahora = new Date();
      const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
      const estaAbierto = horaActual >= f.horario_apertura && horaActual <= f.horario_cierre;

      return {
        ...f,
        horario: `${f.horario_apertura} - ${f.horario_cierre}`,
        eps: f.eps_convenio ? f.eps_convenio.split(',').map((s: string) => s.trim()) : [],
        abierto: estaAbierto,
        distancia: "Chía centro", // Mocked as the backend doesn't provide this yet
        medicamentosDisponibles: 10 // Mocked as the backend doesn't provide this count directly
      };
    }).filter((f) => {
      if (soloAbiertos && !f.abierto) return false;
      return true;
    });
  }, [farmacias, soloAbiertos]);

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="max-w-screen-xl mx-auto px-4">

        {/* ── Encabezado ────────────────────────────────────────────── */}
        <div className="py-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Farmacias en Sabana Centro
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {filtradas.length} farmacia{filtradas.length !== 1 ? 's' : ''} · Cundinamarca
          </p>
        </div>

        {/* ── Filtros ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Municipio */}
          <div className="relative">
            <select
              id="farm-select-municipio"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              className="appearance-none text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer"
            >
              <option value={TODOS}>📍 Todos los municipios</option>
              {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* EPS */}
          <div className="relative">
            <select
              id="farm-select-eps"
              value={eps}
              onChange={(e) => setEps(e.target.value)}
              className="appearance-none text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer"
            >
              <option value={TODAS}>🏥 Todas las EPS</option>
              {epsLista.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Toggle solo abiertos */}
          <button
            id="btn-solo-abiertos"
            onClick={() => setSoloAbiertos((v) => !v)}
            className={`text-sm font-medium px-4 py-2 rounded-xl border transition-all ${
              soloAbiertos
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
            }`}
          >
            ● Abiertas ahora
          </button>
        </div>

        {/* ── Cards de farmacias ────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="mt-4 text-slate-500 dark:text-slate-400 animate-pulse">Cargando farmacias...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="font-bold text-lg text-slate-700 dark:text-slate-300">Error de conexión</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{error}</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏥</div>
            <p className="font-bold text-slate-700 dark:text-slate-300">Sin farmacias con estos filtros</p>
            <button
              onClick={() => { setMunicipio(TODOS); setEps(TODAS); setSoloAbiertos(false); }}
              className="mt-4 text-sm text-primary-500 dark:text-emerald-400 font-semibold hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {filtradas.map((farm) => (
              <div
                key={farm.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:shadow-lg transition-all group"
              >
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🏥</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                      {farm.nombre}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <MapPin size={11} />
                      <span>{farm.municipio} · {farm.distancia}</span>
                    </div>
                  </div>
                  {/* Indicador abierto/cerrado */}
                  <span
                    className={`flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      farm.abierto
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {farm.abierto ? '● Abierto' : '○ Cerrado'}
                  </span>
                </div>

                {/* Detalles */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{farm.direccion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Clock size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{farm.horario}</span>
                  </div>
                  <a
                    href={`tel:${farm.telefono.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 text-xs text-primary-500 dark:text-emerald-400 hover:underline"
                  >
                    <Phone size={12} className="flex-shrink-0" />
                    <span>{farm.telefono}</span>
                  </a>
                  <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-emerald-400 font-semibold">
                    <Package size={12} className="flex-shrink-0" />
                    <span>{farm.medicamentosDisponibles} medicamentos disponibles</span>
                  </div>
                </div>

                {/* EPS que atiende */}
                <div>
                  <div className="flex items-center gap-1 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Shield size={11} />
                    <span>EPS que atiende</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {farm.eps.map((e) => (
                      <span
                        key={e}
                        className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
