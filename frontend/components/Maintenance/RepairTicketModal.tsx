import { useState, useEffect } from 'react';
import InventoryTable from './InventoryTable';
import { maintenanceApi } from '@services/maintenance';

interface RepairTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairTicket: any;
  containerInfo: any;
}

export default function RepairTicketModal({ isOpen, onClose, repairTicket, containerInfo }: RepairTicketModalProps) {
  console.log('RepairTicketModal render:', { isOpen, repairTicket, containerInfo }); // Debug log
  
  if (!isOpen) {
    console.log('Modal not open, returning null'); // Debug log
    return null;
  }

  const fmt = (n: any) => {
    const num = Number(n || 0);
    return num.toLocaleString('vi-VN');
  };

  // State để quản lý việc chỉnh sửa
  const [editedDescription, setEditedDescription] = useState(repairTicket?.problem_description || '');
  const [isEditing, setIsEditing] = useState(false);
  
  // State để quản lý vật tư
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [showInventoryTable, setShowInventoryTable] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // Cập nhật description khi repairTicket thay đổi
  useEffect(() => {
    setEditedDescription(repairTicket?.problem_description || '');
  }, [repairTicket]);

  // Lấy dữ liệu thật từ inventory API
  useEffect(() => {
    fetchInventory();
  }, []);

  // Không cần auto-refresh mỗi 5 giây vì có thể gây conflict
  // Chỉ refresh khi cần thiết

  // Function để fetch inventory - có thể gọi lại khi cần refresh
  const fetchInventory = async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    
    try {
      // Gọi API để lấy inventory thật - sử dụng cùng API với trang Inventory
      const response = await maintenanceApi.listInventory();
      console.log('Inventory API response:', response);
      
      // Chuyển đổi dữ liệu từ backend format sang frontend format
      const formattedItems = response.map((item: any) => {
        // Debug từng item để xem field nào có giá trị
        console.log('Processing item:', item.name, {
          unit_price: item.unit_price,
          price: item.price,
          unitPrice: item.unitPrice,
          qty_on_hand: item.qty_on_hand,
          stock: item.stock,
          uom: item.uom,
          unit: item.unit
        });
        
        return {
          id: item.id,
          name: item.name,
          unit_price: Number(item.unit_price || 0), // Sử dụng unit_price từ database
          stock: Number(item.qty_on_hand || item.stock || 0),
          unit: item.uom || item.unit || 'pcs'
        };
      });
      
      console.log('Formatted inventory items:', formattedItems);
      setInventoryItems(formattedItems);
      
      // Lưu vào localStorage để cache
      localStorage.setItem('inventory_items', JSON.stringify(formattedItems));
      
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryError('Không thể tải dữ liệu inventory');
      
      // Fallback: sử dụng dữ liệu từ localStorage nếu có
      const savedInventory = localStorage.getItem('inventory_items');
      if (savedInventory) {
        setInventoryItems(JSON.parse(savedInventory));
      } else {
        // Fallback cuối cùng: dữ liệu mẫu dựa trên inventory thực tế
        setInventoryItems([
          { id: 1, name: 'Đinh tán', unit_price: 0, stock: 1000, unit: 'pcs' },
          { id: 2, name: 'Ron cao su', unit_price: 0, stock: 500, unit: 'pcs' },
          { id: 3, name: 'Sơn chống rỉ', unit_price: 0, stock: 50, unit: 'lit' }
        ]);
      }
    } finally {
      setInventoryLoading(false);
    }
  };

  // Thêm vật tư vào danh sách
  const addInventoryItem = (item: any, quantity: number) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    
    if (existingItem) {
      // Cập nhật số lượng nếu đã có
      setSelectedItems(prev => prev.map(selected => 
        selected.id === item.id 
          ? { ...selected, quantity: selected.quantity + quantity }
          : selected
      ));
    } else {
      // Thêm mới
      setSelectedItems(prev => [...prev, {
        ...item,
        quantity,
        total_price: item.unit_price * quantity
      }]);
    }
    
    setShowInventoryTable(false);
  };

  // Cập nhật số lượng vật tư
  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Xóa vật tư nếu số lượng = 0
      setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setSelectedItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity, total_price: item.unit_price * newQuantity }
          : item
      ));
    }
  };

  // Tính tổng chi phí
  const totalCost = selectedItems.reduce((sum, item) => sum + item.total_price, 0);

  // Debug function để kiểm tra dữ liệu
  const debugInventoryData = () => {
    console.log('=== DEBUG INVENTORY DATA ===');
    console.log('Current inventoryItems:', inventoryItems);
    console.log('LocalStorage data:', localStorage.getItem('inventory_items'));
    console.log('Selected items:', selectedItems);
    console.log('=======================');
  };

  const handleSaveDescription = async () => {
    try {
      // TODO: Gọi API để lưu mô tả mới
      console.log('Saving new description:', editedDescription);
      setIsEditing(false);
      // Có thể thêm thông báo thành công
    } catch (error) {
      console.error('Error saving description:', error);
      // Có thể thêm thông báo lỗi
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '20px', fontWeight: '600' }}>
            Phiếu Sửa Chữa Container
          </h2>
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

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Thông tin container */}
          <div style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '16px', fontWeight: '500' }}>
              Thông Tin Container
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Container No:</span>
                <span style={{ marginLeft: '8px', color: '#1f2937' }}>{containerInfo?.container_no || '-'}</span>
              </div>
              <div>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Tài xế:</span>
                <span style={{ marginLeft: '8px', color: '#1f2937' }}>{containerInfo?.driver_name || '-'}</span>
              </div>
              <div>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Biển số:</span>
                <span style={{ marginLeft: '8px', color: '#1f2937' }}>{containerInfo?.license_plate || '-'}</span>
              </div>
              <div>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Trạng thái:</span>
                <span style={{ 
                  marginLeft: '8px', 
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: '#fef3c7',
                  color: '#92400e'
                }}>
                  Đang sửa chữa
                </span>
              </div>
            </div>
          </div>

          {/* Thông tin phiếu sửa chữa */}
          <div style={{
            background: '#f0f9ff',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #bae6fd'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0c4a6e', fontSize: '16px', fontWeight: '500' }}>
              Thông Tin Phiếu Sửa Chữa
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontWeight: '500', color: '#0369a1' }}>Mã phiếu:</span>
                <span style={{ marginLeft: '8px', color: '#0c4a6e', fontFamily: 'monospace' }}>
                  {repairTicket?.code || '-'}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '500', color: '#0369a1' }}>Ngày tạo:</span>
                <span style={{ marginLeft: '8px', color: '#0c4a6e' }}>
                  {repairTicket?.createdAt ? new Date(repairTicket.createdAt).toLocaleDateString('vi-VN') : '-'}
                </span>
              </div>
                             <div style={{ gridColumn: '1 / -1' }}>
                 <div style={{ 
                   display: 'flex', 
                   justifyContent: 'space-between', 
                   alignItems: 'center',
                   marginBottom: '4px'
                 }}>
                   <span style={{ fontWeight: '500', color: '#0369a1' }}>Mô tả vấn đề:</span>
                   {!isEditing ? (
                     <button
                       onClick={() => setIsEditing(true)}
                       style={{
                         padding: '4px 8px',
                         border: '1px solid #0369a1',
                         borderRadius: '4px',
                         background: 'white',
                         color: '#0369a1',
                         cursor: 'pointer',
                         fontSize: '12px'
                       }}
                     >
                       ✏️ Chỉnh sửa
                     </button>
                   ) : (
                     <div style={{ display: 'flex', gap: '4px' }}>
                       <button
                         onClick={handleSaveDescription}
                         style={{
                           padding: '4px 8px',
                           border: 'none',
                           borderRadius: '4px',
                           background: '#059669',
                           color: 'white',
                           cursor: 'pointer',
                           fontSize: '12px'
                         }}
                       >
                         💾 Lưu
                       </button>
                       <button
                         onClick={() => {
                           setEditedDescription(repairTicket?.problem_description || '');
                           setIsEditing(false);
                         }}
                         style={{
                           padding: '4px 8px',
                           border: '1px solid #dc2626',
                           borderRadius: '4px',
                           background: 'white',
                           color: '#dc2626',
                           cursor: 'pointer',
                           fontSize: '12px'
                         }}
                       >
                         ❌ Hủy
                       </button>
                     </div>
                   )}
                 </div>
                 
                 {isEditing ? (
                   <textarea
                     value={editedDescription}
                     onChange={(e) => setEditedDescription(e.target.value)}
                     style={{ 
                       marginTop: '4px', 
                       padding: '8px 12px',
                       background: 'white',
                       borderRadius: '4px',
                       border: '2px solid #059669',
                       color: '#0c4a6e',
                       width: '100%',
                       minHeight: '80px',
                       resize: 'vertical',
                       fontFamily: 'inherit',
                       fontSize: '14px'
                     }}
                     placeholder="Nhập mô tả vấn đề cần sửa chữa..."
                   />
                 ) : (
                   <div style={{ 
                     marginTop: '4px', 
                     padding: '8px 12px',
                     background: 'white',
                     borderRadius: '4px',
                     border: '1px solid #bae6fd',
                     color: '#0c4a6e',
                     minHeight: '80px',
                     lineHeight: '1.5'
                   }}>
                     {editedDescription || 'Container cần sửa chữa sau khi kiểm tra'}
                   </div>
                 )}
               </div>
                             <div>
                 <span style={{ fontWeight: '500', color: '#0369a1' }}>Chi phí dự kiến:</span>
                 <span style={{ marginLeft: '8px', color: '#0c4a6e', fontWeight: '600' }}>
                   {fmt(totalCost)} đ
                 </span>
                 {selectedItems.length > 0 && (
                   <span style={{ 
                     marginLeft: '8px', 
                     fontSize: '12px', 
                     color: '#059669',
                     fontStyle: 'italic'
                   }}>
                     (Tự động tính từ vật tư)
                   </span>
                 )}
               </div>
              <div>
                <span style={{ fontWeight: '500', color: '#0369a1' }}>Ghi chú:</span>
                <span style={{ marginLeft: '8px', color: '#0c4a6e' }}>
                  {repairTicket?.manager_comment || 'Container cần sửa chữa sau khi kiểm tra'}
                </span>
              </div>
            </div>
          </div>

                     {/* Danh sách vật tư */}
           <div style={{
             background: '#fefce8',
             padding: '16px',
             borderRadius: '6px',
             border: '1px solid #fde047'
           }}>
             <div style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               marginBottom: '12px'
             }}>
               <h3 style={{ margin: 0, color: '#92400e', fontSize: '16px', fontWeight: '500' }}>
                 Danh Sách Vật Tư Cần Dùng
               </h3>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        fetchInventory(); // Refresh dữ liệu trước khi mở modal
                        setShowInventoryTable(true);
                      }}
                      disabled={inventoryLoading}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #f59e0b',
                        borderRadius: '4px',
                        background: inventoryLoading ? '#f3f4f6' : '#fef3c7',
                        color: inventoryLoading ? '#9ca3af' : '#92400e',
                        cursor: inventoryLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {inventoryLoading ? '⏳ Đang tải...' : '➕ Thêm Vật Tư'}
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log('Force refreshing inventory data...');
                        fetchInventory();
                      }}
                      disabled={inventoryLoading}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        background: 'white',
                        color: '#374151',
                        cursor: inventoryLoading ? 'not-allowed' : 'pointer',
                        fontSize: '10px'
                      }}
                      title="Cập nhật dữ liệu từ trang Inventory"
                    >
                      🔄 Sync
                    </button>
                    
                    <button
                      onClick={debugInventoryData}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #dc2626',
                        borderRadius: '4px',
                        background: 'white',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                      title="Debug dữ liệu inventory"
                    >
                      🐛 Debug
                    </button>
                  </div>
                 
                 {inventoryError && (
                   <span style={{
                     fontSize: '11px',
                     color: '#dc2626',
                     fontStyle: 'italic'
                   }}>
                     ⚠️ {inventoryError}
                   </span>
                 )}
               </div>
             </div>
             
             {selectedItems.length === 0 ? (
               <div style={{
                 padding: '20px',
                 textAlign: 'center',
                 color: '#92400e',
                 fontStyle: 'italic',
                 background: 'white',
                 borderRadius: '4px',
                 border: '1px dashed #fde047'
               }}>
                 Chưa có vật tư nào được chọn. Nhấn "Thêm Vật Tư" để chọn.
               </div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {selectedItems.map((item, index) => (
                   <div key={index} style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     padding: '12px',
                     background: 'white',
                     borderRadius: '4px',
                     border: '1px solid #fde047'
                   }}>
                     <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                         {item.name}
                       </div>
                       <div style={{ fontSize: '12px', color: '#92400e' }}>
                         Đơn giá: {fmt(item.unit_price)} đ/{item.unit}
                       </div>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <input
                         type="number"
                         value={item.quantity}
                         onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                         min="1"
                         style={{
                           width: '60px',
                           padding: '4px 8px',
                           border: '1px solid #fde047',
                           borderRadius: '4px',
                           textAlign: 'center'
                         }}
                       />
                       <span style={{ fontSize: '12px', color: '#92400e' }}>{item.unit}</span>
                       <span style={{ 
                         fontWeight: '600',
                         color: '#92400e',
                         minWidth: '80px',
                         textAlign: 'right'
                       }}>
                         {fmt(item.total_price)} đ
                       </span>
                       <button
                         onClick={() => updateItemQuantity(item.id, 0)}
                         style={{
                           padding: '2px 6px',
                           border: 'none',
                           borderRadius: '4px',
                           background: '#ef4444',
                           color: 'white',
                           cursor: 'pointer',
                           fontSize: '10px'
                         }}
                       >
                         ×
                       </button>
                     </div>
                   </div>
                 ))}
                 
                 {/* Tổng chi phí */}
                 <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   padding: '12px',
                   background: '#fef3c7',
                   borderRadius: '4px',
                   border: '1px solid #f59e0b',
                   marginTop: '8px'
                 }}>
                   <span style={{ fontWeight: '600', color: '#92400e' }}>Tổng chi phí vật tư:</span>
                   <span style={{ fontWeight: '700', color: '#92400e', fontSize: '16px' }}>
                     {fmt(totalCost)} đ
                   </span>
                 </div>
               </div>
             )}
           </div>

          {/* Hướng dẫn */}
          <div style={{
            background: '#f0fdf4',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #bbf7d0'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#166534', fontSize: '16px', fontWeight: '500' }}>
              📋 Hướng Dẫn Tiếp Theo
            </h3>
            <div style={{ color: '#166534', fontSize: '14px', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                1. <strong>Kiểm tra vật tư:</strong> Xác nhận vật tư cần thiết có sẵn trong kho
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                2. <strong>Bắt đầu sửa chữa:</strong> Thực hiện các bước sửa chữa theo quy trình
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                3. <strong>Cập nhật tiến độ:</strong> Ghi nhận các bước đã hoàn thành
              </p>
              <p style={{ margin: '0' }}>
                4. <strong>Hoàn thành:</strong> Cập nhật trạng thái khi sửa chữa xong
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '24px',
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
          <button
            onClick={() => {
              // Có thể thêm logic để in phiếu hoặc xuất PDF
              window.print();
            }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: '#1e40af',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            In Phiếu
          </button>
                 </div>
       </div>
       
       {/* Modal chọn vật tư từ inventory */}
       <InventoryTable
         isOpen={showInventoryTable}
         onClose={() => setShowInventoryTable(false)}
         inventoryItems={inventoryItems}
         onAddItem={addInventoryItem}
       />
     </div>
   );
 }
