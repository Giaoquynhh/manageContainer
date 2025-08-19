import { useEffect, useState } from 'react';
import { maintenanceApi } from '@services/maintenance';
import { mutate } from 'swr';
import ContainerRepairModal from './ContainerRepairModal';
import PendingContainersModalContainer from './PendingContainersModalContainer';

interface PendingContainersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingContainersModal({ isOpen, onClose }: PendingContainersModalProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkResults, setCheckResults] = useState<{[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null}>({});
  const [isCreateRepairModalOpen, setIsCreateRepairModalOpen] = useState(false);
  const [selectedContainerForRepair, setSelectedContainerForRepair] = useState<any>(null);

  const fetchPendingContainers = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('http://localhost:1000/gate/requests/search?status=GATE_IN&limit=100', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRequests(data.data || []);
      
    } catch (err: any) {
      console.error('Error fetching pending containers:', err);
      
      if (err.name === 'AbortError') {
        setError('Yêu cầu bị timeout. Vui lòng thử lại.');
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo backend server đang chạy.');
      } else if (err.message.includes('401')) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.message.includes('403')) {
        setError('Bạn không có quyền truy cập dữ liệu này.');
      } else if (err.message.includes('404')) {
        setError('API endpoint không tồn tại. Vui lòng liên hệ admin.');
      } else if (err.message.includes('500')) {
        setError('Lỗi server. Vui lòng thử lại sau.');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckContainer = async (requestId: string) => {
    try {
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'CHECKING' }
          : req
      ));
      alert('Đã bắt đầu kiểm tra container. Trạng thái đã chuyển sang CHECKING.');
    } catch (err: any) {
      console.error('Error starting container check:', err);
      alert(`Lỗi khi bắt đầu kiểm tra container: ${err.message}`);
    }
  };

  const handleCheckResult = (requestId: string, result: 'PASS' | 'FAIL') => {
    if (result === 'PASS') {
      setRequests(prev => prev.filter(req => req.id !== requestId));
      alert('Kết quả kiểm tra: Đạt chuẩn. Container đã được xóa khỏi danh sách chờ.');
    } else {
      setCheckResults(prev => ({
        ...prev,
        [requestId]: 'FAIL_WITH_OPTIONS'
      }));
    }
  };

  const handleFailOption = (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => {
    if (option === 'UNREPAIRABLE') {
      const reason = 'Container không đạt chuẩn';
      setCheckResults(prev => ({
        ...prev,
        [requestId]: option
      }));
      setRequests(prev => prev.filter(req => req.id !== requestId));
      alert(`Kết quả kiểm tra: ${reason}. Container đã được xóa khỏi danh sách chờ.`);
    } else {
      const container = requests.find(req => req.id === requestId);
      
      const findEquipmentForContainer = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
          }
          
          const response = await fetch(`http://localhost:1000/maintenance/equipments?type=CONTAINER&code=${container?.container_no}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const equipments = await response.json();
            if (equipments.data && equipments.data.length > 0) {
              const equipment = equipments.data[0];
              setSelectedContainerForRepair({
                ...container,
                equipment_id: equipment.id,
                equipment_code: equipment.code
              });
            } else {
              setSelectedContainerForRepair({
                ...container,
                equipment_id: '1',
                equipment_code: container?.container_no || 'Unknown'
              });
            }
          } else {
            setSelectedContainerForRepair({
              ...container,
              equipment_id: '1',
              equipment_code: container?.container_no || 'Unknown'
            });
          }
        } catch (err) {
          console.error('Error finding equipment:', err);
          setSelectedContainerForRepair({
            ...container,
            equipment_id: '1',
            equipment_code: container?.container_no || 'Unknown'
          });
        }
        
        setIsCreateRepairModalOpen(true);
      };
      
      findEquipmentForContainer();
    }
  };

  const handleCreateRepairForContainer = async (form: any) => {
    try {
      if (!form.problem_description || form.problem_description.trim() === '') {
        alert('Vui lòng nhập mô tả lỗi');
        return;
      }
      
      if (form.estimated_cost < 0) {
        alert('Chi phí dự toán không thể âm');
        return;
      }
      
      if (form.estimated_cost === 0) {
        const confirmZero = window.confirm('Chi phí dự toán là 0. Bạn có chắc chắn muốn tiếp tục?');
        if (!confirmZero) {
          return;
        }
      }
      
      const payload = {
        code: `REP-${Date.now()}`,
        container_no: selectedContainerForRepair?.container_no || null,
        problem_description: form.problem_description.trim(),
        estimated_cost: Number(form.estimated_cost) || 0,
        items: []
      };
      
      const result = await maintenanceApi.createRepair(payload);
      
      if (!result) {
        throw new Error('API không trả về dữ liệu');
      }
      
      setRequests(prev => prev.filter(req => req.id !== selectedContainerForRepair.id));
      setCheckResults(prev => ({
        ...prev,
        [selectedContainerForRepair.id]: 'REPAIRABLE'
      }));
      
      setIsCreateRepairModalOpen(false);
      setSelectedContainerForRepair(null);
      
      mutate(['repairs', 'PENDING_APPROVAL']);
      
      alert('Đã tạo phiếu sửa chữa thành công cho container! Container đã được xóa khỏi danh sách chờ.');
      
    } catch (err: any) {
      console.error('Error creating repair:', err);
      
      let errorMessage = 'Lỗi khi tạo phiếu sửa chữa';
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 400) {
          errorMessage = `Lỗi dữ liệu: ${data?.message || 'Dữ liệu không hợp lệ'}`;
        } else if (status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (status === 403) {
          errorMessage = 'Bạn không có quyền tạo phiếu sửa chữa.';
        } else if (status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        } else {
          errorMessage = `Lỗi server (${status}): ${data?.message || 'Không xác định'}`;
        }
      } else if (err.request) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else {
        errorMessage = `Lỗi: ${err.message}`;
      }
      
      alert(errorMessage);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingContainers();
    }
  }, [isOpen]);

  const handleRetry = () => {
    fetchPendingContainers();
  };

  if (!isOpen) return null;

  return (
    <>
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
        <PendingContainersModalContainer
          loading={loading}
          error={error}
          requests={requests}
          checkResults={checkResults}
          onClose={onClose}
          onRetry={handleRetry}
          onCheckContainer={handleCheckContainer}
          onCheckResult={handleCheckResult}
          onFailOption={handleFailOption}
        />
      </div>

      <ContainerRepairModal
        isOpen={isCreateRepairModalOpen}
        onClose={() => {
          setIsCreateRepairModalOpen(false);
          setSelectedContainerForRepair(null);
        }}
        onSubmit={handleCreateRepairForContainer}
        selectedContainer={selectedContainerForRepair}
      />
    </>
  );
}
