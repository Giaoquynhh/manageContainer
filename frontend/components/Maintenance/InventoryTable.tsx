import { useState } from 'react';

interface InventoryItem {
  id: number;
  name: string;
  unit_price: number;
  stock: number;
  unit: string;
}

interface InventoryTableProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  onAddItem: (item: InventoryItem, quantity: number) => void;
}

export default function InventoryTable({ isOpen, onClose, inventoryItems, onAddItem }: InventoryTableProps) {
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  const fmt = (n: any) => {
    const num = Number(n || 0);
    return num.toLocaleString('vi-VN');
  };

  const handleQuantityChange = (itemId: number, value: string) => {
    const quantity = Math.max(1, parseInt(value) || 1);
    setQuantities(prev => ({ ...prev, [itemId]: quantity }));
  };

  const handleAddItem = (item: InventoryItem) => {
    const quantity = quantities[item.id] || 1;
    onAddItem(item, quantity);
    // Reset quantity sau khi thêm
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
            Chọn Vật Tư Từ Kho
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Refresh dữ liệu từ server"
            >
              🔄 Refresh
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{
                background: '#f3f4f6',
                borderBottom: '2px solid #e5e7eb'
              }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  Tên Vật Tư
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  Đơn Giá
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  Tồn Kho
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  Số Lượng
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  Thành Tiền
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => {
                const quantity = quantities[item.id] || 1;
                const totalPrice = item.unit_price * quantity;
                
                return (
                  <tr key={item.id} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {fmt(item.unit_price)} đ/{item.unit}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: item.stock > 20 ? '#d1fae5' : '#fef3c7',
                        color: item.stock > 20 ? '#065f46' : '#92400e'
                      }}>
                        {item.stock} {item.unit}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        min="1"
                        max={item.stock}
                        style={{
                          width: '80px',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          textAlign: 'center'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                      {fmt(totalPrice)} đ
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleAddItem(item)}
                        disabled={quantity > item.stock}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          background: quantity > item.stock ? '#9ca3af' : '#059669',
                          color: 'white',
                          cursor: quantity > item.stock ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {quantity > item.stock ? 'Hết hàng' : 'Thêm'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
