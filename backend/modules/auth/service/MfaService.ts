import crypto from 'crypto';
import { prisma } from '../../../shared/config/database';

export class MfaService {
	generateBase32Secret(): string {
		return crypto.randomBytes(20).toString('hex');
	}

	async setupTotp(userId: string) {
		const secret = this.generateBase32Secret();
		await prisma.mfaSecret.create({ data: { user_id: userId, type: 'TOTP', secret } });
		return { secret, otpauth: `otpauth://totp/Smartlog:${userId}?secret=${secret}&issuer=Smartlog` };
	}

	// Placeholder for TOTP verify (should use a lib like speakeasy in production)
	async verifyTotp(userId: string, code: string): Promise<boolean> {
		const last = await prisma.mfaSecret.findFirst({ where: { user_id: userId, type: 'TOTP' }, orderBy: { created_at: 'desc' } });
		if (!last) return false;
		// NOTE: For real use, replace with time-based OTP verification
		return Boolean(code && code.length >= 6);
	}
}

export default new MfaService();
