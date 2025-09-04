# Container Duplicate Prevention - Logic Lọc Trùng Container

## 📋 Tổng quan

Tài liệu này mô tả chi tiết logic lọc trùng container trong hệ thống Smartlog Container Manager, bao gồm ánh xạ file code và flow xử lý.

## 🎯 Mục đích

Ngăn chặn việc tạo request IMPORT với container number đã tồn tại trong:
1. **ServiceRequest** với trạng thái active
2. **YardPlacement** với trạng thái HOLD/OCCUPIED

## 🏗️ Kiến trúc Logic

### **Backend Flow:**
```
Request Creation → Validation → Database Check → Response
```

### **Frontend Flow:**
```
User Input → Form Submit → API Call → Error Display
```

## 📁 File Mapping

### **Backend Files:**
```
modules/requests/service/RequestService.ts
├── validateContainerNumberNotExists() (lines 252-301)
├── createByCustomer() (lines 11-77)
└── createBySaleAdmin() (lines 79-88)

modules/requests/controller/RequestController.ts
├── create() (lines 8-43)
└── createBySale() (lines 44-48)

modules/requests/controller/RequestRoutes.ts
└── POST / (line 40)
```

### **Frontend Files:**
```
components/RequestForm.tsx
├── handleSubmit() (lines 150-200)
├── handleFileChange() (lines 80-120)
└── removeFile() (lines 130-140)

components/RequestTable.tsx
├── getStatusBadge() (lines 63-86)
└── handleDocumentClick() (lines 101-110)

pages/Requests/Customer.tsx
└── Main request management page
```

## 🔍 Logic Chi Tiết

### **1. ServiceRequest Validation:**
```typescript
// File: modules/requests/service/RequestService.ts (lines 273-287)
const existingRequest = await prisma.serviceRequest.findFirst({
  where: {
    container_no: containerNo,
    type: 'IMPORT',
    status: { in: activeStatuses },
    depot_deleted_at: null,
    customer_deleted_at: null
  }
});
```

**Active Statuses:**
- `PENDING`, `PICK_CONTAINER`, `SCHEDULED`, `SCHEDULED_INFO_ADDED`
- `FORWARDED`, `SENT_TO_GATE`, `GATE_IN`, `CHECKING`
- `PENDING_ACCEPT`, `ACCEPT`, `CHECKED`, `POSITIONED`
- `FORKLIFTING`, `IN_YARD`, `IN_CAR`

### **2. YardPlacement Validation:**
```typescript
// File: modules/requests/service/RequestService.ts (lines 289-300)
const existingYardPlacement = await prisma.yardPlacement.findFirst({
  where: {
    container_no: containerNo,
    status: { in: ['HOLD', 'OCCUPIED'] },
    removed_at: null
  }
});
```

**Yard Statuses:**
- `HOLD` - Container đang được giữ chỗ
- `OCCUPIED` - Container đã chiếm chỗ

## 🚨 Error Messages

### **ServiceRequest Conflict:**
```
"Container {container_no} đã tồn tại trong hệ thống với trạng thái {status}. 
Chỉ có thể tạo request mới khi container này không còn trong hệ thống."
```

### **YardPlacement Conflict:**
```
"Container {container_no} đã có trong bãi (Yard) với trạng thái {status}. 
Chỉ có thể tạo request mới khi container này không còn trong bãi."
```

## 🧪 Test Cases

### **Test Case 1: ServiceRequest Conflict**
```typescript
// Input
{ type: 'IMPORT', container_no: 'ISO1234' }
// Expected: 400 Bad Request
// Message: "Container ISO1234 đã tồn tại trong hệ thống..."
```

### **Test Case 2: YardPlacement Conflict**
```typescript
// Input
{ type: 'IMPORT', container_no: 'TEST1234' }
// Expected: 400 Bad Request
// Message: "Container TEST1234 đã có trong bãi (Yard)..."
```

### **Test Case 3: Success Case**
```typescript
// Input
{ type: 'IMPORT', container_no: 'ISO9999' }
// Expected: 201 Created
// Response: Request object
```

### **Test Case 4: EXPORT Request**
```typescript
// Input
{ type: 'EXPORT', eta: '2024-01-01T10:00:00Z' }
// Expected: 201 Created
// Note: Không cần validation container
```

## 📊 Database Schema

### **ServiceRequest Table:**
```sql
CREATE TABLE "ServiceRequest" (
  id TEXT PRIMARY KEY,
  container_no TEXT,
  type TEXT CHECK (type IN ('IMPORT', 'EXPORT', 'CONVERT')),
  status TEXT,
  depot_deleted_at TIMESTAMP,
  customer_deleted_at TIMESTAMP
);
```

### **YardPlacement Table:**
```sql
CREATE TABLE "YardPlacement" (
  id TEXT PRIMARY KEY,
  slot_id TEXT,
  container_no TEXT,
  status TEXT CHECK (status IN ('HOLD', 'OCCUPIED', 'REMOVED')),
  removed_at TIMESTAMP
);
```

## 🔄 API Endpoints

### **Create Request:**
```http
POST /api/requests
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- type: 'IMPORT'
- container_no: string
- eta: string (ISO date)
- documents: File[] (optional)
```

### **Response Examples:**
```json
// Success
{
  "id": "req_123",
  "type": "IMPORT",
  "container_no": "ISO9999",
  "status": "PENDING",
  "created_at": "2024-01-01T10:00:00Z"
}

// Error
{
  "message": "Container ISO1234 đã tồn tại trong hệ thống với trạng thái PENDING..."
}
```

## 🎨 Frontend Integration

### **Error Display:**
```tsx
{message && (
  <div className="error-message">
    <span className="error-icon">⚠️</span>
    <span className="error-text">{message}</span>
  </div>
)}
```

### **Form Submission:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const formData = new FormData();
    formData.append('type', 'IMPORT');
    formData.append('container_no', containerNo);
    formData.append('eta', eta);
    
    const response = await fetch('/api/requests', {
      method: 'POST',
      body: formData,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      setMessage(error.message);
      return;
    }
    
    onSuccess();
  } catch (error) {
    setMessage('Có lỗi xảy ra khi tạo yêu cầu');
  }
};
```

## 📈 Performance Considerations

### **Database Indexes:**
```sql
-- ServiceRequest indexes
CREATE INDEX idx_service_request_container_no ON "ServiceRequest"(container_no);
CREATE INDEX idx_service_request_status ON "ServiceRequest"(status);
CREATE INDEX idx_service_request_type ON "ServiceRequest"(type);

-- YardPlacement indexes
CREATE INDEX idx_yard_placement_container_no ON "YardPlacement"(container_no);
CREATE INDEX idx_yard_placement_status ON "YardPlacement"(status);
```

### **Query Optimization:**
- Sử dụng `findFirst()` thay vì `findMany()` để tối ưu performance
- Index trên `container_no` và `status` để tăng tốc query
- Soft delete check để tránh false positive

## 🚀 Future Enhancements

### **Short-term:**
- [ ] Real-time validation khi user nhập container number
- [ ] Gợi ý container number available
- [ ] Hiển thị thông tin container hiện tại

### **Long-term:**
- [ ] Bulk validation cho multiple containers
- [ ] Container history tracking
- [ ] Advanced search và filter
- [ ] Integration với external container database

---

**Ngày tạo:** 2024-01-XX  
**Phiên bản:** 3.2.0  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation và documentation
