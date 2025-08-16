export const validatePasswordStrength = (password: string): { ok: boolean; message?: string } => {
	if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters' };
	if (!/[A-Z]/.test(password)) return { ok: false, message: 'Password must include an uppercase letter' };
	if (!/[a-z]/.test(password)) return { ok: false, message: 'Password must include a lowercase letter' };
	if (!/[0-9]/.test(password)) return { ok: false, message: 'Password must include a digit' };
	if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return { ok: false, message: 'Password must include a symbol' };
	return { ok: true };
};
