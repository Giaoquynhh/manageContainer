export const getStatusText = (status: string): string => {
  switch (status) {
    case 'OCCUPIED': return 'Đã vào bãi';
    case 'RESERVED': return 'Đã đặt trước';
    case 'EMPTY': return 'Trống';
    case 'UNDER_MAINTENANCE': return 'Đang bảo trì';
    case 'EXPORT': return 'Đã xuất';
    case 'NOT_IN_YARD': return 'Chưa vào bãi';
    default: return 'Không xác định';
  }
};

export const getContainerType = (kind: string): string => {
  switch (kind?.toUpperCase()) {
    case 'IMPORT': return 'IMPORT';
    case 'EXPORT': return 'EXPORT';
    case 'REEFER': return 'REEFER';
    case 'GEN': return 'GENERAL';
    default: return 'IMPORT';
  }
};

export const getGateStatusText = (status: string): string => {
  switch (status) {
    case 'APPROVED': return 'Đã xác nhận';
    case 'PENDING': return 'Đang chờ xử lý';
    case 'REJECTED': return 'Đã từ chối';
    case 'CANCELLED': return 'Đã hủy';
    default: return 'Không xác định';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'OCCUPIED': return 'text-green-600';
    case 'RESERVED': return 'text-yellow-600';
    case 'EMPTY': return 'text-blue-600';
    case 'UNDER_MAINTENANCE': return 'text-orange-600';
    case 'EXPORT': return 'text-purple-600';
    case 'NOT_IN_YARD': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

export const getDocumentTypeIcon = (docType: string): string => {
  switch (docType.toUpperCase()) {
    case 'EIR': return '📋';
    case 'LOLO': return '🚢';
    case 'INVOICE': return '💰';
    case 'SUPPLEMENT': return '📎';
    default: return '📄';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
