/**
 * QR — Página de escáner de código QR
 * Estados: idle | scanning | success
 * Incluye lista de farmacias cercanas con disponibilidad
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MapPin, Clock, CheckCircle2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { farmacias } from '../data/farmacias';

type ScanState = 'idle' | 'scanning' | 'success';

export default function QR() {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simular detección de QR después de 3 s
  const startScan = () => {
    setScanState('scanning');
    timerRef.current = setTimeout(() => setScanState('success'), 3000);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setScanState('idle');
  };

  // Tomar las 4 primeras farmacias como "cercanas"
  const farmaciasCercanas = farmacias.slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 flex items-center gap-3 transition-colors">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-1 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Escanear QR</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Apunta la cámara al código del medicamento
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8">

        {/* ── Viewport del escáner ─────────────────────────────────────── */}
        <div
          id="qr-viewport"
          className="relative mx-auto w-64 h-64 rounded-3xl overflow-hidden bg-slate-900 shadow-2xl"
        >
          {/* Guías de esquina */}
          {[
            'top-3 left-3',
            'top-3 right-3 rotate-90',
            'bottom-3 left-3 -rotate-90',
            'bottom-3 right-3 rotate-180',
          ].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-7 h-7 pointer-events-none`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-primary-400 dark:bg-emerald-400 rounded-full" />
              <div className="absolute top-0 left-0 w-1 h-full bg-primary-400 dark:bg-emerald-400 rounded-full" />
            </div>
          ))}

          {/* Línea de escaneo animada */}
          {scanState === 'scanning' && (
            <div className="absolute inset-x-6 top-6 h-0.5 bg-primary-400 dark:bg-emerald-400 rounded-full shadow-lg shadow-primary-500/50 animate-scan z-10" />
          )}

          {/* Estado idle */}
          {scanState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center animate-pulse-slow">
                {/* QR mini-icon SVG */}
                <svg viewBox="0 0 40 40" className="w-12 h-12 fill-white/50">
                  <rect x="2"  y="2"  width="14" height="14" rx="2" />
                  <rect x="24" y="2"  width="14" height="14" rx="2" />
                  <rect x="2"  y="24" width="14" height="14" rx="2" />
                  <rect x="5"  y="5"  width="8"  height="8"  rx="1" className="fill-slate-900" />
                  <rect x="27" y="5"  width="8"  height="8"  rx="1" className="fill-slate-900" />
                  <rect x="5"  y="27" width="8"  height="8"  rx="1" className="fill-slate-900" />
                  <rect x="24" y="24" width="4"  height="4"  rx="1" />
                  <rect x="30" y="24" width="4"  height="4"  rx="1" />
                  <rect x="24" y="30" width="4"  height="4"  rx="1" />
                  <rect x="30" y="30" width="4"  height="4"  rx="1" />
                </svg>
              </div>
              <p className="text-white/60 text-xs text-center px-6 leading-relaxed">
                Toca el botón para<br />activar el escáner
              </p>
            </div>
          )}

          {/* Estado scanning */}
          {scanState === 'scanning' && (
            <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Estado success */}
          {scanState === 'success' && (
            <div className="absolute inset-0 bg-primary-500/90 dark:bg-emerald-600/90 flex flex-col items-center justify-center gap-2 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-white" />
              </div>
              <p className="text-white font-bold text-sm">¡Código detectado!</p>
              <p className="text-white/80 text-xs">Acetaminofén 500 mg</p>
              <p className="text-white/60 text-[10px]">Tecnoquímicas</p>
            </div>
          )}
        </div>

        {/* ── Botones de acción ────────────────────────────────────────── */}
        <div className="flex justify-center gap-3 mt-6">
          {scanState === 'idle' && (
            <button
              id="btn-activar-scanner"
              onClick={startScan}
              className="btn-primary px-10 text-sm"
            >
              Activar cámara
            </button>
          )}
          {scanState === 'scanning' && (
            <button onClick={reset} className="btn-outline text-sm">
              Cancelar
            </button>
          )}
          {scanState === 'success' && (
            <>
              <button
                onClick={reset}
                className="btn-outline text-sm"
              >
                Escanear otro
              </button>
              <button
                onClick={() => navigate('/buscar?q=Acetaminofen')}
                className="btn-primary text-sm"
              >
                Ver disponibilidad
              </button>
            </>
          )}
        </div>

        {/* ── Instrucciones ────────────────────────────────────────────── */}
        <div className="mt-6 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Escanea el código QR del <strong>empaque del medicamento</strong> o
            el código impreso en tu <strong>fórmula médica</strong> para consultar
            disponibilidad en todas las farmacias de Sabana Centro.
          </p>
        </div>

        {/* ── Farmacias cercanas ───────────────────────────────────────── */}
        <div className="mt-8 mb-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
            Farmacias cercanas
          </h2>
          <div className="space-y-3">
            {farmaciasCercanas.map((f) => (
              <div
                key={f.id}
                className="card p-4 flex items-start gap-3 hover:shadow-md transition-all"
              >
                {/* Ícono con color según estado */}
                <div
                  className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    f.abierto
                      ? 'bg-emerald-50 dark:bg-emerald-900/30'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}
                >
                  <MapPin
                    size={18}
                    className={f.abierto
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                      {f.nombre}
                    </p>
                    <span
                      className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        f.abierto
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {f.abierto ? '● Abierto' : '○ Cerrado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {f.municipio} · {f.distancia}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {f.horario}
                    </span>
                  </div>
                </div>

                {/* Contador de meds */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 text-primary-600 dark:text-emerald-400">
                    <Package size={13} />
                    <span className="text-sm font-bold">{f.medicamentosDisponibles}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">meds.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
