# Gate Time System Overview - Tổng quan hệ thống thời gian Gate

## 🎯 Tổng quan

Tài liệu này cung cấp cái nhìn tổng quan về hệ thống tự động điền thời gian trong Gate Management, bao gồm cả backend và frontend.

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │    │   (Node.js)     │    │   (PostgreSQL)  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ GateDashboard   │◄──►│ GateController  │◄──►│ ServiceRequest  │
│ GateRequestTable│    │ GateService     │    │ - time_in       │
│ GateActionButtons│   │ - approveGate() │    │ - time_out      │
│                 │    │ - gateOut()     │    │ - gate_checked_at│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Workflow hoàn chỉnh

### **1. Import Request Flow**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ FORWARDED   │───►│ GATE_IN     │───►│ IN_YARD     │───►│ GATE_OUT    │
│             │    │ time_in     │    │             │    │ time_out    │
│ (Chờ Gate)  │    │ (Tự động)   │    │ (Forklift)  │    │ (Tự động)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### **2. Export Request Flow**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ FORWARDED   │───►│ GATE_IN     │───►│ IN_CAR      │───►│ GATE_OUT    │
│             │    │ time_in     │    │             │    │ time_out    │
│ (Chờ Gate)  │    │ (Tự động)   │    │ (Forklift)  │    │ (Tự động)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 📊 Database Schema

### **ServiceRequest Table**
```sql
CREATE TABLE "ServiceRequest" (
  id            TEXT PRIMARY KEY,
  container_no  TEXT,
  type          TEXT, -- IMPORT | EXPORT | CONVERT
  status        TEXT, -- FORWARDED | GATE_IN | IN_YARD | IN_CAR | GATE_OUT
  time_in       TIMESTAMP(3),  -- Thời gian vào cổng
  time_out      TIMESTAMP(3),  -- Thời gian ra cổng
  gate_checked_at TIMESTAMP(3), -- Thời gian Gate kiểm tra
  driver_name   TEXT,
  license_plate TEXT,
  history       JSONB,
  -- ... other fields
);
```

### **Migration History**
```sql
-- Migration: 20250906110613_add_time_in_time_out_fields
ALTER TABLE "ServiceRequest" 
ADD COLUMN "time_in" TIMESTAMP(3),
ADD COLUMN "time_out" TIMESTAMP(3);
```

## 🔧 Backend Implementation

### **API Endpoints**

#### **1. Gate Approve**
```http
PATCH /gate/requests/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "driver_name": "Nguyễn Văn A",
  "license_plate": "38A-12345"
}
```

**Response:**
```json
{
  "message": "Đã approve request thành công",
  "data": {
    "id": "req_123",
    "status": "GATE_IN",
    "time_in": "2025-09-06T10:30:00.000Z",
    "gate_checked_at": "2025-09-06T10:30:00.000Z",
    "driver_name": "Nguyễn Văn A",
    "license_plate": "38A-12345"
  }
}
```

#### **2. Gate Out**
```http
PATCH /gate/requests/:id/gate-out
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Đã chuyển trạng thái: GATE_OUT - Xe rời kho.",
  "data": {
    "id": "req_123",
    "status": "GATE_OUT",
    "time_out": "2025-09-06T15:45:00.000Z"
  }
}
```

### **Service Layer**

#### **GateService.approveGate()**
```typescript
async approveGate(requestId: string, actorId: string, data?: GateApproveData): Promise<any> {
  const currentTime = new Date();
  
  const updatedRequest = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: 'GATE_IN',
      gate_checked_at: currentTime,
      gate_checked_by: actorId,
      // Tự động điền thời gian vào
      time_in: currentTime,
      driver_name: data?.driver_name || null,
      license_plate: data?.license_plate || null,
      history: {
        ...(request.history as any || {}),
        gate_approve: {
          driver_name: data?.driver_name || null,
          license_plate: data?.license_plate || null,
          approved_at: currentTime.toISOString(),
          time_in: currentTime.toISOString()
        }
      }
    }
  });
}
```

#### **GateService.gateOut()**
```typescript
async gateOut(requestId: string, actorId: string): Promise<any> {
  const currentTime = new Date();
  
  const updatedRequest = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: 'GATE_OUT',
      // Tự động điền thời gian ra
      time_out: currentTime,
      history: {
        ...(request.history as any || {}),
        gate_out: {
          previous_status: request.status,
          gate_out_at: currentTime.toISOString(),
          gate_out_by: actorId,
          time_out: currentTime.toISOString()
        }
      }
    }
  });
}
```

## 🎨 Frontend Implementation

### **Component Structure**

#### **GateDashboard.tsx**
```typescript
// Main container component
export default function GateDashboard() {
  const [requests, setRequests] = useState<GateRequest[]>([]);
  
  const fetchRequests = async () => {
    const response = await api.get(`/gate/requests/search?${params.toString()}`);
    setRequests(response.data.data); // Backend trả về time_in, time_out
  };
}
```

#### **GateRequestTable.tsx**
```typescript
// Table component hiển thị thời gian
<td>
  <span className="time-in">
    {request.time_in ? 
      new Date(request.time_in).toLocaleString('vi-VN') : 
      t('common.na')
    }
  </span>
</td>

<td>
  <span className="time-out">
    {request.time_out ? 
      new Date(request.time_out).toLocaleString('vi-VN') : 
      t('common.na')
    }
  </span>
</td>
```

