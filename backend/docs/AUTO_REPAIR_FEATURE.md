# Tính năng Tự động tạo Phiếu sửa chữa

## 🎯 **Mục tiêu**

Khi container vào cổng với trạng thái "GATE_IN", hệ thống sẽ tự động tạo một phiếu sửa chữa với trạng thái "Chờ kiểm tra" (PENDING_APPROVAL).

## 🔄 **Workflow**

```
Container vào cổng (GATE_IN)
    ↓
Tự động tạo phiếu sửa chữa
    ↓
Trạng thái: PENDING_APPROVAL (Chờ kiểm tra)
    ↓
Nhân viên bảo trì kiểm tra và xử lý
```

## 🏗️ **Kiến trúc**

### **Backend (GateService)**
- **Method**: `createAutoRepairTicket()`
- **Trigger**: Khi container được approve vào cổng
- **Logic**: Chỉ áp dụng cho container loại `IMPORT`

### **Database Schema**
```prisma
model RepairTicket {
  id                  String       @id @default(cuid())
  code                String       @unique  // Format: AUTO-{container_no}-{timestamp}
  container_no        String?      // Container number
  created_by          String       // User ID của người approve gate
  status              RepairStatus @default(PENDING_APPROVAL)
  problem_description String       // Mô tả tự động
  estimated_cost      Float?       @default(0)
  manager_comment     String?      // "Tự động tạo khi container vào cổng"
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
}
```

## 📋 **Chi tiết Implementation**

### **1. Tự động tạo phiếu**
```typescript
private async createAutoRepairTicket(request: any, actorId: string): Promise<void> {
  const ticketCode = `AUTO-${request.container_no}-${Date.now()}`;
  
  await prisma.repairTicket.create({
    data: {
      code: ticketCode,
      container_no: request.container_no,
      created_by: actorId,
      status: 'PENDING_APPROVAL',
      problem_description: `Container ${request.container_no} đã vào cổng - cần kiểm tra và đánh giá tình trạng`,
      estimated_cost: 0,
      manager_comment: 'Tự động tạo khi container vào cổng'
    }
  });
}
```

### **2. Trigger points**
- **Method**: `approveGate()` - Khi approve request từ FORWARDED → GATE_IN
- **Method**: `acceptGate()` - Khi accept request từ FORWARDED → GATE_IN

### **3. Error handling**
- Nếu tạo phiếu thất bại, không ảnh hưởng đến quá trình approve gate
- Log error để debug nhưng không throw exception

## 🎨 **Frontend Features**

### **1. Badge đặc biệt**
- Phiếu tự động có badge "Tự động" màu vàng
- Mã phiếu bắt đầu bằng "AUTO-"

### **2. Thông báo**
- Hiển thị thông báo khi có phiếu tự động mới
- Màu sắc và icon đặc biệt để dễ nhận biết

### **3. Nút hành động**
- Nút "Bắt đầu kiểm tra" thay vì "Duyệt" cho phiếu tự động
- Màu xanh dương để phân biệt với phiếu thủ công

## 🔍 **Audit & Tracking**

### **Audit Log**
```typescript
await audit(actorId, 'REPAIR.AUTO_CREATED', 'RepairTicket', ticketCode, {
  container_no: request.container_no,
  request_id: request.id,
  auto_generated: true
});
```

### **Tracking Fields**
- `code`: Bắt đầu bằng "AUTO-"
- `manager_comment`: "Tự động tạo khi container vào cổng"
- `created_by`: User ID của người approve gate

## 🧪 **Testing**

### **Test Script**
```bash
# Chạy test script
node test-auto-repair.js
```

### **Test Cases**
1. **Container IMPORT vào cổng** → Tạo phiếu tự động
2. **Container EXPORT vào cổng** → Không tạo phiếu
3. **Error handling** → Không ảnh hưởng approve gate
4. **Audit log** → Ghi nhận đầy đủ

## 📊 **Monitoring**

### **Metrics cần theo dõi**
- Số lượng phiếu tự động được tạo
- Tỷ lệ thành công khi tạo phiếu tự động
- Thời gian xử lý từ GATE_IN → phiếu sửa chữa

### **Log Analysis**
```bash
# Tìm phiếu tự động
SELECT * FROM "RepairTicket" WHERE code LIKE 'AUTO-%';

# So sánh với ServiceRequest GATE_IN
SELECT 
  sr.container_no,
  sr.status,
  rt.code as repair_ticket
FROM "ServiceRequest" sr
LEFT JOIN "RepairTicket" rt ON sr.container_no = rt.container_no
WHERE sr.status = 'GATE_IN' AND sr.type = 'IMPORT';
```

## 🚀 **Future Enhancements**

### **1. Smart Problem Description**
- Phân tích lỗi thường gặp dựa trên container type
- Gợi ý vật tư cần thiết

### **2. Auto-assignment**
- Tự động gán nhân viên bảo trì dựa trên workload
- Priority scheduling

### **3. Integration với IoT**
- Sensor data từ container để đánh giá tình trạng
- Predictive maintenance

## ⚠️ **Lưu ý quan trọng**

1. **Performance**: Tạo phiếu tự động không được làm chậm quá trình approve gate
2. **Data consistency**: Đảm bảo container_no khớp giữa ServiceRequest và RepairTicket
3. **Error handling**: Không để lỗi tạo phiếu ảnh hưởng đến business flow chính
4. **Audit trail**: Ghi nhận đầy đủ để tracking và compliance

---

*Tài liệu được cập nhật lần cuối: 2024-08-23*  
*Version: 1.0.0 - Auto Repair Ticket Feature*

