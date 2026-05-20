import { useState, useEffect } from 'react';
import { turnosApi } from '../services/turnosApi';
import type { EPSTurno } from '../types/turnos';

export const useEPS = () => {
  const [data, setData] = useState<EPSTurno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    turnosApi
      .getEPS()
      .then((eps) => { if (!cancelled) setData(eps); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
};
