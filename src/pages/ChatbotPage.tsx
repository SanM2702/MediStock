/**
 * Página de Chatbot
 *
 * Integra el componente Chatbot en una página completa
 */

import React from "react";
import Chatbot from "../components/chatbot";
import "./ChatbotPage.css";

export const ChatbotPage: React.FC = () => {
  return (
    <div className="chatbot-page">
      <div className="chatbot-page-container">
        <Chatbot />
      </div>
    </div>
  );
};

export default ChatbotPage;
