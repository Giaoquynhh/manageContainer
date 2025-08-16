import { Request, Response } from 'express';
import authService from '../service/AuthService';
import { loginSchema, changePasswordSchema, updateProfileSchema, acceptInviteSchema } from '../dto/AuthDtos';
import { audit } from '../../../shared/middlewares/audit';
import { AuthRequest } from '../../../shared/middlewares/auth';
import { prisma } from '../../../shared/config/database';

export class AuthController {
	async login(req: Request, res: Response) {
		const { error, value } = loginSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try {
			const result = await authService.login(value.username, value.password);
			return res.json(result);
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	async me(req: AuthRequest, res: Response) {
		const user = await prisma.user.findUnique({ where: { id: String(req.user!._id) } });
		if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
		const { password_hash, ...safe } = user as any;
		return res.json(safe);
	}

	async updateMe(req: AuthRequest, res: Response) {
		const { error, value } = updateProfileSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		const allowed: any = {};
		if (value.full_name) allowed.full_name = value.full_name;
		if (value.phone) allowed.phone = value.phone;
		if (value.address) allowed.address = value.address;
		const updated = await prisma.user.update({ where: { id: String(req.user!._id) }, data: allowed });
		await audit(req.user!._id, 'ACCOUNT_UPDATED', 'USER', req.user!._id);
		const { password_hash: _, ...safe } = updated as any;
		return res.json(safe);
	}

	async changePassword(req: AuthRequest, res: Response) {
		const { error, value } = changePasswordSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try {
			await authService.changePassword(req.user!._id, value.old, value.new, value.confirm);
			return res.json({ success: true });
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	async acceptInvite(req: Request, res: Response) {
		const { error, value } = acceptInviteSchema.validate(req.body);
		if (error) return res.status(400).json({ message: error.message });
		try {
			await authService.acceptInvite(value.token, value.password, value.confirm);
			return res.json({ success: true });
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	// Chặn đăng ký trực tiếp (không theo đặc tả). Luồng cho phép là accept-invite.
	async registerDirect(_req: Request, res: Response) {
		return res.status(403).json({ message: 'Đăng ký trực tiếp không được phép. Vui lòng dùng link mời (accept-invite).' });
	}

  async refresh(req: Request, res: Response) {
    try {
      const { user_id, refresh_token } = req.body || {};
      const data = await authService.refresh(String(user_id), String(refresh_token));
      return res.json(data);
    } catch (e: any) {
      return res.status(401).json({ message: e.message });
    }
  }
}

export default new AuthController();
