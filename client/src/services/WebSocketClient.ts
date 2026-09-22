type MessageHandler = (data: any) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private isConnected = false;

  constructor(private url: string) {}

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.emit(msg.type, msg.data);
          } catch (e) {
            console.error('Failed to parse WS message', e);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('close', null);
        };

        this.ws.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  public authenticate(token: string, sessionId: string) {
    this.send('auth', { token, sessionId });
  }

  public sendInput(data: string) {
    this.send('input', { data });
  }

  public resize(cols: number, rows: number) {
    this.send('resize', { cols, rows });
  }

  private send(type: string, payload: any) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  public on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)?.push(handler);
  }

  public off(event: string, handler: MessageHandler) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      this.handlers.set(event, handlers.filter(h => h !== handler));
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(h => h(data));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
