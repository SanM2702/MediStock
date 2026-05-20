/**
 * AgendarTurno — Wizard de 5 pasos para agendar un turno
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { turnosApi } from '../services/turnosApi';
import PharmacySelector from '../components/turnos/PharmacySelector';
import EPSSelector from '../components/turnos/EPSSelector';
import MedicineSelector from '../components/turnos/MedicineSelector';
import ScheduleSelector from '../components/turnos/ScheduleSelector';
import type { HorarioDisponible, WizardState } from '../types/turnos';

const PASOS = [
  { num: 1, label: 'Farmacia' },
  { num: 2, label: 'EPS' },
  { num: 3, label: 'Medicamentos' },
  { num: 4, label: 'Horario' },
  { num: 5, label: 'Confirmar' },
] as const;

const INITIAL: WizardState = {
  paso: 1,
  farmacia_id: null,
  eps_id: null,
  medicamentos: [],
  fecha: null,
  horario_id: null,
};

export default function AgendarTurno() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [state, setState] = useState<WizardState>(INITIAL);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<HorarioDisponible | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Nombres para el resumen
  const [farmaciaLabel, setFarmaciaLabel] = useState('');
  const [epsLabel, setEpsLabel] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
        <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Inicia sesión para agendar
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Necesitas una cuenta activa para reservar un turno.
          </p>
        </div>
      </div>
    );
  }

  const canNext = () => {
    if (state.paso === 1) return !!state.farmacia_id;
    if (state.paso === 2) return !!state.eps_id;
    if (state.paso === 3) return state.medicamentos.length > 0;
    if (state.paso === 4) return !!state.horario_id && !!state.fecha;
    return false;
  };

  const goNext = () => {
    if (state.paso < 5) setState((s) => ({ ...s, paso: (s.paso + 1) as WizardState['paso'] }));
  };

  const goBack = () => {
    if (state.paso > 1) setState((s) => ({ ...s, paso: (s.paso - 1) as WizardState['paso'] }));
  };

  const handleConfirm = async () => {
    if (!state.farmacia_id || !state.eps_id || !state.horario_id || state.medicamentos.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const turno = await turnosApi.crearTurno({
        farmacia_id: state.farmacia_id,
        eps_id: state.eps_id,
        horario_id: state.horario_id,
        medicamentos: state.medicamentos.map(({ medicamento_id, cantidad }) => ({ medicamento_id, cantidad })),
      });
      navigate(`/turnos/${turno.id}`, { state: { nuevo: true } });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al crear el turno');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto px-4">

        {/* Encabezado */}
        <div className="py-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Agendar Turno</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Reserva tu turno para retirar medicamentos subsidiados
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8">
          {PASOS.map(({ num, label }) => {
            const done = state.paso > num;
            const active = state.paso === num;
            return (
              <div key={num} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    {done ? <CheckCircle2 size={16} /> : num}
                  </div>
                  <span className={`text-[10px] font-semibold hidden sm:block ${
                    active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {label}
                  </span>
                </div>
                {num < 5 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${
                    done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Contenido del paso */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4">
            {state.paso === 1 && '🏥 Selecciona la farmacia'}
            {state.paso === 2 && '🛡️ Selecciona tu EPS'}
            {state.paso === 3 && '💊 Selecciona los medicamentos'}
            {state.paso === 4 && '🕐 Selecciona fecha y horario'}
            {state.paso === 5 && '✅ Confirma tu turno'}
          </h2>

          {state.paso === 1 && (
            <PharmacySelector
              selectedId={state.farmacia_id}
              onSelect={(id, nombre?: string) => {
                setState((s) => ({ ...s, farmacia_id: id }));
                if (nombre) setFarmaciaLabel(nombre);
              }}
            />
          )}

          {state.paso === 2 && (
            <EPSSelector
              selectedId={state.eps_id}
              onSelect={(id, nombre?: string) => {
                setState((s) => ({ ...s, eps_id: id }));
                if (nombre) setEpsLabel(nombre);
              }}
            />
          )}

          {state.paso === 3 && (
            <MedicineSelector
              selected={state.medicamentos}
              onChange={(meds) => setState((s) => ({ ...s, medicamentos: meds }))}
            />
          )}

          {state.paso === 4 && (
            <ScheduleSelector
              farmaciaId={state.farmacia_id}
              selectedHorarioId={state.horario_id}
              selectedFecha={state.fecha}
              onSelect={(h) => {
                setHorarioSeleccionado(h);
                setState((s) => ({ ...s, horario_id: h.id, fecha: h.fecha }));
              }}
            />
          )}

          {state.paso === 5 && (
            <ResumenTurno
              state={state}
              farmaciaLabel={farmaciaLabel}
              epsLabel={epsLabel}
              horario={horarioSeleccionado}
            />
          )}
        </div>

        {/* Error de submit */}
        {submitError && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
          </div>
        )}

        {/* Navegación */}
        <div className="flex gap-3 pb-4">
          {state.paso > 1 && (
            <button
              onClick={goBack}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Atrás
            </button>
          )}

          {state.paso < 5 ? (
            <button
              onClick={goNext}
              disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Agendando...</>
              ) : (
                <><CheckCircle2 size={16} /> Confirmar turno</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Resumen del turno (paso 5) ─────────────────────────────────────────────
function ResumenTurno({
  state,
  farmaciaLabel,
  epsLabel,
  horario,
}: {
  state: WizardState;
  farmaciaLabel: string;
  epsLabel: string;
  horario: HorarioDisponible | null;
}) {
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const fechaLabel = state.fecha
    ? (() => {
        const [y, m, d] = state.fecha.split('-');
        return `${d} ${meses[parseInt(m) - 1]} ${y}`;
      })()
    : '—';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoBlock label="Farmacia" value={farmaciaLabel || `#${state.farmacia_id}`} icon="🏥" />
        <InfoBlock label="EPS" value={epsLabel || `#${state.eps_id}`} icon="🛡️" />
        <InfoBlock label="Fecha" value={fechaLabel} icon="📅" />
        <InfoBlock
          label="Hora"
          value={horario ? horario.hora_inicio.slice(0, 5) : '—'}
          icon="🕐"
        />
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Medicamentos ({state.medicamentos.length})
        </p>
        <div className="space-y-1.5">
          {state.medicamentos.map((m) => (
            <div key={m.medicamento_id} className="flex items-center gap-2 text-sm">
              <span>{m.icono ?? '💊'}</span>
              <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{m.nombre}</span>
              <span className="text-slate-400 dark:text-slate-500 text-xs">×{m.cantidad}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
        ⚠️ Al confirmar, el stock se reservará temporalmente. Puedes cancelar el turno si ya no lo necesitas.
      </div>
    </div>
  );
}

function InfoBlock({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
        {icon} {label}
      </p>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{value}</p>
    </div>
  );
}
