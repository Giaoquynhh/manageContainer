# Module 3 — Quản lý Yêu cầu Dịch vụ & Chứng từ

Mục tiêu: quản lý vòng đời yêu cầu dịch vụ container (tạo → xử lý → hoàn tất), và quản lý chứng từ (EIR/LOLO/Hóa đơn) kèm version. Phân quyền: Customer (Admin/User), SaleAdmin, Accountant.

## 1) Data model (Prisma)
- `ServiceRequest(id, tenant_id, created_by, type, container_no, eta, status, history, createdAt, updatedAt)`
- `DocumentFile(id, request_id, type, name, size, version, uploader_id, storage_key, createdAt, deleted_at?, deleted_by?, delete_reason?)`
  - Type: EIR | LOLO | INVOICE | SUPPLEMENT | INITIAL_DOC
- `PaymentRequest(id, request_id, created_by, status, createdAt)`

Status: PENDING | RECEIVED | SCHEDULED | SCHEDULED_INFO_ADDED | FORWARDED | SENT_TO_GATE | REJECTED | COMPLETED | EXPORTED | IN_YARD | LEFT_YARD

## 2) RBAC
- CustomerAdmin/CustomerUser: tạo/list yêu cầu trong tenant; xem chứng từ của tenant; upload tài liệu bổ sung khi status = SCHEDULED.
- SaleAdmin: nhận/từ chối yêu cầu; tạo mới thay khách; upload/xóa EIR/LOLO; gửi yêu cầu thanh toán; chuyển tiếp yêu cầu sau khi nhận tài liệu bổ sung.
- Accountant: upload/xóa INVOICE; xem requests/docs.

## 3) API
Base: `/requests` (JWT)

### 3.1. Tạo yêu cầu
- Customer (tạo):
  - `POST /requests`
  - Body: `{ type: 'IMPORT'|'EXPORT'|'CONVERT', container_no, eta? }`
  - 201 → Request PENDING
- SaleAdmin (tạo thay khách):
  - `POST /requests` (role=SaleAdmin) → status `RECEIVED`

### 3.2. Danh sách/Tra cứu
- `GET /requests?type=&status=&page=&limit=`
  - Customer: auto filter theo tenant_id
  - SaleAdmin/Accountant: xem tất cả

### 3.3. Cập nhật trạng thái (Depot)
- `PATCH /requests/:id/status`
  - Body: `{ status: 'RECEIVED'|'REJECTED'|'COMPLETED'|'EXPORTED', reason? }`
  - RBAC: SaleAdmin
  - Luồng trạng thái hợp lệ (state machine):
    - `PENDING → SCHEDULED | REJECTED`
    - `SCHEDULED → SCHEDULED_INFO_ADDED | FORWARDED | REJECTED`
    - `SCHEDULED_INFO_ADDED → FORWARDED | REJECTED`
    - `FORWARDED → COMPLETED | SENT_TO_GATE`
    - `SENT_TO_GATE → COMPLETED`
    - `COMPLETED → EXPORTED | IN_YARD`
    - `IN_YARD → LEFT_YARD`
    - `LEFT_YARD`/`EXPORTED`/`REJECTED` là trạng thái cuối (không chuyển tiếp)
  - Yêu cầu nhập `reason` khi chuyển sang `REJECTED`

### 3.4. Reject request (Depot)
- `PATCH /requests/:id/reject`
  - Body: `{ reason?: string }`
  - RBAC: SaleAdmin, SystemAdmin
  - Chỉ cho phép reject khi `status IN ('PENDING','RECEIVED','IN_YARD')`
  - Cập nhật: `status='REJECTED'`, `rejected_reason`, `rejected_by`, `rejected_at`

### 3.5. Soft-delete theo scope
- `DELETE /requests/:id?scope=depot|customer`
  - RBAC: Tất cả roles (theo scope)
  - Depot: chỉ xóa `REJECTED`, `COMPLETED`, `EXPORTED`
  - Customer: chỉ xóa `REJECTED` (và thuộc tenant của họ)
  - Set `depot_deleted_at` hoặc `customer_deleted_at` = now()

### 3.6. Restore theo scope
- `POST /requests/:id/restore?scope=depot|customer`
  - RBAC: Tất cả roles (theo scope)
  - Reset `depot_deleted_at` hoặc `customer_deleted_at` = null

