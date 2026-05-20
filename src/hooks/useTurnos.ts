import { useState, useEffect, useCallback } from 'react';
import { turnosApi } from '../services/turnosApi';
import type { Turno } from '../types/turnos';

export const useTurnos = (filtros?: { estado?: string; fecha?: string }) => {
  const [data, setData] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extraer primitivos para estabilizar las dependencias del callback
  const estado = filtros?.estado;
  const fecha = filtros?.fecha;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const turnos = await turnosApi.getMisTurnos(
        estado || fecha ? { estado, fecha } : undefined
      );
      setData(turnos);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  }, [estado, fecha]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { data, loading, error, refresh: fetch };
};

export const useTurno = (id: number | null) => {
  const [data, setData] = useState<Turno | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    turnosApi
      .getTurno(id)
      .then((t) => { if (!cancelled) setData(t); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
};
