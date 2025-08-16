import { api } from './api';

export const maintenanceApi = {
  async listRepairs(status?: string){
    const { data } = await api.get('/maintenance/repairs', { params: status ? { status } : {} });
    return data as any[];
  },
  async listEquipments(){
    const { data } = await api.get('/maintenance/equipments');
    return data as any[];
  },
  async createRepair(payload: any){
    const { data } = await api.post('/maintenance/repairs', payload);
    return data;
  },
  async approveRepair(id: string){
    const { data } = await api.post(`/maintenance/repairs/${id}/approve`, {});
    return data;
  },
  async rejectRepair(id: string, reason?: string){
    const { data } = await api.post(`/maintenance/repairs/${id}/reject`, { reason });
    return data;
  },
  async listInventory(params?: { q?: string; low?: boolean }){
    const { data } = await api.get('/maintenance/inventory/items', { params });
    return data as any[];
  },
  async updateInventory(id: string, payload: any){
    const { data } = await api.put(`/maintenance/inventory/items/${id}`, payload);
    return data;
  }
};