### 3.7. Chứng từ
- Upload (AC1/AC5):
  - `POST /requests/:id/docs` (multipart: `file`, body: `{ type: 'EIR'|'LOLO'|'INVOICE'|'SUPPLEMENT' }`)
  - EIR/LOLO/INVOICE: chỉ khi status ∈ { COMPLETED, EXPORTED }
  - SUPPLEMENT: chỉ khi status = SCHEDULED (Customer only)
  - **Tự động chuyển trạng thái:** `SCHEDULED → FORWARDED` sau khi upload thành công
  - **State Machine validation:** Sử dụng `RequestStateMachine` để validate và execute transitions
  - **Enhanced logging:** Detailed logs cho debugging và monitoring
  - **Graceful degradation:** Nếu transition thất bại, upload vẫn thành công
  - Mimetype: pdf/jpeg/png, size ≤ 10MB → version tăng tự động (v1, v2, ...)
  - RBAC: EIR/LOLO (SaleAdmin), INVOICE (Accountant), SUPPLEMENT (CustomerAdmin/CustomerUser)
- Upload khi tạo request (Customer):
  - `POST /requests` (multipart: `document`, body: `{ type, container_no, eta? }`)
  - File được lưu với type `INITIAL_DOC`
  - Hỗ trợ: PDF, JPG, PNG (tối đa 10MB)
- Danh sách:
  - `GET /requests/:id/docs?type=SUPPLEMENT` (filter theo type)
  - RBAC: SaleAdmin/Accountant/Customer* (tenant scope)
- Serve files:
  - `GET /requests/documents/:filename`
  - Trả về file từ thư mục uploads
  - Không cần authentication (public access)
- Xóa (AC4):
  - `DELETE /requests/:id/docs/:docId` (Body: `{reason}` optional)
  - RBAC: người upload, hoặc SystemAdmin/BusinessAdmin/SaleAdmin/Accountant
  - Soft-delete: lưu `deleted_at/by/reason`; audit

### 3.8. Yêu cầu thanh toán (US 3.4)
- `POST /requests/:id/payment-request` (SaleAdmin)
  - Chỉ cho phép khi `status = COMPLETED`
  - Trả `PaymentRequest` status `SENT` → Accountant tiếp nhận (luồng tiếp theo sẽ mở rộng)

### 3.9. Tài liệu bổ sung & Hành động Depot
- Upload tài liệu bổ sung (Customer):
  - `POST /requests/:id/docs` với `type: 'SUPPLEMENT'`
  - Chỉ khi status = SCHEDULED
  - RBAC: CustomerAdmin/CustomerUser (tenant scope)
- Danh sách tài liệu bổ sung:
  - `GET /requests/:id/docs?type=SUPPLEMENT`
  - Customer: chỉ xem file của tenant mình
  - Depot: xem tất cả file
- Chuyển tiếp yêu cầu (Depot):
  - `PATCH /requests/:id/status` với `status: 'FORWARDED'`
  - RBAC: SaleAdmin/SystemAdmin
  - Chỉ khi status = SCHEDULED
- Từ chối yêu cầu (Depot):
  - `PATCH /requests/:id/reject` với `reason`
  - RBAC: SaleAdmin/SystemAdmin
  - Chỉ khi status ∈ {SCHEDULED, RECEIVED}

## 4) Soft-delete theo scope
- **Mục tiêu**: Cho phép Kho và Khách hàng xóa/ẩn request theo phạm vi riêng
- **Cơ chế**: Sử dụng `depot_deleted_at` và `customer_deleted_at` để track soft-delete
- **Quy tắc**:
  - Depot: có thể xóa `REJECTED`, `COMPLETED`, `EXPORTED`
  - Customer: chỉ có thể xóa `REJECTED` (và thuộc tenant của họ)
  - Request vẫn tồn tại trong DB, chỉ ẩn theo scope tương ứng
  - Audit log ghi lại hành động `REQUEST.DELETED` và `REQUEST.RESTORED`

## 5) Lưu trữ file
- Demo: lưu local tại `backend/uploads/` với tên `{timestamp}_{request_id}{extension}` (cấu hình trong `RequestRoutes.ts`).
- File được lưu với `storage_key` trong database để tracking.
- API endpoint `/requests/documents/:filename` để serve files trực tiếp.
- Sản phẩm: thay bằng S3/Azure Blob + signed URL.

## 6) Audit
- `REQUEST.CREATED|RECEIVED|REJECTED|COMPLETED|EXPORTED`
- `DOC.UPLOADED|DOC.DELETED`
- `PAYMENT.SENT`

## 6.1) Tính năng xem ảnh (Image Viewer)
- **Frontend**: Modal popup hiển thị ảnh trực tiếp khi click vào document badge
- **Hỗ trợ định dạng**: JPG, JPEG, PNG, GIF, BMP, WEBP
- **File không phải ảnh**: Hiển thị thông tin file + link tải xuống
- **API**: `GET /requests/documents/:filename` (public access)
- **Responsive**: Modal tự động điều chỉnh kích thước
- **UX**: Click bên ngoài hoặc nút X để đóng modal

