# Gate Time Display Logic - Logic hiển thị thời gian Gate

## 🎯 Tổng quan

Tài liệu này mô tả logic hiển thị thời gian vào và ra cổng trong Gate Dashboard. Thời gian được tự động điền bởi backend và hiển thị trong bảng Gate Request Table.

## 🔄 Logic hiển thị thời gian

### **Thời gian vào (time_in)**
- **Hiển thị khi**: Request có trạng thái `GATE_IN`, `IN_YARD`, `IN_CAR`, `GATE_OUT`
- **Format**: `dd/mm/yyyy hh:mm:ss` (theo timezone Việt Nam)
- **Fallback**: "Không có" nếu `time_in` là null

### **Thời gian ra (time_out)**
- **Hiển thị khi**: Request có trạng thái `GATE_OUT`
- **Format**: `dd/mm/yyyy hh:mm:ss` (theo timezone Việt Nam)
- **Fallback**: "Không có" nếu `time_out` là null

## 🏗️ Thay đổi kỹ thuật Frontend

### **1. Interface Updates**

#### **GateRequest Interface**
```typescript
interface GateRequest {
  id: string;
  container_no: string;
  type: string;
  status: string;
  eta?: string;
  forwarded_at?: string;
  license_plate?: string; // Biển số xe
  driver_name?: string;   // Tên tài xế
  time_in?: string;       // Thời gian vào (ISO string từ backend)
  time_out?: string;      // Thời gian ra (ISO string từ backend)
  docs: any[];
  attachments: any[];
}
```

### **2. Component Updates**

#### **GateRequestTable.tsx - Hiển thị thời gian**
```typescript
// Cột thời gian vào
<td>
  <span className="time-in">
    {request.time_in ? 
      new Date(request.time_in).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : 
      t('common.na')
    }
  </span>
</td>

// Cột thời gian ra
<td>
  <span className="time-out">
    {request.time_out ? 
      new Date(request.time_out).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : 
      t('common.na')
    }
  </span>
</td>
```

#### **GateActionButtons.tsx - Loại bỏ trường thời gian**
```typescript
// Loại bỏ các state cho thời gian
// const [timeIn, setTimeIn] = useState('');
// const [timeOut, setTimeOut] = useState('');

// Loại bỏ useEffect tự động điền thời gian
// useEffect(() => {
//   if (isApproveModalOpen) {
//     const now = new Date();
//     const formattedTime = now.toISOString().slice(0, 16);
//     setTimeIn(formattedTime);
//   }
// }, [isApproveModalOpen]);

// Cập nhật API call - không gửi thời gian
await api.patch(`/gate/requests/${requestId}/approve`, { 
  license_plate: normalizedPlate,
  driver_name: normalizedDriver
  // Loại bỏ time_in và time_out
});
```

### **3. Modal Updates**

#### **Approve Modal - Thông báo tự động điền thời gian**
```typescript
<div style={{ 
  marginBottom: 'var(--space-4)',
  padding: 'var(--space-3)',
  backgroundColor: 'var(--color-blue-50)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-blue-200)'
}}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    color: 'var(--color-blue-700)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)'
  }}>
    <span>ℹ️</span>
    <span>Thời gian vào và ra sẽ được tự động điền khi chuyển trạng thái</span>
  </div>
</div>
```

### **4. CSS Updates**

#### **Gate.css - Styling cho cột thời gian**
```css
/* Chiều rộng tối thiểu cho các cột thời gian */
.gate-table td[data-column="time-in"] {
  min-width: 140px;
}

.gate-table td[data-column="time-out"] {
  min-width: 140px;
}

/* Styling cho text thời gian */
.time-in, .time-out {
  font-family: 'Courier New', monospace;
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
  white-space: nowrap;
}
```

## 🔄 Workflow Frontend

### **1. Load Requests**
```typescript
// GateDashboard.tsx
const fetchRequests = async () => {
  const response = await api.get(`/gate/requests/search?${params.toString()}`);
  setRequests(response.data.data); // Backend trả về time_in, time_out
};
```

### **2. Display Time**
```typescript
// GateRequestTable.tsx
const formatTime = (timeString: string | undefined) => {
  if (!timeString) return t('common.na');
  
  return new Date(timeString).toLocaleString(
    currentLanguage === 'vi' ? 'vi-VN' : 'en-US',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  );
};
```

