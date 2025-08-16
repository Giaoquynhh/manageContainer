import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';

// Simple gate-mode middleware using headers: x-device-type, x-device-id
export const gateMode = (req: AuthRequest, res: Response, next: NextFunction) => {
	const user = req.user!;
	const deviceType = String(req.headers['x-device-type'] || '');
	const deviceId = String(req.headers['x-device-id'] || '');
	const deviceTrusted = process.env.GATE_DEVICE_IDS ? process.env.GATE_DEVICE_IDS.split(',').includes(deviceId) : false;
	const isGateDevice = deviceType === 'gate' && deviceTrusted;
	const isAllowed = (user.role === 'SaleAdmin' && isGateDevice) || user.role === 'SystemAdmin';
	if (!isAllowed) return res.status(403).json({ message: 'Thiết bị không được phép dùng Gate Mode' });
	return next();
};


