import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import type { MedicamentoConFarmacias } from '../types/index.ts'

const normalizar = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const useMedicamentos = (filtros?: { busqueda?: string; categoria?: string; estado?: string }) => {
  const [data, setData] = useState<MedicamentoConFarmacias[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedicamentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const medicamentos = await api.getMedicamentos({
        ...filtros,
        categoria: filtros?.categoria ? normalizar(filtros.categoria) : undefined,
        estado: (filtros?.estado === 'disponible' || filtros?.estado === 'limitado' || filtros?.estado === 'agotado') 
          ? filtros.estado 
          : undefined,
      });
      setData(medicamentos);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg || "Error al cargar medicamentos");
    } finally {
      setLoading(false);
    }
  }, [filtros?.busqueda, filtros?.categoria, filtros?.estado]);

  useEffect(() => {
    void fetchMedicamentos();
  }, [fetchMedicamentos]);

  return { data, loading, error, refresh: fetchMedicamentos };
};
