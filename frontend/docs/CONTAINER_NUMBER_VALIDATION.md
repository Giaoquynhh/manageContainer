# Container Number Validation - Frontend Documentation

## 📋 Tổng quan

Tính năng Container Number Validation ngăn chặn việc tạo request IMPORT với container number đã tồn tại trong hệ thống. Tính năng này đảm bảo tính nhất quán dữ liệu và tránh tình trạng duplicate container.

## 🎯 Mục đích

- **Ngăn chặn duplicate:** Không cho phép tạo request IMPORT với container number đã có
- **Đảm bảo tính nhất quán:** Mỗi container chỉ có một request active tại một thời điểm
- **Cải thiện UX:** Hiển thị thông báo lỗi rõ ràng cho user
- **Tự động hóa:** Validation được thực hiện tự động khi tạo request

## 🏗️ Implementation Details

### **Backend Validation Logic:**
```typescript
// Các trạng thái được coi là "active" (chưa hoàn thành)
const activeStatuses = [
  'PENDING',
  'PICK_CONTAINER', 
  'SCHEDULED',
  'SCHEDULED_INFO_ADDED',
  'FORWARDED',
  'SENT_TO_GATE',
  'GATE_IN',
  'CHECKING',
  'PENDING_ACCEPT',
  'ACCEPT',
  'CHECKED',
  'POSITIONED',
  'FORKLIFTING',
  'IN_YARD',
  'IN_CAR'
];

// 1. Container được coi là "đã tồn tại" nếu:
// - type: 'IMPORT'
// - container_no trùng với request khác
// - status trong danh sách active statuses
// - chưa bị xóa (soft delete)

// 2. Container được coi là "đã có trong bãi" nếu:
// - container_no có trong YardPlacement
// - status là 'HOLD' hoặc 'OCCUPIED'
// - removed_at là null (chưa bị xóa khỏi yard)
```

### **Frontend Error Handling:**
```typescript
// File: components/RequestForm.tsx (lines 150-200)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const formData = new FormData();
    formData.append('type', 'IMPORT');
    formData.append('container_no', containerNo);
    formData.append('eta', eta);
    
    // Upload files nếu có
    selectedFiles.forEach(file => {
      formData.append('documents', file);
    });
    
    const response = await fetch('/api/requests', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      // Hiển thị error message từ backend validation
      setMessage(error.message);
      return;
    }
    
    // Success - redirect hoặc refresh
    onSuccess();
    
  } catch (error) {
    setMessage('Có lỗi xảy ra khi tạo yêu cầu');
  }
};
```

### **Frontend File Mapping:**
- **Main Component:** `components/RequestForm.tsx`
  - `handleSubmit()` (lines 150-200) - Form submission với error handling
  - `handleFileChange()` (lines 80-120) - File upload handling
  - `removeFile()` (lines 130-140) - File management
- **Request Table:** `components/RequestTable.tsx`
  - `getStatusBadge()` (lines 63-86) - Status display
  - `handleDocumentClick()` (lines 101-110) - Document viewing
- **Pages:** `pages/Requests/Customer.tsx`
  - Main request management page
  - Integration với RequestForm component

## 🎨 UI/UX Design

### **Error Message Display:**
```tsx
{message && (
  <div className="error-message">
    <span className="error-icon">⚠️</span>
    <span className="error-text">{message}</span>
  </div>
)}
```

### **CSS Styling:**
```css
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  margin-top: 8px;
}

.error-icon {
  font-size: 16px;
}

.error-text {
  flex: 1;
}
```

## 🔧 API Integration

### **Request Endpoint:**
```typescript
// File: modules/requests/controller/RequestRoutes.ts (line 40)
POST /api/requests
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- type: 'IMPORT'
- container_no: string
- eta: string (ISO date)
- documents: File[] (optional)
```

### **Backend Processing:**
```typescript
// File: modules/requests/controller/RequestController.ts
async create(req: AuthRequest, res: Response) {
  // 1. Validate form data (lines 14-16)
  const { error, value } = createRequestSchema.validate(formData);
  
  // 2. Validate files (lines 18-36)
  if (files && files.length > 0) {
    // File validation logic
  }
  
  // 3. Call service với validation (line 38)
  const result = await service.createByCustomer(req.user!, value, files);
  
  // 4. Return response (line 39)
  return res.status(201).json(result);
}
```

