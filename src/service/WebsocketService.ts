// websocketService.ts
export class WebSocketService {
    private static instance: WebSocketService | null = null;
    private socket: WebSocket | null = null;
    private messageHandlers: Array<(data: any) => void> = [];
  
    private constructor() {}
  
    public static getInstance(): WebSocketService {
      if (!WebSocketService.instance) {
        WebSocketService.instance = new WebSocketService();
      }
      return WebSocketService.instance;
    }
  
    public connect(url: string): void {
      // Si ya hay una conexión activa, no crear otra
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log("🔄 Ya existe una conexión WebSocket activa");
        return;
      }
  
      // Si hay una conexión en proceso de conectarse, no crear otra
      if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
        console.log("⏳ WebSocket ya está en proceso de conexión");
        return;
      }
  
      // Cerrar cualquier conexión anterior si existe
      this.disconnect();
  
      console.log("🔌 Creando nueva conexión WebSocket a:", url);
      this.socket = new WebSocket(url);
  
      this.socket.onopen = () => {
        console.log("✅ Conectado al WebSocket");
      };
  
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📨 Mensaje recibido:", data);
        // Notificar a todos los handlers registrados
        this.messageHandlers.forEach(handler => handler(data));
      };
  
      this.socket.onerror = (error) => {
        console.error("❌ Error en WebSocket:", error);
      };
  
      this.socket.onclose = () => {
        console.log("👋 WebSocket cerrado");
      };
    }
  
    public disconnect(): void {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
        console.log("🔒 Conexión WebSocket cerrada");
      }
    }
  
    public send(message: any): void {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message));
      } else {
        console.error("❌ No se puede enviar mensaje: WebSocket no está conectado");
      }
    }
  
    public addMessageHandler(handler: (data: any) => void): () => void {
      this.messageHandlers.push(handler);
      // Devuelve una función para eliminar este handler
      return () => {
        this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
      };
    }
  
    public isConnected(): boolean {
      return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
  }
  
  // Exportación para uso sencillo
  export const getWebSocketService = WebSocketService.getInstance;
  