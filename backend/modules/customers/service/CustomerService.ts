import repo from '../repository/CustomerRepository';
import { audit } from '../../../shared/middlewares/audit';
import { prisma } from '../../../shared/config/database';

export class CustomerService {
	async list(query: any) {
		const filter: any = {};
		if (query.status) filter.status = query.status;
		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
		const skip = (page - 1) * limit;
		const [data, total] = await Promise.all([
			repo.list(filter, skip, limit),
			repo.count(filter)
		]);
		return { data, total, page, totalPages: Math.ceil(total / limit) };
	}

	async create(actorId: string, payload: { name: string; tax_code: string; address?: string; contact_email?: string }) {
		const existsTax = await repo.findByTaxCode(payload.tax_code);
		if (existsTax) throw new Error('Mã số thuế đã tồn tại');
		const customer = await repo.create({ ...payload, status: 'ACTIVE' });
		await audit(actorId, 'CUSTOMER.CREATED', 'CUSTOMER', String((customer as any)._id));

		// Auto-provision CustomerAdmin invited
		if (payload.contact_email) {
			const token = Math.random().toString(36).slice(2);
			await prisma.user.create({ data: {
				email: payload.contact_email,
				full_name: `${payload.name} Admin`,
				role: 'CustomerAdmin',
				tenant_id: String((customer as any)._id),
				status: 'INVITED',
				invite_token: token,
				invite_expires_at: new Date(Date.now() + 1000*60*60*24*7)
			}});
			await audit(actorId, 'USER.INVITED', 'CUSTOMER', String((customer as any)._id), { email: payload.contact_email });
		}
		return customer;
	}

	async update(actorId: string, id: string, data: any) {
		if (data.tax_code) delete data.tax_code; // immutable in this scope
		const updated = await repo.updateById(id, data);
		if (!updated) throw new Error('Khách hàng không tồn tại');
		await audit(actorId, 'CUSTOMER.UPDATED', 'CUSTOMER', id, { fields: Object.keys(data) });
		return updated;
	}

	async disable(actorId: string, id: string) {
		const updated = await repo.updateById(id, { status: 'INACTIVE' });
		if (!updated) throw new Error('Khách hàng không tồn tại');
		await audit(actorId, 'CUSTOMER.DISABLED', 'CUSTOMER', id);
		return true;
	}
}

export default new CustomerService();
