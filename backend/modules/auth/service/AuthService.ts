import bcrypt from 'bcryptjs';
import { signToken, AuthUser } from '../../../shared/middlewares/auth';
import { validatePasswordStrength } from '../../../shared/utils/passwordPolicy';
import { audit } from '../../../shared/middlewares/audit';
import { prisma } from '../../../shared/config/database';
import tokenSvc from './TokenService';

export class AuthService {
	async login(username: string, password: string) {
		const user = await prisma.user.findUnique({ where: { email: username } });
		if (!user) throw new Error('Tài khoản hoặc mật khẩu không đúng');
		if (user.status === 'DISABLED') throw new Error('Tài khoản đã bị vô hiệu hóa');
		if (user.status === 'LOCKED') throw new Error('Tài khoản đang bị khóa');
		if (user.status !== 'ACTIVE') throw new Error('Tài khoản chưa ở trạng thái ACTIVE');

		if (!user.password_hash) throw new Error('Tài khoản chưa kích hoạt');
		const ok = await bcrypt.compare(password, user.password_hash);
		if (!ok) throw new Error('Tài khoản hoặc mật khẩu không đúng');

		await prisma.user.update({ where: { id: String(user.id) }, data: { last_login_at: new Date() } });

		await audit(String(user.id), 'LOGIN_SUCCESS', 'USER', String(user.id));

		const payload: AuthUser = {
			_id: String(user.id),
			email: user.email,
			role: user.role as any,
			tenant_id: user.tenant_id || undefined,
			partner_id: user.partner_id || undefined,
			status: 'ACTIVE'
		};
    const access = signToken(payload);
    const refresh = await tokenSvc.issueRefresh(String(user.id), 7 * 24 * 60 * 60 * 1000);
    return { access_token: access, refresh_token: refresh, user: payload };
	}

	async changePassword(userId: string, oldPass: string, newPass: string, confirm: string) {
		if (newPass !== confirm) throw new Error('Xác nhận mật khẩu không khớp');
		const policy = validatePasswordStrength(newPass);
		if (!policy.ok) throw new Error(policy.message);

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new Error('Người dùng không tồn tại');
		if (!user.password_hash) throw new Error('Tài khoản chưa kích hoạt');
		const ok = await bcrypt.compare(oldPass, user.password_hash);
		if (!ok) throw new Error('Mật khẩu cũ không đúng');
		const same = await bcrypt.compare(newPass, user.password_hash);
		if (same) throw new Error('Mật khẩu mới không được trùng mật khẩu cũ');

    await prisma.user.update({ where: { id: userId }, data: { password_hash: await bcrypt.hash(newPass, 10) } });
    await tokenSvc.revokeAll(userId);
		await audit(userId, 'PASSWORD_CHANGED', 'USER', userId);
		return true;
	}

  async refresh(userId: string, refreshToken: string) {
    const valid = await tokenSvc.verifyRefresh(userId, refreshToken);
    if (!valid) throw new Error('Invalid refresh token');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    const payload: AuthUser = {
      _id: String(user.id),
      email: user.email,
      role: user.role as any,
      tenant_id: user.tenant_id || undefined,
      partner_id: user.partner_id || undefined,
      status: user.status as any
    };
    const access = signToken(payload);
    const rotated = await tokenSvc.rotateRefresh(userId, refreshToken, 7 * 24 * 60 * 60 * 1000);
    return { access_token: access, refresh_token: rotated };
  }

	async acceptInvite(token: string, password: string, confirm: string) {
		if (password !== confirm) throw new Error('Xác nhận mật khẩu không khớp');
		const policy = validatePasswordStrength(password);
		if (!policy.ok) throw new Error(policy.message);
		const user = await prisma.user.findFirst({ where: { invite_token: token, status: 'INVITED' } });
		if (!user) throw new Error('Token mời không hợp lệ hoặc đã hết hạn');
		await prisma.user.update({
			where: { id: user.id },
			data: {
				password_hash: await bcrypt.hash(password, 10),
				status: 'ACTIVE',
				invite_token: null,
				invite_expires_at: null
			}
		});
		await audit(String(user.id), 'USER.ACTIVATED', 'USER', String(user.id));
		return true;
	}
}

export default new AuthService();
