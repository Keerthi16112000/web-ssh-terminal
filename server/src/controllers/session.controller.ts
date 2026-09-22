import { Request, Response, NextFunction } from 'express';
import { sessionManager } from '../sessions/SessionManager';

export const createSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { serverId } = req.body;

    if (!serverId) {
      res.status(400).json({ success: false, error: { message: 'serverId is required' } });
      return;
    }

    const sessionId = await sessionManager.createSession(userId, serverId);

    res.status(201).json({ success: true, data: { sessionId } });
  } catch (error) {
    next(error);
  }
};
