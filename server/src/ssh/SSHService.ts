import { Client, ClientChannel } from 'ssh2';
import { EventEmitter } from 'events';

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

export class SSHService extends EventEmitter {
  private client: Client;
  private stream: ClientChannel | null = null;
  private isConnected = false;

  constructor(private config: SSHConfig) {
    super();
    this.client = new Client();

    this.client.on('ready', () => {
      this.isConnected = true;
      this.emit('ready');
    });

    this.client.on('error', (err) => {
      this.emit('error', err);
      this.disconnect();
    });

    this.client.on('end', () => {
      this.emit('end');
      this.disconnect();
    });

    this.client.on('close', () => {
      this.emit('close');
      this.disconnect();
    });
  }

  public connect() {
    try {
      this.client.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
        passphrase: this.config.passphrase,
        readyTimeout: 10000, // 10 seconds timeout
        keepaliveInterval: 10000,
      });
    } catch (error) {
      this.emit('error', error);
    }
  }

  public async startShell(termVars: { rows: number; cols: number } = { rows: 24, cols: 80 }) {
    if (!this.isConnected) {
      throw new Error('Cannot start shell before SSH client is ready');
    }

    return new Promise<void>((resolve, reject) => {
      this.client.shell({ term: 'xterm-256color', rows: termVars.rows, cols: termVars.cols }, (err, stream) => {
        if (err) {
          return reject(err);
        }

        this.stream = stream;

        stream.on('data', (data: Buffer) => {
          this.emit('data', data);
        });

        stream.on('close', () => {
          this.emit('close');
          this.disconnect();
        });

        resolve();
      });
    });
  }

  public write(data: string) {
    if (this.stream) {
      this.stream.write(data);
    }
  }

  public resize(rows: number, cols: number) {
    if (this.stream) {
      this.stream.setWindow(rows, cols, 0, 0);
    }
  }

  public disconnect() {
    this.isConnected = false;
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
    this.client.end();
  }
}
