/**
 * Header — Barra superior global
 * Desktop: Logo | Búsqueda central | Tema | Notificaciones | Iniciar sesión
 * Mobile:  Logo | Ícono búsqueda | Toggle tema
 */
import { useState } from 'react';
import { Search, Sun, Moon, Bell, X, Menu, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onLoginClick: () => void;
  notificaciones?: number;
}

export default function Header({ onLoginClick, notificaciones = 3 }: HeaderProps) {
  const { isDark, toggleTema } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* ── Header Premium ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-colors duration-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center gap-4">

          {/* ── Logo Premium ───────────────────────────────────────────── */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 flex-shrink-0 group"
            aria-label="Ir al inicio"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-black text-2xl leading-none">+</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xl leading-none block tracking-tight">
                MediStock
              </span>
              <span className="text-xs text-emerald-500 dark:text-emerald-400 font-semibold leading-none">
                Sabana Centro
              </span>
            </div>
          </button>

          {/* ── Barra de búsqueda central premium (desktop) ──────────────── */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-2xl mx-auto relative"
          >
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="header-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar medicamento, EPS o farmacia..."
              className="w-full pl-12 pr-5 py-3.5 text-sm bg-slate-100 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
            />
          </form>

          {/* ── Espaciador (mobile) ────────────────────────────────────── */}
          <div className="flex-1 md:hidden" />

          {/* ── Acciones Premium ─────────────────────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Búsqueda mobile */}
            <button
              id="header-search-mobile"
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-110"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* Toggle tema premium */}
            <button
              id="toggle-tema"
              onClick={toggleTema}
              className="p-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-110"
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notificaciones premium */}
            <button
              id="btn-notificaciones"
              className="relative p-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-110"
              aria-label={`${notificaciones} notificaciones`}
            >
              <Bell size={20} />
              {notificaciones > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-lg shadow-red-500/30">
                  {notificaciones > 9 ? '9+' : notificaciones}
                </span>
              )}
            </button>

            {/* Usuario / Iniciar sesión premium */}
            {user ? (
              <div className="relative">
                <button
                  id="btn-user-menu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-2 pr-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 ml-2 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500/30 dark:hover:border-emerald-500/30"
                >
                  {user.foto_url ? (
                    <img
                      src={user.foto_url}
                      alt={`${user.nombre} ${user.apellido}`}
                      className="w-10 h-10 rounded-xl object-cover shadow-md shadow-emerald-500/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/20">
                      {user.nombre.substring(0, 1)}{user.apellido?.substring(0, 1) || ''}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {user.nombre.split(' ')[0]}
                  </span>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl py-2 z-50 animate-slide-up">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rol: {user.rol}</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{user.nombre} {user.apellido}</p>
                    </div>
                    <button
                      onClick={() => { navigate('/perfil'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                    >
                      <User size={18} /> Mi Perfil
                    </button>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                      <LogOut size={18} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-login"
                onClick={onLoginClick}
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ml-2"
              >
                Iniciar sesión
              </button>
            )}

            {/* Mobile menu premium */}
            {!user && (
              <button
                id="btn-menu-mobile"
                onClick={onLoginClick}
                className="sm:hidden p-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-110"
                aria-label="Menú"
              >
                <Menu size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Búsqueda mobile premium — overlay ─────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-stretch md:hidden animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-5 flex items-center gap-4 shadow-2xl">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar medicamento..."
                className="w-full pl-12 pr-5 py-4 text-sm bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200"
              />
            </form>
            <button
              onClick={() => setSearchOpen(false)}
              className="p-3 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
