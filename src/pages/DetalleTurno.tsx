/**
 * DetalleTurno — Comprobante visual + acciones del turno
 */
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Printer, Calendar, Clock, MapPin, Phone,
  Shield, Pill, Hash, CheckCircle2, Loader2, AlertCircle, XCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTurno } from '../hooks/useTurnos';
import { turnosApi } from '../services/turnosApi';
import AppointmentStatusBadge from '../components/turnos/AppointmentStatusBadge';
import ConfirmationModal from '../components/turnos/ConfirmationModal';

function formatFecha(fecha: string) {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${d} de ${meses[parseInt(m) - 1]} de ${y}`;
}

function formatHora(hora: string) {
  if (!hora) return '—';
  return hora.slice(0, 5);
}

export default function DetalleTurno() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isNuevo = (location.state as { nuevo?: boolean } | null)?.nuevo === true;

  const { data: turno, loading, error } = useTurno(id ? parseInt(id) : null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Limpiar el state de "nuevo" para que no reaparezca al refrescar
  const cleanedRef = useRef(false);
  useEffect(() => {
    if (isNuevo && !cleanedRef.current) {
      cleanedRef.current = true;
      window.history.replaceState({}, '');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
        <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Inicia sesión</h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 animate-pulse">Cargando turno...</p>
        </div>
      </div>
    );
  }

  if (error || !turno) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
        <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="font-bold text-lg text-slate-700 dark:text-slate-300">Turno no encontrado</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
          <button
            onClick={() => navigate('/mis-turnos')}
            className="mt-5 text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            Volver a mis turnos
          </button>
        </div>
      </div>
    );
  }

  const handleCancelar = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await turnosApi.cancelarTurno(turno.id);
      setShowCancelModal(false);
      navigate('/mis-turnos', { replace: true });
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Error al cancelar');
    } finally {
      setCancelling(false);
    }
  };

  // Parse medicamentos from JSON string with error handling
  let medicamentos = [];
  try {
    medicamentos = turno.medicamentos_json
      ? JSON.parse(turno.medicamentos_json)
      : [];
  } catch {
    medicamentos = [];
  }

  const puedeCancel = turno.estado === 'Pendiente';

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="py-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/mis-turnos')}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Detalle del Turno</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{turno.codigo_turno}</p>
          </div>
        </div>

        {/* Banner de éxito si es nuevo */}
        {isNuevo && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-800 dark:text-emerald-300">¡Turno agendado exitosamente!</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Tu turno ha sido reservado. Preséntate a tiempo con tu documento de identidad.
              </p>
            </div>
          </div>
        )}

        {/* Comprobante */}
        <div
          id="comprobante-turno"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm mb-5"
        >
          {/* Cabecera del comprobante */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Comprobante de Turno
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">#{turno.codigo_turno}</span>
                  <span className="text-sm font-semibold text-white/80">Turno</span>
                </div>
              </div>
              <div className="text-right">
                <AppointmentStatusBadge estado={turno.estado} />
                <p className="text-xs text-white/70 mt-2 font-mono">{turno.codigo_turno}</p>
              </div>
            </div>
          </div>

          {/* Cuerpo del comprobante */}
          <div className="p-5 space-y-4">
            {/* Farmacia */}
            <Section icon={<MapPin size={15} className="text-emerald-500" />} title="Farmacia">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {turno.sede?.nombre ?? `Sede #${turno.sede_id}`}
              </p>
              {turno.sede && (
                <>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {turno.sede.municipio} · {turno.sede.direccion}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone size={10} /> {turno.sede.telefono ?? '—'}
                  </p>
                </>
              )}
            </Section>

            <Divider />

            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-4">
              <Section icon={<Calendar size={15} className="text-blue-500" />} title="Fecha">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {formatFecha(turno.fecha)}
                </p>
              </Section>
              <Section icon={<Clock size={15} className="text-purple-500" />} title="Hora">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {formatHora(turno.hora_inicio)}
                </p>
              </Section>
            </div>

            <Divider />

            {/* EPS */}
            <Section icon={<Shield size={15} className="text-blue-500" />} title="EPS">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {turno.eps_solicitante ?? '—'}
              </p>
            </Section>

            <Divider />

            {/* Medicamentos */}
            <Section icon={<Pill size={15} className="text-amber-500" />} title={`Medicamentos (${medicamentos.length})`}>
              <div className="space-y-2 mt-1">
                {medicamentos.map((tm: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-lg">{tm.icono ?? '💊'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {tm.nombre ?? `Medicamento #${tm.medicamento_id}`}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
                      ×{tm.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            <Divider />

            {/* Código */}
            <Section icon={<Hash size={15} className="text-slate-400" />} title="Código único">
              <p className="font-mono font-bold text-lg text-slate-800 dark:text-slate-200 tracking-widest">
                {turno.codigo_turno}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Presenta este código en la farmacia
              </p>
            </Section>
          </div>
        </div>

        {/* Error de cancelación */}
        {cancelError && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{cancelError}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 pb-4">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Printer size={15} /> Imprimir
          </button>

          {puedeCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-2 px-4 py-3 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <XCircle size={15} /> Cancelar turno
            </button>
          )}

          <button
            onClick={() => navigate('/mis-turnos')}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all"
          >
            Mis turnos
          </button>
        </div>
      </div>

      {/* Modal de cancelación */}
      <ConfirmationModal
        isOpen={showCancelModal}
        title="¿Cancelar este turno?"
        message="Al cancelar, el stock reservado se devolverá al inventario y el horario quedará disponible para otros pacientes."
        confirmLabel="Sí, cancelar"
        cancelLabel="No, mantener"
        danger
        loading={cancelling}
        onConfirm={handleCancelar}
        onCancel={() => { setShowCancelModal(false); setCancelError(null); }}
      />
    </div>
  );
}

// ── Sub-componentes de layout ─────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-slate-100 dark:bg-slate-700" />;
}
