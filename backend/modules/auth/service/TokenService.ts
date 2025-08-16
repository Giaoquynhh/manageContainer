import { prisma } from '../../../shared/config/database';
import crypto from 'crypto';

function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}

export class TokenService {
	async issueRefresh(userId: string, ttlMs: number) {
		const token = crypto.randomBytes(32).toString('hex');
		const token_hash = hashToken(token);
		const expires_at = new Date(Date.now() + ttlMs);
		await prisma.refreshToken.create({ data: { user_id: userId, token_hash, expires_at } });
		return token;
	}

	async rotateRefresh(userId: string, oldToken: string | null, ttlMs: number) {
		if (oldToken) {
			await prisma.refreshToken.updateMany({ where: { user_id: userId, token_hash: hashToken(oldToken), revoked_at: null }, data: { revoked_at: new Date() } });
		}
		return this.issueRefresh(userId, ttlMs);
	}

	async revokeRefresh(userId: string, token: string) {
		await prisma.refreshToken.updateMany({ where: { user_id: userId, token_hash: hashToken(token), revoked_at: null }, data: { revoked_at: new Date() } });
	}

	async revokeAll(userId: string) {
		await prisma.refreshToken.updateMany({ where: { user_id: userId, revoked_at: null }, data: { revoked_at: new Date() } });
	}

	async verifyRefresh(userId: string, token: string) {
		const row = await prisma.refreshToken.findFirst({ where: { user_id: userId, token_hash: hashToken(token), revoked_at: null } });
		if (!row || row.expires_at < new Date()) return null;
		return row;
	}
}

export default new TokenService();