## 6.2) Chat System theo đơn hàng
- **Mục tiêu**: Kết nối Customer và Depot Staff qua box chat real-time
- **Tự động tạo**: Chat room được tạo tự động khi tạo request mới
- **System messages**: Tự động gửi thông báo khi trạng thái đơn hàng thay đổi
- **WebSocket**: Real-time messaging với Socket.IO
- **RBAC**: Phân quyền truy cập theo role và tenant
- **File upload**: Hỗ trợ upload file trong chat (ảnh, PDF)
- **UI**: Modal popup với auto-scroll và responsive design

### 6.2.1) API Chat System
- `POST /chat` - Tạo chat room
- `GET /chat/request/:request_id` - Lấy chat room theo request
- `POST /chat/:chat_room_id/messages` - Gửi tin nhắn
- `GET /chat/:chat_room_id/messages` - Lấy danh sách tin nhắn
- `GET /chat/user/rooms` - Lấy danh sách chat rooms của user

### 6.2.2) WebSocket Events
- `join_chat_room` - Tham gia chat room
- `leave_chat_room` - Rời chat room
- `send_message` - Gửi tin nhắn
- `new_message` - Nhận tin nhắn mới
- `system_message` - Nhận system message

### 6.2.3) Chat Status Integration

#### 6.2.3.1) Status Messages
Hệ thống tự động hiển thị thông báo trạng thái trong chat:

| Trạng thái | Message | Icon |
|------------|---------|------|
| PENDING | 📋 Đơn hàng đã được tạo và đang chờ xử lý | 📋 |
| RECEIVED | ✅ Đơn hàng đã được tiếp nhận và đang xử lý | ✅ |
| IN_PROGRESS | 🔄 Đơn hàng đang được xử lý tại kho | 🔄 |
| COMPLETED | ✅ Đơn hàng đã hoàn tất | ✅ |
| EXPORTED | 📦 Đơn hàng đã xuất kho | 📦 |
| REJECTED | ❌ Đơn hàng bị từ chối: [lý do] | ❌ |
| CANCELLED | ❌ Đơn hàng đã bị hủy | ❌ |
| IN_YARD | 🏭 Container đã vào kho | 🏭 |
| LEFT_YARD | 🚛 Container đã rời kho | 🚛 |

#### 6.2.3.2) Chat Restrictions
- **Chỉ cho phép chat** khi trạng thái: `APPROVED`, `IN_PROGRESS`, `COMPLETED`, `EXPORTED`
- **Không cho phép chat** khi trạng thái: `PENDING`, `REJECTED`, `CANCELLED`
- **System messages** được gửi cho mọi trạng thái (không bị giới hạn)

#### 6.2.3.3) Welcome Message
Mỗi chat room hiển thị welcome message với thông tin:
- Loại đơn hàng (Import/Export)
- Số container
- Trạng thái hiện tại

#### 6.2.3.4) Rejection Reason Display
Khi đơn hàng bị từ chối:
- Hiển thị lý do từ chối trong system message
- Hiển thị lý do trong warning banner
- Disable chat input và nút gửi tin nhắn

### 6.3) Soft-Delete Functionality

#### 6.3.1) Overview
Hệ thống hỗ trợ **soft-delete theo phạm vi** (scope-based soft delete) cho phép:
- **Kho (Depot)**: Ẩn request đã reject/cancel/complete khỏi danh sách
- **Khách hàng**: Ẩn request đã reject/cancel khỏi danh sách
- **Không xóa cứng** khỏi database để đảm bảo audit trail

#### 6.3.2) Business Rules
| Trạng thái Request | Kho có thể xóa? | Khách hàng có thể xóa? | Ghi chú |
|-------------------|-----------------|----------------------|---------|
| PENDING / APPROVED / IN_PROGRESS | ❌ | ❌ | Không cho xóa để tránh mất việc đang xử lý |
| REJECTED | ✅ (ẩn khỏi danh sách Kho) | ✅ (ẩn khỏi danh sách Khách) | Trạng thái hiển thị phía còn lại vẫn là **Rejected** |
| CANCELLED | ✅ | ✅ | Tương tự REJECTED |
| COMPLETED | ✅ | ❌ | Kho có thể dọn danh sách; Khách giữ lịch sử |

#### 6.3.3) Database Schema
```sql
-- Thêm cột soft-delete vào bảng requests
ALTER TABLE requests 
ADD COLUMN depot_deleted_at TIMESTAMP NULL,
ADD COLUMN customer_deleted_at TIMESTAMP NULL,
ADD COLUMN rejected_reason TEXT NULL,
ADD COLUMN rejected_by UUID NULL,
ADD COLUMN rejected_at TIMESTAMP NULL;

-- Indexes cho performance
CREATE INDEX idx_requests_depot_deleted_at ON requests(depot_deleted_at);
CREATE INDEX idx_requests_customer_deleted_at ON requests(customer_deleted_at);
CREATE INDEX idx_requests_status ON requests(status);
```

#### 6.3.4) API Endpoints

