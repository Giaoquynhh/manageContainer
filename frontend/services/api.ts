import axios from 'axios';

export const api = axios.create({ baseURL: 'http://localhost:1000' });

export async function feLog(message: string, meta?: any){
	try{
		await fetch('/api/fe-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, meta, at: new Date().toISOString() }) });
	}catch{}
}

api.interceptors.request.use((config)=>{
	if (typeof window !== 'undefined'){
		const token = localStorage.getItem('token');
		if (token) config.headers = { ...(config.headers||{}), Authorization: `Bearer ${token}` };
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
			const refresh_token = localStorage.getItem('refresh_token');
			const user_id = localStorage.getItem('user_id');
			if (refresh_token && user_id) {
				const resp = await axios.post('http://localhost:1000/auth/refresh', { user_id, refresh_token });
				localStorage.setItem('token', resp.data.access_token);
				localStorage.setItem('refresh_token', resp.data.refresh_token);
				pending.forEach(fn => fn(resp.data.access_token));
				pending = [];
				isRefreshing = false;
				const cfg = error.config;
				cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${resp.data.access_token}` };
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
				cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${t}` };
				resolve(axios(cfg));
			});
		});
	}
	try{ await feLog('API_ERROR', { url: error?.config?.url, status: error?.response?.status, data: error?.response?.data }); }catch{}
	return Promise.reject(error);
});
