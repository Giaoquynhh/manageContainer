# Tính năng "Bắt đầu kiểm tra" Container

## 🎯 **Mục tiêu**

Khi nhấn nút "Bắt đầu kiểm tra" cho container đang chờ, hệ thống sẽ:
1. Chuyển trạng thái container từ `GATE_IN` thành `CHECKING`
2. Tạo phiếu sửa chữa với trạng thái "Đang kiểm tra" (`CHECKING`)
3. Hiển thị 2 nút: "Đạt chuẩn" / "Không đạt chuẩn" để đánh giá kết quả kiểm tra
4. Khi bấm "Không đạt chuẩn", hiển thị 2 lựa chọn: "Có thể sửa chữa" / "Không thể sửa chữa"

## 🔄 **Workflow mới**

```
Container GATE_IN (đang chờ)
    ↓
Nhấn "Bắt đầu kiểm tra"
    ↓
Container → CHECKING
    ↓
Tạo phiếu sửa chữa → CHECKING
    ↓
Nhân viên bảo trì kiểm tra
    ↓
Nhấn "Đạt chuẩn" hoặc "Không đạt chuẩn"
    ↓
Đạt chuẩn: Container → COMPLETED
    ↓
Không đạt chuẩn: Hiển thị 2 lựa chọn
    ↓
Có thể sửa chữa: Container → REPAIRING
    ↓
Không thể sửa chữa: Container → REJECTED
```

## 🏗️ **Kiến trúc**

### **Backend (MaintenanceService)**
- **Method**: `createRepairFromContainer()` - Xử lý logic bắt đầu kiểm tra
- **Transaction**: Đảm bảo tính nhất quán giữa container và phiếu
- **Audit Log**: Ghi nhận đầy đủ các bước thực hiện

### **Frontend**
- **Button**: "Bắt đầu kiểm tra" thay vì "Tạo phiếu"
- **Message**: Thông báo phù hợp với hành động mới
- **Lựa chọn**: Hiển thị 2 button "Có thể sửa chữa" / "Không thể sửa chữa" trực tiếp trong bảng

## 📋 **Chi tiết Implementation**

### **1. Backend - Logic xử lý**
```typescript
private async createRepairFromContainer(actor: any, containerId: string, manager_comment?: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Cập nhật trạng thái container thành CHECKING
    await tx.serviceRequest.update({
      where: { id: realContainerId },
      data: { 
        status: 'CHECKING',
        history: {
          maintenance_start: {
            started_at: new Date().toISOString(),
            started_by: actor._id,
            action: 'Bắt đầu kiểm tra'
          }
        }
      }
    });

    // 2. Tạo phiếu sửa chữa với trạng thái UNDER_INSPECTION
    const repairTicket = await tx.repairTicket.create({
      data: {
        code: `MANUAL-${container.container_no}-${Date.now()}`,
        container_no: container.container_no,
        status: 'UNDER_INSPECTION', // Trạng thái "Đang kiểm tra"
        problem_description: `Container ${container.container_no} - đang được kiểm tra và đánh giá tình trạng`,
        manager_comment: 'Bắt đầu kiểm tra từ container đang chờ'
      }
    });

    // 3. Audit log
    await audit(actor._id, 'CONTAINER.MAINTENANCE_STARTED', 'ServiceRequest', realContainerId, {...});
    await audit(actor._id, 'REPAIR.CREATED_FROM_CONTAINER', 'RepairTicket', repairTicket.id, {...});

    return repairTicket;
  });
}
```

### **2. Frontend - Giao diện**
```typescript
// Nút hành động cho container đang chờ
{r.isContainer ? (
  <div>
    <button onClick={() => onApprove(r.id)}>
      Bắt đầu kiểm tra
    </button>
    <button onClick={() => onReject(r.id)}>
      Bỏ qua
    </button>
  </div>
) : (
  // Nút cho phiếu sửa chữa thật
)}
```

## 🎨 **UI Features**

### **1. Nút hành động**
- **"Bắt đầu kiểm tra"** (xanh lá) - Bắt đầu quy trình kiểm tra
- **"Đạt chuẩn"** (xanh lá) - Xác nhận container đạt chuẩn kiểm tra
- **"Không đạt chuẩn"** (đỏ) - Xác nhận container không đạt chuẩn kiểm tra

