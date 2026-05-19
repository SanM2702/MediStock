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
  const hadToken = !!localStorage.getItem("medistock_token");
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: getHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 401 && hadToken) {
    localStorage.removeItem("medistock_token");
    localStorage.removeItem("user");
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }
    throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Manejo especial para errores de validación Pydantic (422)
    if (response.status === 422 && Array.isArray(errorData.detail)) {
      const validationErrors = errorData.detail
        .map((err: any) => `${err.loc?.[1] || 'campo'}: ${err.msg}`)
        .join('; ');
      console.error('Errores de validación:', validationErrors);
      throw new Error(validationErrors);
    }
    
    throw new Error(errorData.detail || `Error ${response.status} en la petición`);
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

  registro: (datos: {
    cedula: string;
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    eps: string;
    telefono?: string;
  }) => {
    return fetcher<any>(`/auth/registro`, "POST", datos);
  },

  activarCuenta: (token: string) => {
    return fetcher<any>(`/auth/activar/${encodeURIComponent(token)}`, "POST");
  },

  forgotPassword: (email: string) => {
    return fetcher<any>(`/auth/forgot-password`, "POST", { email });
  },

  resetPassword: (token: string, password: string) => {
    return fetcher<any>(`/auth/reset-password`, "POST", { token, password });
  },

  // ==================== PERFIL DEL USUARIO ====================

  getPerfil: () => {
    return fetcher<any>(`/usuarios/me`);
  },

  actualizarPerfil: (datos: {
    nombre?: string;
    apellido?: string;
    email?: string;
    eps?: string;
    telefono?: string;
  }) => {
    return fetcher<any>(`/usuarios/me`, "PUT", datos);
  },

  cambiarContrasena: (passwordActual: string, passwordNueva: string) => {
    return fetcher<any>(`/usuarios/me/password`, "PUT", {
      password_actual: passwordActual,
      password_nueva: passwordNueva,
    });
  },

  getNetworkMetrics: () => {
    return fetcher<any>("/network/metrics");
  },

  getNetworkHistory: () => {
    return fetcher<any[]>("/network/history");
  },

  getUsuarios: (filtros?: { rol?: string; eps?: string; activo?: boolean }) => {
    const params = new URLSearchParams();
    if (filtros?.rol) params.append("rol", filtros.rol);
    if (filtros?.eps) params.append("eps", filtros.eps);
    if (filtros?.activo !== undefined) params.append("activo", String(filtros.activo));

    const query = params.toString();
    return fetcher<any[]>(`/usuarios${query ? `?${query}` : ""}`);
  },

  getUsuario: (id: string | number) => {
    return fetcher<any>(`/usuarios/${id}`);
  },

  crearUsuario: (datos: {
    cedula: string;
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rol: string;
    eps?: string;
  }) => {
    return fetcher<any>(`/usuarios`, "POST", datos);
  },

  actualizarUsuario: (id: string | number, datos: {
    nombre?: string;
    apellido?: string;
    email?: string;
    eps?: string;
    rol?: string;
    activo?: boolean;
    password?: string;
  }) => {
    return fetcher<any>(`/usuarios/${id}`, "PUT", datos);
  },

  eliminarUsuario: (id: string | number) => {
    return fetcher<any>(`/usuarios/${id}`, "DELETE");
  },
};
