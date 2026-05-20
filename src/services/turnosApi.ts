/**
 * turnosApi.ts — Métodos de API para el módulo de agendamiento de turnos
 * Extiende el cliente HTTP existente (fetcher) sin modificar api.ts
 */

import type { EPSTurno, HorarioDisponible, Turno, TurnoCreatePayload } from '../types/turnos';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  // ── EPS ──────────────────────────────────────────────────────────────────
  getEPS: () => fetcher<EPSTurno[]>('/eps?activo=true'),

  // ── Horarios disponibles ─────────────────────────────────────────────────
  getHorariosDisponibles: (farmacia_id: number, fecha: string) =>
    fetcher<HorarioDisponible[]>(
      `/horarios-disponibles?farmacia_id=${farmacia_id}&fecha=${fecha}&solo_disponibles=true`
    ),

  // ── Turnos ───────────────────────────────────────────────────────────────
  crearTurno: (payload: TurnoCreatePayload) =>
    fetcher<Turno>('/turnos', 'POST', payload),

  getMisTurnos: (filtros?: { estado?: string; fecha?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.fecha) params.append('fecha', filtros.fecha);
    const q = params.toString();
    return fetcher<Turno[]>(`/mis-turnos${q ? `?${q}` : ''}`);
  },

  getTurno: (id: number) => fetcher<Turno>(`/turnos/${id}`),

  cancelarTurno: (id: number) => fetcher<void>(`/turnos/${id}`, 'DELETE'),
};
