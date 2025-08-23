# Tính năng Hiển thị trực tiếp Container vào Bảng Phiếu sửa chữa

## 🎯 **Mục tiêu**

Thay vì hiển thị container đang chờ trong pop-up riêng biệt, hệ thống sẽ hiển thị trực tiếp container vào bảng phiếu sửa chữa để người dùng có thể xử lý trực tiếp.

## 🔄 **Workflow mới**

```
Container vào cổng (GATE_IN)
    ↓
Hiển thị trực tiếp trong bảng phiếu sửa chữa
    ↓
Người dùng có thể:
    - Tạo phiếu sửa chữa (nút "Tạo phiếu")
    - Bỏ qua container (nút "Bỏ qua")
```

## 🏗️ **Kiến trúc**

### **Backend (MaintenanceService)**
- **Method**: `listRepairs()` - Kết hợp phiếu sửa chữa + container đang chờ
- **Method**: `createRepairFromContainer()` - Tạo phiếu từ container
- **Method**: `skipContainer()` - Bỏ qua container

### **Frontend**
- **Component**: `RepairTable` - Hiển thị cả phiếu và container
- **Badge**: Phân biệt loại item (Tự động, Chờ xử lý)
- **Actions**: Nút phù hợp cho từng loại

## 📋 **Chi tiết Implementation**

### **1. Backend - Kết hợp dữ liệu**
```typescript
async listRepairs(query: any) {
  // Lấy phiếu sửa chữa
  const repairs = await prisma.repairTicket.findMany({...});
  
  // Nếu filter PENDING_APPROVAL, thêm container đang chờ
  if (!query.status || query.status === 'PENDING_APPROVAL') {
    const pendingContainers = await prisma.serviceRequest.findMany({
      where: {
        status: 'GATE_IN',
        type: 'IMPORT',
        container_no: { notIn: repairs.map(r => r.container_no) }
      }
    });
    
    // Chuyển đổi format
    const containerRepairs = pendingContainers.map(container => ({
      id: `container-${container.id}`,
      code: `PENDING-${container.container_no}`,
      isContainer: true,
      // ... other fields
    }));
    
    return [...repairs, ...containerRepairs];
  }
  
  return repairs;
}
```

### **2. Frontend - Hiển thị và xử lý**
```typescript
// Badge phân biệt
{r.isContainer && (
  <span style={{ background: '#dbeafe', color: '#1e40af' }}>
    Chờ xử lý
  </span>
)}

// Nút hành động
{r.isContainer ? (
  <div>
    <button onClick={() => onApprove(r.id)}>Tạo phiếu</button>
    <button onClick={() => onReject(r.id)}>Bỏ qua</button>
  </div>
) : (
  // Nút cho phiếu sửa chữa thật
)}
```

## 🎨 **UI Features**

### **1. Badge phân loại**
- **Tự động**: Màu vàng - Phiếu tự động tạo khi container vào cổng
- **Chờ xử lý**: Màu xanh dương - Container đang chờ tạo phiếu

### **2. Thông tin hiển thị**
- **Container đang chờ**: Hiển thị thông tin tài xế, biển số xe
- **Phiếu sửa chữa**: Hiển thị thông tin phiếu bình thường

### **3. Nút hành động**
- **Container đang chờ**:
  - "Tạo phiếu" (xanh lá) - Tạo phiếu sửa chữa mới
  - "Bỏ qua" (đỏ) - Bỏ qua container
- **Phiếu sửa chữa**:
  - Nút duyệt/từ chối theo trạng thái

## 🔍 **Audit & Tracking**

### **Audit Log**
```typescript
// Tạo phiếu từ container
await audit(actor._id, 'REPAIR.CREATED_FROM_CONTAINER', 'RepairTicket', ticketId, {
  container_no: container.container_no,
  container_request_id: realContainerId,
  manual_created: true
});

// Bỏ qua container
await audit(actor._id, 'CONTAINER.SKIPPED', 'ServiceRequest', containerId, {
  container_no: container.container_no,
  reason: manager_comment,
  skipped_by: actor._id
});
```

### **Tracking Fields**
- `isContainer`: Flag phân biệt container đang chờ
- `id`: Format `container-{id}` cho container, `{id}` cho phiếu
- `code`: Format `PENDING-{container_no}` cho container

## 🧪 **Test Cases**

### **1. Hiển thị container đang chờ**
- Container GATE_IN → Hiển thị trong bảng với badge "Chờ xử lý"
- Không hiển thị container đã có phiếu sửa chữa

### **2. Tạo phiếu từ container**
- Nhấn "Tạo phiếu" → Tạo phiếu mới với code `MANUAL-{container_no}-{timestamp}`
- Container biến mất khỏi danh sách chờ

### **3. Bỏ qua container**
- Nhấn "Bỏ qua" → Container được đánh dấu đã xử lý
- Audit log ghi nhận hành động

## 📊 **Monitoring**

### **Metrics cần theo dõi**
- Số lượng container đang chờ xử lý
- Tỷ lệ container được tạo phiếu vs bỏ qua
- Thời gian xử lý từ GATE_IN → tạo phiếu

### **Log Analysis**
```sql
-- Tìm container đang chờ
SELECT * FROM "ServiceRequest" 
WHERE status = 'GATE_IN' AND type = 'IMPORT';

-- So sánh với phiếu sửa chữa
SELECT 
  sr.container_no,
  CASE WHEN rt.id IS NOT NULL THEN 'Có phiếu' ELSE 'Chưa có phiếu' END as status
FROM "ServiceRequest" sr
LEFT JOIN "RepairTicket" rt ON sr.container_no = rt.container_no
WHERE sr.status = 'GATE_IN' AND sr.type = 'IMPORT';
```

## 🚀 **Future Enhancements**

### **1. Bulk Actions**
- Chọn nhiều container để tạo phiếu hàng loạt
- Template phiếu sửa chữa cho từng loại container

### **2. Auto-assignment**
- Tự động gán nhân viên bảo trì dựa trên workload
- Priority scheduling cho container khẩn cấp

### **3. Integration với IoT**
- Sensor data để đánh giá tình trạng container
- Predictive maintenance recommendations

## ⚠️ **Lưu ý quan trọng**

1. **Performance**: Kết hợp dữ liệu không làm chậm response time
2. **Data consistency**: Đảm bảo container_no khớp giữa ServiceRequest và RepairTicket
3. **User experience**: Giao diện rõ ràng phân biệt container và phiếu
4. **Audit trail**: Ghi nhận đầy đủ để tracking và compliance

---

*Tài liệu được cập nhật lần cuối: 2024-08-23*  
*Version: 1.0.0 - Direct Container Display Feature*

