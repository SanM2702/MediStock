import { useState, useCallback } from 'react';
import { api } from '../services/api';

export interface ActividadHistorial {
  id: number;
  tipo: string;
  titulo: string;
  descripcion?: string;
  metadata_json?: string;
  creado_en: string;
}

export interface FiltrosHistorial {
  tipo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  limite?: number;
}

export interface Resumen {
  consultas: number;
  turnos: number;
  busquedas: number;
  chats: number;
  cambios_perfil: number;
  logins: number;
  otros: number;
}

export interface HistorialAgrupado {
  [fecha: string]: ActividadHistorial[];
}

export const useHistorial = () => {
  const [data, setData] = useState<ActividadHistorial[]>([]);
  const [historialAgrupado, setHistorialAgrupado] = useState<HistorialAgrupado>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);

  const getHistorial = useCallback(async (filtros?: FiltrosHistorial) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getHistorial(filtros);
      setData(response.actividades || []);
      setHistorialAgrupado(response.historial_agrupado || {});
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar el historial';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getResumen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getResumenHistorial();
      setResumen(response);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar el resumen';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarActividad = useCallback(async (id: number) => {
    setError(null);
    try {
      await api.eliminarActividad(id);
      setData((prev) => prev.filter((a) => a.id !== id));
      setHistorialAgrupado((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((fecha) => {
          updated[fecha] = updated[fecha].filter((a) => a.id !== id);
          if (updated[fecha].length === 0) {
            delete updated[fecha];
          }
        });
        return updated;
      });
      return { mensaje: 'Actividad eliminada correctamente' };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar la actividad';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const limpiarHistorial = useCallback(async () => {
    setError(null);
    try {
      await api.limpiarHistorial();
      setData([]);
      setHistorialAgrupado({});
      setResumen(null);
      return { mensaje: 'Historial limpiado correctamente' };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al limpiar el historial';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const registrarActividad = useCallback(async (actividad: {
    tipo: string;
    titulo: string;
    descripcion?: string;
    metadata_json?: string;
  }) => {
    setError(null);
    try {
      const response = await api.registrarActividad(actividad);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar la actividad';
      setError(errorMsg);
      console.warn('Actividad no registrada:', errorMsg);
      return null;
    }
  }, []);

  return {
    data,
    historialAgrupado,
    loading,
    error,
    resumen,
    getHistorial,
    getResumen,
    eliminarActividad,
    limpiarHistorial,
    registrarActividad,
  };
};
