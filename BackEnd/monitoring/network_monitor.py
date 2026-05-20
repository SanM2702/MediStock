import asyncio
from collections import deque
from datetime import datetime
from typing import Any, Dict

import psutil


class NetworkMonitor:
    """
    Monitor de métricas de red y rendimiento del sistema.
    Recopila datos de CPU, memoria, conexiones de red y requests.
    """

    def __init__(self, max_history: int = 60):
        """
        Inicializa el monitor.

        Args:
            max_history: Número máximo de lecturas a guardar (default 60 para último minuto)
        """
        self.max_history = max_history
        self.metricas_history: deque = deque(maxlen=max_history)
        self.contador_requests = 0
        self.timestamps_requests: deque = deque(maxlen=max_history)
        self.is_running = False
        self.task = None

    def increment_request_counter(self) -> None:
        """Incrementa el contador de requests."""
        self.contador_requests += 1
        self.timestamps_requests.append(datetime.now())

    def get_requests_por_segundo(self) -> float:
        """
        Calcula el promedio de requests por segundo en los últimos 60 segundos.

        Returns:
            float: Requests por segundo
        """
        if len(self.timestamps_requests) < 2:
            return 0.0

        tiempo_total = (
            self.timestamps_requests[-1] - self.timestamps_requests[0]
        ).total_seconds()

        if tiempo_total == 0:
            return 0.0

        return len(self.timestamps_requests) / tiempo_total

    def get_metrics(self) -> Dict[str, Any]:
        """
        Obtiene las métricas actuales del sistema.

        Returns:
            dict: Diccionario con todas las métricas
        """
        cpu_percent = psutil.cpu_percent(interval=0.1)

        memoria = psutil.virtual_memory()
        memoria_usada_mb = memoria.used / (1024 * 1024)
        memoria_total_mb = memoria.total / (1024 * 1024)

        net_io = psutil.net_io_counters()
        bytes_enviados = net_io.bytes_sent
        bytes_recibidos = net_io.bytes_recv

        try:
            conexiones_activas = len(psutil.net_connections())
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            conexiones_activas = 0

        requests_por_segundo = self.get_requests_por_segundo()
        latencia_ms = 0.5

        metricas = {
            "timestamp": datetime.now().isoformat(),
            "cpu_percent": round(cpu_percent, 2),
            "memoria_usada_mb": round(memoria_usada_mb, 2),
            "memoria_total_mb": round(memoria_total_mb, 2),
            "memoria_percent": round(memoria.percent, 2),
            "bytes_enviados": bytes_enviados,
            "bytes_recibidos": bytes_recibidos,
            "conexiones_activas": conexiones_activas,
            "total_requests": self.contador_requests,
            "requests_por_segundo": round(requests_por_segundo, 2),
            "latencia_ms": round(latencia_ms, 2),
        }

        self.metricas_history.append(metricas)

        return metricas

    async def start(self, intervalo: float = 2.0) -> None:
        """
        Inicia el loop de monitoreo asincrónico.
        Recopila métricas cada N segundos.

        Args:
            intervalo: Segundos entre cada lectura (default 2)
        """
        self.is_running = True
        while self.is_running:
            self.get_metrics()
            await asyncio.sleep(intervalo)

    def stop(self) -> None:
        """Detiene el loop de monitoreo."""
        self.is_running = False

    def get_history(self, limit: int = 100) -> list:
        """
        Obtiene el historial de métricas.

        Args:
            limit: Número máximo de entradas a retornar

        Returns:
            list: Lista de diccionarios con métricas históricas
        """
        return list(self.metricas_history)[-limit:]

    def reset_counters(self) -> None:
        """Reinicia los contadores."""
        self.contador_requests = 0
        self.timestamps_requests.clear()
        self.metricas_history.clear()


monitor = NetworkMonitor()
