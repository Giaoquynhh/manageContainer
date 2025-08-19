import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { maintenanceApi } from '@services/maintenance';
import { useState } from 'react';
import {
  CreateRepairModal,
  PendingContainersModal,
  RepairTable,
  RepairPageHeader,
  MessageDisplay
} from '@components/Maintenance';

export default function RepairsPage() {
  const [filter, setFilter] = useState<string>('PENDING_APPROVAL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPendingContainersModalOpen, setIsPendingContainersModalOpen] = useState(false);
  const key = ['repairs', filter].join(':');
  const { data: repairs } = useSWR(key, async () => maintenanceApi.listRepairs(filter || undefined));
  const [msg, setMsg] = useState('');

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
            onCreateRepair={() => setIsModalOpen(true)}
          />

          <MessageDisplay message={msg} />

          <RepairTable
            repairs={repairs || []}
            onApprove={approve}
            onReject={reject}
          />
        </Card>

        <CreateRepairModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateRepair}
        />

        <PendingContainersModal
          isOpen={isPendingContainersModalOpen}
          onClose={() => setIsPendingContainersModalOpen(false)}
        />
      </main>
    </>
  );
}


