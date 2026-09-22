import { SSHService, SSHConfig } from '../ssh/SSHService';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/logger';

export interface ActiveSession {
  sessionId: string;
  userId: string;
  serverId: string;
  sshService: SSHService;
  lastActivity: Date;
}

export class SessionManager {
  private sessions: Map<string, ActiveSession> = new Map();

  public async createSession(userId: string, serverId: string): Promise<string> {
    const dbServer = await prisma.server.findFirst({
      where: { id: serverId, userId },
    });

    if (!dbServer) {
      throw new Error('Server not found or access denied');
    }

    const dbSession = await prisma.session.create({
      data: {
        userId,
        serverId,
        status: 'active',
      },
    });

    const config: SSHConfig = {
      host: dbServer.host,
      port: dbServer.port,
      username: dbServer.username,
      password: dbServer.password || undefined,
      privateKey: dbServer.privateKey || undefined,
      passphrase: dbServer.passphrase || undefined,
    };

    const sshService = new SSHService(config);
    
    this.sessions.set(dbSession.id, {
      sessionId: dbSession.id,
      userId,
      serverId,
      sshService,
      lastActivity: new Date(),
    });

    await logAudit(userId, 'SSH_CONNECTION_INITIALIZED', `Initializing connection to ${dbServer.name}`);

    return dbSession.id;
  }

  public getSession(sessionId: string): ActiveSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  public async terminateSession(sessionId: string, reason = 'terminated') {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.sshService.disconnect();
      this.sessions.delete(sessionId);

      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'closed', lastActivity: new Date() },
      });

      await logAudit(session.userId, 'SSH_CONNECTION_CLOSED', `Session ${sessionId} closed (${reason})`);
    }
  }

  // Cleanup inactive sessions could be added via a setInterval
  public startCleanupTask(intervalMs: number = 60000, maxIdleMs: number = 3600000) {
    setInterval(() => {
      const now = new Date();
      for (const [sessionId, session] of Array.from(this.sessions.entries())) {
        if (now.getTime() - session.lastActivity.getTime() > maxIdleMs) {
          this.terminateSession(sessionId, 'idle_timeout');
        }
      }
    }, intervalMs);
  }
}

export const sessionManager = new SessionManager();
sessionManager.startCleanupTask();
