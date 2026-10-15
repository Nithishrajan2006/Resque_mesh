type EventCallback = (data: any) => void;

class ResQMeshWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private clientId: string = 'client_' + Math.random().toString(36).substring(2, 9);
  private reconnectTimeout: any = null;
  private isConnecting: boolean = false;

  constructor() {
    this.connect();
  }

  public connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }
    this.isConnecting = true;
    
    let url = '';
    const envWsUrl = (import.meta.env.VITE_WS_URL || '').trim();
    const envApiUrl = (import.meta.env.VITE_API_URL || '').trim();

    if (envWsUrl) {
      url = `${envWsUrl.replace(/\/$/, '')}/ws/${this.clientId}`;
    } else if (envApiUrl) {
      const wsProto = envApiUrl.startsWith('https') ? 'wss:' : 'ws:';
      const cleanHost = envApiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      url = `${wsProto}//${cleanHost}/ws/${this.clientId}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      url = `${protocol}//${host}/ws/${this.clientId}`;
    }

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('⚡ ResQMesh WebSocket connected');
        this.emit('connection_change', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type) {
            this.emit(message.type, message.data || message);
          }
          this.emit('*', message);
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        console.warn('⚡ ResQMesh WebSocket disconnected. Retrying in 3s...');
        this.emit('connection_change', { status: 'disconnected' });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        this.ws?.close();
      };
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  public emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }
}

export const wsClient = new ResQMeshWebSocket();
