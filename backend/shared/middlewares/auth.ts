import { Request, Response, NextFunction } from 'express';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { appConfig } from '../config/database';

export type AppRole =
  | 'SystemAdmin'
  | 'BusinessAdmin'
  | 'HRManager'
  | 'SaleAdmin'
  | 'CustomerAdmin'
  | 'CustomerUser'
  | 'PartnerAdmin'
  | 'Security'
  | 'YardManager'
  | 'MaintenanceManager'
  | 'Accountant';

export interface AuthUser {
	_id: string;
	email: string;
	role: AppRole;
	tenant_id?: string | null;
	partner_id?: string | null;
	status: 'INVITED' | 'ACTIVE' | 'DISABLED' | 'LOCKED';
}

export interface AuthRequest extends Request {
	user?: AuthUser;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : '';
	if (!token) return res.status(401).json({ message: 'Unauthorized' });
	try {
		const decoded = jwt.verify(token, appConfig.jwtSecret as Secret) as AuthUser;
		req.user = decoded;
		if (decoded.status === 'DISABLED') return res.status(403).json({ message: 'Account disabled' });
		if (decoded.status === 'LOCKED') return res.status(403).json({ message: 'Account locked' });
		return next();
	} catch (e) {
		return res.status(401).json({ message: 'Invalid token' });
	}
};

export const signToken = (payload: AuthUser): string => {
	const options: SignOptions = { expiresIn: appConfig.jwtExpiresIn as unknown as any };
	return jwt.sign(payload as unknown as object, appConfig.jwtSecret as Secret, options);
};
