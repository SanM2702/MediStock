/**
 * ProfilePage.tsx — Página de perfil del usuario
 *
 * Funcionalidades:
 *   - Ver información personal
 *   - Editar nombre, apellido, email, EPS, teléfono
 *   - Cambiar contraseña
 *   - Mostrar información de cuenta (fecha de creación, última actualización)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Eye, EyeOff, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

interface FormState {
  nombre: string;
  apellido: string;
  email: string;
  eps: string;
  telefono: string;
}

interface PasswordState {
  passwordActual: string;
  passwordNueva: string;
  passwordNuevaConfirm: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingFoto, setLoadingFoto] = useState(false);

  // Estado de edición
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Estado para foto de perfil
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Estados de formulario
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    apellido: '',
    email: '',
    eps: '',
    telefono: '',
  });

  const [passwordData, setPasswordData] = useState<PasswordState>({
    passwordActual: '',
    passwordNueva: '',
    passwordNuevaConfirm: '',
  });

  // Estados para visibilidad de contraseña
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirm: false,
  });

  // Estados de feedback
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Validar autenticación
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Inicializar formulario con datos del usuario
    setFormData({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      eps: user.eps || '',
      telefono: user.telefono || '',
    });

    // Cargar foto de perfil si existe
    if (user.foto_url) {
      setFotoPreview(user.foto_url);
    }
  }, [user, navigate]);

  // Manejadores del formulario de perfil
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'El archivo debe ser una imagen' });
      return;
    }

    // Validar tamaño máximo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no puede superar 5MB' });
      return;
    }

    setLoadingFoto(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Usa la misma base URL que el resto de la app (definida en api.ts)
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('medistock_token');

      const response = await fetch(`${baseUrl}/usuarios/me/foto`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: `Error ${response.status}` }));
        throw new Error(error.detail || 'Error al subir la foto');
      }

      const updatedUser = await response.json();
      
      // Actualizar el preview local
      setFotoPreview(updatedUser.foto_url);
      
      // Actualizar el contexto global de autenticación
      updateUser({ foto_url: updatedUser.foto_url });
      
      setMessage({ type: 'success', text: 'Foto de perfil actualizada exitosamente' });

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al subir la foto' });
    } finally {
      setLoadingFoto(false);
    }
  };

  const handleGuardarPerfil = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Preparar solo los campos que cambiaron
      const changed: any = {};
      if (formData.nombre !== user.nombre) changed.nombre = formData.nombre;
      if (formData.apellido !== user.apellido) changed.apellido = formData.apellido;
      if (formData.email !== user.email) changed.email = formData.email;
      if (formData.eps !== user.eps) changed.eps = formData.eps;
      if (formData.telefono !== user.telefono) changed.telefono = formData.telefono;

      if (Object.keys(changed).length === 0) {
        setMessage({ type: 'info', text: 'No hay cambios para guardar' });
        return;
      }

      await api.actualizarPerfil(changed);

      // Actualizar usuario en localStorage
      const usuarioActualizado = { ...user, ...changed };
      localStorage.setItem('user', JSON.stringify(usuarioActualizado));

      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      setIsEditing(false);

      // Recargar página después de 1.5s para reflejar cambios
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al actualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarContrasena = async () => {
    setLoadingPassword(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      // Validaciones
      if (!passwordData.passwordActual) {
        throw new Error('Ingresa tu contraseña actual');
      }
      if (!passwordData.passwordNueva) {
        throw new Error('Ingresa una nueva contraseña');
      }
      if (passwordData.passwordNueva.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }
      if (passwordData.passwordNueva !== passwordData.passwordNuevaConfirm) {
        throw new Error('Las contraseñas no coinciden');
      }
      if (passwordData.passwordActual === passwordData.passwordNueva) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }

      await api.cambiarContrasena(
        passwordData.passwordActual,
        passwordData.passwordNueva
      );

      setPasswordMessage({ type: 'success', text: 'Contraseña cambiada exitosamente' });
      setPasswordData({ passwordActual: '', passwordNueva: '', passwordNuevaConfirm: '' });
      setIsChangingPassword(false);

      // Cerrar sesión después de 2s para que inicie sesión nuevamente
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleCancelar = () => {
    setFormData({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      eps: user.eps || '',
      telefono: user.telefono || '',
    });
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const handleCancelarPassword = () => {
    setPasswordData({ passwordActual: '', passwordNueva: '', passwordNuevaConfirm: '' });
    setIsChangingPassword(false);
    setPasswordMessage({ type: '', text: '' });
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 pt-20 pb-24 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ==================== TARJETA SUPERIOR - PERFIL ==================== */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
          {/* Fondo decorativo */}
          <div className="h-24 bg-gradient-to-r from-primary-500/80 via-primary-600/80 to-emerald-500/80 dark:from-emerald-600/80 dark:via-emerald-500/80 dark:to-teal-600/80 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.2),transparent_50%)]"></div>
            </div>
          </div>
          
          {/* Contenido del perfil */}
          <div className="px-6 pb-6 pt-4">
            <div className="flex flex-col md:flex-row md:items-center md:gap-8">
              {/* Avatar circular grande */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-400 to-emerald-400 dark:from-emerald-500 dark:to-teal-500 p-1.5 shadow-xl">
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      alt="Foto de perfil"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-primary-600 dark:text-emerald-400">
                      {formData.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white dark:border-slate-800 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                {/* Botón para cambiar foto */}
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-2 border-slate-200 dark:border-slate-600">
                  <Camera size={18} className="text-slate-600 dark:text-slate-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                    disabled={loadingFoto}
                  />
                </label>
              </div>
              
              {/* Información del usuario */}
              <div className="flex-1 mt-4 md:mt-0">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {formData.nombre} {formData.apellido}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{formData.email}</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 dark:bg-emerald-900/30 text-primary-700 dark:text-emerald-400 border border-primary-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-primary-500 dark:bg-emerald-500"></span>
                    {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
                  </span>
                  {formData.eps && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {formData.eps}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    ID: {user.cedula}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== TARJETAS DE CONTENIDO ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ==================== INFORMACIÓN PERSONAL ==================== */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 dark:from-emerald-500 dark:to-emerald-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Información Personal
                </h2>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-emerald-400 hover:bg-primary-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  Editar
                </button>
              )}
            </div>

            {/* Mensaje de feedback */}
            {message.text && message.type !== 'error' && (
              <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle size={18} className="flex-shrink-0" />
                ) : (
                  <AlertCircle size={18} className="flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            {message.type === 'error' && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 flex items-center gap-3 animate-fade-in">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Nombre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Nombre
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  ) : (
                    <p className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium bg-slate-50 dark:bg-slate-700/50 rounded-xl">{formData.nombre}</p>
                  )}
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Apellido
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  ) : (
                    <p className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium bg-slate-50 dark:bg-slate-700/50 rounded-xl">{formData.apellido}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                ) : (
                  <p className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium bg-slate-50 dark:bg-slate-700/50 rounded-xl">{formData.email}</p>
                )}
              </div>

              {/* EPS y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    EPS
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="eps"
                      value={formData.eps}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  ) : (
                    <p className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium bg-slate-50 dark:bg-slate-700/50 rounded-xl">{formData.eps || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Teléfono
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  ) : (
                    <p className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium bg-slate-50 dark:bg-slate-700/50 rounded-xl">{formData.telefono || 'No especificado'}</p>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleGuardarPerfil}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-emerald-600 dark:to-emerald-700 hover:from-primary-700 hover:to-primary-800 dark:hover:from-emerald-700 dark:hover:to-emerald-800 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-600 dark:disabled:to-slate-700 text-white font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-500/25 dark:shadow-emerald-500/25"
                  >
                    <Save size={18} />
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    onClick={handleCancelar}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <X size={18} />
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ==================== SEGURIDAD ==================== */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 p-6 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Seguridad
                </h2>
              </div>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  Cambiar contraseña
                </button>
              )}
            </div>

            {/* Mensaje de feedback de contraseña */}
            {passwordMessage.text && (
              <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}>
                {passwordMessage.type === 'success' ? (
                  <CheckCircle size={18} className="flex-shrink-0" />
                ) : (
                  <AlertCircle size={18} className="flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{passwordMessage.text}</span>
              </div>
            )}

            {!isChangingPassword ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Usa una contraseña única y segura</p>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Cambia tu contraseña regularmente</p>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No compartas tu contraseña con nadie</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Contraseña actual */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Contraseña actual
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.actual ? 'text' : 'password'}
                      name="passwordActual"
                      value={passwordData.passwordActual}
                      onChange={handlePasswordChange}
                      placeholder="Ingresa tu contraseña actual"
                      className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, actual: !prev.actual }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPasswords.actual ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Nueva contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.nueva ? 'text' : 'password'}
                      name="passwordNueva"
                      value={passwordData.passwordNueva}
                      onChange={handlePasswordChange}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, nueva: !prev.nueva }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPasswords.nueva ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirmar nueva contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="passwordNuevaConfirm"
                      value={passwordData.passwordNuevaConfirm}
                      onChange={handlePasswordChange}
                      placeholder="Repite tu nueva contraseña"
                      className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleCambiarContrasena}
                    disabled={loadingPassword}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 hover:from-slate-800 hover:to-slate-900 dark:hover:from-slate-700 dark:hover:to-slate-800 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-600 dark:disabled:to-slate-700 text-white font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-500/25"
                  >
                    <Save size={18} />
                    {loadingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
                  </button>
                  <button
                    onClick={handleCancelarPassword}
                    disabled={loadingPassword}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <X size={18} />
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
