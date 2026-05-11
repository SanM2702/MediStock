import { useState, useEffect } from "react";
import { api } from "../services/api";

export const useFarmacias = (filtros?: { municipio?: string; eps?: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFarmacias = async () => {
    setLoading(true);
    setError(null);
    try {
      const farmacias = await api.getFarmacias(filtros);
      setData(farmacias);
    } catch (err: any) {
      setError(err.message || "Error al cargar farmacias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmacias();
  }, [filtros?.municipio, filtros?.eps]);

  return { data, loading, error, refresh: fetchFarmacias };
};
