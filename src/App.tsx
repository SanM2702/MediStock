/**
 * App.tsx — Raíz de la aplicación MediStock QR
 *
 * Provee:
 *   - ThemeProvider (modo oscuro/claro global)
 *   - BrowserRouter con todas las rutas
 *   - Layout: Header + Sidebar (desktop) + contenido + BottomNav (mobile)
 *   - Estado global: isLoginModalOpen, isAdmin
 */
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Home as HomeIcon, Search, QrCode, Shield, Clock, Settings } from 'lucide-react';

// Contexto de tema
import { ThemeProvider } from './contexts/ThemeContext';

// Layout
import Header  from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Auth
import LoginModal from './components/auth/LoginModal';
import { useAuth } from './hooks/useAuth';

// Páginas
import Home      from './pages/Home';
import Buscar    from './pages/Buscar';
import Farmacias from './pages/Farmacias';
import MiEPS     from './pages/MiEPS';
import Historial from './pages/Historial';
import Admin     from './pages/Admin';
import QR        from './pages/QR';
import RedeAdmin from './pages/RedeAdmin';

// ── Configuración del Bottom Navbar (mobile) ──────────────────────────────
const bottomNavItems = [
  { to: '/',          label: 'Inicio',   Icon: HomeIcon, end: true  },
  { to: '/buscar',    label: 'Buscar',   Icon: Search,   end: false },
  { to: '/qr',        label: 'Escáner',  Icon: QrCode,   end: false },
  { to: '/mi-eps',    label: 'Mi EPS',   Icon: Shield,   end: false },
  { to: '/historial', label: 'Historial',Icon: Clock,    end: false },
];

// ── Bottom Navigation Bar (solo mobile/tablet) ────────────────────────────
function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const items = isAdmin
    ? [...bottomNavItems, { to: '/admin', label: 'Admin', Icon: Settings, end: false }]
    : bottomNavItems;

  return (
    <nav
      id="bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-nav safe-bottom transition-colors duration-200"
    >
      <div className="flex items-stretch h-16">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            id={`bottom-nav-${label.toLowerCase().replace(' ', '-')}`}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ${
                isActive
                  ? 'text-primary-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Píldora indicadora activa */}
                <div
                  className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-primary-50 dark:bg-emerald-900/30' : ''
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span
                  className={`text-[10px] leading-none ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

// ── Layout principal (envuelve todas las rutas) ───────────────────────────
function AppLayout() {
  const [loginOpen, setLoginOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* ── Header global ──────────────────────────────────────────── */}
      <Header
        onLoginClick={() => setLoginOpen(true)}
        notificaciones={3}
      />

      {/* ── Cuerpo: sidebar + contenido ───────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (oculto en mobile) */}
        <Sidebar isAdmin={isAdmin()} />

        {/* Área de contenido principal */}
        <main className="flex-1 flex flex-col overflow-y-auto min-h-0">
          <Routes>
            {/* Ruta raíz → Home */}
            <Route path="/"          element={<Home />} />
            <Route path="/buscar"    element={<Buscar />} />
            <Route path="/qr"        element={<QR />} />
            <Route path="/farmacias" element={<Farmacias />} />
            <Route path="/mi-eps"    element={<MiEPS />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/admin"     element={<Admin />} />
            <Route 
              path="/red-admin" 
              element={isAdmin() ? <RedeAdmin /> : <Navigate to="/" replace />} 
            />
            {/* Cualquier ruta desconocida → Home */}
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* ── Bottom nav (mobile) ────────────────────────────────────── */}
      <BottomNav isAdmin={isAdmin()} />

      {/* ── Modal de login ─────────────────────────────────────────── */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </div>
  );
}

// ── Componente raíz — proveedores globales ────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}
