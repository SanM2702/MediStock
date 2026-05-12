const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const getHeaders = () => {
  const token = localStorage.getItem("medistock_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function fetcher<T>(
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: getHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error en la petición");
  }

  return response.json();
}

export const api = {
  getMedicamentos: (filtros?: { busqueda?: string; categoria?: string; estado?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.busqueda) params.append("busqueda", filtros.busqueda);
    if (filtros?.categoria) params.append("categoria", filtros.categoria);
    if (filtros?.estado) params.append("estado", filtros.estado);
    
    const query = params.toString();
    return fetcher<any[]>(`/medicamentos${query ? `?${query}` : ""}`);
  },

  getFarmacias: (filtros?: { municipio?: string; eps?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.municipio) params.append("municipio", filtros.municipio);
    if (filtros?.eps) params.append("eps", filtros.eps);
    
    const query = params.toString();
    return fetcher<any[]>(`/farmacias${query ? `?${query}` : ""}`);
  },

  getFarmacia: (id: string | number) => {
    return fetcher<any>(`/farmacias/${id}`);
  },

  getMedicamento: (id: string | number) => {
    return fetcher<any>(`/medicamentos/${id}`);
  },

  login: (cedula: string, password: string) => {
    const params = new URLSearchParams();
    params.append("cedula", cedula);
    params.append("password", password);
    
    return fetcher<any>(`/auth/login?${params.toString()}`, "POST");
  },

  getNetworkMetrics: () => {
    return fetcher<any>("/network/metrics");
  },

  getNetworkHistory: () => {
    return fetcher<any[]>("/network/history");
  },
};
