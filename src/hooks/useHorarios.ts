import { useState, useEffect } from 'react';
import { turnosApi } from '../services/turnosApi';
import type { HorarioDisponible } from '../types/turnos';

export const useHorarios = (farmacia_id: number | null, fecha: string | null) => {
  const [data, setData] = useState<HorarioDisponible[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmacia_id || !fecha) {
      setData([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    turnosApi
      .getHorariosDisponibles(farmacia_id, fecha)
      .then((h) => { if (!cancelled) setData(h); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [farmacia_id, fecha]);

  return { data, loading, error };
};
