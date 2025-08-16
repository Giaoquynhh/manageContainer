import { Request, Response } from 'express';
import { toCsv } from '../../../shared/utils/csv';
import { prisma } from '../../../shared/config/database';

export class AuditController {
	async list(req: Request, res: Response) {
		const { entity, entity_id, actor, date_from, date_to, export_type } = req.query as any;
		const filter: any = {};
		if (entity) filter.entity = entity;
		if (entity_id) filter.entity_id = entity_id;
		if (actor) filter.actor_id = actor;
		if (date_from || date_to) {
			filter.createdAt = {} as any;
			if (date_from) filter.createdAt.$gte = new Date(date_from);
			if (date_to) filter.createdAt.$lte = new Date(date_to);
		}
		// Map filter to Prisma where clause
		const where: any = {};
		if (filter.entity) where.entity = String(filter.entity);
		if (filter.entity_id) where.entity_id = String(filter.entity_id);
		if (filter.actor_id) where.actor_id = String(filter.actor_id);
		if (filter.createdAt) {
			where.createdAt = {} as any;
			if (filter.createdAt.$gte) where.createdAt.gte = filter.createdAt.$gte;
			if (filter.createdAt.$lte) where.createdAt.lte = filter.createdAt.$lte;
		}
		const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5000 });
		if (export_type === 'csv') {
			const csv = toCsv(logs.map((l: any) => ({
				createdAt: l.createdAt.toISOString(),
				action: l.action,
				actor_id: l.actor_id,
				entity: l.entity,
				entity_id: l.entity_id,
				meta: JSON.stringify(l.meta || {})
			})));
			res.setHeader('Content-Type', 'text/csv');
			res.setHeader('Content-Disposition', 'attachment; filename="audit.csv"');
			return res.send(csv);
		}
		return res.json({ data: logs });
	}
}

export default new AuditController();
