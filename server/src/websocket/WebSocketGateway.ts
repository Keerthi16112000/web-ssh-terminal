import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { sessionManager } from '../sessions/SessionManager';

interface WSMessage {
  type: 'auth' | 'input' | 'resize' | 'ping';
  token?: string;     // For auth
  sessionId?: string; // For auth
  data?: string;      // For input
  cols?: number;      // For resize
  rows?: number;      // For resize
}

export const initializeWebSocketGateway = (server: Server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    let activeSessionId: string | null = null;
    let userId: string | null = null;
    let isAuthenticated = false;

    ws.on('message', async (rawMsg: Buffer) => {
      try {
        const msgStr = rawMsg.toString('utf-8');
        const msg: WSMessage = JSON.parse(msgStr);

        if (msg.type === 'auth') {
          // Authenticate WS Connection
          if (!msg.token || !msg.sessionId) {
            ws.send(JSON.stringify({ type: 'error', data: 'Missing auth data' }));
            return ws.close();
          }

          const secret = process.env.JWT_SECRET || 'secret';
          try {
            const decoded = jwt.verify(msg.token, secret) as { userId: string };
            userId = decoded.userId;
            
            const session = sessionManager.getSession(msg.sessionId);
            if (!session || session.userId !== userId) {
              ws.send(JSON.stringify({ type: 'error', data: 'Invalid session' }));
              return ws.close();
            }

            isAuthenticated = true;
            activeSessionId = msg.sessionId;

            // Connect SSH
            const sshService = session.sshService;

            sshService.on('ready', async () => {
              ws.send(JSON.stringify({ type: 'connection', data: 'connected' }));
              try {
                await sshService.startShell();
              } catch (err) {
                ws.send(JSON.stringify({ type: 'error', data: 'Failed to start shell' }));
                ws.close();
              }
            });

            sshService.on('data', (data: Buffer) => {
              ws.send(JSON.stringify({ type: 'output', data: data.toString('utf-8') }));
            });

            sshService.on('error', (err) => {
              ws.send(JSON.stringify({ type: 'error', data: err.message }));
            });

            sshService.on('close', () => {
              ws.send(JSON.stringify({ type: 'close' }));
              ws.close();
            });

            sshService.connect();

          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', data: 'Invalid token' }));
            return ws.close();
          }
          return;
        }

        if (!isAuthenticated || !activeSessionId) {
          return;
        }

        const session = sessionManager.getSession(activeSessionId);
        if (!session) return;

        if (msg.type === 'input' && msg.data) {
          session.sshService.write(msg.data);
        } else if (msg.type === 'resize' && msg.cols && msg.rows) {
          session.sshService.resize(msg.rows, msg.cols);
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }

      } catch (err) {
        console.error('Invalid WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (activeSessionId) {
        sessionManager.terminateSession(activeSessionId, 'websocket_closed');
      }
    });
  });
};
