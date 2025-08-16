import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';

export const audit = async (actorId: string | null, action: string, entity?: string, entity_id?: string, meta?: any) => {
	await prisma.auditLog.create({ data: { actor_id: actorId ?? null, action, entity, entity_id, meta } });
};

export const withAudit = (action: string, entity?: string) => {
	return async (req: AuthRequest, res: Response, next: NextFunction) => {
		res.on('finish', async () => {
			try {
				if (res.statusCode < 400) {
					await audit(req.user?._id || null, action, entity, (res as any).locals?.entity_id, (res as any).locals?.auditMeta);
				}
			} catch {}
		});
		next();
	};
};
