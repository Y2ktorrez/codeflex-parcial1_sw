'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
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

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsService = getWebSocketService();

  useEffect(() => {
    const code = localStorage.getItem("current_invitation_code");
    const WS_BASE_URL = process.env.NEXT_PUBLIC_WS;
    if (!code || !accessToken || !WS_BASE_URL) return;

    const wsUrl = `${WS_BASE_URL}/ws/room/${code}/?token=${accessToken}`;
    wsService.connect(wsUrl);

    const removeHandler = wsService.addMessageHandler((data) => {
      if (data.type === "presence" && data.event === "join") {
        const user =
          typeof data.user === "string" ? data.user : data.user.username;
        setMessages(prev => [
          ...prev,
          { type: "system", content: `${user} se ha unido al proyecto`, username: user },
        ]);
      } else if (data.type === "chat_message") {
        const user =
          typeof data.user === "string" ? data.user : data.user?.username || "Anonimo";
        setMessages(prev => [
          ...prev,
          { type: "chat", content: data.content, username: user },
        ]);
      }
    });

    return () => {
      removeHandler();
      // not calling wsService.disconnect() here to keep the socket alive
    };
  }, [accessToken, wsService]);

  const sendMessage = (msg: string) => {
    const username = localStorage.getItem("current_username") || "Anonimo";
    wsService.send({
      type: "chat_message",
      message: msg,
      user: username,
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
