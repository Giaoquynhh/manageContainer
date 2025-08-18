import { useState } from 'react';
import { yardApi } from '@services/yard';
import { api } from '@services/api';
import { getStatusText, getContainerType } from '../../utils/containerUtils';

// Function tạo mock data cho vị trí cổng
const getMockGateLocation = (containerNo: string): string => {
  // Sử dụng container number để tạo vị trí cổng ngẫu nhiên nhưng nhất quán
  const hash = containerNo.split('').reduce((a, b) => {
    a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
    return a;
  }, 0);
  
  const gateNumber = (Math.abs(hash) % 8) + 1; // Tạo 8 cổng từ 1-8
  return `Gate ${gateNumber}`;
};

export const useContainerSearch = () => {
  const [containerInfo, setContainerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingContainers, setExistingContainers] = useState<any[]>([]);

  const searchContainer = async (containerNo: string, gateLocationFilter: string = '') => {
    if (!containerNo.trim()) {
      setMsg('Vui lòng nhập Container No');
      return;
    }

    // Kiểm tra độ dài tối thiểu của container number
    if (containerNo.trim().length < 4) {
      setMsg('Container No phải có ít nhất 4 ký tự');
      console.log('Container No quá ngắn:', containerNo.trim(), 'Length:', containerNo.trim().length);
      return;
    }

    console.log('=== BẮT ĐẦU TÌM KIẾM CONTAINER ===');
    console.log('Container No:', containerNo.trim());

    try {
      setLoading(true);
      setMsg('');
      setContainerInfo(null);
      setIsDuplicate(false);
      
      // Tìm kiếm container trong database
      console.log('🔍 Gọi API /gate/requests/search với query:', containerNo.trim());
      const searchResponse = await api.get(`/gate/requests/search?container_no=${encodeURIComponent(containerNo.trim())}&limit=100`);
      console.log('🔍 API Response full:', searchResponse);
      console.log('🔍 API Response data:', searchResponse.data);
      console.log('🔍 API Response status:', searchResponse.status);
      
      // Debug: Kiểm tra cấu trúc response
      console.log('🔍 Response structure check:', {
        hasData: !!searchResponse.data,
        dataKeys: searchResponse.data ? Object.keys(searchResponse.data) : [],
        hasDataArray: !!searchResponse.data?.data,
        hasItems: !!searchResponse.data?.items,
        dataType: typeof searchResponse.data?.data,
        itemsType: typeof searchResponse.data?.items
      });
      
      // Thử nhiều cách để lấy danh sách containers
      let existingContainers: any[] = [];
      if (searchResponse.data?.data && Array.isArray(searchResponse.data.data)) {
        existingContainers = searchResponse.data.data;
        console.log('✅ Sử dụng searchResponse.data.data');
      } else if (searchResponse.data?.items && Array.isArray(searchResponse.data.items)) {
        existingContainers = searchResponse.data.items;
        console.log('✅ Sử dụng searchResponse.data.items');
      } else if (Array.isArray(searchResponse.data)) {
        existingContainers = searchResponse.data;
        console.log('✅ Sử dụng searchResponse.data trực tiếp');
      } else {
        console.log('❌ Không thể xác định cấu trúc response');
        existingContainers = [];
      }
      
      console.log('🔍 Existing containers found:', existingContainers.length);
      console.log('🔍 All containers:', existingContainers);
      
      // Tìm container exact match
      const foundContainer = existingContainers.find((c: any) => {
        console.log('🔍 Checking container:', c.container_no, 'vs search:', containerNo.trim());
        return c.container_no === containerNo.trim();
      });
      console.log('🔍 Container found:', foundContainer);
      
      // Nếu không tìm thấy container trong database, báo lỗi
      if (!foundContainer) {
        console.log('❌ Container không tồn tại trong database:', containerNo.trim());
        console.log('❌ Tất cả containers trong response:', existingContainers.map(c => c.container_no));
        setContainerInfo(null);
        setMsg('Không có thông tin về container');
        return;
      }
      
      console.log('✅ Container tìm thấy trong database:', foundContainer);
      console.log('🔍 Container status:', foundContainer.status);
      console.log('🔍 Container type:', foundContainer.type);
      console.log('🔍 Container full object:', JSON.stringify(foundContainer, null, 2));
      
      // Kiểm tra xem container có trạng thái GATE_IN không
      const hasGateInStatus = foundContainer.status === 'GATE_IN' || 
                             foundContainer.status === 'Gate In' ||
                             foundContainer.status?.toUpperCase() === 'GATE_IN';
      
      console.log('🔍 Has Gate In status?', hasGateInStatus);
      console.log('🔍 Status comparison:', {
        status: foundContainer.status,
        statusEqualsGATE_IN: foundContainer.status === 'GATE_IN',
        statusEqualsGateIn: foundContainer.status === 'Gate In',
        statusToUpper: foundContainer.status?.toUpperCase()
      });
      
      if (hasGateInStatus) {
        console.log('🎯 Container có trạng thái Gate In!');
        
        // Kiểm tra filter vị trí cổng xe vào
        if (gateLocationFilter && gateLocationFilter !== '') {
          const containerGateLocation = foundContainer.gate_location || getMockGateLocation(containerNo.trim());
          if (containerGateLocation !== gateLocationFilter) {
            console.log('❌ Container không khớp với filter vị trí cổng:', containerGateLocation, 'vs', gateLocationFilter);
            setContainerInfo(null);
            setMsg(`Container không ở vị trí cổng ${gateLocationFilter}`);
            return;
          }
          console.log('✅ Container khớp với filter vị trí cổng:', containerGateLocation);
        }
        
        // Nếu tìm thấy container với trạng thái GATE_IN, hiển thị thông tin
        setIsDuplicate(true);
        setExistingContainers(existingContainers);
        
        // Tạo container data từ database
        const containerData = {
          container_no: containerNo.trim(),
          status: foundContainer.status || 'GATE_IN',
          status_text: getStatusText(foundContainer.status || 'GATE_IN'),
          type: getContainerType(foundContainer.type) || 'Chưa xác định',
          location: foundContainer.location || null,
          block_code: foundContainer.block_code || null,
          slot_code: foundContainer.slot_code || null,
          dem_date: foundContainer.dem_date,
          det_date: foundContainer.det_date,
          yard_name: foundContainer.yard_name || 'Chưa xác định',
          gate_status: foundContainer.status || 'GATE_IN',
          gate_location: foundContainer.gate_location || getMockGateLocation(containerNo.trim())
        };
        
        console.log('📦 Container data created:', containerData);
        console.log('📦 Setting containerInfo to:', containerData);
        setContainerInfo(containerData);
        setMsg('Đã tìm thấy container với trạng thái Gate In');
        console.log('✅ ContainerInfo đã được set thành công');
        return;
      } else {
        console.log('❌ Container không có trạng thái Gate In');
        console.log('❌ Status:', foundContainer.status);
        // Container có trong database nhưng không có trạng thái GATE_IN
        setContainerInfo(null);
        setMsg('Container không có trạng thái Gate In');
        console.log('❌ ContainerInfo đã được set thành null');
        return;
      }
      
    } catch (error: any) {
      console.error('🚨 Lỗi khi tìm kiếm container:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 404) {
        setMsg('Không có thông tin về container');
      } else {
        setMsg(error?.response?.data?.message || 'Lỗi khi tìm kiếm container');
      }
    } finally {
      setLoading(false);
      console.log('=== KẾT THÚC TÌM KIẾM ===');
    }
  };

  const reset = () => {
    setContainerInfo(null);
    setMsg('');
    setIsDuplicate(false);
    setExistingContainers([]);
  };

  return {
    containerInfo,
    loading,
    msg,
    isDuplicate,
    existingContainers,
    searchContainer,
    reset,
    setMsg
  };
};
