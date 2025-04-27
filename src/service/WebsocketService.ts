// websocketService.ts
/** ──────────────────────────────────────────────────────────────────────────
 *  Tipos de mensajes
 *  - Ajusta los campos según lo que realmente envíe/reciba tu backend.
 * ──────────────────────────────────────────────────────────────────────────*/
export type IncomingMessage =
  | {
      type: 'presence';
      event: 'join' | 'leave';
      user: { username: string } | string;
    }
  | {
      type: 'chat_message';
      content: string;
      user: { username: string } | string;
    };

export interface OutgoingMessage {
  type: 'chat_message';
  message: string;
  user: string;
}

type MessageHandler = (data: IncomingMessage) => void;

/** ──────────────────────────────────────────────────────────────────────────
 *  WebSocketService (patrón Singleton)
 * ──────────────────────────────────────────────────────────────────────────*/
export class WebSocketService {
  private static instance: WebSocketService | null = null;

  private socket: WebSocket | null = null;
  private messageHandlers = new Set<MessageHandler>();

  private constructor() {} // impedir new externo

  /** Obtiene la misma instancia siempre */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /** Conectar (si no hay conexión existente/en curso) */
  public connect(url: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('🔄 Ya existe una conexión WebSocket activa');
      return;
    }
    if (this.socket?.readyState === WebSocket.CONNECTING) {
      console.log('⏳ WebSocket ya está en proceso de conexión');
      return;
    }

    this.disconnect(); // Cierra restos de sockets viejos

    console.log('🔌 Creando nueva conexión WebSocket a:', url);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => console.log('✅ Conectado al WebSocket');

    this.socket.onmessage = (evt) => {
      const data: IncomingMessage = JSON.parse(evt.data);
      console.log('📨 Mensaje recibido:', data);
      this.messageHandlers.forEach((h) => h(data));
    };

    this.socket.onerror = (err) => console.error('❌ Error en WebSocket:', err);

    this.socket.onclose = () => console.log('👋 WebSocket cerrado');
  }

  /** Cierra la conexión si existe */
  public disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  /** Envía un mensaje al servidor */
  public send(message: OutgoingMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('❌ No se puede enviar: WebSocket no está conectado');
    }
  }

  /** Registra un handler y devuelve una función para des-registrarlo */
  public addMessageHandler(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /** ¿Hay socket abierto? */
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

/** Helper de acceso rápido (igual que antes) */
export const getWebSocketService = WebSocketService.getInstance;
