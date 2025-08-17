# 🔌 Request State Machine API Documentation

## Tổng quan

Tài liệu này mô tả các API endpoints mới được thêm vào để hỗ trợ Request State Machine. Tất cả endpoints đều yêu cầu authentication và authorization theo role.

## 🔐 Authentication

Tất cả API endpoints yêu cầu:
- **Authorization Header:** `Bearer <token>`
- **Content-Type:** `application/json`

## 📋 API Endpoints

### 1. Đặt lịch hẹn (Schedule Appointment)

**Endpoint:** `PATCH /requests/:id/schedule`

**Quyền:** SaleAdmin, SystemAdmin

**Mô tả:** Depot đặt lịch hẹn cho request đang ở trạng thái PENDING

**Request Body:**
```json
{
  "appointment_time": "2024-08-20T10:00:00Z",
  "appointment_location_type": "gate",
  "appointment_location_id": "GATE_01",
  "gate_ref": "REF123",
  "appointment_note": "Ghi chú lịch hẹn"
}
```

**Response (200):**
```json
{
  "id": "req_123",
  "status": "SCHEDULED",
  "appointment_time": "2024-08-20T10:00:00Z",
  "appointment_location_type": "gate",
  "appointment_location_id": "GATE_01",
  "gate_ref": "REF123",
  "appointment_note": "Ghi chú lịch hẹn",
  "updatedAt": "2024-08-16T21:30:00Z"
}
```

**Validation Errors:**
- `400` - Request không tồn tại
- `400` - Request không ở trạng thái PENDING
- `400` - Không có quyền đặt lịch hẹn
- `400` - Dữ liệu không hợp lệ

---

### 2. Bổ sung thông tin (Add Information)

**Endpoint:** `PATCH /requests/:id/add-info`

**Quyền:** CustomerAdmin, CustomerUser

**Mô tả:** Customer bổ sung thông tin cho request đang ở trạng thái SCHEDULED

**Request Body:**
```json
{
  "documents": [
    {
      "name": "invoice.pdf",
      "type": "INVOICE",
      "size": 1024000
    },
    {
      "name": "packing_list.pdf", 
      "type": "PACKING_LIST",
      "size": 512000
    }
  ],
  "notes": "Bổ sung hóa đơn và packing list"
}
```

**Response (200):**
```json
{
  "id": "req_123",
  "status": "SCHEDULED_INFO_ADDED",
  "attachments_count": 2,
  "updatedAt": "2024-08-16T21:30:00Z"
}
```

**Validation Errors:**
- `400` - Request không tồn tại
- `400` - Request không ở trạng thái SCHEDULED
- `400` - Không có quyền bổ sung thông tin
- `400` - Dữ liệu không hợp lệ

---

### 3. Chuyển tiếp sang Gate (Send to Gate)

**Endpoint:** `PATCH /requests/:id/send-to-gate`

**Quyền:** SaleAdmin, SystemAdmin

**Mô tả:** Depot chuyển tiếp request sang Gate để xử lý

**Request Body:**
```json
{}
```

**Response (200):**
```json
{
  "id": "req_123",
  "status": "SENT_TO_GATE",
  "updatedAt": "2024-08-16T21:30:00Z"
}
```

**Validation Errors:**
- `400` - Request không tồn tại
- `400` - Request không ở trạng thái SCHEDULED hoặc SCHEDULED_INFO_ADDED
- `400` - Không có quyền chuyển Gate

---

### 4. Hoàn tất Request (Complete Request)

**Endpoint:** `PATCH /requests/:id/complete`

**Quyền:** SaleAdmin, SystemAdmin, System

**Mô tả:** Hoàn tất xử lý request tại Gate

**Request Body:**
```json
{}
```

**Response (200):**
```json
{
  "id": "req_123",
  "status": "COMPLETED",
  "updatedAt": "2024-08-16T21:30:00Z"
}
```

**Validation Errors:**
- `400` - Request không tồn tại
- `400` - Request không ở trạng thái SENT_TO_GATE
- `400` - Không có quyền hoàn tất

---

### 5. Từ chối Request (Reject Request)

**Endpoint:** `PATCH /requests/:id/reject`

**Quyền:** SaleAdmin, SystemAdmin

**Mô tả:** Depot từ chối request với lý do

**Request Body:**
```json
{
  "reason": "Thiếu hồ sơ bắt buộc"
}
```

**Response (200):**
```json
{
  "id": "req_123",
  "status": "REJECTED",
  "rejected_reason": "Thiếu hồ sơ bắt buộc",
  "rejected_by": "user_456",
  "rejected_at": "2024-08-16T21:30:00Z",
  "updatedAt": "2024-08-16T21:30:00Z"
}
```

**Validation Errors:**
- `400` - Request không tồn tại
- `400` - Request không thể bị từ chối ở trạng thái hiện tại
- `400` - Không có quyền từ chối
- `400` - Lý do từ chối là bắt buộc

---

### 6. Lấy transitions hợp lệ (Get Valid Transitions)

**Endpoint:** `GET /requests/:id/transitions`

**Quyền:** CustomerAdmin, CustomerUser, SaleAdmin, SystemAdmin

**Mô tả:** Lấy danh sách các transitions hợp lệ cho request hiện tại

