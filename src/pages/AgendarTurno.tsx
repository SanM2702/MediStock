import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  Pill, 
  Info, 
  Plus, 
  Minus, 
  Trash2, 
  Search 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { turnosApi } from '../services/turnosApi';
import { api } from '../services/api';
import { sendTurnoConfirmationEmail } from '../services/emailjs';
import type { RedFarmaceutica, SedeFarmaceutica, SlotResponse, Turno } from '../types/turnos';
import type { MedicamentoConFarmacias } from '../types/index';

const PASOS = [
  { num: 1, label: 'EPS & Red' },
  { num: 2, label: 'Sede' },
  { num: 3, label: 'Medicamentos' },
  { num: 4, label: 'Horario' },
  { num: 5, label: 'Confirmar' },
] as const;

const LISTA_EPS = [
  "Nueva EPS",
  "Sanitas",
  "Sura",
  "Compensar",
  "Capital Salud",
  "Coosalud",
  "Famisanar",
  "Salud Total"
];

const MUNICIPIOS_SABANA = [
  "Chía",
  "Zipaquirá",
  "Cajicá",
  "Sopó",
  "Cogua",
  "Tabio",
  "Tenjo",
  "Gachancipá",
  "Tocancipá"
];

// Helper to format Date
const formatFechaReadable = (dateStr: string) => {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}, ${y}`;
};

export default function AgendarTurno() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Wizard state
  const [paso, setPaso] = useState<number>(1);
  const [eps, setEps] = useState<string>('');
  const [redes, setRedes] = useState<RedFarmaceutica[]>([]);
  const [loadingRedes, setLoadingRedes] = useState(false);
  const [selectedRed, setSelectedRed] = useState<RedFarmaceutica | null>(null);

  const [municipio, setMunicipio] = useState<string>('Chía');
  const [sedes, setSedes] = useState<SedeFarmaceutica[]>([]);
  const [loadingSedes, setLoadingSedes] = useState(false);
  const [selectedSede, setSelectedSede] = useState<SedeFarmaceutica | null>(null);

  const [busquedaMed, setBusquedaMed] = useState('');
  const [medSearchResults, setMedSearchResults] = useState<MedicamentoConFarmacias[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<{
    medicamento_id: number;
    cantidad: number;
    nombre: string;
    icono?: string;
    maxStock: number;
  }[]>([]);

  const [fecha, setFecha] = useState<string>('');
  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [numeroAfiliado, setNumeroAfiliado] = useState('');
  const [notas, setNotas] = useState('');

  // Execution states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoTurno, setExitoTurno] = useState<Turno | null>(null);

  // Initialize EPS from user profile
  useEffect(() => {
    if (user?.eps && LISTA_EPS.some(e => e.toLowerCase() === user.eps.toLowerCase())) {
      const match = LISTA_EPS.find(e => e.toLowerCase() === user.eps.toLowerCase());
      if (match) setEps(match);
    } else {
      setEps(LISTA_EPS[0]);
    }
  }, [user]);

  // Load networks for current EPS
  useEffect(() => {
    if (!eps) return;
    const fetchRedes = async () => {
      setLoadingRedes(true);
      setSelectedRed(null);
      setSelectedSede(null);
      try {
        const res = await turnosApi.getRedesPorEps(eps);
        setRedes(res);
        if (res.length > 0) {
          setSelectedRed(res[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRedes(false);
      }
    };
    void fetchRedes();
  }, [eps]);

  // Load sedes for current Red and Municipio
  useEffect(() => {
    if (!selectedRed || !municipio) return;
    const fetchSedes = async () => {
      setLoadingSedes(true);
      setSelectedSede(null);
      try {
        const res = await turnosApi.getSedes({ red_id: selectedRed.id, municipio });
        setSedes(res);
        if (res.length > 0) {
          setSelectedSede(res[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSedes(false);
      }
    };
    void fetchSedes();
  }, [selectedRed, municipio]);

  // Search medicines on Step 3
  useEffect(() => {
    if (busquedaMed.length < 2) {
      setMedSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoadingMeds(true);
      try {
        const res = await api.getMedicamentos({ busqueda: busquedaMed });
        setMedSearchResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMeds(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [busquedaMed]);

  // Fetch slots when date or Sede changes
  useEffect(() => {
    if (!selectedSede || !fecha) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await turnosApi.getSlots(selectedSede.id, fecha);
        setSlots(res);
      } catch (err) {
        console.error(err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    void fetchSlots();
  }, [selectedSede, fecha]);

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

  // Next Step validation logic
  const canNext = () => {
    if (paso === 1) return !!selectedRed;
    if (paso === 2) return !!selectedSede;
    if (paso === 3) return selectedMeds.length > 0;
    if (paso === 4) return !!selectedSlot && !!fecha;
    return false;
  };

  const goNext = () => {
    if (paso < 5) setPaso(paso + 1);
  };

  const goBack = () => {
    if (paso > 1) setPaso(paso - 1);
  };

  const addMed = (med: MedicamentoConFarmacias) => {
    const inventarioSede = med.inventarios?.find((i: any) => i.farmacia_id === selectedSede?.id);
    const stock = inventarioSede ? inventarioSede.stock : 0;
    
    if (stock <= 0) return;
    if (selectedMeds.some(m => m.medicamento_id === med.id)) return;

    setSelectedMeds(prev => [
      ...prev,
      {
        medicamento_id: med.id,
        nombre: med.nombre,
        icono: med.icono,
        cantidad: 1,
        maxStock: stock
      }
    ]);
  };

  const removeMed = (id: number) => {
    setSelectedMeds(prev => prev.filter(m => m.medicamento_id !== id));
  };

  const adjustMedQuantity = (id: number, delta: number) => {
    setSelectedMeds(prev =>
      prev.map(m => {
        if (m.medicamento_id === id) {
          const newQty = m.cantidad + delta;
          return {
            ...m,
            cantidad: Math.max(1, Math.min(m.maxStock, newQty))
          };
        }
        return m;
      })
    );
  };

  const handleConfirm = async () => {
    if (!selectedSede || !selectedSlot || !fecha || selectedMeds.length === 0) return;
    
    setSubmitting(true);
    setErrorMsg(null);

    // Calc end time (15 mins duration)
    const [h, m] = selectedSlot.split(':').map(Number);
    const finMin = m + 15;
    const finH = h + Math.floor(finMin / 60);
    const finM = finMin % 60;
    const hora_fin = `${String(finH).padStart(2, '0')}:${String(finM).padStart(2, '0')}`;

    try {
      const payload = {
        sede_id: selectedSede.id,
        eps_solicitante: eps,
        numero_afiliado: numeroAfiliado || undefined,
        fecha,
        hora_inicio: selectedSlot,
        hora_fin,
        medicamentos: selectedMeds.map(m => ({
          medicamento_id: m.medicamento_id,
          cantidad: m.cantidad,
          nombre: m.nombre,
          icono: m.icono
        })),
        notas: notas || undefined
      };

      const res = await turnosApi.crearTurno(payload);
      setExitoTurno(res);

      // Trigger EmailJS Email
      try {
        await sendTurnoConfirmationEmail(
          user.email,
          `${user.nombre} ${user.apellido || ''}`,
          res.codigo_turno,
          selectedSede.nombre,
          selectedSede.direccion,
          formatFechaReadable(fecha),
          selectedSlot,
          selectedMeds
        );
      } catch (emailErr) {
        console.warn("No se pudo enviar el correo de confirmación", emailErr);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al agendar el turno. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setPaso(1);
    setSelectedMeds([]);
    setFecha('');
    setSelectedSlot(null);
    setNotas('');
    setNumeroAfiliado('');
    setExitoTurno(null);
    setErrorMsg(null);
  };

  // Get tomorrow's date string for min date in picker
  const getTomorrowString = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return tom.toISOString().split('T')[0];
  };

  // Success view screen
  if (exitoTurno) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-6 px-4">
        <div className="max-w-xl mx-auto my-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Decorative glowing gradient */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />

          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
              <CheckCircle2 size={44} className="stroke-[2.5]" />
            </div>

            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              ¡Turno Agendado con Éxito!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Se ha enviado una confirmación detallada a tu correo: <strong className="text-slate-600 dark:text-slate-300">{user?.email}</strong>.
            </p>

            {/* Display Big Code */}
            <div className="my-8 py-5 px-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                Código de Turno
              </span>
              <p className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-1 select-all tracking-wider font-mono">
                {exitoTurno.codigo_turno}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3.5 text-left border-t border-slate-100 dark:border-slate-700/50 pt-6">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>EPS:</strong> {eps}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-slate-400 mt-0.5" />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Sede:</strong> {selectedSede?.nombre} <br />
                  <span className="text-xs text-slate-400">{selectedSede?.direccion} · {selectedSede?.municipio}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Fecha:</strong> {formatFechaReadable(fecha)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Hora:</strong> {selectedSlot} - {exitoTurno.hora_fin || ''}
                </span>
              </div>
            </div>

            {/* Medicines List */}
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-4 mt-6 text-left border border-slate-100 dark:border-slate-700/30">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-wider">
                Medicamentos a retirar
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {selectedMeds.map(m => (
                  <div key={m.medicamento_id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300 truncate">
                      {m.icono || '💊'} {m.nombre}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold flex-shrink-0">
                      x{m.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/mis-turnos')}
                className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-500/10 active:scale-95 transition-all text-sm"
              >
                Ver Mis Turnos
              </button>
              <button
                onClick={resetWizard}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold active:scale-95 transition-all text-sm"
              >
                Agendar Otro Turno
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sede Remission mapping checks
  const esRemision = selectedSede && municipio && selectedSede.municipio.toLowerCase() !== municipio.toLowerCase();

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Encabezado */}
        <div className="py-6">
          <h1 className="text-2xl font-black bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Agendar Turno
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reserva tu turno de atención prioritaria para reclamar tus fórmulas médicas
          </p>
        </div>

        {/* Stepper Progress bar */}
        <div className="flex items-center gap-1.5 mb-8">
          {PASOS.map(({ num, label }) => {
            const done = paso > num;
            const active = paso === num;
            return (
              <div key={num} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                    done
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : active
                      ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/35 border border-teal-400/20 scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-transparent'
                  }`}>
                    {done ? <CheckCircle2 size={18} className="stroke-[2.5]" /> : num}
                  </div>
                  <span className={`text-[10px] font-bold hidden sm:block tracking-wide uppercase ${
                    active ? 'text-teal-500 dark:text-teal-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {label}
                  </span>
                </div>
                {num < 5 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${
                    done ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Main Panel Content */}
        <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 rounded-3xl p-6 mb-6 shadow-xl backdrop-blur-md">
          
          {/* PASO 1: EPS Y RED */}
          {paso === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  1. Selecciona tu EPS afiliada
                </label>
                <select
                  value={eps}
                  onChange={(e) => setEps(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  {LISTA_EPS.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  2. Red farmacéutica asignada
                </label>

                {loadingRedes ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  </div>
                ) : redes.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    No se encontraron redes asignadas para esta EPS.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {redes.map((r) => {
                      const selected = selectedRed?.id === r.id;
                      // Display a custom color badge or emoji
                      const emoji = r.slug === 'audifarma' ? '🏥' : r.slug === 'cruz_verde' ? '🟢' : r.slug === 'colsubsidio' ? '🔵' : '🔴';
                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRed(r)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 ${
                            selected
                              ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20'
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="text-3xl filter drop-shadow-sm">{emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{r.nombre}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Red Farmacéutica</p>
                          </div>
                          {selected && (
                            <div className="w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                              <CheckCircle2 size={12} className="stroke-[2.5]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: SEDE */}
          {paso === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Ubicación (Municipio de Sabana Centro)
                </label>
                <select
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  {MUNICIPIOS_SABANA.map(mun => (
                    <option key={mun} value={mun}>{mun}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  Sede de Atención
                </label>

                {loadingSedes ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  </div>
                ) : sedes.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    No hay sedes disponibles de la red <strong className="text-slate-600 dark:text-slate-300">{selectedRed?.nombre}</strong> en este municipio.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {esRemision && selectedSede && (
                      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300">
                        <Info size={16} className="text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                        <p>
                          <strong>📍 Sede de remisión asignada:</strong> Debido a que tu municipio ({municipio}) no cuenta con una sede física de {selectedRed?.nombre}, tu punto de atención por convenio más cercano es en <strong>{selectedSede.municipio}</strong>.
                        </p>
                      </div>
                    )}

                    {sedes.map((s) => {
                      const selected = selectedSede?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSede(s)}
                          className={`w-full flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 ${
                            selected
                              ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20'
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{s.nombre}</h3>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                                <MapPin size={12} /> {s.direccion} · {s.municipio}
                              </p>
                            </div>
                            {selected && (
                              <div className="w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                <CheckCircle2 size={12} className="stroke-[2.5]" />
                              </div>
                            )}
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                              📅 L-V: {s.horario_apertura} - {s.horario_cierre}
                            </span>
                            {s.atiende_sabado && (
                              <span className="bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400">
                                Sáb: {s.horario_sabado_apertura || s.horario_apertura} - {s.horario_sabado_cierre || s.horario_cierre}
                              </span>
                            )}
                            {s.atiende_domingo ? (
                              <span className="bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded text-teal-600 dark:text-teal-400">
                                Dom & Festivos
                              </span>
                            ) : (
                              <span className="bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded text-red-600 dark:text-red-400">
                                Dom: Cerrado
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 3: MEDICAMENTOS */}
          {paso === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Sede seleccionada:
                </span>
                <span className="bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/20">
                  {selectedSede?.nombre}
                </span>
              </div>

              {/* Selected List */}
              {selectedMeds.length > 0 && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Medicamentos Agregados ({selectedMeds.length})
                  </label>
                  <div className="space-y-2">
                    {selectedMeds.map((m) => (
                      <div
                        key={m.medicamento_id}
                        className="flex items-center gap-3 bg-emerald-50/30 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3.5 hover:shadow-sm transition-all"
                      >
                        <span className="text-2xl flex-shrink-0">{m.icono ?? '💊'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                            {m.nombre}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            Cargado en stock (Máx: {m.maxStock} uds.)
                          </p>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-1 shadow-sm">
                          <button
                            onClick={() => adjustMedQuantity(m.medicamento_id, -1)}
                            disabled={m.cantidad <= 1}
                            className="w-7 h-7 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-500 disabled:opacity-40"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-extrabold text-slate-800 dark:text-slate-200">
                            {m.cantidad}
                          </span>
                          <button
                            onClick={() => adjustMedQuantity(m.medicamento_id, 1)}
                            disabled={m.cantidad >= m.maxStock}
                            className="w-7 h-7 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-500 disabled:opacity-40"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeMed(m.medicamento_id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medicine Search input */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Buscar Medicamentos
                </label>
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={busquedaMed}
                    onChange={(e) => setBusquedaMed(e.target.value)}
                    placeholder="Escribe el nombre del medicamento..."
                    className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                  />
                </div>

                {/* Results list */}
                {busquedaMed.length >= 2 && (
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800 rounded-2xl p-2.5 bg-slate-50/30 dark:bg-slate-900/10">
                    {loadingMeds ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                      </div>
                    ) : medSearchResults.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400">
                        No se hallaron resultados para "{busquedaMed}".
                      </p>
                    ) : (
                      medSearchResults.map((med) => {
                        const inStockItem = med.inventarios?.find((i: any) => i.farmacia_id === selectedSede?.id);
                        const stock = inStockItem ? inStockItem.stock : 0;
                        const yaAgregado = selectedMeds.some(m => m.medicamento_id === med.id);

                        return (
                          <div
                            key={med.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent bg-white dark:bg-slate-800 shadow-sm transition-all"
                          >
                            <span className="text-2xl">{med.icono || '💊'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{med.nombre}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{med.laboratorio} · {med.unidad}</p>
                            </div>

                            <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                              {stock > 0 ? (
                                <>
                                  <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                    Disponible ({stock} uds)
                                  </span>
                                  <button
                                    onClick={() => addMed(med)}
                                    disabled={yaAgregado}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                                      yaAgregado
                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-default'
                                        : 'bg-teal-500 hover:bg-teal-600 text-white active:scale-95'
                                    }`}
                                  >
                                    {yaAgregado ? 'Agregado' : 'Agregar'}
                                  </button>
                                </>
                              ) : (
                                <span className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                  Sin Stock
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 4: HORARIOS */}
          {paso === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Selecciona la Fecha de Atención
                </label>
                <input
                  type="date"
                  value={fecha}
                  min={getTomorrowString()}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              {fecha && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                    Horas de Citas Disponibles (Bloques de 15 minutos)
                  </label>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                      La sede no cuenta con horarios de atención activos para esta fecha o todos los turnos están reservados.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {slots.map((s) => {
                        const selected = selectedSlot === s.hora;
                        return (
                          <button
                            key={s.hora}
                            disabled={!s.disponible}
                            onClick={() => setSelectedSlot(s.hora)}
                            className={`py-2 px-1 text-xs rounded-xl font-bold border transition-all duration-150 ${
                              selected
                                ? 'bg-teal-500 border-teal-500 text-white shadow shadow-teal-500/30 scale-[1.03]'
                                : !s.disponible
                                ? 'bg-slate-50 dark:bg-slate-900/20 border-transparent text-slate-300 dark:text-slate-600 line-through cursor-not-allowed'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-700'
                            }`}
                          >
                            {s.hora}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PASO 5: CONFIRMACIÓN */}
          {paso === 5 && (
            <div className="space-y-6">
              <div className="bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Resumen de la Cita
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">EPS de Solicitud</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{eps}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Red Asignada</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRed?.nombre}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Sede de Entrega</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{selectedSede?.nombre}</span>
                    <span className="text-[10px] text-slate-400">{selectedSede?.direccion} · {selectedSede?.municipio}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Fecha y Hora</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      📅 {formatFechaReadable(fecha)} <br />
                      🕐 {selectedSlot} ({paso === 5 && selectedSlot ? (() => {
                        const [h, m] = selectedSlot.split(':').map(Number);
                        const finMin = m + 15;
                        const finH = h + Math.floor(finMin / 60);
                        const finM = finMin % 60;
                        return `${selectedSlot} - ${String(finH).padStart(2, '0')}:${String(finM).padStart(2, '0')}`;
                      })() : ''})
                    </span>
                  </div>
                </div>
              </div>

              {/* Medicines Resumen list */}
              <div className="bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Medicamentos seleccionados ({selectedMeds.length})
                </h3>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedMeds.map(m => (
                    <div key={m.medicamento_id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100/50 dark:border-slate-800/30 last:border-0">
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {m.icono || '💊'} {m.nombre}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        x{m.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    Número de Afiliación (Opcional)
                  </label>
                  <input
                    type="text"
                    value={numeroAfiliado}
                    onChange={(e) => setNumeroAfiliado(e.target.value)}
                    placeholder="Ej: EPS-1234567"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    Notas u Observaciones (Opcional)
                  </label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Detalles sobre quién retira o requerimientos particulares..."
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 mb-5">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex gap-3 pb-8">
          {paso > 1 && (
            <button
              onClick={goBack}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
            >
              <ChevronLeft size={18} /> Atrás
            </button>
          )}

          {paso < 5 ? (
            <button
              onClick={goNext}
              disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-teal-500/10 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-teal-500/20 active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Agendando cita...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} className="stroke-[2.5]" />
                  Confirmar Agendamiento
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
