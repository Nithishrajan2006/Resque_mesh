type EventCallback = (data: any) => void;

class ResQMeshWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private clientId: string = 'client_' + Math.random().toString(36).substring(2, 9);
  private reconnectTimeout: any = null;
  private isConnecting: boolean = false;
  private hasWarnedMissingBackend: boolean = false;

  constructor() {
    this.connect();
  }

  /**
   * Resolves the WebSocket endpoint URL.
   * Ensures that the client does NOT attempt to connect to static hosts (like Vercel)
   * where no WebSocket server is running, which prevents 'Unexpected response code: 200' errors.
   */
  public getTargetUrl(): string | null {
    const envWsUrl = (import.meta.env.VITE_WS_URL || '').trim();
    const envApiUrl = (import.meta.env.VITE_API_URL || '').trim();

    // 1. Explicit VITE_WS_URL provided
    if (envWsUrl) {
      try {
        const testHttp = envWsUrl.startsWith('ws') ? envWsUrl.replace(/^ws/, 'http') : envWsUrl;
        const parsed = new URL(testHttp);
        if (parsed.hostname.endsWith('.vercel.app') || parsed.hostname === 'vercel.app') {
          console.warn('⚠️ VITE_WS_URL points to a Vercel domain. Vercel cannot host WebSocket servers. Set VITE_WS_URL to your backend (e.g. Render/Railway).');
          return null;
        }
      } catch {
        // Continue if URL parsing fails
      }
      return `${envWsUrl.replace(/\/$/, '')}/ws/${this.clientId}`;
    }

    // 2. Explicit VITE_API_URL provided - derive ws/wss URL
    if (envApiUrl) {
      try {
        const parsed = new URL(envApiUrl);
        if (parsed.hostname.endsWith('.vercel.app') || parsed.hostname === 'vercel.app') {
          console.warn('⚠️ VITE_API_URL points to a Vercel domain. Vercel cannot host WebSocket servers. Set VITE_WS_URL to your backend (e.g. Render/Railway).');
          return null;
        }
        const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
        const cleanHost = parsed.host;
        return `${wsProto}//${cleanHost}/ws/${this.clientId}`;
      } catch {
        const wsProto = envApiUrl.startsWith('https') ? 'wss:' : 'ws:';
        const cleanHost = envApiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return `${wsProto}//${cleanHost}/ws/${this.clientId}`;
      }
    }

    // 3. Runtime host inspection (when no environment variable is provided)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

      if (isLocal) {
        // Local development: connect through Vite dev server proxy or direct local backend
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/ws/${this.clientId}`;
      }

      // Static cloud hosting (Vercel, GitHub Pages, Netlify) without backend URL
      if (hostname.endsWith('.vercel.app') || hostname === 'vercel.app') {
        // Do NOT connect to Vercel — Vercel returns HTTP 200 (index.html) and breaks the handshake
        return null;
      }

      // Other remote host without configured backend
      return null;
    }

    return null;
  }

  public connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    const url = this.getTargetUrl();
    if (!url) {
      this.isConnecting = false;
      if (!this.hasWarnedMissingBackend) {
        this.hasWarnedMissingBackend = true;
        console.info(
          '⚡ ResQMesh: Running in standalone offline mesh mode on Vercel. ' +
          'No external WebSocket backend configured. Set VITE_WS_URL (or VITE_API_URL) in your Vercel project environment variables ' +
          'to point to your deployed backend (e.g. Render / Railway) to enable live real-time multi-peer sync.'
        );
      }
      this.emit('connection_change', { status: 'disconnected', reason: 'no_backend_ws' });
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('⚡ ResQMesh WebSocket connected to:', url);
        this.emit('connection_change', { status: 'connected', url });
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
    // Only schedule reconnect if a target URL is actually available
    if (this.getTargetUrl()) {
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, 3000);
    }
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
