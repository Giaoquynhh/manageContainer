import { api } from './api';

export const yardApi = {
  async map() {
    const { data } = await api.get('/yard/map');
    return data;
  },
  async locate(containerNo: string) {
    const { data } = await api.get(`/yard/container/${encodeURIComponent(containerNo)}`);
    return data;
  },
  async suggest(containerNo: string) {
    const { data } = await api.get('/yard/suggest-position', { params: { container_no: containerNo } });
    return data as Array<{ slot: any; score: number }>;
  },
  async assign(containerNo: string, slotId: string) {
    const { data } = await api.patch('/yard/assign-position', { container_no: containerNo, slot_id: slotId });
    return data;
  }
};


