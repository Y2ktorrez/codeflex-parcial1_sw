'use client';
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getWebSocketService } from "@/service/WebsocketService";

interface ChatMessage {
  type: 'system' | 'chat';
  content: string;
  username?: string;
}

interface WebSocketContextType {
  sendMessage: (msg: string) => void;
  messages: ChatMessage[];
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsService = getWebSocketService();

  useEffect(() => {
    const code = localStorage.getItem("current_invitation_code");
    const WS_BASE_URL = process.env.NEXT_PUBLIC_WS;
   
    if (!code || !accessToken || !WS_BASE_URL) return;

    // Conectar usando el servicio singleton
    const wsUrl = `${WS_BASE_URL}/ws/room/${code}/?token=${accessToken}`;
    wsService.connect(wsUrl);

    // Registrar un manejador de mensajes
    const removeHandler = wsService.addMessageHandler((data) => {
      console.log("Mensaje recibido en handler:", data); // Para depuración
      
      if (data.type === "presence" && data.event === "join") {
        setMessages(prev => [
          ...prev,
          { 
            type: "system", 
            content: `${typeof data.user === 'string' ? data.user : data.user.username} se ha unido al proyecto`, 
            username: typeof data.user === 'string' ? data.user : data.user.username 
          }
        ]);
      } else if (data.type === "chat_message") {
        console.log("Usuario actual:", localStorage.getItem("current_username"));
        console.log("Username extraído:", typeof data.user === 'string' ? data.user : data.user?.username);
        
        setMessages(prev => [
          ...prev,
          { 
            type: "chat", 
            content: data.content, 
            username: typeof data.user === 'string' ? data.user : data.user?.username || "Anonimo" 
          }
        ]);
      }
    });

    // Limpieza al desmontar
    return () => {
      removeHandler();
      // No desconectamos aquí para mantener la conexión viva
      // Solo se desconectará si la aplicación se cierra o se llama explícitamente a disconnect
    };
  }, [accessToken]);

  const sendMessage = (msg: string) => {
    const username = localStorage.getItem("current_username") || "Anonimo";
    console.log("Enviando mensaje como:", username);
    
    wsService.send({
      type: "chat_message",
      message: msg,
      user: username  // Enviar el username directamente, no como objeto
    });
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, messages }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket debe usarse dentro de WebSocketProvider");
  }
  return context;
};