### **Success Response:**
```json
{
  "id": "req_123",
  "type": "IMPORT",
  "container_no": "ISO1234",
  "status": "PENDING",
  "created_at": "2024-01-01T10:00:00Z"
}
```

### **Error Response:**
```json
{
  "message": "Container ISO1234 đã tồn tại trong hệ thống với trạng thái PENDING. Chỉ có thể tạo request mới khi container này không còn trong hệ thống."
}
```

## 🧪 Testing Scenarios

### **Test Case 1: Container đã tồn tại trong ServiceRequest**
```typescript
// Input
{
  type: 'IMPORT',
  container_no: 'ISO1234', // Đã tồn tại trong ServiceRequest
  eta: '2024-01-01T10:00:00Z'
}

// Expected Result
// Status: 400 Bad Request
// Message: "Container ISO1234 đã tồn tại trong hệ thống với trạng thái PENDING..."
// Backend: RequestService.validateContainerNumberNotExists() throws error
```

### **Test Case 2: Container đã có trong YardPlacement**
```typescript
// Input
{
  type: 'IMPORT',
  container_no: 'TEST1234', // Đã có trong YardPlacement
  eta: '2024-01-01T10:00:00Z'
}

// Expected Result
// Status: 400 Bad Request
// Message: "Container TEST1234 đã có trong bãi (Yard) với trạng thái OCCUPIED..."
// Backend: RequestService.validateContainerNumberNotExists() throws error
```

### **Test Case 3: Container mới**
```typescript
// Input
{
  type: 'IMPORT',
  container_no: 'ISO9999', // Mới - không có trong ServiceRequest và YardPlacement
  eta: '2024-01-01T10:00:00Z'
}

// Expected Result
// Status: 201 Created
// Response: Request object với status PENDING
// Backend: RequestService.validateContainerNumberNotExists() passes validation
```

### **Test Case 4: Request EXPORT (không validation)**
```typescript
// Input
{
  type: 'EXPORT',
  eta: '2024-01-01T10:00:00Z'
  // Không có container_no - không cần validation
}

// Expected Result
// Status: 201 Created
// Response: Request object với status PENDING
// Backend: RequestService.validateContainerNumberNotExists() không được gọi cho EXPORT
```

## 📊 Error Messages

### **Container đã tồn tại trong ServiceRequest:**
```
"Container {container_no} đã tồn tại trong hệ thống với trạng thái {status}. 
Chỉ có thể tạo request mới khi container này không còn trong hệ thống."
```

### **Container đã có trong Yard:**
```
"Container {container_no} đã có trong bãi (Yard) với trạng thái {status}. 
Chỉ có thể tạo request mới khi container này không còn trong bãi."
```

### **Container đã hoàn thành:**
```
"Container {container_no} đã hoàn thành quy trình và có thể tạo request mới."
```

### **Lỗi hệ thống:**
```
"Có lỗi xảy ra khi kiểm tra container. Vui lòng thử lại sau."
```

## 🚀 Future Enhancements

### **Short-term:**
- [ ] Real-time validation khi user nhập container number
- [ ] Gợi ý container number available
- [ ] Hiển thị thông tin container hiện tại (status, ngày tạo)
- [ ] Auto-complete cho container number

### **Long-term:**
- [ ] Bulk validation cho multiple containers
- [ ] Container history tracking
- [ ] Advanced search và filter
- [ ] Integration với external container database

## 📝 Changelog

### **Version 3.2.0 (2024-01-XX)**
- ✅ **NEW:** Container Number Validation cho request IMPORT
- ✅ **NEW:** Backend validation logic với active statuses
  - `RequestService.validateContainerNumberNotExists()` (lines 252-301)
  - ServiceRequest + YardPlacement validation
- ✅ **NEW:** Frontend error handling và display
  - `RequestForm.handleSubmit()` (lines 150-200)
  - Error message display với proper styling
- ✅ **NEW:** API integration với proper error responses
  - `RequestController.create()` (lines 8-43)
  - `RequestRoutes.POST /` (line 40)
- ✅ **NEW:** Comprehensive testing scenarios
  - ServiceRequest validation test cases
  - YardPlacement validation test cases
- ✅ **IMPROVED:** User experience với validation thông minh

---

**Ngày tạo:** 2024-01-XX  
**Phiên bản:** 3.2.0  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation
