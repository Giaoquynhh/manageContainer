# Auto Time Fill Logic - Logic tự động điền thời gian

## 🎯 Tổng quan

Tài liệu này mô tả logic tự động điền thời gian vào và ra cổng trong hệ thống Gate Management. Thời gian sẽ được tự động điền bởi backend khi trạng thái request thay đổi, không cần người dùng nhập thủ công.

## 🔄 Logic tự động điền thời gian

### **Thời gian vào (time_in)**
- **Khi nào**: Khi request chuyển từ `FORWARDED` → `GATE_IN`
- **API**: `PATCH /gate/requests/:id/approve`
- **Tự động điền**: `time_in = current_timestamp`
- **Lưu trữ**: Database field `time_in` và `history.gate_approve.time_in`

### **Thời gian ra (time_out)**
- **Khi nào**: Khi request chuyển từ `IN_YARD` hoặc `IN_CAR` → `GATE_OUT`
- **API**: `PATCH /gate/requests/:id/gate-out`
- **Tự động điền**: `time_out = current_timestamp`
- **Lưu trữ**: Database field `time_out` và `history.gate_out.time_out`

## 🏗️ Thay đổi kỹ thuật

### **1. Database Schema**

#### **ServiceRequest Model**
```prisma
model ServiceRequest {
  // ... existing fields
  time_in         DateTime?  // Thời gian vào cổng
  time_out        DateTime?  // Thời gian ra cổng
  gate_checked_at DateTime?  // Thời gian Gate kiểm tra (khác với time_in)
  // ... other fields
}
```

#### **Migration**
```sql
-- Migration: 20250906110613_add_time_in_time_out_fields
ALTER TABLE "ServiceRequest" 
ADD COLUMN "time_in" TIMESTAMP(3),
ADD COLUMN "time_out" TIMESTAMP(3);
```

### **2. Backend Implementation**

#### **GateService.ts - approveGate()**
```typescript
async approveGate(requestId: string, actorId: string, data?: GateApproveData): Promise<any> {
  const currentTime = new Date();
  
  const updatedRequest = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: newStatus,
      gate_checked_at: currentTime,
      gate_checked_by: actorId,
      // Tự động điền thời gian vào khi chuyển sang GATE_IN
      time_in: newStatus === 'GATE_IN' ? currentTime : null,
      // Lưu thông tin tài xế và biển số xe
      driver_name: data?.driver_name || null,
      license_plate: data?.license_plate || null,
      history: {
        ...(request.history as any || {}),
        gate_approve: {
          ...(request as any).history?.gate_approve,
          driver_name: data?.driver_name || null,
          license_plate: data?.license_plate || null,
          approved_at: currentTime.toISOString(),
          time_in: newStatus === 'GATE_IN' ? currentTime.toISOString() : null
        }
      }
    }
  });
}
```

#### **GateService.ts - gateOut()**
```typescript
async gateOut(requestId: string, actorId: string): Promise<any> {
  const currentTime = new Date();
  
  const updatedRequest = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: 'GATE_OUT',
      // Tự động điền thời gian ra khi chuyển sang GATE_OUT
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

### **3. API Endpoints**

#### **Gate Approve**
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

#### **Gate Out**
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

## 🔄 Workflow hoàn chỉnh

### **Import Request Workflow:**
```
1. FORWARDED → GATE_IN (time_in tự động điền)
2. GATE_IN → IN_YARD (không thay đổi time)
3. IN_YARD → GATE_OUT (time_out tự động điền)
```

### **Export Request Workflow:**
```
1. FORWARDED → GATE_IN (time_in tự động điền)
2. GATE_IN → IN_CAR (không thay đổi time)
3. IN_CAR → GATE_OUT (time_out tự động điền)
```

## 📊 Database Queries

### **Lấy requests với thời gian:**
```sql
SELECT 
  id,
  container_no,
  type,
  status,
  time_in,
  time_out,
  gate_checked_at,
  driver_name,
  license_plate
FROM "ServiceRequest" 
WHERE status IN ('GATE_IN', 'GATE_OUT', 'IN_YARD', 'IN_CAR')
ORDER BY created_at DESC;
```

### **Thống kê thời gian:**
```sql
-- Thời gian trung bình từ vào đến ra
SELECT 
  AVG(EXTRACT(EPOCH FROM (time_out - time_in))/3600) as avg_hours_in_yard
FROM "ServiceRequest" 
WHERE time_in IS NOT NULL 
  AND time_out IS NOT NULL 
  AND status = 'GATE_OUT';
```

## 🎯 Business Logic

### **Tại sao tự động điền thời gian:**
1. **Chính xác**: Thời gian được lấy từ server, không phụ thuộc vào thời gian client
2. **Nhất quán**: Tất cả requests đều có cùng format thời gian
3. **Đơn giản**: Người dùng không cần nhập thời gian thủ công
4. **Audit**: Có thể theo dõi chính xác thời gian xử lý

### **Validation:**
- `time_in` chỉ được điền khi chuyển sang `GATE_IN`
- `time_out` chỉ được điền khi chuyển sang `GATE_OUT`
- Không cho phép sửa đổi thời gian sau khi đã điền
- Thời gian được lưu theo UTC và hiển thị theo timezone local

## 🔧 Testing

### **Test Cases:**
1. **Approve Request**: Kiểm tra `time_in` được điền đúng
2. **Gate Out**: Kiểm tra `time_out` được điền đúng
3. **Invalid Status**: Không điền thời gian cho trạng thái không hợp lệ
4. **Timezone**: Kiểm tra thời gian hiển thị đúng timezone

### **Test Script:**
```typescript
// Test approve request
const approveResponse = await api.patch('/gate/requests/req_123/approve', {
  driver_name: 'Test Driver',
  license_plate: 'TEST-123'
});

expect(approveResponse.data.time_in).toBeDefined();
expect(approveResponse.data.status).toBe('GATE_IN');

// Test gate out
const gateOutResponse = await api.patch('/gate/requests/req_123/gate-out');
expect(gateOutResponse.data.time_out).toBeDefined();
expect(gateOutResponse.data.status).toBe('GATE_OUT');
```

## 📚 Tài liệu liên quan

- [MODULE_4_GATE.md](./MODULE_4_GATE.md)
- [GATE_OUT_STATUS_UPDATE.md](./GATE_OUT_STATUS_UPDATE.md)
- [REQUEST_STATE_MACHINE_API.md](./REQUEST_STATE_MACHINE_API.md)

## 🚀 Future Enhancements

### **Có thể mở rộng:**
- Thêm validation thời gian (time_out phải sau time_in)
- Thêm tính năng sửa thời gian cho admin
- Thêm báo cáo thời gian xử lý trung bình
- Thêm cảnh báo khi thời gian xử lý quá lâu
