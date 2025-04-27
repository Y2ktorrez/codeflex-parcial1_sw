'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/context/WebSocketContext";

export function ChatDrawer() {
  const { messages, sendMessage } = useWebSocket();
  const [newMessage, setNewMessage] = useState("");
  const [currentUsername, setCurrentUsername] = useState("Anonimo");
  
  useEffect(() => {
    // Asegurarse de que esto se ejecute solo en el cliente
    if (typeof window !== "undefined") {
      setCurrentUsername(localStorage.getItem("current_username") || "Anonimo");
    }
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    console.log("Enviando mensaje como usuario:", currentUsername);
    sendMessage(newMessage);
    setNewMessage("");
  };

  const getColorFromUsername = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 70%)`;
    return color;
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="fixed bottom-5 right-5 z-50">
          Abrir Chat
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[80%] max-w-md mx-auto rounded-t-2xl p-4 flex flex-col bg-background">
        <DrawerHeader>
          <DrawerTitle>Chat en tiempo real</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto space-y-4 p-2">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center">No hay mensajes aún</p>
          ) : (
            messages.map((msg, index) => {
              const color = getColorFromUsername(msg.username || "Anonimo");
              const username = msg.username || "Anonimo";
              const isOwnMessage = username === currentUsername;
              
              console.log(`Mensaje #${index}:`, {
                username,
                currentUsername,
                isOwnMessage,
                content: msg.content
              });
              
              return (
                <div
                  key={index}
                  className={`flex ${msg.type === 'chat' ? (isOwnMessage ? 'justify-end' : 'justify-start') : 'justify-center'} items-start gap-2`}
                >
                  {msg.type === 'chat' && (
                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-xs`}>
                      <span className="text-xs text-muted-foreground mb-1">{username}</span>
                      <div
                        className="p-3 rounded-xl break-words"
                        style={{ backgroundColor: color, color: "black" }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {msg.type === 'system' && (
                    <div
                      className="p-3 rounded-xl bg-gray-300 text-gray-700 max-w-xs break-words text-center"
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <DrawerFooter className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <Button onClick={handleSendMessage}>Enviar</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}