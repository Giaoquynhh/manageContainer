import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { maintenanceApi } from '@services/maintenance';
import { useState } from 'react';
import {
  PendingContainersModal,
  RepairTable,
  RepairPageHeader,
  MessageDisplay
} from '@components/Maintenance';

export default function RepairsPage() {
  const [filter, setFilter] = useState<string>('CHECKING');
  const [isPendingContainersModalOpen, setIsPendingContainersModalOpen] = useState(false);
  const key = ['repairs', filter].join(':');
  const { data: repairs } = useSWR(key, async () => maintenanceApi.listRepairs(filter || undefined));
  const [msg, setMsg] = useState('');

  const approve = async (id: string) => {
    setMsg('');
    try {
      await maintenanceApi.approveRepair(id);
      mutate(key);
      setMsg('Đã duyệt phiếu');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi duyệt');
    }
  };

  const reject = async (id: string) => {
    setMsg('');
    try {
      const c = window.prompt('Lý do từ chối?') || undefined;
      await maintenanceApi.rejectRepair(id, c);
      mutate(key);
      setMsg('Đã từ chối phiếu');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi từ chối');
    }
  };

  const handlePassStandard = async (id: string) => {
    setMsg('');
    try {
      // Hoàn thành kiểm tra với kết quả PASS
      await maintenanceApi.completeRepairCheck(id, 'PASS');
      
      // Refresh danh sách
      mutate(key);
      mutate(['repairs', 'CHECKED']);
      
      setMsg('Đã hoàn thành kiểm tra - Đạt chuẩn');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi hoàn thành kiểm tra');
    }
  };

  const handleFailStandard = async (id: string) => {
    setMsg('');
    try {
      // Khi bấm "Không đạt chuẩn", lưu manager_comment để hiển thị 2 button mới
      await maintenanceApi.updateRepairStatus(id, 'CHECKING', 'Container không đạt chuẩn');
      
      // Refresh danh sách
      mutate(key);
      
      setMsg('Container không đạt chuẩn - chọn option sửa chữa');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi xử lý');
    }
  };

  const handleRepairable = async (id: string) => {
    setMsg('');
    try {
      // Cập nhật manager_comment để đánh dấu có thể sửa chữa
      await maintenanceApi.updateRepairStatus(id, 'CHECKING', 'Container không đạt chuẩn nhưng có thể sửa chữa');
      
      // Refresh danh sách
      mutate(key);
      
      setMsg('Container có thể sửa chữa - đang chờ xử lý');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi xử lý');
    }
  };

  const handleUnrepairable = async (id: string) => {
    setMsg('');
    try {
      // Chuyển cả repair ticket và service request sang REJECTED
      await maintenanceApi.completeRepairCheck(id, 'FAIL', 'Container không đạt chuẩn và không thể sửa chữa');
      
      // Refresh danh sách
      mutate(key);
      mutate(['repairs', 'REJECTED']);
      
      setMsg('Đã từ chối - Container không đạt chuẩn và không thể sửa chữa');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi xử lý');
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
            onOpenPendingContainers={() => setIsPendingContainersModalOpen(true)}
          />

          <MessageDisplay message={msg} />

          <RepairTable
            repairs={repairs || []}
            onApprove={approve}
            onReject={reject}
            onPassStandard={handlePassStandard}
            onFailStandard={handleFailStandard}
            onRepairable={handleRepairable}
            onUnrepairable={handleUnrepairable}
          />
        </Card>

        <PendingContainersModal
          isOpen={isPendingContainersModalOpen}
          onClose={() => setIsPendingContainersModalOpen(false)}
        />
      </main>
    </>
  );
}