##### Reject Request (Kho)
```http
PATCH /requests/{id}/reject
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Thiếu chứng từ vận đơn"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "rejected_reason": "Thiếu chứng từ vận đơn",
  "rejected_by": "user-uuid",
  "rejected_at": "2024-01-15T10:30:00Z"
}
```

##### Soft-Delete theo Scope
```http
DELETE /requests/{id}?scope=depot|customer
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "id": "uuid",
  "scope": "depot",
  "deleted_at": "2024-01-15T10:30:00Z"
}
```

##### Restore theo Scope
```http
POST /requests/{id}/restore?scope=depot|customer
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "id": "uuid",
  "scope": "depot",
  "restored_at": "2024-01-15T10:30:00Z"
}
```

#### 6.3.5) Implementation Code

##### Service Layer (RequestService.ts)
```typescript
// Reject request
async rejectRequest(id: string, reason: string, actor: User) {
  const request = await this.repo.findById(id);
  if (!request) throw new Error('Request not found');
  
  // Kiểm tra quyền và trạng thái
  if (!['PENDING', 'APPROVED', 'IN_PROGRESS'].includes(request.status)) {
    throw new Error('Cannot reject request in current status');
  }
  
  // Cập nhật trạng thái
  const updated = await this.repo.update(id, {
    status: 'REJECTED',
    rejected_reason: reason,
    rejected_by: actor._id,
    rejected_at: new Date()
  });
  
  // Audit log
  await audit(actor._id, 'REQUEST.REJECTED', 'REQUEST', id, { reason });
  
  // Gửi system message vào chat room
  try {
    const chatRoom = await chatService.getChatRoom(actor, id);
    if (chatRoom) {
      const systemMessage = `❌ Đơn hàng bị từ chối${reason ? `: ${reason}` : ''}`;
      await chatService.sendSystemMessageUnrestricted(chatRoom.id, systemMessage);
    }
  } catch (error) {
    console.error('Không thể gửi system message khi reject:', error);
  }
  
  return updated;
}

// Soft-delete theo scope
async softDelete(id: string, scope: 'depot' | 'customer', actor: User) {
  const request = await this.repo.findById(id);
  if (!request) throw new Error('Request not found');
  
  if (scope === 'depot') {
    // Kiểm tra quyền Kho
    if (!['SaleAdmin', 'Accountant', 'SystemAdmin'].includes(actor.role)) {
      throw new Error('Unauthorized for depot scope');
    }
    
    // Kiểm tra trạng thái cho phép xóa
    if (!['REJECTED', 'CANCELLED', 'COMPLETED'].includes(request.status)) {
      throw new Error('Depot can only delete rejected/cancelled/completed requests');
    }
    
    await this.repo.update(id, { depot_deleted_at: new Date() });
  } else {
    // Kiểm tra quyền Khách hàng
    if (!['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
      throw new Error('Unauthorized for customer scope');
    }
    
    // Kiểm tra request thuộc tenant của user
    if (request.tenant_id !== actor.tenant_id) {
      throw new Error('Request does not belong to your organization');
    }
    
    // Kiểm tra trạng thái cho phép xóa
    if (!['REJECTED', 'CANCELLED'].includes(request.status)) {
      throw new Error('Customer can only delete rejected/cancelled requests');
    }
    
    await this.repo.update(id, { customer_deleted_at: new Date() });
  }
  
  // Audit log
  await audit(actor._id, 'REQUEST.DELETED', 'REQUEST', id, { scope });
  
  return { ok: true, id, scope, deleted_at: new Date() };
}

// Restore theo scope
async restore(id: string, scope: 'depot' | 'customer', actor: User) {
  const request = await this.repo.findById(id);
  if (!request) throw new Error('Request not found');
  
  if (scope === 'depot') {
    if (!['SaleAdmin', 'Accountant', 'SystemAdmin'].includes(actor.role)) {
      throw new Error('Unauthorized for depot scope');
    }
    await this.repo.update(id, { depot_deleted_at: null });
  } else {
    if (!['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
      throw new Error('Unauthorized for customer scope');
    }
    if (request.tenant_id !== actor.tenant_id) {
      throw new Error('Request does not belong to your organization');
    }
    await this.repo.update(id, { customer_deleted_at: null });
  }
  
  // Audit log
  await audit(actor._id, 'REQUEST.RESTORED', 'REQUEST', id, { scope });
  
  return { ok: true, id, scope, restored_at: new Date() };
}
```

##### Repository Layer (RequestRepository.ts)
```typescript
// List requests với filter theo scope
async listForDepot(query: ListQuery) {
  return this.prisma.serviceRequest.findMany({
    where: {
      depot_deleted_at: null, // Chỉ lấy chưa bị xóa bởi depot
      ...this.buildWhereClause(query)
    },
    include: {
      documents: true,
      chatRoom: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

async listForCustomer(tenantId: string, query: ListQuery) {
  return this.prisma.serviceRequest.findMany({
    where: {
      tenant_id: tenantId,
      customer_deleted_at: null, // Chỉ lấy chưa bị xóa bởi customer
      ...this.buildWhereClause(query)
    },
    include: {
      documents: true,
      chatRoom: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Update với soft-delete fields
async update(id: string, data: any) {
  return this.prisma.serviceRequest.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}
```

