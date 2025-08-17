import { prisma } from '../../../shared/config/database';

export class RequestRepository {
	create(data: any) { return prisma.serviceRequest.create({ data }); }
	update(id: string, data: any) { return prisma.serviceRequest.update({ where: { id }, data }); }
	findById(id: string) { return prisma.serviceRequest.findUnique({ where: { id } }); }
	
	// List với soft-delete filter
	list(filter: any, skip: number, take: number, actor?: 'depot' | 'customer', includeHidden = false) {
		let where = { ...filter };
		
		if (!includeHidden) {
			if (actor === 'depot') {
				where.depot_deleted_at = null;
			} else if (actor === 'customer') {
				where.customer_deleted_at = null;
			}
		}
		
		return prisma.serviceRequest.findMany({ 
			where, 
			orderBy: { createdAt: 'desc' }, 
			skip, 
			take,
			include: {
				docs: {
					where: { deleted_at: null },
					orderBy: [{ type: 'asc' }, { createdAt: 'desc' }]
				}
			}
		});
	}
	
	count(filter: any, actor?: 'depot' | 'customer', includeHidden = false) { 
		let where = { ...filter };
		
		if (!includeHidden) {
			if (actor === 'depot') {
				where.depot_deleted_at = null;
			} else if (actor === 'customer') {
				where.customer_deleted_at = null;
			}
		}
		
		return prisma.serviceRequest.count({ where }); 
	}
	
	// Soft delete theo scope
	softDelete(id: string, scope: 'depot' | 'customer') {
		const data = scope === 'depot' 
			? { depot_deleted_at: new Date() }
			: { customer_deleted_at: new Date() };
		return prisma.serviceRequest.update({ where: { id }, data });
	}
	
	// Restore theo scope
	restore(id: string, scope: 'depot' | 'customer') {
		const data = scope === 'depot' 
			? { depot_deleted_at: null }
			: { customer_deleted_at: null };
		return prisma.serviceRequest.update({ where: { id }, data });
	}

	// Documents
	createDoc(data: any) { return prisma.documentFile.create({ data }); }
	listDocs(request_id: string, type?: string) { 
		const where: any = { request_id, deleted_at: null };
		if (type) where.type = type;
		return prisma.documentFile.findMany({ 
			where, 
			orderBy: [{ type: 'asc' }, { createdAt: 'desc' }] 
		}); 
	}
	getDoc(id: string) { return prisma.documentFile.findUnique({ where: { id } }); }
	softDeleteDoc(id: string, deleted_by: string, reason?: string) { return prisma.documentFile.update({ where: { id }, data: { deleted_at: new Date(), deleted_by, delete_reason: reason } }); }
	getLastDocVersion(request_id: string, type: string) { return prisma.documentFile.findFirst({ where: { request_id, type }, orderBy: { version: 'desc' } }); }

	// Payment requests
	createPayment(data: any) { return prisma.paymentRequest.create({ data }); }
	listPayments(request_id: string) { return prisma.paymentRequest.findMany({ where: { request_id }, orderBy: { createdAt: 'desc' } }); }
	getLatestPayment(request_id: string) { return prisma.paymentRequest.findFirst({ where: { request_id }, orderBy: { createdAt: 'desc' } }); }
}

export default new RequestRepository();
