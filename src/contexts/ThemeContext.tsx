/**
 * ThemeContext — Contexto global para modo oscuro/claro
 * Persiste la preferencia en localStorage y aplica la clase "dark" al <html>
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Tema = 'claro' | 'oscuro';

interface ThemeContextValue {
  tema: Tema;
  isDark: boolean;
  toggleTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    // Recuperar preferencia guardada o usar preferencia del sistema
    const stored = localStorage.getItem('medistock-tema') as Tema | null;
    if (stored === 'claro' || stored === 'oscuro') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  });

  // Aplicar/quitar clase "dark" en <html> cada vez que cambie el tema
  useEffect(() => {
    const root = document.documentElement;
    if (tema === 'oscuro') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('medistock-tema', tema);
  }, [tema]);

  const toggleTema = () =>
    setTema((prev) => (prev === 'claro' ? 'oscuro' : 'claro'));

  return (
    <ThemeContext.Provider value={{ tema, isDark: tema === 'oscuro', toggleTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Hook de conveniencia — lanza error si se usa fuera del provider */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