#### **GateActionButtons.tsx**
```typescript
// Action buttons - không cần nhập thời gian
const confirmApprove = async () => {
  await api.patch(`/gate/requests/${requestId}/approve`, { 
    license_plate: normalizedPlate,
    driver_name: normalizedDriver
    // Không gửi time_in, time_out
  });
  
  onActionSuccess(); // Refresh table để hiển thị thời gian mới
};
```

### **CSS Styling**

#### **Gate.css**
```css
/* Chiều rộng tối thiểu cho bảng */
.gate-table {
  min-width: 1400px;
}

/* Cột thời gian */
.gate-table td[data-column="time-in"],
.gate-table td[data-column="time-out"] {
  min-width: 140px;
}

/* Text thời gian */
.time-in, .time-out {
  font-family: 'Courier New', monospace;
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
  white-space: nowrap;
}
```

## 🔄 Data Flow

### **1. User Approve Request**
```
User clicks "Cho phép"
    ↓
Frontend: GateActionButtons.confirmApprove()
    ↓
API: PATCH /gate/requests/:id/approve
    ↓
Backend: GateService.approveGate()
    ↓
Database: UPDATE time_in = NOW()
    ↓
Response: { time_in: "2025-09-06T10:30:00.000Z" }
    ↓
Frontend: Refresh table, display time_in
```

### **2. User Gate Out**
```
User clicks "GATE_OUT"
    ↓
Frontend: GateActionButtons.handleGateOut()
    ↓
API: PATCH /gate/requests/:id/gate-out
    ↓
Backend: GateService.gateOut()
    ↓
Database: UPDATE time_out = NOW()
    ↓
Response: { time_out: "2025-09-06T15:45:00.000Z" }
    ↓
Frontend: Refresh table, display time_out
```

## 📊 Business Logic

### **Tại sao tự động điền thời gian:**
1. **Chính xác**: Thời gian server, không phụ thuộc client
2. **Nhất quán**: Cùng format cho tất cả requests
3. **Đơn giản**: User không cần nhập thủ công
4. **Audit**: Theo dõi chính xác thời gian xử lý

### **Validation Rules:**
- `time_in` chỉ điền khi `FORWARDED` → `GATE_IN`
- `time_out` chỉ điền khi `IN_YARD/IN_CAR` → `GATE_OUT`
- Không cho phép sửa thời gian sau khi điền
- Thời gian lưu UTC, hiển thị local timezone

## 🧪 Testing

### **Backend Tests**
```typescript
describe('Gate Time Fill Logic', () => {
  test('should auto-fill time_in on approve', async () => {
    const response = await request(app)
      .patch('/gate/requests/req_123/approve')
      .send({
        driver_name: 'Test Driver',
        license_plate: 'TEST-123'
      });
    
    expect(response.body.data.time_in).toBeDefined();
    expect(response.body.data.status).toBe('GATE_IN');
  });
  
  test('should auto-fill time_out on gate out', async () => {
    const response = await request(app)
      .patch('/gate/requests/req_123/gate-out');
    
    expect(response.body.data.time_out).toBeDefined();
    expect(response.body.data.status).toBe('GATE_OUT');
  });
});
```

### **Frontend Tests**
```typescript
describe('Gate Time Display', () => {
  test('should display time_in correctly', () => {
    const mockRequest = {
      time_in: '2025-09-06T10:30:00.000Z',
      time_out: null
    };
    
    const timeInDisplay = new Date(mockRequest.time_in).toLocaleString('vi-VN');
    expect(timeInDisplay).toBe('06/09/2025 17:30:00');
  });
  
  test('should display "Không có" for null time', () => {
    const mockRequest = {
      time_in: null,
      time_out: null
    };
    
    expect(formatTime(mockRequest.time_in)).toBe('Không có');
  });
});
```

## 📚 Tài liệu liên quan

### **Backend Docs:**
- [AUTO_TIME_FILL_LOGIC.md](../backend/docs/AUTO_TIME_FILL_LOGIC.md)
- [MODULE_4_GATE.md](../backend/docs/MODULE_4_GATE.md)
- [GATE_OUT_STATUS_UPDATE.md](../backend/docs/GATE_OUT_STATUS_UPDATE.md)

### **Frontend Docs:**
- [GATE_TIME_DISPLAY_LOGIC.md](../frontend/docs/GATE_TIME_DISPLAY_LOGIC.md)
- [GATE_DASHBOARD_UPDATE.md](../frontend/docs/GATE_DASHBOARD_UPDATE.md)
- [TOAST_IMPLEMENTATION_SUMMARY.md](../frontend/docs/TOAST_IMPLEMENTATION_SUMMARY.md)

## 🚀 Future Enhancements

### **Có thể mở rộng:**
- Thêm validation thời gian (time_out > time_in)
- Thêm tính năng sửa thời gian cho admin
- Thêm báo cáo thời gian xử lý trung bình
- Thêm cảnh báo khi thời gian xử lý quá lâu
- Thêm export thời gian ra Excel
- Thêm biểu đồ thống kê thời gian

## 🔧 Deployment

### **Backend Deployment:**
1. Chạy migration: `npx prisma migrate deploy`
2. Restart backend service
3. Verify API endpoints hoạt động

### **Frontend Deployment:**
1. Build frontend: `npm run build`
2. Deploy static files
3. Verify UI hiển thị thời gian đúng

### **Database Migration:**
```bash
# Chạy migration
cd backend
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

## 📈 Monitoring

### **Metrics to Track:**
- Số lượng requests được approve mỗi ngày
- Thời gian trung bình từ vào đến ra
- Tỷ lệ requests có thời gian đầy đủ
- Lỗi API approve/gate-out

### **Logs to Monitor:**
- Gate approve operations
- Gate out operations
- Database update errors
- Frontend display errors
