import React, { useState, useEffect } from 'react';
import { maintenanceApi } from '@services/maintenance';

interface RepairInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairTicket: any;
  onSuccess: () => void;
}

interface InventoryItem {
  id: string;
  name: string;
  uom: string;
  unit_price: number;
  qty_on_hand: number;
}

interface SelectedPart {
  inventory_item_id: string;
  quantity: number;
}

export default function RepairInvoiceModal({ isOpen, onClose, repairTicket, onSuccess }: RepairInvoiceModalProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [laborCost, setLaborCost] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadInventoryItems();
    }
  }, [isOpen]);

  const loadInventoryItems = async () => {
    try {
      const items = await maintenanceApi.listInventory();
      setInventoryItems(items);
    } catch (error: any) {
      setMessage('Lỗi tải danh sách phụ tùng: ' + error.message);
    }
  };

  const addPart = () => {
    setSelectedParts([...selectedParts, { inventory_item_id: '', quantity: 0 }]);
  };

  const removePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: keyof SelectedPart, value: any) => {
    const newParts = [...selectedParts];
    newParts[index] = { ...newParts[index], [field]: value };
    setSelectedParts(newParts);
  };

  const calculatePartsCost = () => {
    return selectedParts.reduce((total, part) => {
      const item = inventoryItems.find(i => i.id === part.inventory_item_id);
      return total + (item ? item.unit_price * part.quantity : 0);
    }, 0);
  };

  const calculateTotalCost = () => {
    return calculatePartsCost() + (Number(laborCost) || 0);
  };

  const handleSubmit = async () => {
    if (selectedParts.length === 0) {
      setMessage('Vui lòng chọn ít nhất một phụ tùng');
      return;
    }

    // Kiểm tra tất cả phụ tùng đều có số lượng > 0
    for (const part of selectedParts) {
      if (part.quantity <= 0) {
        setMessage('Số lượng phụ tùng phải lớn hơn 0');
        return;
      }
    }

    if (Number(laborCost) < 0) {
      setMessage('Chi phí công sửa chữa không được âm');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const payload = {
        repair_ticket_id: repairTicket.id,
        labor_cost: Number(laborCost) || 0,
        selected_parts: selectedParts
      };

      await maintenanceApi.createRepairInvoice(repairTicket.id, payload);
      setMessage('Đã tạo hóa đơn sửa chữa thành công');
      onSuccess();
      onClose();
    } catch (error: any) {
      setMessage('Lỗi tạo hóa đơn: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>Hóa đơn Sửa chữa</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Thông tin phiếu */}
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#374151' }}>Thông tin phiếu</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>Mã phiếu</label>
                <div style={{ fontWeight: 'bold' }}>{repairTicket.code}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>Mã container</label>
                <div>{repairTicket.container_no || 'N/A'}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>Thời gian tạo</label>
                <div>{new Date(repairTicket.createdAt).toLocaleString('vi-VN')}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>Mô tả lỗi</label>
                <div>{repairTicket.problem_description}</div>
              </div>
            </div>
          </div>

                     {/* Chi phí công sửa chữa */}
           <div style={{ marginBottom: '20px' }}>
             <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
               Chi phí công sửa chữa (VND)
             </label>
             <input
               type="text"
               value={laborCost}
               onChange={(e) => {
                 const value = e.target.value;
                 if (value === '' || /^\d+$/.test(value)) {
                   setLaborCost(value);
                 }
               }}
               style={{
                 width: '100%',
                 padding: '12px',
                 border: '1px solid #d1d5db',
                 borderRadius: '6px',
                 fontSize: '16px'
               }}
               placeholder="Nhập chi phí công sửa chữa (số nguyên)"
             />
           </div>

          {/* Danh sách phụ tùng */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontWeight: 'bold' }}>Phụ tùng sử dụng</label>
              <button
                onClick={addPart}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                + Thêm phụ tùng
              </button>
            </div>

            {selectedParts.map((part, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: '12px',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                marginBottom: '8px'
              }}>
                <select
                  value={part.inventory_item_id}
                  onChange={(e) => updatePart(index, 'inventory_item_id', e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Chọn phụ tùng</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.uom}) - {item.unit_price.toLocaleString('vi-VN')} VND
                    </option>
                  ))}
                </select>

                                 <input
                   type="text"
                   value={part.quantity}
                   onChange={(e) => {
                     const value = e.target.value;
                     if (value === '' || /^\d+$/.test(value)) {
                       updatePart(index, 'quantity', Number(value) || 0);
                     }
                   }}
                   style={{
                     padding: '8px',
                     border: '1px solid #d1d5db',
                     borderRadius: '4px'
                   }}
                   placeholder="Số lượng"
                 />

                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {(() => {
                    const item = inventoryItems.find(i => i.id === part.inventory_item_id);
                    return item ? `${(item.unit_price * part.quantity).toLocaleString('vi-VN')} VND` : '0 VND';
                  })()}
                </div>

                <button
                  onClick={() => removePart(index)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>

                     {/* Table phụ tùng đã sử dụng */}
           {selectedParts.length > 0 && (
             <div style={{ marginBottom: '20px' }}>
               <h3 style={{ margin: '0 0 12px 0', color: '#374151' }}>Phụ tùng đã sử dụng</h3>
               <div style={{
                 border: '1px solid #e5e7eb',
                 borderRadius: '8px',
                 overflow: 'hidden'
               }}>
                 <table style={{
                   width: '100%',
                   borderCollapse: 'collapse',
                   fontSize: '14px'
                 }}>
                   <thead>
                     <tr style={{
                       backgroundColor: '#f9fafb',
                       borderBottom: '1px solid #e5e7eb'
                     }}>
                       <th style={{
                         padding: '12px',
                         textAlign: 'left',
                         fontWeight: 'bold',
                         color: '#374151',
                         borderRight: '1px solid #e5e7eb'
                       }}>
                         Tên phụ tùng
                       </th>
                       <th style={{
                         padding: '12px',
                         textAlign: 'center',
                         fontWeight: 'bold',
                         color: '#374151',
                         borderRight: '1px solid #e5e7eb'
                       }}>
                         Đơn giá (VND)
                       </th>
                       <th style={{
                         padding: '12px',
                         textAlign: 'center',
                         fontWeight: 'bold',
                         color: '#374151',
                         borderRight: '1px solid #e5e7eb'
                       }}>
                         Số lượng
                       </th>
                       <th style={{
                         padding: '12px',
                         textAlign: 'right',
                         fontWeight: 'bold',
                         color: '#374151'
                       }}>
                         Thành tiền (VND)
                       </th>
                     </tr>
                   </thead>
                   <tbody>
                     {selectedParts.map((part, index) => {
                       const item = inventoryItems.find(i => i.id === part.inventory_item_id);
                       if (!item) return null;
                       
                       return (
                         <tr key={index} style={{
                           borderBottom: '1px solid #f3f4f6'
                         }}>
                           <td style={{
                             padding: '12px',
                             borderRight: '1px solid #e5e7eb',
                             color: '#374151'
                           }}>
                             {item.name} ({item.uom})
                           </td>
                           <td style={{
                             padding: '12px',
                             textAlign: 'center',
                             borderRight: '1px solid #e5e7eb',
                             color: '#6b7280'
                           }}>
                             {item.unit_price.toLocaleString('vi-VN')}
                           </td>
                           <td style={{
                             padding: '12px',
                             textAlign: 'center',
                             borderRight: '1px solid #e5e7eb',
                             color: '#6b7280'
                           }}>
                             {part.quantity}
                           </td>
                           <td style={{
                             padding: '12px',
                             textAlign: 'right',
                             fontWeight: 'bold',
                             color: '#059669'
                           }}>
                             {(item.unit_price * part.quantity).toLocaleString('vi-VN')}
                           </td>
                         </tr>
                       );
                     })}
                     <tr style={{
                       backgroundColor: '#f0f9ff',
                       borderTop: '2px solid #1e40af'
                     }}>
                       <td colSpan={3} style={{
                         padding: '12px',
                         textAlign: 'right',
                         fontWeight: 'bold',
                         color: '#1e40af',
                         borderRight: '1px solid #e5e7eb'
                       }}>
                         Tổng chi phí phụ tùng:
                       </td>
                       <td style={{
                         padding: '12px',
                         textAlign: 'right',
                         fontWeight: 'bold',
                         fontSize: '16px',
                         color: '#1e40af'
                       }}>
                         {calculatePartsCost().toLocaleString('vi-VN')} VND
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {/* Tổng kết chi phí */}
           <div style={{
             padding: '16px',
             backgroundColor: '#f0f9ff',
             borderRadius: '8px',
             marginBottom: '20px'
           }}>
             <h3 style={{ margin: '0 0 12px 0', color: '#1e40af' }}>Tổng kết chi phí</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                 <span style={{ color: '#6b7280' }}>Chi phí phụ tùng:</span>
                 <span style={{ float: 'right', fontWeight: 'bold' }}>
                   {calculatePartsCost().toLocaleString('vi-VN')} VND
                 </span>
               </div>
               <div>
                 <span style={{ color: '#6b7280' }}>Chi phí công sửa chữa:</span>
                 <span style={{ float: 'right', fontWeight: 'bold' }}>
                   {(Number(laborCost) || 0).toLocaleString('vi-VN')} VND
                 </span>
               </div>
               <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #d1d5db', paddingTop: '8px', marginTop: '8px' }}>
                 <span style={{ color: '#1e40af', fontWeight: 'bold' }}>Tổng chi phí sửa chữa:</span>
                 <span style={{ float: 'right', fontWeight: 'bold', fontSize: '18px', color: '#1e40af' }}>
                   {calculateTotalCost().toLocaleString('vi-VN')} VND
                 </span>
               </div>
             </div>
           </div>

          {/* Thông báo */}
          {message && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '6px',
              backgroundColor: message.includes('thành công') ? '#d1fae5' : '#fee2e2',
              color: message.includes('thành công') ? '#065f46' : '#991b1b',
              border: `1px solid ${message.includes('thành công') ? '#a7f3d0' : '#fecaca'}`
            }}>
              {message}
            </div>
          )}

          {/* Nút hành động */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Đang xử lý...' : 'Tạo hóa đơn'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