##### Controller Layer (RequestController.ts)
```typescript
// Reject request
async rejectRequest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const actor = req.user!;
    
    const result = await this.service.rejectRequest(id, reason, actor);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}

// Soft-delete theo scope
async softDelete(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { scope } = req.query;
    const actor = req.user!;
    
    if (!scope || !['depot', 'customer'].includes(scope as string)) {
      return res.status(400).json({ message: 'Invalid scope parameter' });
    }
    
    const result = await this.service.softDelete(id, scope as 'depot' | 'customer', actor);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}

// Restore theo scope
async restore(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { scope } = req.query;
    const actor = req.user!;
    
    if (!scope || !['depot', 'customer'].includes(scope as string)) {
      return res.status(400).json({ message: 'Invalid scope parameter' });
    }
    
    const result = await this.service.restore(id, scope as 'depot' | 'customer', actor);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}
```

##### Routes (RequestRoutes.ts)
```typescript
// Soft-delete routes
router.patch('/:id/reject', authenticate, requireRoles(['SaleAdmin', 'Accountant', 'SystemAdmin']), controller.rejectRequest);
router.delete('/:id', authenticate, controller.softDelete);
router.post('/:id/restore', authenticate, controller.restore);
```

#### 6.3.6) Frontend Integration

##### RequestTable Component
```typescript
// Thêm action buttons cho soft-delete
const getActionButtons = (request: Request, userRole: string) => {
  const buttons = [];
  
  // Nút Reject (chỉ cho Kho)
  if (['SaleAdmin', 'Accountant', 'SystemAdmin'].includes(userRole)) {
    if (['PENDING', 'APPROVED', 'IN_PROGRESS'].includes(request.status)) {
      buttons.push(
        <button
          key="reject"
          onClick={() => handleReject(request.id)}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          ❌ Từ chối
        </button>
      );
    }
  }
  
  // Nút Delete theo scope
  if (['SaleAdmin', 'Accountant', 'SystemAdmin'].includes(userRole)) {
    // Kho có thể xóa REJECTED, CANCELLED, COMPLETED
    if (['REJECTED', 'CANCELLED', 'COMPLETED'].includes(request.status)) {
      buttons.push(
        <button
          key="delete-depot"
          onClick={() => handleDelete(request.id, 'depot')}
          className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
        >
          🗑️ Xóa khỏi Kho
        </button>
      );
    }
  }
  
  if (['CustomerAdmin', 'CustomerUser'].includes(userRole)) {
    // Khách hàng có thể xóa REJECTED, CANCELLED
    if (['REJECTED', 'CANCELLED'].includes(request.status)) {
      buttons.push(
        <button
          key="delete-customer"
          onClick={() => handleDelete(request.id, 'customer')}
          className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
        >
          🗑️ Xóa khỏi danh sách
        </button>
      );
    }
  }
  
  return buttons;
};

// Handler functions
const handleReject = async (requestId: string) => {
  const reason = prompt('Nhập lý do từ chối:');
  if (!reason) return;
  
  try {
    await axios.patch(`/api/requests/${requestId}/reject`, { reason });
    toast.success('Đã từ chối đơn hàng');
    mutate(); // Refresh data
  } catch (error) {
    toast.error('Lỗi khi từ chối đơn hàng');
  }
};

const handleDelete = async (requestId: string, scope: 'depot' | 'customer') => {
  const confirmMessage = scope === 'depot' 
    ? 'Xóa khỏi danh sách Kho? (Đơn hàng vẫn hiển thị bên Khách hàng)'
    : 'Xóa khỏi danh sách của bạn?';
    
  if (!confirm(confirmMessage)) return;
  
  try {
    await axios.delete(`/api/requests/${requestId}?scope=${scope}`);
    toast.success(`Đã xóa khỏi danh sách ${scope === 'depot' ? 'Kho' : 'của bạn'}`);
    mutate(); // Refresh data
  } catch (error) {
    toast.error('Lỗi khi xóa đơn hàng');
  }
};
```

