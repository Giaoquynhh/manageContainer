import { api } from './api';

export const authApi = {
	async login(username: string, password: string) {
		const { data } = await api.post('/auth/login', { username, password });
		return data as { access_token: string; refresh_token: string; user: any };
	},
	async refresh(userId: string, refresh_token: string) {
		const { data } = await api.post('/auth/refresh', { user_id: userId, refresh_token });
		return data as { access_token: string; refresh_token: string };
	},
	async me() {
		const { data } = await api.get('/auth/me');
		return data;
	},
	async updateMe(payload: any) {
		const { data } = await api.patch('/auth/me', payload);
		return data;
	},
	async changePassword(payload: { old: string; new: string; confirm: string }) {
		const { data } = await api.post('/auth/me/change-password', payload);
		return data;
	}
};
