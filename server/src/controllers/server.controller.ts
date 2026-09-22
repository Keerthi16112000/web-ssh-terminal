import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { ValidationError } from '../errors/AppError';
import { logAudit } from '../utils/logger';

export const getServers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const servers = await prisma.server.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        authType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({ success: true, data: servers });
  } catch (error) {
    next(error);
  }
};

export const getServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    const server = await prisma.server.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        authType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!server) {
      throw new ValidationError('Server not found');
    }

    res.status(200).json({ success: true, data: server });
  } catch (error) {
    next(error);
  }
};

export const createServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { name, host, port, username, authType, password, privateKey, passphrase } = req.body;

    if (!name || !host || !username || !authType) {
      throw new ValidationError('Name, host, username, and authType are required');
    }

    const server = await prisma.server.create({
      data: {
        name,
        host,
        port: port || 22,
        username,
        authType,
        password,
        privateKey,
        passphrase,
        userId,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        authType: true,
        createdAt: true,
      },
    });

    await logAudit(userId, 'SERVER_CREATED', `Created server ${name} (${host})`);

    res.status(201).json({ success: true, data: server });
  } catch (error) {
    next(error);
  }
};

export const updateServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { name, host, port, username, authType, password, privateKey, passphrase } = req.body;

    const existing = await prisma.server.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new ValidationError('Server not found');
    }

    const server = await prisma.server.update({
      where: { id },
      data: {
        name,
        host,
        port,
        username,
        authType,
        password: password !== undefined ? password : existing.password,
        privateKey: privateKey !== undefined ? privateKey : existing.privateKey,
        passphrase: passphrase !== undefined ? passphrase : existing.passphrase,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        authType: true,
        updatedAt: true,
      },
    });

    await logAudit(userId, 'SERVER_UPDATED', `Updated server ${name}`);

    res.status(200).json({ success: true, data: server });
  } catch (error) {
    next(error);
  }
};

export const deleteServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    const existing = await prisma.server.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new ValidationError('Server not found');
    }

    await prisma.server.delete({ where: { id } });

    await logAudit(userId, 'SERVER_DELETED', `Deleted server ${existing.name}`);

    res.status(200).json({ success: true, data: { message: 'Server deleted successfully' } });
  } catch (error) {
    next(error);
  }
};
