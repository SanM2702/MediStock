/**
 * Usuarios — Gestión de usuarios (solo superusuario)
 * Permite crear, filtrar, editar y eliminar usuarios
 */
import { useState, useMemo, useEffect } from 'react';
import {
  Users, Plus, Search, Edit, Trash2, X,
  ChevronUp, ChevronDown, Shield, User,
} from 'lucide-react';
import type { Usuario, RolUsuario } from '../types';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const rolLabels: Record<RolUsuario, string> = {
  paciente: 'Paciente',
  farmaceutico: 'Farmacéutico',
  admin: 'Administrador',
};

const rolColors: Record<RolUsuario, string> = {
  paciente: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  farmaceutico: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  admin: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
};

function RolBadge({ rol }: { rol: RolUsuario }) {
  const label = rolLabels[rol] ?? rol;
  const color = rolColors[rol] ?? 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  const Icon = rol === 'paciente' ? User : Shield;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

type SortKey = 'nombre' | 'cedula' | 'eps' | 'rol';

export default function Usuarios() {
  const { user, isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Formulario
  const emptyForm = {
    cedula: '',
    nombre: '',
    apellido: '',
    email: '',
    eps: '',
    rol: 'paciente' as RolUsuario,
    password: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  // ── Cargar usuarios desde la API ───────────────────────────────────────
  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await api.getUsuarios();
      const usuariosFormateados = data.map((u: any) => ({
        cedula: u.cedula,
        nombre: u.nombre,
        eps: u.eps || '',
        rol: u.rol as RolUsuario,
        id: u.id,
        apellido: u.apellido,
        email: u.email,
      }));
      setUsuarios(usuariosFormateados);
      setError(null);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios. Verifica que tengas permisos de administrador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin()) {
      setError('No tienes permisos para acceder a esta sección');
      setLoading(false);
      return;
    }
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Filtrar y ordenar usuarios ─────────────────────────────────────────
  const filteredUsuarios = useMemo(() => {
    let filtered = usuarios.filter((u) => {
      const search = filterText.toLowerCase();
      return (
        u.nombre.toLowerCase().includes(search) ||
        u.cedula.includes(search) ||
        u.eps.toLowerCase().includes(search) ||
        u.rol.toLowerCase().includes(search)
      );
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'nombre') cmp = a.nombre.localeCompare(b.nombre);
      if (sortKey === 'cedula') cmp = a.cedula.localeCompare(b.cedula);
      if (sortKey === 'eps') cmp = a.eps.localeCompare(b.eps);
      if (sortKey === 'rol') cmp = a.rol.localeCompare(b.rol);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [usuarios, filterText, sortKey, sortDir]);

  // ── Ordenar columna ───────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="inline-block ml-0.5" />
      : <ChevronDown size={11} className="inline-block ml-0.5" />;
  }

  // ── CRUD Operations ───────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formData.cedula || !formData.nombre || !formData.apellido || !formData.email || !formData.password) {
      alert('Completa cédula, nombre, apellido, email y contraseña.');
      return;
    }
    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      await api.crearUsuario({
        cedula: formData.cedula,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
        eps: formData.eps || undefined,
      });

      await fetchUsuarios();
      setIsCreateModalOpen(false);
      setFormData(emptyForm);
    } catch (err: any) {
      console.error('Error al crear usuario:', err);
      alert(err?.message || 'Error al crear usuario');
    }
  };

  const handleEdit = async () => {
    if (!selectedUser || !formData.nombre || !formData.email) {
      alert('Nombre y email son obligatorios.');
      return;
    }

    try {
      const payload: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        eps: formData.eps,
        rol: formData.rol,
      };
      if (formData.password) {
        if (formData.password.length < 6) {
          alert('La contraseña debe tener al menos 6 caracteres.');
          return;
        }
        payload.password = formData.password;
      }

      await api.actualizarUsuario(selectedUser.id, payload);
      await fetchUsuarios();

      setIsEditModalOpen(false);
      setSelectedUser(null);
      setFormData(emptyForm);
    } catch (err: any) {
      console.error('Error al actualizar usuario:', err);
      alert(err?.message || 'Error al actualizar usuario');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await api.eliminarUsuario(selectedUser.id);
      await fetchUsuarios();
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Error al eliminar usuario:', err);
      alert(err?.message || 'Error al eliminar usuario');
    }
  };

  const openCreateModal = () => {
    setFormData(emptyForm);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setSelectedUser(u);
    setFormData({
      cedula: u.cedula,
      nombre: u.nombre,
      apellido: u.apellido || '',
      email: u.email || '',
      eps: u.eps || '',
      rol: u.rol,
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (u: any) => {
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  const isSelf = (u: any) => user && u && u.id === user.id;

  // ── Estadísticas ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pacientes = usuarios.filter((u) => u.rol === 'paciente').length;
    const farmaceuticos = usuarios.filter((u) => u.rol === 'farmaceutico').length;
    const admins = usuarios.filter((u) => u.rol === 'admin').length;
    return { total: usuarios.length, pacientes, farmaceuticos, admins };
  }, [usuarios]);

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6 bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Encabezado Premium ──────────────────────────────────────── */}
        <div className="py-8 sm:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Gestión de Usuarios
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Panel de superusuario · Sabana Centro
                </p>
              </div>
            </div>
          </div>
          <button
            id="btn-crear-usuario"
            onClick={openCreateModal}
            className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} /> Nuevo Usuario
          </button>
        </div>

        {/* ── KPIs Premium con Gradientes ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Users size={28} className="text-white" />
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {stats.total}
            </p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total usuarios</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <User size={28} className="text-white" />
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {stats.pacientes}
            </p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pacientes</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-500 dark:to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Shield size={28} className="text-white" />
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {stats.farmaceuticos}
            </p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Farmacéuticos</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Shield size={28} className="text-white" />
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {stats.admins}
            </p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Administradores</p>
          </div>
        </div>

        {/* ── Buscador Premium ───────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, EPS o rol..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
            />
          </div>
        </div>

        {/* ── Tabla Premium ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
          {/* Cabecera de la tabla */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                <Users size={20} className="text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Lista de usuarios
              </h2>
            </div>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
              {filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'usuario' : 'usuarios'}
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Cargando usuarios...</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex items-center gap-2 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl">
                <X size={18} />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Cabecera de columnas */}
          {!loading && !error && (
            <div className="grid grid-cols-12 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <button
                className="col-span-4 flex items-center gap-2 text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                onClick={() => toggleSort('nombre')}
              >
                Nombre <SortIcon col="nombre" />
              </button>
              <button
                className="col-span-2 flex items-center gap-2 text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                onClick={() => toggleSort('cedula')}
              >
                Cédula <SortIcon col="cedula" />
              </button>
              <button
                className="col-span-3 flex items-center gap-2 text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                onClick={() => toggleSort('eps')}
              >
                EPS <SortIcon col="eps" />
              </button>
              <button
                className="col-span-2 flex items-center gap-2 text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                onClick={() => toggleSort('rol')}
              >
                Rol <SortIcon col="rol" />
              </button>
              <span className="col-span-1 text-center">Acciones</span>
            </div>
          )}

          {/* Filas */}
          {!loading && !error && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsuarios.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="inline-flex flex-col items-center gap-3 text-slate-400">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                      <Users size={32} />
                    </div>
                    <span className="text-sm font-medium">No se encontraron usuarios</span>
                  </div>
                </div>
              ) : (
                filteredUsuarios.map((usuario, index) => (
                <div
                  key={(usuario as any).id ?? usuario.cedula}
                  className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all duration-200 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Nombre */}
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {usuario.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {usuario.nombre}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {usuario.apellido || ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cédula */}
                  <p className="col-span-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {usuario.cedula}
                  </p>

                  {/* EPS */}
                  <p className="col-span-3 text-sm text-slate-600 dark:text-slate-400 truncate">
                    {usuario.eps || '—'}
                  </p>

                  {/* Rol */}
                  <div className="col-span-2">
                    <RolBadge rol={usuario.rol} />
                  </div>

                  {/* Acciones */}
                  <div className="col-span-1 flex justify-center gap-1">
                    <button
                      onClick={() => openEditModal(usuario)}
                      disabled={isSelf(usuario)}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent hover:scale-110"
                      title={isSelf(usuario) ? 'No puedes editar tu propio usuario aquí' : 'Editar'}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(usuario)}
                      disabled={isSelf(usuario)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent hover:scale-110"
                      title={isSelf(usuario) ? 'No puedes eliminar tu propio usuario' : 'Eliminar'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
            </div>
          )}
        </div>

        {/* ── Modal Crear Usuario Premium ─────────────────────────────── */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-8 transform transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Plus size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Nuevo Usuario
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Crea una cuenta de usuario
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Cédula
                    </label>
                    <input
                      type="text"
                      value={formData.cedula}
                      onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                      placeholder="123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Rol
                    </label>
                    <select
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value as RolUsuario })}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                    >
                      <option value="paciente">Paciente</option>
                      <option value="farmaceutico">Farmacéutico</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                      placeholder="Juan"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                    placeholder="juan@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    EPS {formData.rol === 'paciente' && <span className="text-slate-400 font-normal">(recomendada)</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.eps}
                    onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                    placeholder="Sanitas"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Contraseña <span className="text-slate-400 font-normal">(mín. 6 caracteres)</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                    placeholder="••••••"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-6 py-3 text-sm font-semibold rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-1 px-6 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Crear Usuario
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Editar Usuario Premium ─────────────────────────────── */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-8 transform transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Edit size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Editar Usuario
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Actualiza la información del usuario
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Cédula
                    </label>
                    <input
                      type="text"
                      value={formData.cedula}
                      disabled
                      className="w-full px-4 py-3 text-sm bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Rol
                    </label>
                    <select
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value as RolUsuario })}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                    >
                      <option value="paciente">Paciente</option>
                      <option value="farmaceutico">Farmacéutico</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    EPS
                  </label>
                  <input
                    type="text"
                    value={formData.eps}
                    onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    Nueva contraseña <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
                    placeholder="Dejar en blanco para no cambiar"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-6 py-3 text-sm font-semibold rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex-1 px-6 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Eliminar Usuario Premium ───────────────────────────── */}
        {isDeleteModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 transform transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
                  <Trash2 size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Eliminar Usuario
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 mb-6 border border-red-200 dark:border-red-800">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  ¿Estás seguro de que deseas eliminar a <strong className="text-red-600 dark:text-red-400">{selectedUser.nombre}</strong>?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-6 py-3 text-sm font-semibold rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
