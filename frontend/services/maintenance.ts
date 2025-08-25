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
  async updateRepairStatus(id: string, status: string, manager_comment?: string){
    const { data } = await api.patch(`/maintenance/repairs/${id}/status`, { status, manager_comment });
    return data;
  },
  async completeRepairCheck(id: string, result: 'PASS' | 'FAIL', manager_comment?: string){
    const { data } = await api.post(`/maintenance/repairs/${id}/complete-check`, { result, manager_comment });
    return data;
  },
  async listInventory(params?: { q?: string; low?: boolean }){
    const { data } = await api.get('/maintenance/inventory/items', { params });
    return data as any[];
  },
  async updateInventory(id: string, payload: any){
    const { data } = await api.put(`/maintenance/inventory/items/${id}`, payload);
    return data;
  },
  async createInventory(payload: any){
    const { data } = await api.post('/maintenance/inventory/items', payload);
    return data;
  },

  async createRepairInvoice(repairTicketId: string, payload: any){
    const { data } = await api.post(`/maintenance/repairs/${repairTicketId}/invoice`, payload);
    return data;
  },

  async getRepairInvoice(repairTicketId: string){
    const { data } = await api.get(`/maintenance/repairs/${repairTicketId}/invoice`);
    return data;
  },

  async uploadRepairInvoicePDF(repairTicketId: string, pdfBase64: string, fileName: string) {
    const response = await api.post(`/maintenance/repairs/${repairTicketId}/pdf`, {
      pdfBase64,
      fileName
    });
    return response.data;
  },

  async checkRepairInvoice(repairTicketId: string) {
    try {
      const { data } = await api.get(`/maintenance/repairs/${repairTicketId}/invoice`);
      // Bây giờ 'data' sẽ chứa trường 'pdfExists' từ backend
      return { hasInvoice: data.pdfExists, invoice: data }; // Chỉ có hóa đơn nếu file PDF tồn tại
    } catch (error) {
      return { hasInvoice: false, invoice: null };
    }
  },

  async downloadRepairInvoicePDF(repairTicketId: string) {
    const response = await api.get(`/maintenance/repairs/${repairTicketId}/invoice/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};


