// ─── Tipos del Módulo Audifarma — Agendamiento de Turnos ─────────────────

export interface RedFarmaceutica {
  id: number;
  nombre: string;
  slug: string;
  logo_url?: string;
  activo: boolean;
}

export interface SedeFarmaceutica {
  id: number;
  red_id: number;
  nombre: string;
  municipio: string;
  direccion: string;
  telefono?: string;
  horario_apertura: string;
  horario_cierre: string;
  atiende_sabado: boolean;
  atiende_domingo: boolean;
  horario_sabado_apertura?: string;
  horario_sabado_cierre?: string;
  activo: boolean;
}

export interface SlotResponse {
  hora: string;
  disponible: boolean;
}

export type EstadoTurno = 'Pendiente' | 'Confirmado' | 'Cancelado' | 'Completado';

export interface Turno {
  id: number;
  usuario_id: number;
  sede_id: number;
  eps_solicitante: string;
  numero_afiliado?: string;
  fecha: string;          // YYYY-MM-DD
  hora_inicio: string;    // HH:MM
  hora_fin: string;       // HH:MM
  codigo_turno: string;
  estado: EstadoTurno;
  medicamentos_json?: string; // JSON string conteniendo medicamentos [{medicamento_id, cantidad, nombre, icono}]
  notas?: string;
  creado_en: string;
  sede?: SedeFarmaceutica;
}

export interface TurnoCreatePayload {
  sede_id: number;
  eps_solicitante: string;
  numero_afiliado?: string;
  fecha: string;          // YYYY-MM-DD
  hora_inicio: string;    // HH:MM
  hora_fin: string;       // HH:MM
  medicamentos?: { medicamento_id: number; cantidad: number; nombre: string; icono?: string }[];
  notas?: string;
}

// Estado del wizard de agendamiento
export interface WizardState {
  paso: 1 | 2 | 3 | 4 | 5;
  eps_solicitante: string | null;
  numero_afiliado: string;
  red_id: number | null;
  sede_id: number | null;
  medicamentos: { medicamento_id: number; cantidad: number; nombre: string; icono?: string }[];
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  notas: string;
}
