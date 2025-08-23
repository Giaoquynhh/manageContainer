import axios, { AxiosHeaders } from 'axios';

export const api = axios.create({ baseURL: '/backend' });

export async function feLog(message: string, meta?: any){
	try{
		await fetch('/api/fe-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, meta, at: new Date().toISOString() }) });
	}catch{}
}

api.interceptors.request.use((config)=>{
	if (typeof window !== 'undefined'){
		const token = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null)
			|| localStorage.getItem('token');
		if (token) {
			const h: any = config.headers;
			if (h && typeof h.set === 'function') {
				h.set('Authorization', `Bearer ${token}`);
			} else {
				const headers = new AxiosHeaders(config.headers as any);
				headers.set('Authorization', `Bearer ${token}`);
				config.headers = headers as any;
			}
		}
	}
	return config;
});

let isRefreshing = false;
let pending: Array<(t: string)=>void> = [];

api.interceptors.response.use(r => r, async (error) => {
	const status = error?.response?.status;
	if (status === 401 && !isRefreshing) {
		try{
			isRefreshing = true;
			const refresh_token = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('refresh_token') : null)
				|| localStorage.getItem('refresh_token');
			const user_id = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('user_id') : null)
				|| localStorage.getItem('user_id');
			if (refresh_token && user_id) {
				const resp = await axios.post('/backend/auth/refresh', { user_id, refresh_token });
				const useSession = typeof sessionStorage !== 'undefined' && (
					!!sessionStorage.getItem('token') || !!sessionStorage.getItem('refresh_token')
				);
				if (useSession) {
					try {
						sessionStorage.setItem('token', resp.data.access_token);
						sessionStorage.setItem('refresh_token', resp.data.refresh_token);
						localStorage.removeItem('token');
						localStorage.removeItem('refresh_token');
					} catch {}
				} else {
					localStorage.setItem('token', resp.data.access_token);
					localStorage.setItem('refresh_token', resp.data.refresh_token);
					try {
						sessionStorage.removeItem('token');
						sessionStorage.removeItem('refresh_token');
					} catch {}
				}
				pending.forEach(fn => fn(resp.data.access_token));
				pending = [];
				isRefreshing = false;
				const cfg = error.config;
				{
					const h: any = cfg.headers;
					if (h && typeof h.set === 'function') {
						h.set('Authorization', `Bearer ${resp.data.access_token}`);
					} else {
						const headers = new AxiosHeaders(cfg.headers as any);
						headers.set('Authorization', `Bearer ${resp.data.access_token}`);
						cfg.headers = headers as any;
					}
				}
				return axios(cfg);
			}
		}catch(e){
			isRefreshing = false;
		}
	}
	if (status === 401 && isRefreshing) {
		return new Promise((resolve) => {
			pending.push((t: string)=>{
				const cfg = error.config;
				{
					const h: any = cfg.headers;
					if (h && typeof h.set === 'function') {
						h.set('Authorization', `Bearer ${t}`);
					} else {
						const headers = new AxiosHeaders(cfg.headers as any);
						headers.set('Authorization', `Bearer ${t}`);
						cfg.headers = headers as any;
					}
				}
				resolve(axios(cfg));
			});
		});
	}
	try{ await feLog('API_ERROR', { url: error?.config?.url, status: error?.response?.status, data: error?.response?.data }); }catch{}
	return Promise.reject(error);
});