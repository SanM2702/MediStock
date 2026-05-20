/**
 * Componente principal del Chatbot
 *
 * Características:
 * - Interfaz limpia y moderna
 * - Envío de mensajes con Enter
 * - Loading state
 * - Manejo de errores
 * - Scroll automático
 * - Diseño responsive
 */

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { sendChatMessage, sendChatMessageAnonymous, ChatResponse } from "../services/chatbot";
import "./Chatbot.css";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens_used?: number;
  time_ms?: number;
  error?: string;
}

/**
 * Componente Chatbot
 * Renderiza la interfaz de chat con Groq
 */
export const Chatbot: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Maneja el envío de un mensaje
   */
  const handleSendMessage = async () => {
    // Validaciones
    if (!input.trim()) {
      setError("Por favor, escribe un mensaje");
      return;
    }

    if (input.length > 500) {
      setError("El mensaje no puede exceder 500 caracteres");
      return;
    }

    // Crear mensaje del usuario
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // Agregar a lista de mensajes
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      // Enviar mensaje al backend
      const response: ChatResponse = isAuthenticated
        ? await sendChatMessage(input.trim(), token!)
        : await sendChatMessageAnonymous(input.trim());

      if (response.success && response.response) {
        // Mensaje exitoso
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_response`,
          role: "assistant",
          content: response.response,
          timestamp: new Date(),
          tokens_used: response.tokens_used,
          time_ms: response.time_ms,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Error en la respuesta
        const errorMessage = response.error || "Error desconocido";
        setError(errorMessage);

        const assistantMessage: Message = {
          id: `msg_${Date.now()}_error`,
          role: "assistant",
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
          error: errorMessage,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMsg);

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: "assistant",
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
        error: errorMsg,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja la tecla Enter para enviar
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Limpia el chat
   */
  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setInput("");
  };

  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="chatbot-header">
        <h2>Asistente MediStock</h2>
        <p className="chatbot-subtitle">
          Preguntas sobre medicamentos, farmacias y salud
        </p>
      </div>

      {/* Área de mensajes */}
      <div className="chatbot-messages">
        {messages.length === 0 ? (
          <div className="chatbot-empty">
            <div className="chatbot-empty-icon">💊</div>
            <p>¿En qué puedo ayudarte hoy?</p>
            <p className="text-gray-500 text-sm">
              Pregunta sobre medicamentos, farmacias o salud básica
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chatbot-message ${msg.role}`}>
              <div className="chatbot-message-avatar">
                {msg.role === "user" ? "👤" : "🤖"}
              </div>
              <div className="chatbot-message-content">
                <p>{msg.content}</p>
                {msg.time_ms && (
                  <span className="chatbot-message-meta">
                    ⏱️ {msg.time_ms}ms {msg.tokens_used && `• 🪙 ${msg.tokens_used} tokens`}
                  </span>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="chatbot-message assistant">
            <div className="chatbot-message-avatar">🤖</div>
            <div className="chatbot-message-content">
              <div className="chatbot-loading">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="chatbot-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chatbot-input-area">
        <div className="chatbot-input-wrapper">
          <textarea
            className="chatbot-input"
            placeholder="Escribe tu pregunta... (Shift+Enter para nueva línea)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            rows={1}
            maxLength={500}
          />
          <div className="chatbot-input-controls">
            <span className="chatbot-char-count">
              {input.length}/500
            </span>
            <button
              className="chatbot-send-btn"
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              title="Enviar mensaje (Enter)"
            >
              {loading ? "..." : "Enviar"}
            </button>
          </div>
        </div>

        {/* Footer actions */}
        {messages.length > 0 && (
          <button
            className="chatbot-clear-btn"
            onClick={handleClearChat}
            disabled={loading}
            title="Limpiar chat"
          >
            🗑️ Limpiar
          </button>
        )}

        {/* Auth status */}
        <p className="chatbot-auth-status">
          {isAuthenticated ? (
            <span className="text-green-600">✓ Autenticado</span>
          ) : (
            <span className="text-orange-600">○ Anónimo</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default Chatbot;
