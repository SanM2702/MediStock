import { useState, useEffect } from "react";
import { api } from "../services/api";

export const useAuth = () => {
  const [user, setUser] = useState<any>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Sincronizar si es necesario, aunque el inicializador ya lo hace
  }, []);

  const login = async (cedula: string, password: string) => {
    try {
      const data = await api.login(cedula, password);
      localStorage.setItem("medistock_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.usuario));
      setUser(data.usuario);
      return data.usuario;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("medistock_token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const getCurrentUser = () => {
    return user;
  };

  const isAdmin = () => {
    return user?.rol === "admin";
  };

  return {
    user,
    loading,
    login,
    logout,
    getCurrentUser,
    isAdmin,
  };
};
