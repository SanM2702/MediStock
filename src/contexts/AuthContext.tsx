import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../services/api';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailjs';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (cedula: string, password: string) => Promise<any>;
  registro: (datos: any) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isAuthenticated: boolean;
  updateUser: (updates: any) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (cedula: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.login(cedula, password);
      localStorage.setItem('medistock_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.usuario));
      setUser(data.usuario);
      
      // Registrar login en el historial
      try {
        await api.registrarActividad({
          tipo: 'login',
          titulo: 'Inicio de sesión',
          descripcion: 'Acceso exitoso a MediStock'
        });
      } catch (historialErr) {
        // No interferir si falla el registro del historial
        console.warn('No se pudo registrar el login:', historialErr);
      }
      
      return data.usuario;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registro = async (datos: any) => {
    setLoading(true);
    try {
      const data = await api.registro(datos);
      // No iniciamos sesión: la cuenta nace inactiva hasta que el usuario
      // confirme su correo.

      console.log("Respuesta del registro:", data);

      try {
        const codigo = data.codigo_activacion;
        
        if (!codigo) {
          throw new Error("codigo_activacion no fue retornado por el backend");
        }

        const activationLink = `${window.location.origin}/activate/${codigo}`;
        console.log("Link de activación:", activationLink);
        
        await sendWelcomeEmail(
          datos.email,
          datos.nombre,
          datos.cedula,
          datos.eps,
          activationLink,
        );
      } catch (emailError) {
        console.warn('Registro exitoso pero no se pudo enviar el correo de bienvenida', emailError);
      }

      return data;
    } catch (error) {
      console.error('Registro error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const data = await api.forgotPassword(email);
      const resetLink = `${window.location.origin}/reset-password/${data.reset_token}`;
      await sendPasswordResetEmail(
        email,
        data.nombre || 'Usuario',
        resetLink,
        '1 hora',
      );
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('medistock_token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const updateUser = (updates: any) => {
    const usuarioActualizado = { ...user, ...updates };
    setUser(usuarioActualizado);
    localStorage.setItem('user', JSON.stringify(usuarioActualizado));
  };

  const isAdmin = () => user?.rol === 'admin';
  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    loading,
    login,
    registro,
    requestPasswordReset,
    logout,
    updateUser,
    isAdmin,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
