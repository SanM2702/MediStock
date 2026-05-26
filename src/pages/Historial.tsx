import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useHistorial } from '../hooks/useHistorial';
import type { ActividadHistorial } from '../hooks/useHistorial';
import { format, isToday, isYesterday, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  Trash2, 
  Pill, 
  MessageSquare, 
  User, 
  LogIn, 
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Clock,
  LayoutDashboard,
  AlertCircle
} from 'lucide-react';
import './Historial.css';

// Interfaces para datos locales
interface Filtro {
  tipo: string | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
}

// Mapa de tipos a iconos y colores para el dashboard
const tipoConfig: Record<string, { icono: any; color: string; etiqueta: string; bg: string }> = {
  consulta_medicamento: { icono: Pill, color: '#10b981', bg: '#ecfdf5', etiqueta: 'Consulta' },
  turno_agendado: { icono: Calendar, color: '#3b82f6', bg: '#eff6ff', etiqueta: 'Turno' },
  turno_cancelado: { icono: AlertCircle, color: '#ef4444', bg: '#fef2f2', etiqueta: 'Cancelado' },
  busqueda: { icono: Search, color: '#6366f1', bg: '#eef2ff', etiqueta: 'Búsqueda' },
  chat_ia: { icono: MessageSquare, color: '#a855f7', bg: '#f5f3ff', etiqueta: 'Chat IA' },
  cambio_perfil: { icono: User, color: '#f97316', bg: '#fff7ed', etiqueta: 'Perfil' },
  login: { icono: LogIn, color: '#eab308', bg: '#fefce8', etiqueta: 'Login' },
};

