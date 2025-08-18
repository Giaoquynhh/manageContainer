import React from 'react';
import { getGateStatusText, getStatusColor } from '../../utils/containerUtils';

interface ContainerInfoCardProps {
  containerInfo: any;
}

export const ContainerInfoCard: React.FC<ContainerInfoCardProps> = ({ containerInfo }) => {
  // Không hiển thị gì cả, chỉ giữ component để tránh lỗi
  return null;
};