#### 6.3.7) Test Cases
```typescript
// Unit tests cho soft-delete functionality
describe('Soft-Delete Functionality', () => {
  test('Depot can reject pending request', async () => {
    const request = await createTestRequest({ status: 'PENDING' });
    const depotUser = await createTestUser({ role: 'SaleAdmin' });
    
    const result = await requestService.rejectRequest(request.id, 'Test reason', depotUser);
    
    expect(result.status).toBe('REJECTED');
    expect(result.rejected_reason).toBe('Test reason');
    expect(result.rejected_by).toBe(depotUser._id);
  });
  
  test('Depot can soft-delete rejected request', async () => {
    const request = await createTestRequest({ status: 'REJECTED' });
    const depotUser = await createTestUser({ role: 'SaleAdmin' });
    
    const result = await requestService.softDelete(request.id, 'depot', depotUser);
    
    expect(result.ok).toBe(true);
    expect(result.scope).toBe('depot');
    
    // Verify request is hidden from depot list
    const depotList = await requestService.listForDepot({});
    expect(depotList.find(r => r.id === request.id)).toBeUndefined();
  });
  
  test('Customer cannot delete pending request', async () => {
    const request = await createTestRequest({ status: 'PENDING' });
    const customerUser = await createTestUser({ role: 'CustomerUser' });
    
    await expect(
      requestService.softDelete(request.id, 'customer', customerUser)
    ).rejects.toThrow('Customer can only delete rejected/cancelled requests');
  });
});
```

### 6.1.1) Document Upload & Viewer System

#### 6.1.1.1) Overview
Hệ thống hỗ trợ upload và xem chứng từ cho từng request:
- **Upload**: Hỗ trợ file ảnh (jpg, png, gif) và PDF khi tạo request
- **Storage**: Files được lưu tại `D:\container\container2\backend\uploads`
- **Viewer**: Modal popup để xem ảnh trực tiếp hoặc download PDF
- **Public Access**: Documents có thể xem mà không cần authentication

#### 6.1.1.2) File Upload Process
```typescript
// Frontend: Upload files khi tạo request
const handleFileUpload = async (files: FileList) => {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('documents', file);
  });
  
  try {
    const response = await axios.post('/api/requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

#### 6.1.1.3) Backend File Processing
```typescript
// RequestService.ts - Xử lý upload files
async createRequest(data: CreateRequestDto, files: Express.Multer.File[], actor: User) {
  // Tạo request
  const request = await this.repo.create({
    ...data,
    created_by: actor._id,
    tenant_id: actor.tenant_id
  });

  // Xử lý upload files
  if (files && files.length > 0) {
    for (const file of files) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Lưu file
      await fs.promises.writeFile(filePath, file.buffer);
      
      // Tạo record trong database
      await this.docRepo.createDoc({
        request_id: request.id,
        file_name: file.originalname,
        storage_key: fileName,
        file_type: file.mimetype,
        file_size: file.size,
        uploader_id: actor._id
      });
    }
  }

  return request;
}
```

#### 6.1.1.4) Document Viewer Implementation

##### Frontend Component (DocumentViewer.tsx)
```typescript
interface DocumentViewerProps {
  documents: DocumentFile[];
  onClose: () => void;
}

