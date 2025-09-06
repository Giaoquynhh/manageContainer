import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import repo from '../repository/UserRepository';
import { audit } from '../../../shared/middlewares/audit';
import { AppRole } from '../../../shared/middlewares/auth';
import emailService from '../../../shared/services/EmailService';
import { prisma } from '../../../shared/config/database';

const INTERNAL_ROLES: AppRole[] = ['SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','Driver'];
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
		
		// Gửi email invitation
		try {
			await emailService.sendUserInvitation(
				payload.email,
				payload.full_name,
				payload.role,
				invite.token,
				invite.expires,
				'vi' // Default language, có thể lấy từ actor preferences sau
			);
			console.log(`Invitation email sent to ${payload.email}`);
		} catch (emailError) {
			console.error('Failed to send invitation email:', emailError);
			// Không throw error để không làm fail việc tạo user
		}
		
		return user;
	}

	async createCustomerUser(actor: any, payload: { full_name: string; email: string; role: AppRole; tenant_id?: string; company_name?: string; }) {
		this.ensureRoleAllowedByCreator(actor.role as AppRole, payload.role);
		await this.ensureEmailUnique(payload.email);
		
		// Customer Admin must not cross tenant
		let tenant_id: string;
		if (actor.role === 'CustomerAdmin') {
			tenant_id = actor.tenant_id as string;
		} else {
			if (!payload.tenant_id) {
				throw new Error('tenant_id is required for non-CustomerAdmin users');
			}
			tenant_id = payload.tenant_id;
		}
		
		// Nếu có tenant_id nhưng chưa có customer, tạo customer trước
		if (tenant_id && payload.company_name) {
			const existingCustomer = await prisma.customer.findUnique({
				where: { id: tenant_id }
			});
			
			if (!existingCustomer) {
				// Tạo customer mới với id = tenant_id
				await prisma.customer.create({
					data: {
						id: tenant_id,
						name: payload.company_name,
						tax_code: tenant_id, // Sử dụng tenant_id làm tax_code tạm thời
						status: 'ACTIVE'
					}
				});
				console.log(`Created customer with id: ${tenant_id}, name: ${payload.company_name}`);
			}
		}
		
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
		
		// Gửi email invitation
		try {
			await emailService.sendUserInvitation(
				payload.email,
				payload.full_name,
				payload.role,
				invite.token,
				invite.expires,
				'vi' // Default language, có thể lấy từ actor preferences sau
			);
			console.log(`Invitation email sent to ${payload.email}`);
		} catch (emailError) {
			console.error('Failed to send invitation email:', emailError);
			// Không throw error để không làm fail việc tạo user
		}
		
		return user;
	}

	async update(actor: any, id: string, data: any) {
		const user = await repo.findById(id);
		if (!user) throw new Error('User không tồn tại');

		// Defense-in-depth: chặn tự đổi vai trò/chức năng
		if (String(actor._id) === String(id) && (typeof data.role !== 'undefined' || typeof data.permissions !== 'undefined')) {
			throw new Error('Không thể tự đổi vai trò/chức năng của chính mình');
		}
		// Tenant boundary for Customer Admin
		if (actor.role === 'CustomerAdmin' && user.tenant_id !== actor.tenant_id) throw new Error('Không có quyền');
		// Role change rule
		if (data.role && actor.role !== 'SystemAdmin' && actor.role !== 'BusinessAdmin') {
			// Only high roles can change role
			throw new Error('Không có quyền đổi vai trò');
		}
		// Permissions change rule
		if (data.permissions && actor.role !== 'SystemAdmin' && actor.role !== 'BusinessAdmin') {
			throw new Error('Không có quyền đổi chức năng');
		}

		// Chuẩn hóa permissions (unique, trimmed, max 50) — Joi đã validate pattern/size, đây là lớp phòng vệ bổ sung
		if (Array.isArray(data.permissions)) {
			const uniq = Array.from(new Set((data.permissions as string[]).map((s) => String(s).trim())));
			data.permissions = uniq.slice(0, 50);
		}
		// Prevent tenant/partner change without high privileges
		if ((data.tenant_id || data.partner_id) && actor.role !== 'SystemAdmin' && actor.role !== 'BusinessAdmin') {
			throw new Error('Không có quyền đổi scope');
		}
		const updated = await repo.updateById(id, data);
		const event = data.role
			? 'USER.ROLE_CHANGED'
			: (data.permissions ? 'USER.PERMISSION_CHANGED' : 'USER.UPDATED');
		await audit(String(actor._id as any), event, 'USER', id, { fields: Object.keys(data) });
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
		const user = await repo.findById(id);
		if (!user) throw new Error('User không tồn tại');
		
		// CustomerAdmin không thể khóa CustomerAdmin khác
		if (actor.role === 'CustomerAdmin' && user.role === 'CustomerAdmin') {
			throw new Error('CustomerAdmin không thể khóa CustomerAdmin khác');
		}
		
		// CustomerAdmin chỉ có thể khóa users cùng tenant
		if (actor.role === 'CustomerAdmin' && user.tenant_id !== actor.tenant_id) {
			throw new Error('Không có quyền khóa user này');
		}
		
		await repo.updateById(id, { status: 'LOCKED' });
		await audit(String(actor._id as any), 'USER.LOCKED', 'USER', id);
		return true;
	}

	async unlock(actor: any, id: string) {
		const user = await repo.findById(id);
		if (!user) throw new Error('User không tồn tại');
		
		// CustomerAdmin không thể mở khóa CustomerAdmin khác
		if (actor.role === 'CustomerAdmin' && user.role === 'CustomerAdmin') {
			throw new Error('CustomerAdmin không thể mở khóa CustomerAdmin khác');
		}
		
		// CustomerAdmin chỉ có thể mở khóa users cùng tenant
		if (actor.role === 'CustomerAdmin' && user.tenant_id !== actor.tenant_id) {
			throw new Error('Không có quyền mở khóa user này');
		}
		
		await repo.updateById(id, { status: 'ACTIVE' });
		await audit(String(actor._id as any), 'USER.UNLOCKED', 'USER', id);
		return true;
	}

	async sendInvite(actor: any, id: string) {
		const user = await repo.findById(id);
		if (!user) throw new Error('User không tồn tại');
		
		const invite = this.buildInvite();
		const updated = await repo.updateById(id, { status: 'INVITED', invite_token: invite.token, invite_expires_at: invite.expires });
		await audit(String(actor._id as any), 'USER.INVITED', 'USER', id);
		
		// Gửi email invitation
		try {
			await emailService.sendUserInvitation(
				user.email,
				user.full_name,
				user.role,
				invite.token,
				invite.expires,
				'vi' // Default language, có thể lấy từ actor preferences sau
			);
			console.log(`Invitation email sent to ${user.email}`);
		} catch (emailError) {
			console.error('Failed to send invitation email:', emailError);
			// Không throw error để không làm fail việc gửi invite
		}
		
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
		
		// Lưu tenant_id trước khi xóa user
		const tenantId = user.tenant_id;
		
		await repo.deleteById(id);
		await audit(String(actor._id as any), 'USER.DELETED', 'USER', id);
		
		// Nếu user có tenant_id, kiểm tra xem còn user nào khác không
		if (tenantId) {
			const remainingUsers = await prisma.user.count({
				where: {
					tenant_id: tenantId,
					role: { in: ['CustomerAdmin', 'CustomerUser'] }
				}
			});
			
			// Nếu không còn user nào, tự động xóa customer
			if (remainingUsers === 0) {
				await prisma.customer.delete({
					where: { id: tenantId }
				});
				console.log(`Auto-deleted customer ${tenantId} - no remaining users`);
			}
		}
		
		return true;
	}

	private buildInvite() { return { token: crypto.randomBytes(24).toString('hex'), expires: new Date(Date.now() + 1000*60*60*24*7) }; }
}

export default new UserService();
