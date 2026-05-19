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
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-screen-xl mx-auto px-4">

        {/* ── Encabezado ──────────────────────────────────────────────── */}
        <div className="py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Panel de superusuario · Sabana Centro
            </p>
          </div>
          <button
            id="btn-crear-usuario"
            onClick={openCreateModal}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary-500 dark:bg-emerald-500 text-white hover:bg-primary-600 dark:hover:bg-emerald-600 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={16} /> Nuevo Usuario
          </button>
        </div>

        {/* ── Tarjetas de estadísticas ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="card flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-primary-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {stats.total}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total usuarios</p>
            </div>
          </div>

          <div className="card flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {stats.pacientes}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pacientes</p>
            </div>
          </div>

          <div className="card flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {stats.farmaceuticos}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Farmacéuticos</p>
            </div>
          </div>

          <div className="card flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {stats.admins}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Administradores</p>
            </div>
          </div>
        </div>

        {/* ── Barra de búsqueda ───────────────────────────────────────── */}
        <div className="card p-4 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, EPS o rol..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* ── Tabla de usuarios ──────────────────────────────────────── */}
        <div className="card p-0 overflow-hidden mb-4">
          {/* Cabecera de la tabla */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Lista de usuarios
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'usuario' : 'usuarios'}
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              Cargando usuarios...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-8 text-center text-red-500 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Cabecera de columnas */}
          <div className="grid grid-cols-12 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <button
              className="col-span-4 flex items-center gap-0.5 text-left hover:text-primary-500 dark:hover:text-emerald-400 transition-colors"
              onClick={() => toggleSort('nombre')}
            >
              Nombre <SortIcon col="nombre" />
            </button>
            <button
              className="col-span-2 flex items-center gap-0.5 text-left hover:text-primary-500 dark:hover:text-emerald-400 transition-colors"
              onClick={() => toggleSort('cedula')}
            >
              Cédula <SortIcon col="cedula" />
            </button>
            <button
              className="col-span-3 flex items-center gap-0.5 text-left hover:text-primary-500 dark:hover:text-emerald-400 transition-colors"
              onClick={() => toggleSort('eps')}
            >
              EPS <SortIcon col="eps" />
            </button>
            <button
              className="col-span-2 flex items-center gap-0.5 text-left hover:text-primary-500 dark:hover:text-emerald-400 transition-colors"
              onClick={() => toggleSort('rol')}
            >
              Rol <SortIcon col="rol" />
            </button>
            <span className="col-span-1 text-center">Acciones</span>
          </div>

          {/* Filas */}
          {!loading && !error && (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredUsuarios.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No se encontraron usuarios
                </div>
              ) : (
                filteredUsuarios.map((usuario) => (
                <div
                  key={(usuario as any).id ?? usuario.cedula}
                  className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  {/* Nombre */}
                  <div className="col-span-4 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
                      {usuario.nombre}
                    </p>
                  </div>

                  {/* Cédula */}
                  <p className="col-span-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {usuario.cedula}
                  </p>

                  {/* EPS */}
                  <p className="col-span-3 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {usuario.eps}
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      title={isSelf(usuario) ? 'No puedes editar tu propio usuario aquí' : 'Editar'}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(usuario)}
                      disabled={isSelf(usuario)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      title={isSelf(usuario) ? 'No puedes eliminar tu propio usuario' : 'Eliminar'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
            </div>
          )}
        </div>

        {/* ── Modal Crear Usuario ─────────────────────────────────────── */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Nuevo Usuario
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cédula
                  </label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                    placeholder="Pérez"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                    placeholder="juan@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    EPS {formData.rol === 'paciente' && <span className="text-slate-400 font-normal">(recomendada)</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.eps}
                    onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                    placeholder="Sanitas"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contraseña <span className="text-slate-400 font-normal">(mín. 6 caracteres)</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                    placeholder="••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as RolUsuario })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                  >
                    <option value="paciente">Paciente</option>
                    <option value="farmaceutico">Farmacéutico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary-500 dark:bg-emerald-500 text-white hover:bg-primary-600 dark:hover:bg-emerald-600 transition-colors"
                  >
                    Crear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Editar Usuario ─────────────────────────────────────── */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Editar Usuario
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cédula
                  </label>
                  <input
                    type="text"
                    value={formData.cedula}
                    disabled
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    EPS
                  </label>
                  <input
                    type="text"
                    value={formData.eps}
                    onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as RolUsuario })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                  >
                    <option value="paciente">Paciente</option>
                    <option value="farmaceutico">Farmacéutico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nueva contraseña <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
                    placeholder="Dejar en blanco para no cambiar"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary-500 dark:bg-emerald-500 text-white hover:bg-primary-600 dark:hover:bg-emerald-600 transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Eliminar Usuario ───────────────────────────────────── */}
        {isDeleteModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Eliminar Usuario
                </h3>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                ¿Estás seguro de que deseas eliminar a <strong>{selectedUser.nombre}</strong>? Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
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
