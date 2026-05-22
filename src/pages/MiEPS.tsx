/**
 * MiEPS — Información sobre EPS cubiertas y medicamentos del plan básico
 * Datos mock educativos (sin funcionalidad real de login)
 */
import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, CheckCircle2, Info } from 'lucide-react';

// ── Datos mock de EPS ──────────────────────────────────────────────────────
const epsData = [
  {
    id: 'nueva-eps',
    nombre: 'Nueva EPS',
    logo: '🟦',
    afiliados: '13.2 millones',
    cobertura: 'Nacional',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    darkBg: 'bg-blue-900/20',
    darkText: 'text-blue-400',
    descripcion:
      'EPS pública con presencia en todo el territorio colombiano. Maneja el mayor número de afiliados al régimen contributivo.',
    telefono: '01 8000 910 990',
    web: 'www.nuevaeps.com.co',
  },
  {
    id: 'sura',
    nombre: 'EPS Sura',
    logo: '🟩',
    afiliados: '5.1 millones',
    cobertura: 'Nacional',
    color: '#059669',
    bgColor: '#ECFDF5',
    darkBg: 'bg-emerald-900/20',
    darkText: 'text-emerald-400',
    descripcion:
      'EPS privada con reconocida trayectoria. Ofrece amplia red de prestadores y programas de medicina preventiva.',
    telefono: '01 8000 051 320',
    web: 'www.eps.sura.com',
  },
  {
    id: 'sanitas',
    nombre: 'EPS Sanitas',
    logo: '🟥',
    afiliados: '3.8 millones',
    cobertura: 'Nacional',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    darkBg: 'bg-red-900/20',
    darkText: 'text-red-400',
    descripcion:
      'EPS privada con amplia red de clínicas propias. Conocida por su servicio en centros médicos especializados.',
    telefono: '601 787 7000',
    web: 'www.eps.sanitas.com',
  },
  {
    id: 'compensar',
    nombre: 'Compensar EPS',
    logo: '🟧',
    afiliados: '1.5 millones',
    cobertura: 'Bogotá y Cundinamarca',
    color: '#D97706',
    bgColor: '#FFFBEB',
    darkBg: 'bg-amber-900/20',
    darkText: 'text-amber-400',
    descripcion:
      'Caja de compensación familiar con EPS. Especializada en la región Bogotá–Cundinamarca con servicios complementarios de bienestar.',
    telefono: '601 307 8080',
    web: 'www.compensar.com',
  },
];

export default function MiEPS() {
  const [expandedEPS, setExpandedEPS] = useState<string | null>('nueva-eps');

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="max-w-screen-xl mx-auto px-4">

        {/* ── Encabezado ────────────────────────────────────────────── */}
        <div className="py-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Mi EPS</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            EPS cubiertas en Sabana Centro · Plan básico de medicamentos
          </p>
        </div>

        {/* ── Banner informativo ────────────────────────────────────── */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Info size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Medicamentos subsidiados por EPS
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 leading-relaxed">
              Los medicamentos listados en esta plataforma corresponden al Plan de Beneficios en
              Salud (PBS) de Colombia. Son entregados sin costo en farmacias autorizadas
              previa presentación de fórmula médica.
            </p>
          </div>
        </div>

        {/* ── Lista de EPS ──────────────────────────────────────────── */}
        <div className="space-y-3 mb-8">
          {epsData.map((eps) => {
            const isOpen = expandedEPS === eps.id;
            // Medicamentos cubiertos por esta EPS (datos estáticos para demo)
            const medsCubiertos = [
              { nombre: 'Acetaminofén 500 mg', categoria: 'Analgésico' },
              { nombre: 'Metformina 850 mg', categoria: 'Antidiabético' },
              { nombre: 'Losartán 50 mg', categoria: 'Antihipertensivo' },
              { nombre: 'Omeprazol 20 mg', categoria: 'Gastrointestinal' },
            ].filter(() => Math.random() > 0.3); // Simulación aleatoria

            return (
              <div
                key={eps.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all hover:shadow-md"
              >
                {/* Cabecera clickeable */}
                <button
                  id={`eps-${eps.id}`}
                  className="w-full flex items-center gap-4 p-4 text-left"
                  onClick={() => setExpandedEPS(isOpen ? null : eps.id)}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: eps.bgColor }}
                  >
                    {eps.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{eps.nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {eps.afiliados} afiliados · {eps.cobertura}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ color: eps.color, backgroundColor: eps.bgColor }}
                    >
                      {medsCubiertos.length} meds.
                    </span>
                    {isOpen
                      ? <ChevronUp size={16} className="text-slate-400" />
                      : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {/* Contenido expandido */}
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-700 p-4 animate-slide-up">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                      {eps.descripcion}
                    </p>

                    {/* Contacto */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                          Línea gratuita
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{eps.telefono}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                          Sitio web
                        </p>
                        <p className="text-sm font-bold text-primary-600 dark:text-emerald-400">{eps.web}</p>
                      </div>
                    </div>

                    {/* Medicamentos cubiertos */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Shield size={14} className="text-slate-500 dark:text-slate-400" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Medicamentos cubiertos en Sabana Centro
                        </p>
                      </div>
                      <div className="space-y-2">
                        {medsCubiertos.map((med, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                          >
                            <span className="text-xl">💊</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {med.nombre}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">{med.categoria}</p>
                            </div>
                            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                          </div>
                        ))}

                        {medsCubiertos.length === 0 && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                            No hay medicamentos registrados para esta EPS.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Nota legal ────────────────────────────────────────────── */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center">
            La información presentada es de carácter informativo y orientativo.
            Para confirmación oficial, consulte directamente con su EPS o farmacia autorizada.
            MediStock no es operado por ninguna EPS colombiana.
          </p>
        </div>
      </div>
    </div>
  );
}
