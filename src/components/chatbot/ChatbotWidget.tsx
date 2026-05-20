/**
 * ChatbotWidget — Botón flotante + panel de chat
 *
 * Se monta globalmente en App.tsx y flota sobre todo el contenido
 * en la esquina inferior derecha. Al hacer clic en el botón se
 * despliega/oculta el panel de chat sin cambiar de ruta.
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { sendChatMessage, sendChatMessageAnonymous } from '../../services/chatbot';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
}

const ChatbotWidget: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus al input cuando se abre
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = isAuthenticated && token
        ? await sendChatMessage(text, token)
        : await sendChatMessageAnonymous(text);

      const botMsg: Message = {
        id: `b_${Date.now()}`,
        role: 'assistant',
        content: res.success && res.response
          ? res.response
          : (res.error ?? 'Error al obtener respuesta'),
        timestamp: new Date(),
        error: !res.success,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          role: 'assistant',
          content: 'Error de conexión. Intenta de nuevo.',
          timestamp: new Date(),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <>
      {/* ── Panel de chat ─────────────────────────────────────────── */}
      {open && (
        <div
          className="
            fixed bottom-20 right-4 z-50
            w-[340px] sm:w-[380px]
            flex flex-col
            bg-white dark:bg-slate-800
            rounded-2xl shadow-2xl
            border border-slate-200 dark:border-slate-700
            overflow-hidden
            animate-in
          "
          style={{ height: '520px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">💊</span>
              <div>
                <p className="font-semibold text-sm leading-tight">Asistente MediStock</p>
                <p className="text-[11px] opacity-80 leading-tight">Medicamentos · Farmacias · Salud</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  title="Limpiar chat"
                >
                  <span className="text-xs">🗑️</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Minimizar"
              >
                <Minimize2 size={15} />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50 dark:bg-slate-900/50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500 gap-2 pb-4">
                <span className="text-4xl">💬</span>
                <p className="text-sm font-medium">¿En qué puedo ayudarte?</p>
                <p className="text-xs">Pregunta sobre medicamentos,<br />farmacias o salud básica</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <span className="text-base flex-shrink-0 mt-0.5">🤖</span>
                  )}
                  <div
                    className={`
                      max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-sm'
                        : msg.error
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-bl-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm rounded-bl-sm'
                      }
                    `}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <span className="text-base flex-shrink-0 mt-0.5">👤</span>
                  )}
                </div>
              ))
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2 justify-start">
                <span className="text-base flex-shrink-0 mt-0.5">🤖</span>
                <div className="bg-white dark:bg-slate-700 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-3 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2 items-end bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-violet-500 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Escribe tu pregunta..."
                rows={1}
                maxLength={500}
                className="
                  flex-1 bg-transparent resize-none outline-none
                  text-sm text-slate-800 dark:text-slate-100
                  placeholder-slate-400 dark:placeholder-slate-500
                  min-h-[32px] max-h-[96px] py-1
                  disabled:opacity-50
                "
                style={{ lineHeight: '1.5' }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="
                  flex-shrink-0 w-8 h-8 rounded-lg
                  bg-gradient-to-br from-violet-600 to-purple-700
                  text-white flex items-center justify-center
                  hover:opacity-90 active:scale-95 transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
                title="Enviar (Enter)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 2L15 22 11 13 2 9l20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex justify-between items-center mt-1.5 px-1">
              <span className="text-[10px] text-slate-400">
                {isAuthenticated
                  ? <span className="text-emerald-500 font-medium">✓ Autenticado</span>
                  : <span className="text-amber-500">○ Anónimo</span>
                }
              </span>
              <span className="text-[10px] text-slate-400">{input.length}/500</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Botón flotante ────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="
          fixed bottom-20 right-4 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-violet-600 to-purple-700
          text-white shadow-lg shadow-violet-500/40
          flex items-center justify-center
          hover:scale-110 active:scale-95
          transition-all duration-200
          focus:outline-none focus:ring-4 focus:ring-violet-400/50
        "
        aria-label={open ? 'Cerrar chatbot' : 'Abrir chatbot'}
        title="Asistente MediStock"
      >
        {open
          ? <X size={24} strokeWidth={2.5} />
          : <MessageCircle size={24} strokeWidth={2} />
        }

        {/* Badge de notificación cuando está cerrado y hay mensajes */}
        {!open && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {messages.filter(m => m.role === 'assistant').length > 9
              ? '9+'
              : messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </button>
    </>
  );
};

export default ChatbotWidget;
