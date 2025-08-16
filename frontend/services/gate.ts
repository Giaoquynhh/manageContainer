import { api } from './api';

export function getGateDeviceId(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('gate_device_id');
}

export function setGateDeviceId(id: string) {
	if (typeof window === 'undefined') return;
	localStorage.setItem('gate_device_id', id);
}

function gateHeaders() {
	const deviceId = getGateDeviceId();
	return {
		'x-device-type': 'gate',
		...(deviceId ? { 'x-device-id': deviceId } : {})
	};
}

export const gateApi = {
	async lookup(code: string) {
		const { data } = await api.get('/gate/lookup', { params: { code }, headers: gateHeaders() });
		return data as any;
	},
	async checkin(request_id: string, plate_no: string) {
		const { data } = await api.post('/gate/checkin', { request_id, plate_no }, { headers: gateHeaders() });
		return data as any;
	},
	async checkout(request_id: string, supervisor_pin?: string) {
		const { data } = await api.post('/gate/checkout', { request_id, supervisor_pin }, { headers: gateHeaders() });
		return data as any;
	},
	async print(request_id: string, type: 'IN'|'OUT') {
		const { data } = await api.post('/gate/print', { request_id, type }, { headers: gateHeaders() });
		return data as any;
	}
};


