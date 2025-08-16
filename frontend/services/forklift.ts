import { api } from './api';

export const forkliftApi = {
  async list(status?: string) {
    const { data } = await api.get('/forklift/tasks', { params: { status } });
    return data as any[];
  },
  async assign(payload: { container_no: string; from_slot_id?: string; to_slot_id?: string; driver_id?: string; }) {
    const { data } = await api.post('/forklift/assign', payload);
    return data;
  },
  async updateStatus(id: string, status: string, reason?: string) {
    const { data } = await api.patch(`/forklift/task/${id}/status`, { status, reason });
    return data;
  }
};


