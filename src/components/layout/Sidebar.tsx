/**
 * Sidebar — Navegación lateral (solo visible en desktop ≥ lg)
 * Oculto completamente en mobile (se usa BottomNav)
 */
import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  MapPin,
  Shield,
  Clock,
  Settings,
  Users,
  CalendarClock,
  Plus,
} from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
}

// ── Estructura de la navegación ────────────────────────────────────────────
const navPrincipal = [
  { to: '/',           label: 'Inicio',               Icon: Home         },
  { to: '/buscar',     label: 'Buscar medicamentos',   Icon: Search       },
  { to: '/farmacias',  label: 'Farmacias',             Icon: MapPin       },
  { to: '/mi-eps',     label: 'Mi EPS',                Icon: Shield       },
  { to: '/historial',  label: 'Historial',             Icon: Clock        },
];

const navTurnos = [
  { to: '/mis-turnos',    label: 'Mis Turnos',    Icon: CalendarClock },
  { to: '/agendar-turno', label: 'Agendar Turno', Icon: Plus          },
];

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 min-h-[calc(100vh-80px)] sticky top-20 transition-colors duration-200">

      {/* ── Navegación principal premium ─────────────────────────────── */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">
            Principal
          </p>
          {navPrincipal.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group mb-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                  }`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className="font-semibold">{label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* ── Sección Audifarma — Turnos ────────────────────────────────── */}
        <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">
            Audifarma · Turnos
          </p>
          {navTurnos.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group mb-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-md shadow-teal-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                  }`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className="font-semibold">{label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 shadow-sm shadow-teal-500/50" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* ── Sección de superusuario ────────────────────────────────────── */}
        {isAdmin && (          <>
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">
                Administración
              </p>
              <NavLink
                to="/usuarios"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group mb-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                    }`}>
                      <Users size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                    </div>
                    <span className="font-semibold">Usuarios</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 shadow-sm shadow-blue-500/50" />
                    )}
                  </>
                )}
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group mb-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-purple-400 to-pink-500 text-white shadow-md shadow-purple-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                    }`}>
                      <Settings size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                    </div>
                    <span className="font-semibold">Panel Admin</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 shadow-sm shadow-purple-500/50" />
                    )}
                  </>
                )}
              </NavLink>
            </div>
          </>
        )}
      </nav>

      {/* ── Footer del sidebar premium ───────────────────────────────────────── */}
      <div className="px-5 py-6 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-white font-black text-sm leading-none">+</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
                MediStock
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-none">
                v1.0.0
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Sabana Centro · Cundinamarca
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
            Datos actualizados cada 15 min
          </p>
        </div>
      </div>
    </aside>
  );
}
