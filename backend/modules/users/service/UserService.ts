import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import repo from '../repository/UserRepository';
import { audit } from '../../../shared/middlewares/audit';
import { AppRole } from '../../../shared/middlewares/auth';

const INTERNAL_ROLES: AppRole[] = ['SystemAdmin','BusinessAdmin','HRManager','SaleAdmin'];
const CUSTOMER_ROLES: AppRole[] = ['CustomerAdmin','CustomerUser'];

export class UserService {
	private ensureEmailUnique = async (email: string) => {
		const existing = await repo.findByEmail(email);
		if (existing) throw new Error('Email đã tồn tại');
	};

	private ensureRoleAllowedByCreator(creatorRole: AppRole, role: AppRole) {
		if (creatorRole === 'HRManager') {
			if (!INTERNAL_ROLES.includes(role)) throw new Error('HR chỉ được tạo vai trò nội bộ');
			return;
		}
		if (creatorRole === 'SaleAdmin') {
			if (!CUSTOMER_ROLES.includes(role)) throw new Error('Sale chỉ được tạo user khách hàng');
			return;
		}
		if (creatorRole === 'CustomerAdmin') {
			if (!CUSTOMER_ROLES.includes(role)) throw new Error('Customer Admin chỉ được tạo user khách');
			return;
		}
	}

	async list(creator: any, query: any) {
		// Xây where cho Prisma
		const where: any = {};
		if (query.role) where.role = String(query.role);
		if (query.tenant_id) where.tenant_id = String(query.tenant_id);
		if (query.partner_id) where.partner_id = String(query.partner_id);

		// RLS scope
		if (creator.role === 'CustomerAdmin' || creator.role === 'CustomerUser') {
			where.tenant_id = String(creator.tenant_id || '');
		}
		// HR chỉ thấy user nội bộ (không thuộc tenant/partner)
		if (creator.role === 'HRManager') {
			where.partner_id = null;
			where.tenant_id = null;
		}

		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
		const skip = (page - 1) * limit;
		const [data, total] = await Promise.all([
			repo.list(where, skip, limit),
			repo.count(where)
		]);
		return { data, total, page, totalPages: Math.ceil(total / limit) };
	}

	async createByHR(actor: any, payload: { full_name: string; email: string; role: AppRole; }) {
		this.ensureRoleAllowedByCreator(actor.role as AppRole, payload.role);
		await this.ensureEmailUnique(payload.email);
		const invite = this.buildInvite();
		const user = await repo.create({
			full_name: payload.full_name,
			email: payload.email,
			role: payload.role,
			status: 'INVITED',
			invite_token: invite.token,
			invite_expires_at: invite.expires
		});
		await audit(String(actor._id as any), 'USER.INVITED', 'USER', String((user as any)._id));
		return user;
	}

	async createCustomerUser(actor: any, payload: { full_name: string; email: string; role: AppRole; tenant_id: string; }) {
		this.ensureRoleAllowedByCreator(actor.role as AppRole, payload.role);
		await this.ensureEmailUnique(payload.email);
		// Customer Admin must not cross tenant
		const tenant_id = actor.role === 'CustomerAdmin' ? (actor.tenant_id as string) : payload.tenant_id;
		const invite = this.buildInvite();
		const user = await repo.create({
			full_name: payload.full_name,
			email: payload.email,
			role: payload.role,
			tenant_id,
			status: 'INVITED',
			invite_token: invite.token,
			invite_expires_at: invite.expires
		});
		await audit(String(actor._id as any), 'USER.INVITED', 'USER', String((user as any)._id));
		return user;
	}

	async update(actor: any, id: string, data: any) {
		const user = await repo.findById(id);
		if (!user) throw new Error('User không tồn tại');
		// Tenant boundary for Customer Admin
		if (actor.role === 'CustomerAdmin' && user.tenant_id !== actor.tenant_id) throw new Error('Không có quyền');
		// Role change rule
		if (data.role && actor.role !== 'SystemAdmin' && actor.role !== 'BusinessAdmin') {
			// Only high roles can change role
			throw new Error('Không có quyền đổi vai trò');
		}
		// Prevent tenant/partner change without high privileges
		if ((data.tenant_id || data.partner_id) && actor.role !== 'SystemAdmin' && actor.role !== 'BusinessAdmin') {
			throw new Error('Không có quyền đổi scope');
		}
		const updated = await repo.updateById(id, data);
		await audit(String(actor._id as any), data.role ? 'USER.ROLE_CHANGED' : 'USER.UPDATED', 'USER', id, { fields: Object.keys(data) });
		return updated;
	}

	async disable(actor: any, id: string) {
		const user = await repo.updateById(id, { status: 'DISABLED' });
		if (!user) throw new Error('User không tồn tại');
		await audit(String(actor._id as any), 'USER.DISABLED', 'USER', id);
		return true;
	}

	async enable(actor: any, id: string) {
		const user = await repo.updateById(id, { status: 'ACTIVE' });
		if (!user) throw new Error('User không tồn tại');
		await audit(String(actor._id as any), 'USER.ENABLED', 'USER', id);
		return true;
	}

	async lock(actor: any, id: string) {
		const user = await repo.updateById(id, { status: 'LOCKED' });
		if (!user) throw new Error('User không tồn tại');
		await audit(String(actor._id as any), 'USER.LOCKED', 'USER', id);
		return true;
	}

	async unlock(actor: any, id: string) {
		const user = await repo.updateById(id, { status: 'ACTIVE' });
		if (!user) throw new Error('User không tồn tại');
		await audit(String(actor._id as any), 'USER.UNLOCKED', 'USER', id);
		return true;
	}

	async sendInvite(actor: any, id: string) {
		const invite = this.buildInvite();
		const updated = await repo.updateById(id, { status: 'INVITED', invite_token: invite.token, invite_expires_at: invite.expires });
		if (!updated) throw new Error('User không tồn tại');
		await audit(String(actor._id as any), 'USER.INVITED', 'USER', id);
		return { invite_token: invite.token, invite_expires_at: invite.expires };
	}

	async delete(actor: any, id: string) {
		const user = await repo.findById(id);
		if (!user) throw new Error('User không tồn tại');
		if (user.status !== 'DISABLED') throw new Error('Chỉ có thể xóa user đã bị vô hiệu hóa');
		
		// Kiểm tra quyền xóa
		if (actor.role === 'CustomerAdmin' && user.tenant_id !== actor.tenant_id) {
			throw new Error('Không có quyền xóa user khác tenant');
		}
		
		await repo.deleteById(id);
		await audit(String(actor._id as any), 'USER.DELETED', 'USER', id);
		return true;
	}

	private buildInvite() { return { token: crypto.randomBytes(24).toString('hex'), expires: new Date(Date.now() + 1000*60*60*24*7) }; }
}

export default new UserService();