export default function DocumentViewer({ documents, onClose }: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);

  const handleDocumentClick = (doc: DocumentFile) => {
    setSelectedDoc(doc);
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chứng từ</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Document List */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleDocumentClick(doc)}
              className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
            >
              <div className="text-center">
                {isImage(doc.file_type) ? (
                  <img
                    src={`/api/requests/documents/${doc.storage_key}`}
                    alt={doc.file_name}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-100 flex items-center justify-center rounded mb-2">
                    📄 PDF
                  </div>
                )}
                <p className="text-sm text-gray-600 truncate">{doc.file_name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Document Preview Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{selectedDoc.file_name}</h3>
                <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              
              {isImage(selectedDoc.file_type) ? (
                <img
                  src={`/api/requests/documents/${selectedDoc.storage_key}`}
                  alt={selectedDoc.file_name}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">PDF Document</p>
                  <a
                    href={`/api/requests/documents/${selectedDoc.storage_key}`}
                    download={selectedDoc.file_name}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    📥 Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 6.1.1.5) Backend Document Serving

##### Document Routes (DocumentRoutes.ts)
```typescript
import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Serve documents without authentication
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    // Kiểm tra file tồn tại
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Lấy file stats
    const stats = fs.statSync(filePath);
    
    // Set headers
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Type', getMimeType(filename));
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export default router;
```

##### Main.ts Configuration
```typescript
// Serve documents without authentication (public access)
app.use('/requests/documents', documentRoutes);

// All other request routes require authentication
app.use('/requests', authenticate, requestRoutes);
```

#### 6.1.1.6) Database Schema
```sql
-- Document files table
CREATE TABLE document_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  storage_key VARCHAR(255) NOT NULL UNIQUE,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  uploader_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_document_files_request_id ON document_files(request_id);
CREATE INDEX idx_document_files_storage_key ON document_files(storage_key);
```

#### 6.1.1.7) Multer Configuration
```typescript
// multer.ts
import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
  }
  
  if (file.size > maxSize) {
    return cb(new Error('File too large. Maximum size is 10MB.'));
  }
  
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files per request
  }
});
```

#### 6.1.1.8) Request Table Integration
```typescript
// RequestTable.tsx - Thêm cột Documents
const columns = [
  // ... other columns
  {
    key: 'documents',
    label: 'Chứng từ',
    render: (item: Request) => (
      <div className="flex gap-1">
        {item.documents && item.documents.length > 0 ? (
          <button
            onClick={() => setSelectedRequestId(item.id)}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
          >
            📄 Xem ({item.documents.length})
          </button>
        ) : (
          <span className="text-gray-400 text-xs">Không có</span>
        )}
      </div>
    )
  }
];

// Document viewer modal
{selectedRequestId && (
  <DocumentViewer
    documents={data?.find((r: any) => r.id === selectedRequestId)?.documents || []}
    onClose={() => setSelectedRequestId(null)}
  />
)}
```

#### 6.1.1.9) Error Handling & Validation
```typescript
// Validation middleware
const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  
  const files = Array.isArray(req.files) ? req.files : [req.files];
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  for (const file of files) {
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        message: `Invalid file type: ${file.originalname}. Only images and PDFs are allowed.` 
      });
    }
    
    if (file.size > maxSize) {
      return res.status(400).json({ 
        message: `File too large: ${file.originalname}. Maximum size is 10MB.` 
      });
    }
  }
  
  next();
};
```

#### 6.1.1.10) Security Considerations
- **File Type Validation**: Chỉ cho phép images và PDFs
- **File Size Limits**: Giới hạn 10MB per file
- **Storage Security**: Files được lưu ngoài web root
- **Access Control**: Documents có thể xem public nhưng upload cần authentication
- **File Naming**: Sử dụng timestamp để tránh conflict
- **Error Handling**: Proper error messages cho invalid files

#### 6.1.1.11) Sửa lỗi Authentication cho Document Viewer
- **Vấn đề**: API `/requests/documents/:filename` bị lỗi "Unauthorized" do middleware `authenticate` được áp dụng cho tất cả routes `/requests/*`
- **Giải pháp**: 
  - Tạo router riêng `DocumentRoutes.ts` cho documents không cần authentication
  - Cấu hình trong `main.ts`: 
    ```typescript
    // Serve documents without authentication (public access)
    app.use('/requests/documents', documentRoutes);
    // All other request routes require authentication
    app.use('/requests', authenticate, requestRoutes);
    ```
  - Xóa route `/documents/:filename` khỏi `RequestRoutes.ts` để tránh conflict
- **Kết quả**: Documents có thể được xem trực tiếp mà không cần đăng nhập

## 7) FE gợi ý
- Trang khách hàng (Customer*): form tạo yêu cầu + list; filter theo trạng thái.
- Trang depot (SaleAdmin): bảng requests với action nhận/từ chối; tab docs; nút “Gửi yêu cầu thanh toán”.

## 8) Bản đồ mã nguồn Module 3
- DTO: `modules/requests/dto/RequestDtos.ts`
- Repository: `modules/requests/repository/RequestRepository.ts`
- Service: `modules/requests/service/RequestService.ts`
- Controller: `modules/requests/controller/RequestController.ts`
- Routes: `modules/requests/controller/RequestRoutes.ts`
- Document Routes: `modules/requests/controller/DocumentRoutes.ts` (public access)
- Prisma: `prisma/schema.prisma` (ServiceRequest, DocumentFile, PaymentRequest)

### 8.1) Appointment System (Module 3.2)
- DTO: `modules/requests/dto/AppointmentDtos.ts`
- Service: `modules/requests/service/AppointmentService.ts`
- Controller: `modules/requests/controller/AppointmentController.ts`
- Routes: `modules/requests/controller/AppointmentRoutes.ts`
- Frontend: `frontend/components/AppointmentModal.tsx`

### 8.2) Attachment System (Module 3.3)
- DTO: `modules/requests/dto/AttachmentDtos.ts`
- Repository: `modules/requests/repository/AttachmentRepository.ts`
- Service: `modules/requests/service/AttachmentService.ts`
- Controller: `modules/requests/controller/AttachmentController.ts`
- Routes: `modules/requests/controller/AttachmentRoutes.ts`
- Frontend: `frontend/components/UploadModal.tsx`

### 8.1) Chat System (Module 3.1)
- DTO: `modules/chat/dto/ChatDtos.ts`
- Repository: `modules/chat/repository/ChatRepository.ts`
- Service: `modules/chat/service/ChatService.ts`
- Controller: `modules/chat/controller/ChatController.ts`
- Routes: `modules/chat/controller/ChatRoutes.ts`
- WebSocket: `modules/chat/websocket/ChatWebSocket.ts`
- Prisma: `prisma/schema.prisma` (ChatRoom, ChatMessage)

## 9) TODO tiếp theo
- Notification service (email/webpush) khi tạo/nhận/từ chối.
- **✅ Viewer file**: Đã implement modal xem ảnh trực tiếp + download link cho PDF.
- **✅ Sửa lỗi authentication**: Đã tạo DocumentRoutes riêng để serve files không cần authentication.
- **✅ Soft-delete theo scope**: Đã implement tính năng xóa/ẩn request theo phạm vi người dùng (depot/customer).
- **✅ Chat System**: Đã implement box chat theo đơn hàng với WebSocket real-time.
- **✅ Appointment System**: Đã implement tính năng tiếp nhận yêu cầu với lịch hẹn và mở chat.
- **✅ Attachment System**: Đã implement upload/download chứng từ cho khách hàng và depot.
- Accountant xử lý PaymentRequest (RECEIVED/PAID/REJECTED) + xuất hóa đơn.
- Reuse COS: thêm endpoint redirect với prefill.

## 10) References & Liên kết module

### 10.1. Liên kết với Module 1 — Quản lý Người dùng & Đối tác
- ServiceRequest lưu `tenant_id` để áp scope theo khách hàng.
- Người tạo/duyệt request là user trong Module 1: `created_by` ↔ user_id.
- RBAC kế thừa từ Module 1 (vai trò: CustomerAdmin/CustomerUser, SaleAdmin, Accountant).
- Khi SaleAdmin tạo user khách hoặc CustomerAdmin mời user, họ có thể truy cập Module 3 theo scope tenant.

### 10.2. Liên kết với Module 2 — Auth & Account
- JWT chứa `role`, `tenant_id` được sử dụng để filter và kiểm tra quyền cho tất cả API của Module 3.
- Audit log dùng middleware chung `shared/middlewares/audit.ts` như Module 2.
- Người dùng đăng nhập/đổi mật khẩu/accept-invite ở Module 2 trước khi thao tác yêu cầu dịch vụ.

### 10.3. Liên kết Module 4 — Gate Management
- Gate IN/OUT sử dụng các trạng thái `IN_YARD` và `LEFT_YARD` được mô tả ở Module 4.

### 10.4. Bảng phân quyền (RBAC) tóm tắt cho Module 3

| Tác vụ                                    | CustomerAdmin | CustomerUser | SaleAdmin | Accountant |
|-------------------------------------------|---------------|--------------|----------:|-----------:|
| Tạo yêu cầu (POST /requests)              | ✅ (tenant)    | ✅ (tenant)   | ✅         | ❌          |
| Upload chứng từ khi tạo request           | ✅ (tenant)    | ✅ (tenant)   | ✅         | ❌          |
| Danh sách yêu cầu (GET /requests)         | ✅ (tenant)    | ✅ (tenant)   | ✅         | ✅          |
| Cập nhật trạng thái (PATCH /:id/status)   | ❌             | ❌            | ✅         | ❌          |
| Upload EIR/LOLO (POST /:id/docs)          | ❌             | ❌            | ✅         | ❌          |
| Upload INVOICE (POST /:id/docs)           | ❌             | ❌            | ❌         | ✅          |
| Xem chứng từ (GET /:id/docs)              | ✅ (tenant)    | ✅ (tenant)   | ✅         | ✅          |
| Xóa chứng từ (DELETE /:id/docs/:docId)    | ❌ (trừ uploader) | ❌         | ✅         | ✅          |
| Gửi yêu cầu thanh toán (POST /:id/payment-request) | ❌ | ❌ | ✅ | ❌ |
| Reject request (PATCH /:id/reject) | ❌ | ❌ | ✅ | ❌ |
| Soft-delete request (DELETE /:id?scope=depot) | ❌ | ❌ | ✅ | ✅ |
| Soft-delete request (DELETE /:id?scope=customer) | ✅ | ✅ | ❌ | ❌ |
| Restore request (POST /:id/restore) | ✅ | ✅ | ✅ | ✅ |
| Chat access (GET /chat/request/:id) | ✅ (tenant) | ✅ (tenant) | ✅ | ✅ |
| Send message (POST /chat/:id/messages) | ✅ (approved) | ✅ (approved) | ✅ (approved) | ✅ (approved) |
| Upload documents (POST /requests with files) | ✅ (tenant) | ✅ (tenant) | ✅ | ❌ |
| View documents (GET /requests/documents/:filename) | ✅ (public) | ✅ (public) | ✅ (public) | ✅ (public) |
| Delete documents (DELETE /:id/documents/:docId) | ❌ (trừ uploader) | ❌ (trừ uploader) | ✅ | ✅ |

Ghi chú:
- “(tenant)” nghĩa là chỉ trong tenant của user, áp dụng qua `tenant_id` trong JWT.
- Xóa chứng từ: người upload xóa được; hoặc vai trò cao hơn (SystemAdmin/BusinessAdmin/SaleAdmin/Accountant).