### **3. Approve Request**
```typescript
// GateActionButtons.tsx
const confirmApprove = async () => {
  // Chỉ gửi thông tin tài xế và biển số
  await api.patch(`/gate/requests/${requestId}/approve`, { 
    license_plate: normalizedPlate,
    driver_name: normalizedDriver
  });
  
  // Backend sẽ tự động điền time_in
  // Frontend sẽ refresh để hiển thị thời gian mới
  onActionSuccess();
};
```

## 📊 State Management

### **Request State Flow**
```
1. FORWARDED → [User clicks "Cho phép"] → GATE_IN
   - Backend: time_in = current_timestamp
   - Frontend: Refresh table, hiển thị time_in

2. GATE_IN → [Forklift operations] → IN_YARD/IN_CAR
   - time_in giữ nguyên
   - time_out vẫn null

3. IN_YARD/IN_CAR → [User clicks "GATE_OUT"] → GATE_OUT
   - Backend: time_out = current_timestamp
   - Frontend: Refresh table, hiển thị time_out
```

### **Data Flow**
```
Backend API Response
├── time_in: "2025-09-06T10:30:00.000Z"
├── time_out: "2025-09-06T15:45:00.000Z"
└── status: "GATE_OUT"

Frontend Display
├── time_in: "06/09/2025 17:30:00" (UTC+7)
├── time_out: "06/09/2025 22:45:00" (UTC+7)
└── status: "Đã rời kho"
```

## 🎯 User Experience

### **Trước khi cập nhật:**
- Người dùng phải nhập thời gian vào và ra thủ công
- Có thể nhập sai thời gian
- Giao diện phức tạp với nhiều trường input

### **Sau khi cập nhật:**
- Thời gian được tự động điền chính xác
- Giao diện đơn giản, chỉ cần nhập tên tài xế và biển số
- Thông báo rõ ràng về việc tự động điền thời gian

## 🔧 Testing Frontend

### **Test Cases:**
1. **Load Requests**: Kiểm tra thời gian hiển thị đúng format
2. **Approve Request**: Kiểm tra thời gian vào xuất hiện sau khi approve
3. **Gate Out**: Kiểm tra thời gian ra xuất hiện sau khi gate out
4. **Timezone**: Kiểm tra thời gian hiển thị đúng timezone local
5. **Null Values**: Kiểm tra hiển thị "Không có" khi thời gian null

### **Test Script:**
```typescript
// Test hiển thị thời gian
const mockRequest = {
  id: 'req_123',
  container_no: 'ISO1234',
  time_in: '2025-09-06T10:30:00.000Z',
  time_out: '2025-09-06T15:45:00.000Z',
  status: 'GATE_OUT'
};

// Kiểm tra format hiển thị
const timeInDisplay = new Date(mockRequest.time_in).toLocaleString('vi-VN');
expect(timeInDisplay).toBe('06/09/2025 17:30:00');

// Test approve request
const approveResponse = await api.patch('/gate/requests/req_123/approve', {
  driver_name: 'Test Driver',
  license_plate: 'TEST-123'
});

expect(approveResponse.data.time_in).toBeDefined();
```

## 📱 Responsive Design

### **Mobile Layout**
```css
@media (max-width: 768px) {
  .gate-table td[data-column="time-in"],
  .gate-table td[data-column="time-out"] {
    min-width: 120px;
    font-size: var(--font-size-xs);
  }
}
```

### **Tablet Layout**
```css
@media (max-width: 1024px) {
  .gate-table td[data-column="time-in"],
  .gate-table td[data-column="time-out"] {
    min-width: 130px;
  }
}
```

## 🚀 Future Enhancements

### **Có thể mở rộng:**
- Thêm tooltip hiển thị thời gian UTC
- Thêm tính năng export thời gian ra Excel
- Thêm filter theo khoảng thời gian
- Thêm biểu đồ thống kê thời gian xử lý
- Thêm cảnh báo khi thời gian xử lý quá lâu

## 📚 Tài liệu liên quan

- [GATE_DASHBOARD_UPDATE.md](./GATE_DASHBOARD_UPDATE.md)
- [TOAST_IMPLEMENTATION_SUMMARY.md](./TOAST_IMPLEMENTATION_SUMMARY.md)
- [../backend/docs/AUTO_TIME_FILL_LOGIC.md](../backend/docs/AUTO_TIME_FILL_LOGIC.md)