export const Historial = () => {
  const { user } = useAuth();
  const { data, historialAgrupado, loading, error, resumen, getHistorial, getResumen, eliminarActividad, limpiarHistorial } = useHistorial();
  
  const [filtros, setFiltros] = useState<Filtro>({
    tipo: null,
    fecha_desde: null,
    fecha_hasta: null,
  });
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [expandidos, setExpandidos] = useState<number[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.id) {
      cargarHistorial();
      cargarResumen();
    }
  }, [user?.id]);

  const cargarHistorial = async () => {
    try {
      await getHistorial({
        tipo: filtros.tipo || undefined,
        fecha_desde: filtros.fecha_desde || undefined,
        fecha_hasta: filtros.fecha_hasta || undefined,
        limite: 100,
      });
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  };

  const cargarResumen = async () => {
    try {
      await getResumen();
    } catch (err) {
      console.error('Error cargando resumen:', err);
    }
  };

  const aplicarFiltros = () => {
    cargarHistorial();
  };

  const limpiarFiltros = () => {
    setFiltros({ tipo: null, fecha_desde: null, fecha_hasta: null });
    // Se dispara el efecto al limpiar filtros en un dashboard real, aquí lo forzamos
    setTimeout(() => cargarHistorial(), 0);
  };

  const handleEliminarActividad = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
      try {
        await eliminarActividad(id);
      } catch (err) {
        console.error('Error eliminando actividad:', err);
      }
    }
  };

  const handleLimpiarHistorial = async () => {
    try {
      await limpiarHistorial();
      setMostrarConfirmacion(false);
    } catch (err) {
      console.error('Error limpiando historial:', err);
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // Logo y título
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Azul
    doc.text('MediStock', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Información del usuario y fecha
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Usuario: ${user?.nombre || 'Usuario'}`, 10, yPosition);
    yPosition += 5;
    doc.text(`Exportado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 10, yPosition);
    yPosition += 10;

    // Resumen
    if (resumen) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Resumen de Actividades:', 10, yPosition);
      yPosition += 5;

      doc.setFontSize(9);
      const resumenTexto = [
        `• Consultas: ${resumen.consultas}`,
        `• Turnos: ${resumen.turnos}`,
        `• Búsquedas: ${resumen.busquedas}`,
        `• Chats con IA: ${resumen.chats}`,
      ];
      resumenTexto.forEach((texto) => {
        doc.text(texto, 15, yPosition);
        yPosition += 4;
      });
      yPosition += 5;
    }

    // Historial
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Historial de Actividades:', 10, yPosition);
    yPosition += 5;

    doc.setFontSize(9);
    data.forEach((actividad) => {
      const fecha = format(parseISO(actividad.creado_en), 'dd/MM/yyyy HH:mm', { locale: es });
      const config = tipoConfig[actividad.tipo] || { etiqueta: actividad.tipo };
      
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 10) {
        doc.addPage();
        yPosition = 10;
      }

      doc.setTextColor(0, 0, 0);
      doc.text(`[${fecha}] ${config.etiqueta}: ${actividad.titulo}`, 10, yPosition);
      yPosition += 4;

      if (actividad.descripcion) {
        doc.setTextColor(100, 100, 100);
        doc.text(actividad.descripcion, 15, yPosition, { maxWidth: pageWidth - 20 });
        yPosition += 4;
      }
      yPosition += 2;
    });

    // Descargar
    doc.save(`Historial_MediStock_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const formatearFechaCabecera = (isoString: string) => {
    const fecha = parseISO(isoString);
    if (isToday(fecha)) return 'Hoy';
    if (isYesterday(fecha)) return 'Ayer';
    return format(fecha, "EEEE, d 'de' MMMM", { locale: es });
  };

  const toggleExpandido = (id: number) => {
    setExpandidos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Renderizado
  if (!user?.id) {
    return (
      <div className="historial-page">
        <div className="historial-empty-state">
          <div className="empty-state-icon"><LogIn size={48} /></div>
          <h2>Sesión requerida</h2>
          <p>Por favor inicia sesión para ver tu historial de actividades.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historial-page">
      <div className="historial-max-container">
        
        {/* Modern Header */}
        <header className="historial-dashboard-header">
          <div className="header-left">
            <div className="header-icon-container">
              <LayoutDashboard size={24} className="text-primary" />
            </div>
            <div>
              <h1>Mi Historial</h1>
              <p>Monitorea y gestiona todas tus actividades en la plataforma</p>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={exportarPDF} className="btn-modern btn-primary-modern">
              <Download size={18} />
              <span>Exportar PDF</span>
            </button>
            <button onClick={() => setMostrarConfirmacion(true)} className="btn-modern btn-ghost-danger">
              <Trash2 size={18} />
              <span>Limpiar Historial</span>
            </button>
          </div>
        </header>

        {/* Analytics Stats Grid */}
        {resumen && !loading && (
          <section className="historial-stats-grid">
            <div className="stat-card-modern">
              <div className="stat-icon-bg" style={{ backgroundColor: tipoConfig.consulta_medicamento.bg }}>
                <Pill size={20} style={{ color: tipoConfig.consulta_medicamento.color }} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{resumen.consultas}</span>
                <span className="stat-label">Consultas</span>
              </div>
            </div>
            <div className="stat-card-modern">
              <div className="stat-icon-bg" style={{ backgroundColor: tipoConfig.turno_agendado.bg }}>
                <Calendar size={20} style={{ color: tipoConfig.turno_agendado.color }} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{resumen.turnos}</span>
                <span className="stat-label">Turnos</span>
              </div>
            </div>
            <div className="stat-card-modern">
              <div className="stat-icon-bg" style={{ backgroundColor: tipoConfig.busqueda.bg }}>
                <Search size={20} style={{ color: tipoConfig.busqueda.color }} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{resumen.busquedas}</span>
                <span className="stat-label">Búsquedas</span>
              </div>
            </div>
            <div className="stat-card-modern">
              <div className="stat-icon-bg" style={{ backgroundColor: tipoConfig.chat_ia.bg }}>
                <MessageSquare size={20} style={{ color: tipoConfig.chat_ia.color }} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{resumen.chats}</span>
                <span className="stat-label">IA Chats</span>
              </div>
            </div>
          </section>
        )}

        {/* Modern Toolbar (Filters) */}
        <div className="historial-toolbar">
          <div className="toolbar-filters">
            <div className="filter-item">
              <Filter size={16} className="filter-icon" />
              <select
                value={filtros.tipo || ''}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value || null })}
                className="modern-select"
              >
                <option value="">Todos los tipos</option>
                <option value="consulta_medicamento">💊 Consultas</option>
                <option value="turno_agendado">📅 Turnos</option>
                <option value="busqueda">🔍 Búsquedas</option>
                <option value="chat_ia">🤖 Chat IA</option>
                <option value="cambio_perfil">👤 Perfil</option>
                <option value="login">🔐 Login</option>
              </select>
            </div>
            <div className="filter-divider"></div>
            <div className="filter-item">
              <Calendar size={16} className="filter-icon" />
              <input
                type="date"
                value={filtros.fecha_desde || ''}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value || null })}
                className="modern-date-input"
                placeholder="Desde"
              />
            </div>
            <div className="filter-item">
              <input
                type="date"
                value={filtros.fecha_hasta || ''}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value || null })}
                className="modern-date-input"
                placeholder="Hasta"
              />
            </div>
          </div>
          <div className="toolbar-actions">
            <button onClick={aplicarFiltros} className="btn-modern btn-accent">
              <Search size={16} />
              <span>Filtrar</span>
            </button>
            <button onClick={limpiarFiltros} className="btn-modern btn-ghost">
              <span>Limpiar</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <main className="historial-main-content">
          {loading ? (
            <div className="historial-loading-feed">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-feed-item"></div>
              ))}
            </div>
          ) : error ? (
            <div className="historial-error-box">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="historial-empty-state">
              <div className="empty-state-icon">📭</div>
              <h2>Sin actividad reciente</h2>
              <p>No se encontraron registros con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="activity-feed">
              {Object.entries(historialAgrupado).map(([fecha, actividades]) => (
                <div key={fecha} className="feed-date-group">
                  <h2 className="feed-date-label">
                    {formatearFechaCabecera(actividades[0].creado_en)}
                  </h2>
                  <div className="feed-items-container">
                    {actividades.map((actividad) => {
                      const config = tipoConfig[actividad.tipo] || { icono: MoreHorizontal, color: '#6b7280', bg: '#f3f4f6', etiqueta: 'Actividad' };
                      const Icon = config.icono;
                      const isExpandido = expandidos.includes(actividad.id);

                      return (
                        <div key={actividad.id} className="feed-item-card">
                          <div className="feed-item-left">
                            <div className="feed-item-icon" style={{ color: config.color, backgroundColor: config.bg }}>
                              <Icon size={18} />
                            </div>
                            <div className="feed-item-details">
                              <div className="feed-item-main">
                                <h3 className="feed-item-title">{actividad.titulo}</h3>
                                <span className="feed-item-badge" style={{ color: config.color, backgroundColor: config.bg }}>
                                  {config.etiqueta}
                                </span>
                              </div>
                              {actividad.descripcion && (
                                <p className="feed-item-desc">{actividad.descripcion}</p>
                              )}
                              <div className="feed-item-meta">
                                <span className="feed-item-time">
                                  <Clock size={12} />
                                  {formatDistanceToNow(parseISO(actividad.creado_en), { addSuffix: true, locale: es })}
                                </span>
                                {actividad.metadata_json && (
                                  <button onClick={() => toggleExpandido(actividad.id)} className="btn-metadata-toggle">
                                    {isExpandido ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    Detalles técnicos
                                  </button>
                                )}
                              </div>
                              {isExpandido && actividad.metadata_json && (
                                <div className="feed-item-json">
                                  <pre>{JSON.stringify(JSON.parse(actividad.metadata_json), null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleEliminarActividad(actividad.id)} 
                            className="btn-item-delete"
                            title="Eliminar de mi historial"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={observerTarget} className="feed-footer">
                <p>Has llegado al final de tu historial</p>
              </div>
            </div>
          )}
        </main>

        {/* Confirmation Modal */}
        {mostrarConfirmacion && (
          <div className="modern-modal-overlay" onClick={() => setMostrarConfirmacion(false)}>
            <div className="modern-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-accent-line"></div>
              <div className="modern-modal-content">
                <div className="modal-icon-warning">
                  <AlertCircle size={32} />
                </div>
                <h3>¿Limpiar historial completo?</h3>
                <p>Esta acción eliminará permanentemente todos tus registros de actividad. No podrás deshacer esta operación.</p>
                <div className="modal-modern-actions">
                  <button onClick={() => setMostrarConfirmacion(false)} className="btn-modern btn-ghost">
                    Cancelar
                  </button>
                  <button onClick={handleLimpiarHistorial} className="btn-modern btn-danger-modern">
                    Confirmar eliminación
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;
