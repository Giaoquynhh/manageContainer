import { api } from './api';

export type InvoiceItemInput = {
  service_code: string;
  description: string;
  qty: number;
  unit_price: number;
  tax_code?: string;
  tax_rate?: number;
};

export const financeApi = {
  // Catalog
  async listServices() {
    const { data } = await api.get('/finance/services');
    return data as Array<{ code: string; name: string; default_description?: string; default_unit_price?: number; tax_rate?: number }>;
  },
  // Invoices
  async listInvoices(params?: any) {
    const { data } = await api.get('/finance/invoices', { params });
    return data as any[];
  },
  async createInvoice(payload: { customer_id: string; currency?: string; issue_date?: string; due_date?: string; notes?: string; items: InvoiceItemInput[] }) {
    const { data } = await api.post('/finance/invoices', payload);
    return data;
  },
  async issueInvoice(id: string, payload: { issue_date: string; due_date: string }) {
    const { data } = await api.post(`/finance/invoices/${id}/issue`, payload);
    return data;
  },
  async getInvoice(id: string) {
    const { data } = await api.get(`/finance/invoices/${id}`);
    return data;
  },
  async patchInvoice(id: string, payload: { due_date?: string; notes?: string }) {
    const { data } = await api.patch(`/finance/invoices/${id}`, payload);
    return data;
  },
  async cancelInvoice(id: string) {
    const { data } = await api.post(`/finance/invoices/${id}/cancel`, {});
    return data;
  },
  // Payments
  async listPayments(params?: any) {
    const { data } = await api.get('/finance/payments', { params });
    return data as any[];
  },
  async createPayment(payload: any, idempotencyKey?: string) {
    const { data } = await api.post('/finance/payments', payload, { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {} });
    return data;
  }
};