### **2. Thông báo**
- **Trước khi bắt đầu**: "Container đang chờ bắt đầu kiểm tra"
- **Sau khi bắt đầu**: "Đã bắt đầu kiểm tra container và tạo phiếu sửa chữa"
- **Đạt chuẩn**: "Đã xác nhận container đạt chuẩn kiểm tra"
- **Không đạt chuẩn**: "Đã xác nhận container không đạt chuẩn kiểm tra"

### **3. Mô tả vấn đề**
- **Container đang chờ**: "Container {no} đang chờ bắt đầu kiểm tra - nhấn 'Bắt đầu kiểm tra' để tạo phiếu sửa chữa"

## 🔍 **Audit & Tracking**

### **Audit Log**
```typescript
// Bắt đầu kiểm tra container
await audit(actor._id, 'CONTAINER.MAINTENANCE_STARTED', 'ServiceRequest', containerId, {
  container_no: container.container_no,
  new_status: 'CHECKING',
  repair_ticket_id: repairTicket.id,
  action: 'Bắt đầu kiểm tra'
});

// Tạo phiếu sửa chữa
await audit(actor._id, 'REPAIR.CREATED_FROM_CONTAINER', 'RepairTicket', ticketId, {
  container_no: container.container_no,
  container_request_id: realContainerId,
  manual_created: true,
  initial_status: 'UNDER_INSPECTION'
});
```

### **Tracking Fields**
- **Container**: `status: CHECKING` + `history.maintenance_start`
- **Phiếu sửa chữa**: `status: UNDER_INSPECTION` + `manager_comment`

## 🧪 **Test Cases**

### **1. Bắt đầu kiểm tra thành công**
- Container GATE_IN → Nhấn "Bắt đầu kiểm tra"
- Container chuyển thành CHECKING
- Tạo phiếu sửa chữa với status UNDER_INSPECTION
- Container biến mất khỏi danh sách chờ

### **2. Kiểm tra trạng thái**
- Container không còn hiển thị với status GATE_IN
- Phiếu sửa chữa hiển thị với status "Đang kiểm tra"
- Audit log ghi nhận đầy đủ

### **3. Xử lý lỗi**
- Container không tồn tại → Error message
- Container không ở trạng thái GATE_IN → Error message
- Transaction rollback nếu có lỗi

## 📊 **Monitoring**

### **Metrics cần theo dõi**
- Số lượng container chuyển từ GATE_IN → CHECKING
- Thời gian xử lý từ GATE_IN → CHECKING
- Tỷ lệ container được bắt đầu kiểm tra vs bỏ qua

### **Log Analysis**
```sql
-- Tìm container đã bắt đầu kiểm tra
SELECT 
  sr.container_no,
  sr.status,
  rt.code as repair_ticket,
  rt.status as repair_status
FROM "ServiceRequest" sr
LEFT JOIN "RepairTicket" rt ON sr.container_no = rt.container_no
WHERE sr.status = 'CHECKING' AND sr.type = 'IMPORT';

-- So sánh trạng thái
SELECT 
  sr.status as container_status,
  rt.status as repair_status,
  COUNT(*) as count
FROM "ServiceRequest" sr
LEFT JOIN "RepairTicket" rt ON sr.container_no = rt.container_no
WHERE sr.type = 'IMPORT'
GROUP BY sr.status, rt.status;
```

## 🚀 **Future Enhancements**

### **1. Auto-assignment**
- Tự động gán nhân viên bảo trì khi bắt đầu kiểm tra
- Priority scheduling dựa trên loại container

### **2. Workflow Automation**
- Tự động chuyển trạng thái theo thời gian
- Reminder cho nhân viên bảo trì

### **3. Integration với IoT**
- Sensor data để đánh giá tình trạng container
- Predictive maintenance recommendations

## ⚠️ **Lưu ý quan trọng**

1. **Transaction**: Sử dụng Prisma transaction để đảm bảo tính nhất quán
2. **Status Flow**: GATE_IN → CHECKING → (các trạng thái khác)
3. **Audit Trail**: Ghi nhận đầy đủ để tracking và compliance
4. **Error Handling**: Rollback transaction nếu có lỗi xảy ra

---

*Tài liệu được cập nhật lần cuối: 2024-08-23*  
*Version: 1.0.0 - Start Inspection Feature*
