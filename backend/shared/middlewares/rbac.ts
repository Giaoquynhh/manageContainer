import { Response, NextFunction } from 'express';
import { AuthRequest, AppRole } from './auth';

export const requireRoles = (...roles: AppRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
	next();
};

export const enforceTenantScope = (req: AuthRequest, res: Response, next: NextFunction) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	// Customer Admin/User must be scoped to their tenant on list/search
  if (['CustomerAdmin','CustomerUser'].includes(String(req.user.role))) {
    req.query.tenant_id = (req.user.tenant_id || undefined) as any;
  }
	next();
};

export const enforcePartnerScope = (req: AuthRequest, res: Response, next: NextFunction) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (['PartnerAdmin'].includes(String(req.user.role))) {
    req.query.partner_id = (req.user.partner_id || undefined) as any;
  }
	next();
};
