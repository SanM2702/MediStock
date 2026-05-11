import { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  Clock, 
  Zap, 
  History,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface NetworkMetrics {
  timestamp: string;
  cpu_percent: number;
  memoria_usada_mb: number;
  memoria_total_mb: number;
  memoria_percent: number;
  bytes_enviados: number;
  bytes_recibidos: number;
  conexiones_activas: number;
  total_requests: number;
  requests_por_segundo: number;
  latencia_ms: number;
}

export default function RedeAdmin() {
  const { isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const conectarWebSocket = () => {
    if (ws.current) ws.current.close();
    
    ws.current = new WebSocket('ws://localhost:8000/api/network/ws');

    ws.current.onopen = () => {
      setConnected(true);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(data);
      setLatencyHistory(prev => {
        const next = [...prev, data.latencia_ms];
        return next.slice(-30); // Guardar últimos 60 segundos (si cada 2s)
      });
    };

    ws.current.onclose = () => {
      setConnected(false);
      // Reconexión automática tras 2 segundos
      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(conectarWebSocket, 2000);
      }
    };

    ws.current.onerror = () => {
      setConnected(false);
      ws.current?.close();
    };
  };

  useEffect(() => {
    // Cargar historial inicial con el token correcto
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('medistock_token');
        const response = await fetch('http://localhost:8000/api/network/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();

    // Delay de 500ms antes de la primera conexión
    const initialTimer = setTimeout(() => {
      conectarWebSocket();
    }, 500);

    return () => {
      clearTimeout(initialTimer);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, []);

  if (!isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Acceso Denegado</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Solo los administradores pueden ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="text-primary-500" />
            Monitoreo de Red
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Métricas del servidor en tiempo real via WebSocket
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <Cpu className="text-orange-500" size={20} />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {metrics?.cpu_percent ?? 0}%
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Uso de CPU</p>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-orange-500 h-full transition-all duration-500" 
              style={{ width: `${metrics?.cpu_percent ?? 0}%` }}
            />
          </div>
        </div>

        {/* RAM */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Database className="text-blue-500" size={20} />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {metrics ? Math.round(metrics.memoria_percent) : 0}%
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Memoria RAM</p>
          <p className="text-xs text-slate-400 mb-1">
            {metrics ? `${Math.round(metrics.memoria_usada_mb)}MB / ${Math.round(metrics.memoria_total_mb)}MB` : '-'}
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-500" 
              style={{ width: `${metrics?.memoria_percent ?? 0}%` }}
            />
          </div>
        </div>

        {/* Conexiones */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <Globe className="text-purple-500" size={20} />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {metrics?.conexiones_activas ?? 0}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Conexiones Activas</p>
          <p className="text-xs text-slate-400 mt-1">
            Total requests: {metrics?.total_requests ?? 0}
          </p>
        </div>

        {/* Latencia */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <Clock className="text-emerald-500" size={20} />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {metrics?.latencia_ms ?? 0} ms
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Latencia Promedio</p>
          <p className="text-xs text-slate-400 mt-1">
            RPS: {metrics?.requests_por_segundo ?? 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Latencia */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-yellow-500" />
            Latencia (últimos 60s)
          </h3>
          <div className="h-48 w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl relative flex items-end p-2 gap-1">
            {latencyHistory.map((l, i) => (
              <div 
                key={i}
                className="flex-1 bg-primary-400/50 hover:bg-primary-500 rounded-t-sm transition-all group relative"
                style={{ height: `${Math.min(100, (l / 200) * 100)}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
                  {l}ms
                </div>
              </div>
            ))}
            {latencyHistory.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                Esperando datos...
              </p>
            )}
          </div>
        </div>

        {/* Transferencia de Datos */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Globe size={18} className="text-blue-500" />
            Transferencia de Datos
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <ArrowDown className="text-emerald-500" size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Bytes Recibidos</p>
                  <p className="text-xs text-slate-500">Tráfico de entrada</p>
                </div>
              </div>
              <p className="text-lg font-mono font-bold text-slate-700 dark:text-slate-300">
                {(metrics?.bytes_recibidos ?? 0).toLocaleString()} B
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <ArrowUp className="text-blue-500" size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Bytes Enviados</p>
                  <p className="text-xs text-slate-500">Tráfico de salida</p>
                </div>
              </div>
              <p className="text-lg font-mono font-bold text-slate-700 dark:text-slate-300">
                {(metrics?.bytes_enviados ?? 0).toLocaleString()} B
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Sesiones */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History size={18} className="text-slate-400" />
            Historial de Lecturas
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha/Hora</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">CPU</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Latencia</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Conexiones</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Tráfico (IN/OUT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {history.map((h, i) => (
                <tr key={h.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(h.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">
                    {h.cpu_percent}%
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {h.latencia_ms} ms
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {h.conexiones_activas}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {h.bytes_recibidos.toLocaleString()} / {h.bytes_enviados.toLocaleString()}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    No hay registros históricos disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
