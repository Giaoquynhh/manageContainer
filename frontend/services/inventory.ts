import { api } from './api';

export const inventoryApi = {
  // Lấy danh sách inventory
  async getInventory() {
    const { data } = await api.get('/maintenance/inventory/items');
    return data;
  },

  // Lấy inventory theo ID
  async getInventoryById(id: string) {
    const { data } = await api.get(`/maintenance/inventory/items/${id}`);
    return data;
  },

  // Tìm kiếm inventory
  async searchInventory(query: string) {
    const { data } = await api.get('/maintenance/inventory/items', { 
      params: { q: query } 
    });
    return data;
  },

  // Lấy inventory có low stock
  async getLowStockInventory() {
    const { data } = await api.get('/maintenance/inventory/items', { 
      params: { low: true } 
    });
    return data;
  }
};
