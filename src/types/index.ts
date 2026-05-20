// ─── Tipos de dominio — MediStock ─────────────────────────────────────────

// ── Tema ──────────────────────────────────────────────────────────────────────
export type Tema = 'claro' | 'oscuro';

// ── Rol de usuario ────────────────────────────────────────────────────────────
export type RolUsuario = 'paciente' | 'farmaceutico' | 'admin';

// ── Usuario ───────────────────────────────────────────────────────────────────
export interface Usuario {
  cedula: string;
  nombre: string;
  eps: string;
  rol: RolUsuario;
  id?: number;
  apellido?: string;
  email?: string;
}

// ── Categoría de medicamento ──────────────────────────────────────────────────
export interface Categoria {
  id: string;
  nombre: string;
  /** Nombre del ícono de lucide-react (string) */
  icono: string;
  /** Color de acento en hex */
  color: string;
  /** Color de fondo suave */
  bgColor: string;
  /** Cantidad de medicamentos en esa categoría */
  count: number;
}

// ── Tipo de categoría (unión) ─────────────────────────────────────────────────
export type CategoriaId =
  | 'analgesico'
  | 'antibiotico'
  | 'antidiabetico'
  | 'antiinflamatorio'
  | 'antihipertensivo'
  | 'cardioprotector'
  | 'gastrointestinal'
  | 'neurologico'
  | 'respiratorio';

// ── Estado de stock ───────────────────────────────────────────────────────────
export type EstadoStock = 'disponible' | 'limitado' | 'agotado';

// ── Farmacia (completa) ───────────────────────────────────────────────────────
export interface Farmacia {
  id: string;
  nombre: string;
  municipio: string;
  direccion: string;
  telefono: string;
  horario: string;
  /** EPS que atiende esta farmacia */
  eps: string[];
  medicamentosDisponibles: number;
  /** Coordenadas para futura integración con mapas */
  lat: number;
  lng: number;
  /** Si la farmacia está abierta en este momento (dato mock) */
  abierto: boolean;
  /** Distancia desde Chía centro (texto) */
  distancia: string;
}

// ── Stock de un medicamento en una farmacia (Inventario API) ──────────────────
export interface ItemInventario {
  farmacia_id: number;
  farmacia_nombre: string;
  farmacia_municipio: string;
  farmacia_direccion: string;
  stock: number;
  estado: 'disponible' | 'limitado' | 'agotado';
  precio_local?: number;
  lote?: string;
}

// ── Medicamento ───────────────────────────────────────────────────────────────
export interface Medicamento {
  id: number;
  nombre: string;
  nombre_generico: string;
  laboratorio: string;
  categoria: string;
  precio: number;
  unidad: string;
  activo: boolean;
  icono?: string;
  /** EPS que lo cubre (vacío = no cubierto por EPS) */
  epsCobertura?: string[];
  descripcion?: string;
}

// ── Medicamento con inventario por farmacia ───────────────────────────────────
export interface MedicamentoConFarmacias {
  id: number;
  nombre: string;
  nombre_generico: string;
  laboratorio: string;
  categoria: string;
  precio: number;
  unidad: string;
  activo: boolean;
  icono?: string;
  epsCobertura?: string[];
  descripcion?: string;
  inventario: ItemInventario[];
}

// ── Tarjeta de estadística (panel Admin) ─────────────────────────────────────
export interface StatCard {
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Módulo Audifarma — Agendamiento de Turnos
// ─────────────────────────────────────────────────────────────────────────────

export interface EPS {
  id: number;
  nombre: string;
  codigo?: string;
  activo: boolean;
  creado_en: string;
}

export interface HorarioDisponible {
  id: number;
  farmacia_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  capacidad_maxima: number;
  turnos_agendados: number;
  activo: boolean;
}

export interface TurnoMedicamento {
  id: number;
  medicamento_id: number;
  cantidad: number;
  medicamento?: Medicamento;
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
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  observaciones?: string;
  creado_en: string;
  actualizado_en: string;
  farmacia?: any;
  eps_obj?: EPS;
  medicamentos: TurnoMedicamento[];
}

export interface MedicamentoSeleccionado {
  medicamento_id: number;
  cantidad: number;
  nombre?: string;
  unidad?: string;
}
