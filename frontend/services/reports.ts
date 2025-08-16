import { api } from './api';

export type ReportFilters = { from?: string; to?: string; customer_id?: string };

export const reportsApi = {
  async getDashboard(filters?: ReportFilters){
    const { data } = await api.get('/reports/dashboard', { params: filters });
    return data as any;
  },
  async preview(type: string, filters?: ReportFilters){
    const { data } = await api.post('/reports/custom/preview', { type, filters: filters || {} });
    return data as any;
  },
  async exportFile(type: string, format: 'csv'|'pdf', filename: string, filters?: ReportFilters){
    const resp = await api.post('/reports/export', { type, format, filename, filters: filters || {} }, { responseType: 'blob' });
    return resp.data as Blob;
  }
  ,async listContainers(params: { q?: string; status?: string; page?: number; pageSize?: number }){
    const { data } = await api.get('/reports/containers', { params });
    return data as { items: any[]; total: number; page: number; pageSize: number };
  }
};