**Response (200):**
```json
[
  {
    "from": "SCHEDULED",
    "to": "SCHEDULED_INFO_ADDED",
    "allowedRoles": ["CustomerAdmin", "CustomerUser"],
    "requiresReason": false,
    "description": "Customer bổ sung thông tin"
  },
  {
    "from": "SCHEDULED", 
    "to": "SENT_TO_GATE",
    "allowedRoles": ["SaleAdmin", "SystemAdmin"],
    "requiresReason": false,
    "description": "Depot chuyển tiếp sang Gate"
  },
  {
    "from": "SCHEDULED",
    "to": "REJECTED", 
    "allowedRoles": ["SaleAdmin", "SystemAdmin"],
    "requiresReason": true,
    "description": "Depot từ chối request"
  }
]
```

---

### 7. Lấy thông tin trạng thái (Get State Info)

**Endpoint:** `GET /requests/state/:state/info`

**Quyền:** CustomerAdmin, CustomerUser, SaleAdmin, SystemAdmin

**Mô tả:** Lấy thông tin mô tả và màu sắc cho trạng thái

**Response (200):**
```json
{
  "state": "SCHEDULED",
  "description": "Đã đặt lịch hẹn",
  "color": "blue"
}
```

---

## 🔄 State Transitions Flow

### Luồng chính:
```
PENDING → SCHEDULED → SCHEDULED_INFO_ADDED → SENT_TO_GATE → COMPLETED
    ↓           ↓              ↓
  REJECTED   REJECTED       REJECTED
```

### Chi tiết transitions:

| From | To | Actor | Requires Reason | API Endpoint |
|------|----|-------|----------------|--------------|
| PENDING | SCHEDULED | SaleAdmin, SystemAdmin | ❌ | `PATCH /:id/schedule` |
| PENDING | REJECTED | SaleAdmin, SystemAdmin | ✅ | `PATCH /:id/reject` |
| SCHEDULED | SCHEDULED_INFO_ADDED | CustomerAdmin, CustomerUser | ❌ | `PATCH /:id/add-info` |
| SCHEDULED | SENT_TO_GATE | SaleAdmin, SystemAdmin | ❌ | `PATCH /:id/send-to-gate` |
| SCHEDULED | REJECTED | SaleAdmin, SystemAdmin | ✅ | `PATCH /:id/reject` |
| SCHEDULED_INFO_ADDED | SENT_TO_GATE | SaleAdmin, SystemAdmin | ❌ | `PATCH /:id/send-to-gate` |
| SCHEDULED_INFO_ADDED | REJECTED | SaleAdmin, SystemAdmin | ✅ | `PATCH /:id/reject` |
| SENT_TO_GATE | COMPLETED | SaleAdmin, SystemAdmin, System | ❌ | `PATCH /:id/complete` |

## 📊 Error Responses

### Standard Error Format:
```json
{
  "message": "Mô tả lỗi chi tiết",
  "code": "ERROR_CODE",
  "details": {
    "field": "additional_info"
  }
}
```

### Common Error Codes:
- `REQUEST_NOT_FOUND` - Request không tồn tại
- `INVALID_TRANSITION` - Transition không hợp lệ
- `INSUFFICIENT_PERMISSIONS` - Không đủ quyền
- `INVALID_STATUS` - Trạng thái không hợp lệ
- `REASON_REQUIRED` - Lý do bắt buộc
- `VALIDATION_ERROR` - Dữ liệu không hợp lệ

## 🔒 Security Considerations

### Role-based Access Control:
- **CustomerAdmin/CustomerUser:** Chỉ có thể add-info
- **SaleAdmin/SystemAdmin:** Có thể schedule, send-to-gate, complete, reject
- **System:** Chỉ có thể complete

### Validation Rules:
- Transition phải hợp lệ theo state machine
- Lý do bắt buộc khi reject
- Chỉ update appointment khi ở trạng thái SCHEDULED
- Không thể chuyển trực tiếp từ PENDING sang SENT_TO_GATE

## 📝 Examples

### Complete Flow Example:

1. **Customer tạo request:**
```bash
POST /requests
{
  "type": "IMPORT",
  "container_no": "ABCD1234567",
  "eta": "2024-08-25T10:00:00Z"
}
# Response: status: "PENDING"
```

2. **Depot đặt lịch hẹn:**
```bash
PATCH /requests/req_123/schedule
{
  "appointment_time": "2024-08-20T10:00:00Z",
  "appointment_location_type": "gate",
  "appointment_location_id": "GATE_01"
}
# Response: status: "SCHEDULED"
```

3. **Customer bổ sung thông tin:**
```bash
PATCH /requests/req_123/add-info
{
  "documents": [
    {"name": "invoice.pdf", "type": "INVOICE", "size": 1024000}
  ],
  "notes": "Bổ sung hóa đơn"
}
# Response: status: "SCHEDULED_INFO_ADDED"
```

4. **Depot chuyển Gate:**
```bash
PATCH /requests/req_123/send-to-gate
{}
# Response: status: "SENT_TO_GATE"
```

5. **System hoàn tất:**
```bash
PATCH /requests/req_123/complete
{}
# Response: status: "COMPLETED"
```

## 🧪 Testing

### Test Cases:
1. **Valid transitions** - Kiểm tra các transitions hợp lệ
2. **Invalid transitions** - Kiểm tra transitions không hợp lệ
3. **Role validation** - Kiểm tra quyền theo role
4. **Required fields** - Kiểm tra các field bắt buộc
5. **State validation** - Kiểm tra validation theo trạng thái

### Test Tools:
- Postman Collection
- Jest Unit Tests
- Integration Tests

---

**Ngày tạo:** 2024-08-16  
**Phiên bản:** 1.0.0  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành
