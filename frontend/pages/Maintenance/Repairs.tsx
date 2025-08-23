import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { maintenanceApi } from '@services/maintenance';
import { useState } from 'react';
import {
  CreateRepairModal,
  RepairTable,
  RepairPageHeader,
  RepairTicketModal,
  MessageDisplay
} from '@components/Maintenance';

export default function RepairsPage() {
  const [filter, setFilter] = useState<string>('GATE_IN');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Bỏ state cho pop-up pending containers
  const key = ['repairs', filter].join(':');
  const { data: repairs } = useSWR(key, async () => maintenanceApi.listRepairs(filter || undefined));
  const [msg, setMsg] = useState('');
  // State để quản lý việc hiển thị button lựa chọn
  const [showChoiceButtons, setShowChoiceButtons] = useState<string | null>(null);
  // State để quản lý modal hiển thị phiếu sửa chữa
  const [repairTicketModal, setRepairTicketModal] = useState<{
    isOpen: boolean;
    repairTicket: any;
    containerInfo: any;
  }>({
    isOpen: false,
    repairTicket: null,
    containerInfo: null
  });

  const handleCreateRepair = async (form: any) => {
    setMsg('');
    try {
      await maintenanceApi.createRepair(form);
      setMsg('Đã tạo phiếu thành công');
      setIsModalOpen(false);
      mutate(key);
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi tạo phiếu');
    }
  };

  const approve = async (id: string) => {
    setMsg('');
    try {
      await maintenanceApi.approveRepair(id);
      mutate(key);
      // Kiểm tra nếu đây là container đang chờ
      if (id.startsWith('container-')) {
        setMsg('Đã bắt đầu kiểm tra container và tạo phiếu sửa chữa');
      } else {
        // Kiểm tra trạng thái phiếu để hiển thị thông báo phù hợp
        const repair = repairs?.find((r: any) => r.id === id);
        if (repair?.status === 'CHECKING') {
          setMsg('Đã xác nhận container đạt chuẩn kiểm tra');
        } else {
          setMsg('Đã duyệt phiếu');
        }
      }
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi xử lý');
    }
  };

  const reject = async (id: string, action?: string) => {
    setMsg('');
    try {
      if (action === 'show_options') {
        // Hiển thị 2 button lựa chọn thay vì dialog
        setShowChoiceButtons(id);
        return; // Không gọi API ngay, đợi user chọn
      } else if (action === 'can_repair') {
        // Có thể sửa chữa
        try {
          const result = await maintenanceApi.rejectRepair(id, 'Có thể sửa chữa', 'can_repair');
          console.log('API Response:', result); // Debug log
          console.log('Response type:', typeof result); // Debug log
          console.log('Response keys:', Object.keys(result || {})); // Debug log
          
          setMsg('Đã bắt đầu sửa chữa container');
          setShowChoiceButtons(null); // Ẩn button lựa chọn
          
          // Hiển thị modal phiếu sửa chữa
          if (result && result.repairTicket) {
            console.log('Found repairTicket:', result.repairTicket); // Debug log
            const container = repairs?.find((r: any) => r.id === id);
            console.log('Found container:', container); // Debug log
            
            setRepairTicketModal({
              isOpen: true,
              repairTicket: result.repairTicket,
              containerInfo: {
                container_no: container?.container_no,
                driver_name: container?.driver_name,
                license_plate: container?.license_plate
              }
            });
            console.log('Modal state set to open'); // Debug log
          } else {
            console.log('No repairTicket in response:', result);
            console.log('Result structure:', JSON.stringify(result, null, 2)); // Debug log
          }
        } catch (error) {
          console.error('Error calling API:', error);
          setMsg('Lỗi khi tạo phiếu sửa chữa');
        }
      } else if (action === 'cannot_repair') {
        // Không thể sửa chữa
        await maintenanceApi.rejectRepair(id, 'Container không đạt chuẩn và không thể sửa chữa', 'cannot_repair');
        setMsg('Đã từ chối container - không thể sửa chữa');
        setShowChoiceButtons(null); // Ẩn button lựa chọn
      } else {
        let promptMessage = 'Lý do từ chối?';
        if (id.startsWith('container-')) {
          promptMessage = 'Lý do bỏ qua container?';
        }
        
        const c = window.prompt(promptMessage) || undefined;
        await maintenanceApi.rejectRepair(id, c);
        
        if (id.startsWith('container-')) {
          setMsg('Đã bỏ qua container');
        } else {
          // Kiểm tra trạng thái phiếu để hiển thị thông báo phù hợp
          const repair = repairs?.find((r: any) => r.id === id);
          if (repair?.status === 'CHECKING') {
            setMsg('Đã xác nhận container không đạt chuẩn kiểm tra');
          } else {
            setMsg('Đã từ chối phiếu');
          }
        }
      }
      
      mutate(key);
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi xử lý');
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    mutate(key);
  };

  return (
    <>
      <Header />
      <main className="container">
        <Card title="Danh sách phiếu sửa chữa">
          <RepairPageHeader
            filter={filter}
            onFilterChange={handleFilterChange}
            // Bỏ chức năng mở pop-up
            onCreateRepair={() => setIsModalOpen(true)}
          />

          <MessageDisplay message={msg} />

          {/* Thông báo phiếu tự động và container đang chờ */}
          {repairs && (repairs.some((r: any) => r.code.startsWith('AUTO-') && r.status === 'GATE_IN') || 
                      repairs.some((r: any) => r.isContainer && r.status === 'GATE_IN')) && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '16px',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>🔔</span>
              <div>
                <div style={{ fontWeight: '500', color: '#92400e' }}>
                  Có container cần xử lý
                </div>
                <div style={{ fontSize: '14px', color: '#92400e' }}>
                  {repairs.some((r: any) => r.code.startsWith('AUTO-')) && 'Có phiếu sửa chữa tự động mới. '}
                  {repairs.some((r: any) => r.isContainer) && 'Có container đang chờ bắt đầu kiểm tra.'}
                </div>
              </div>
            </div>
          )}

          <RepairTable
            repairs={repairs || []}
            onApprove={approve}
            onReject={reject}
            showChoiceButtons={showChoiceButtons}
            onChoiceSelect={reject}
          />
        </Card>

        <CreateRepairModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateRepair}
        />

        {/* Modal hiển thị phiếu sửa chữa */}
        <RepairTicketModal
          isOpen={repairTicketModal.isOpen}
          onClose={() => setRepairTicketModal(prev => ({ ...prev, isOpen: false }))}
          repairTicket={repairTicketModal.repairTicket}
          containerInfo={repairTicketModal.containerInfo}
        />
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            position: 'fixed', 
            bottom: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999
          }}>
            Modal State: {repairTicketModal.isOpen ? 'OPEN' : 'CLOSED'}<br/>
            Has RepairTicket: {repairTicketModal.repairTicket ? 'YES' : 'NO'}<br/>
            Has ContainerInfo: {repairTicketModal.containerInfo ? 'YES' : 'NO'}
          </div>
        )}

        {/* Bỏ PendingContainersModal - container sẽ hiển thị trực tiếp trong bảng */}
      </main>
    </>
  );
}


