/**
 * turnosApi.ts — Métodos de API para el módulo de agendamiento de turnos
 * Extiende el cliente HTTP existente (fetcher) sin modificar api.ts
 */

import type { RedFarmaceutica, SedeFarmaceutica, SlotResponse, Turno, TurnoCreatePayload } from '../types/turnos';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper to capitalize estado values from backend
function capitalizeEstado(estado: string): string {
  const map: Record<string, string> = {
    'pendiente': 'Pendiente',
    'confirmado': 'Confirmado',
    'cancelado': 'Cancelado',
    'completado': 'Completado',
  };
  return map[estado.toLowerCase()] || estado;
}

const getHeaders = () => {
  const token = localStorage.getItem('medistock_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function fetcher<T>(endpoint: string, method = 'GET', body?: unknown): Promise<T> {
  const hadToken = !!localStorage.getItem('medistock_token');
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: getHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 401 && hadToken) {
    localStorage.removeItem('medistock_token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/') window.location.href = '/';
    throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
  }

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 422 && Array.isArray(errorData.detail)) {
      const msg = errorData.detail.map((e: { loc?: string[]; msg: string }) =>
        `${e.loc?.[1] ?? 'campo'}: ${e.msg}`
      ).join('; ');
      throw new Error(msg);
    }
    throw new Error(errorData.detail || `Error ${response.status}`);
  }

  return response.json();
}

export const turnosApi = {
  // ── Redes Farmacéuticas ──────────────────────────────────────────────────
  getRedes: () => fetcher<RedFarmaceutica[]>('/turnos/redes'),
  
  getRedesPorEps: (epsNombre: string) => 
    fetcher<RedFarmaceutica[]>(`/turnos/eps/${encodeURIComponent(epsNombre)}/redes`),

  // ── Sedes Farmacéuticas ──────────────────────────────────────────────────
  getSedes: (filtros?: { red_id?: number; municipio?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.red_id) params.append('red_id', String(filtros.red_id));
    if (filtros?.municipio) params.append('municipio', filtros.municipio);
    const q = params.toString();
    return fetcher<SedeFarmaceutica[]>(`/turnos/sedes${q ? `?${q}` : ''}`);
  },

  // ── Slots de Horarios ────────────────────────────────────────────────────
  getSlots: (sedeId: number, fecha: string) =>
    fetcher<SlotResponse[]>(`/turnos/slots?sede_id=${sedeId}&fecha=${fecha}`),

  // ── Turnos ───────────────────────────────────────────────────────────────
  crearTurno: (payload: TurnoCreatePayload) =>
    fetcher<Turno>('/turnos', 'POST', payload),

  getMisTurnos: async () => {
    const turnos = await fetcher<Turno[]>('/turnos/mis-turnos');
    // Normalize backend data to match frontend expectations
    return turnos.map(t => ({
      ...t,
      estado: capitalizeEstado(t.estado),
    }));
  },

  getTurno: async (id: number) => {
    const turnos = await fetcher<Turno[]>('/turnos/mis-turnos');
    const found = turnos.find(t => t.id === id);
    if (!found) throw new Error("Turno no encontrado");
    return {
      ...found,
      estado: capitalizeEstado(found.estado),
    };
  },

  cancelarTurno: (id: number) => fetcher<void>(`/turnos/${id}`, 'DELETE'),
};
