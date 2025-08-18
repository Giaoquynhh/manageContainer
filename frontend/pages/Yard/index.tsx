import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { yardApi } from '@services/yard';
import { useState, useEffect } from 'react';
import {
  YardMap,
  ContainerSearchForm,
  ContainerInfoModal
} from '@components/yard';
import { useContainerSearch } from '@components/yard/hooks/useContainerSearch';

const fetcher = async () => yardApi.map();

export default function YardPage() {
  const { data: map } = useSWR('yard_map', fetcher);
  const [containerNo, setContainerNo] = useState('');
  const [gateLocationFilter, setGateLocationFilter] = useState('');
  const [showContainerModal, setShowContainerModal] = useState(false);

  const {
    containerInfo,
    loading,
    msg,
    isDuplicate,
    existingContainers,
    searchContainer,
    reset,
    setMsg
  } = useContainerSearch();

  const handleSearchContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 handleSearchContainer called with containerNo:', containerNo);
    console.log('🔍 Container No length:', containerNo.trim().length);
    console.log('🔍 Gate Location Filter:', gateLocationFilter);
    
    // Kiểm tra độ dài tối thiểu trước khi tìm kiếm
    if (containerNo.trim().length < 4) {
      console.log('❌ Container No quá ngắn, không tìm kiếm');
      return; // Không làm gì nếu container number quá ngắn
    }
    
    console.log('✅ Container No hợp lệ, bắt đầu tìm kiếm');
    console.log('🔍 Trước khi searchContainer - containerInfo:', containerInfo);
    console.log('🔍 Trước khi searchContainer - msg:', msg);
    
    await searchContainer(containerNo, gateLocationFilter);
    
    // Đợi một chút để state được update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('🔍 Sau khi tìm kiếm, containerInfo:', containerInfo);
    console.log('🔍 Sau khi tìm kiếm, msg:', msg);
    
    // Luôn hiển thị modal để người dùng có thể thấy kết quả tìm kiếm
    console.log('🔍 Hiển thị modal...');
    setShowContainerModal(true);
  };

  const handleCloseContainerModal = () => {
    setShowContainerModal(false);
  };

  const handleReset = () => {
    setContainerNo('');
    setGateLocationFilter('');
    reset();
  };

  // Transform data cho YardMap component
  const transformMapData = (mapData: any) => {
    if (!mapData) return null;
    
    return mapData.map((yard: any) => ({
      ...yard,
      blocks: yard.blocks.map((block: any) => ({
        ...block,
        slots: block.slots.map((slot: any) => ({
          ...slot,
          isSuggested: false, // Removed suggestedPositions
          isSelected: slot.id === containerInfo?.slot_id // Use containerInfo.slot_id
        }))
      }))
    }));
  };

  const transformedMap = transformMapData(map);

  // Theo dõi thay đổi của containerInfo
  useEffect(() => {
    console.log('🔄 containerInfo changed:', containerInfo);
    console.log('🔄 containerInfo type:', typeof containerInfo);
    console.log('🔄 containerInfo === null:', containerInfo === null);
    console.log('🔄 containerInfo === undefined:', containerInfo === undefined);
    
    if (containerInfo) {
      console.log('📦 Container Info details:', {
        container_no: containerInfo.container_no,
        status: containerInfo.status,
        gate_status: containerInfo.gate_status,
        type: containerInfo.type
      });
      console.log('📦 Full containerInfo object:', JSON.stringify(containerInfo, null, 2));
    } else {
      console.log('❌ containerInfo is null/undefined');
    }
  }, [containerInfo]);

  return (
    <>
      <Header />
      <main className="container">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Quản lý Bãi Container</h1>
            <p className="page-subtitle">Sơ đồ bãi và tìm kiếm thông tin container</p>
          </div>
        </div>

        {msg && (
          <div className={`message-banner ${msg.includes('thành công') || msg.includes('tìm thấy') ? 'success' : 'error'}`}>
            <p>{msg}</p>
            <button className="close-btn" onClick={() => setMsg('')}>×</button>
          </div>
        )}

        <div className="yard-layout">
          {/* Left Column - Yard Map */}
          <div className="yard-left">
            <Card title="Sơ đồ bãi">
              {!transformedMap && <div>Đang tải…</div>}
              {transformedMap && (
                <YardMap
                  yard={transformedMap[0]}
                  onSlotClick={() => {}} // Removed handleConfirmPosition
                  suggestedSlots={[]} // Removed suggestedPositions
                  selectedSlotId={containerInfo?.slot_id || ''} // Use containerInfo.slot_id
                />
              )}
            </Card>
          </div>

          {/* Right Column - Container Search & Info */}
          <div className="yard-right">
            <Card title="Tìm kiếm Container">
              <ContainerSearchForm
                containerNo={containerNo}
                onContainerNoChange={setContainerNo}
                gateLocationFilter={gateLocationFilter}
                onGateLocationFilterChange={setGateLocationFilter}
                onSubmit={handleSearchContainer}
                loading={loading}
              />
            </Card>
          </div>
        </div>

        {/* Confirm Position Modal */}
        {/* Removed ConfirmPositionModal */}

        {/* Container Information Modal */}
        <ContainerInfoModal
          isOpen={showContainerModal}
          containerInfo={containerInfo}
          isDuplicate={isDuplicate}
          existingContainers={existingContainers}
          onClose={handleCloseContainerModal}
        />
      </main>
    </>
  );
}


