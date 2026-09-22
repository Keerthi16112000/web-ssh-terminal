import prisma from './prisma';

export const logAudit = async (userId: string | null, action: string, details?: string) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
