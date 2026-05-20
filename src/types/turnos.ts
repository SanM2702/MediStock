// ─── Tipos del Módulo Audifarma — Agendamiento de Turnos ─────────────────

export interface EPSTurno {
  id: number;
  nombre: string;
  codigo?: string;
  activo: boolean;
  creado_en: string;
}

export interface HorarioDisponible {
  id: number;
  farmacia_id: number;
  fecha: string;          // YYYY-MM-DD
  hora_inicio: string;    // HH:MM:SS
  hora_fin: string;       // HH:MM:SS
  capacidad_maxima: number;
  turnos_agendados: number;
  activo: boolean;
  creado_en: string;
}

export interface TurnoMedicamento {
  id: number;
  medicamento_id: number;
  cantidad: number;
  medicamento?: {
    id: number;
    nombre: string;
    nombre_generico: string;
    laboratorio: string;
    categoria: string;
    precio: number;
    unidad: string;
    icono?: string;
  };
}

export type EstadoTurno = 'Pendiente' | 'Confirmado' | 'Cancelado' | 'Completado';

export interface Turno {
  id: number;
  codigo: string;
  numero_turno: number;
  usuario_id: number;
  farmacia_id: number;
  eps_id: number;
  horario_id: number;
  fecha: string;          // YYYY-MM-DD
  hora: string;           // HH:MM:SS
  estado: EstadoTurno;
  observaciones?: string;
  creado_en: string;
  actualizado_en: string;
  farmacia?: {
    id: number;
    nombre: string;
    municipio: string;
    direccion: string;
    telefono: string;
    horario_apertura: string;
    horario_cierre: string;
    eps_convenio?: string;
  };
  eps_obj?: EPSTurno;
  medicamentos: TurnoMedicamento[];
}

export interface TurnoCreatePayload {
  farmacia_id: number;
  eps_id: number;
  horario_id: number;
  medicamentos: { medicamento_id: number; cantidad: number }[];
  observaciones?: string;
}

// Estado del wizard de agendamiento
export interface WizardState {
  paso: 1 | 2 | 3 | 4 | 5;
  farmacia_id: number | null;
  eps_id: number | null;
  medicamentos: { medicamento_id: number; cantidad: number; nombre: string; icono?: string }[];
  fecha: string | null;
  horario_id: number | null;
}
