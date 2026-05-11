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
} from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
}

// ── Estructura de la navegación ────────────────────────────────────────────
const navPrincipal = [
  { to: '/',          label: 'Inicio',               Icon: Home    },
  { to: '/buscar',    label: 'Buscar medicamentos',   Icon: Search  },
  { to: '/farmacias', label: 'Farmacias',             Icon: MapPin  },
  { to: '/mi-eps',    label: 'Mi EPS',                Icon: Shield  },
  { to: '/historial', label: 'Historial',             Icon: Clock   },
];

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-[calc(100vh-64px)] sticky top-16 transition-colors duration-200">

      {/* ── Navegación principal ─────────────────────────────────────── */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navPrincipal.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-primary-50 dark:bg-emerald-900/30 text-primary-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-primary-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}
                />
                <span>{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-emerald-400" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* ── Separador ────────────────────────────────────────────── */}
        {isAdmin && (
          <>
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-3 mx-1" />
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-primary-50 dark:bg-emerald-900/30 text-primary-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Settings
                    size={18}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? 'text-primary-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}
                  />
                  <span>Panel Admin</span>
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* ── Footer del sidebar ───────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
          <span className="font-semibold text-primary-500 dark:text-emerald-400">MediStock QR</span>
          {' '}v1.0.0
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Sabana Centro · Cundinamarca
        </p>
        <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
          Datos actualizados cada 15 min
        </p>
      </div>
    </aside>
  );
}
