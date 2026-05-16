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
      {/* ── Header principal ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center gap-3">

          {/* ── Logo ──────────────────────────────────────────────────── */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 flex-shrink-0 group"
            aria-label="Ir al inicio"
          >
            {/* Cruz médica */}
            <div className="w-8 h-8 rounded-lg bg-primary-500 dark:bg-emerald-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-lg leading-none">+</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-base leading-none block">
                MediStock
              </span>
              <span className="text-[10px] text-primary-500 dark:text-emerald-400 font-semibold leading-none">
                Sabana Centro
              </span>
            </div>
          </button>

          {/* ── Barra de búsqueda central (desktop) ───────────────────── */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-auto relative"
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="header-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar medicamento, EPS o farmacia..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-emerald-500 transition-all"
            />
          </form>

          {/* ── Espaciador (mobile) ────────────────────────────────────── */}
          <div className="flex-1 md:hidden" />

          {/* ── Acciones ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-1">

            {/* Búsqueda mobile */}
            <button
              id="header-search-mobile"
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* Toggle tema */}
            <button
              id="toggle-tema"
              onClick={toggleTema}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notificaciones */}
            <button
              id="btn-notificaciones"
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={`${notificaciones} notificaciones`}
            >
              <Bell size={20} />
              {notificaciones > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {notificaciones > 9 ? '9+' : notificaciones}
                </span>
              )}
            </button>

            {/* Usuario / Iniciar sesión */}
            {user ? (
              <div className="relative">
                <button
                  id="btn-user-menu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-1 border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-emerald-900/30 text-primary-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {user.nombre.substring(0, 1)}{user.apellido?.substring(0, 1) || ''}
                  </div>
                  <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {user.nombre.split(' ')[0]}
                  </span>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 animate-slide-up">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Rol: {user.rol}</p>
                    </div>
                    <button
                      onClick={() => { navigate('/mi-eps'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <User size={16} /> Mi Perfil
                    </button>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-login"
                onClick={onLoginClick}
                className="hidden sm:flex items-center gap-1.5 bg-primary-500 dark:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-600 dark:hover:bg-emerald-600 active:scale-95 transition-all shadow-sm ml-1"
              >
                Iniciar sesión
              </button>
            )}

            {/* Mobile menu (ícono hamburguesa — acceso rápido a login si no hay user) */}
            {!user && (
              <button
                id="btn-menu-mobile"
                onClick={onLoginClick}
                className="sm:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Menú"
              >
                <Menu size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Búsqueda mobile — overlay ──────────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col items-stretch md:hidden animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-4 flex items-center gap-3 shadow-lg">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar medicamento..."
                className="w-full pl-9 pr-4 py-3 text-sm bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
              />
            </form>
            <button
              onClick={() => setSearchOpen(false)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
