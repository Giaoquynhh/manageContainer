# Tính năng Bổ sung thông tin & Hành động của Depot - Implementation

## Tổng quan

Đã hoàn thành triển khai tính năng "Bổ sung thông tin & Hành động của Depot" theo đặc tả. Tính năng này cho phép Customer upload tài liệu bổ sung sau khi yêu cầu được lên lịch hẹn, và Depot có thể xem xét, chuyển tiếp hoặc từ chối yêu cầu.

## Các thay đổi đã thực hiện

### 1. Backend Changes

#### 1.1. Prisma Schema
**File:** `manageContainer/backend/prisma/schema.prisma`
- Cập nhật comment cho `DocumentFile.type` để thêm `SUPPLEMENT`
- Hỗ trợ upload tài liệu bổ sung với type `SUPPLEMENT`

#### 1.2. State Machine
**File:** `manageContainer/backend/modules/requests/service/RequestStateMachine.ts`
- Thêm trạng thái `FORWARDED` vào `VALID_STATES`
- Thêm transitions mới:
  - `SCHEDULED → FORWARDED` (Depot chuyển tiếp)
  - `SCHEDULED_INFO_ADDED → FORWARDED` (Depot chuyển tiếp)
  - `FORWARDED → COMPLETED` (Hoàn tất)
  - `FORWARDED → SENT_TO_GATE` (Chuyển sang Gate)

#### 1.3. DTOs
**File:** `manageContainer/backend/modules/requests/dto/RequestDtos.ts`
- Cập nhật `updateRequestStatusSchema` để hỗ trợ `FORWARDED`
- Cập nhật `uploadDocSchema` để hỗ trợ `SUPPLEMENT`

#### 1.4. RequestService
**File:** `manageContainer/backend/modules/requests/service/RequestService.ts`
- Cập nhật `uploadDocument` method:
  - Thêm validation cho `SUPPLEMENT` type
  - Chỉ cho phép Customer upload khi status `SCHEDULED`
  - Thêm scope check cho tenant
  - Xử lý file upload với tên unique
  - Audit log với action `DOC.UPLOADED_SUPPLEMENT`
- Cập nhật `listDocuments` để hỗ trợ filter theo type
- Thêm `getAppointmentInfo` method

#### 1.5. RequestRepository
**File:** `manageContainer/backend/modules/requests/repository/RequestRepository.ts`
- Cập nhật `listDocs` method để hỗ trợ filter theo type

#### 1.6. RequestController
**File:** `manageContainer/backend/modules/requests/controller/RequestController.ts`
- Cập nhật `listDocs` để hỗ trợ query parameter `type`
- Thêm `getAppointmentInfo` method

#### 1.7. RequestRoutes
**File:** `manageContainer/backend/modules/requests/controller/RequestRoutes.ts`
- Thêm route `GET /:id/appointment` cho appointment info

### 2. Frontend Changes

#### 2.1. Upload Supplement Modal
**File:** `manageContainer/frontend/components/UploadSupplementModal.tsx`
- Component modal cho Customer upload tài liệu bổ sung
- Hỗ trợ drag & drop và chọn file
- Validation file type (PDF, JPG, PNG) và size (≤10MB)
- Upload qua API `POST /requests/:id/docs` với type `SUPPLEMENT`

#### 2.2. Supplement Documents Component
**File:** `manageContainer/frontend/components/SupplementDocuments.tsx`
- Component hiển thị danh sách tài liệu bổ sung cho Depot
- Hiển thị file icon, size, version, upload date
- Hỗ trợ download file
- Loading states và error handling

#### 2.3. Customer Page
**File:** `manageContainer/frontend/pages/Requests/Customer.tsx`
- Thêm import `UploadSupplementModal`
- Thêm state `showSupplementModal`
- Thêm functions:
  - `handleOpenSupplementModal`
  - `handleSupplementSuccess`
- Truyền `handleOpenSupplementModal` vào RequestTable actions

#### 2.4. RequestTable Component
**File:** `manageContainer/frontend/components/RequestTable.tsx`
- Cập nhật interface để hỗ trợ `handleOpenSupplementModal`
- Thêm nút "Bổ sung thông tin" cho status `SCHEDULED` (Customer only)

#### 2.5. Depot Page
**File:** `manageContainer/frontend/pages/Requests/Depot.tsx`
- Thêm import `SupplementDocuments`
- Thêm state `activeSupplementRequests`
- Thêm functions:
  - `toggleSupplement` - mở/đóng modal tài liệu bổ sung
  - `handleForward` - chuyển tiếp yêu cầu sang `FORWARDED`
  - `handleReject` - từ chối yêu cầu với lý do
- Thêm actions cho status `SCHEDULED`:
  - "Tài liệu bổ sung" - xem danh sách file
  - "Chuyển tiếp" - chuyển sang `FORWARDED`
  - "Từ chối" - từ chối với lý do
- Thêm SupplementDocuments modal windows

#### 2.6. Components Index
**File:** `manageContainer/frontend/components/index.ts`
- Export các component mới:
  - `UploadSupplementModal`
  - `SupplementDocuments`

## API Endpoints

### 1. Upload Supplement Document
```http
POST /requests/:id/docs
Content-Type: multipart/form-data
Body: { file, type: 'SUPPLEMENT' }
Authorization: Bearer <token>
```
- **RBAC:** CustomerAdmin/CustomerUser
- **Điều kiện:** status = SCHEDULED, tenant scope

### 2. List Supplement Documents
```http
GET /requests/:id/docs?type=SUPPLEMENT
Authorization: Bearer <token>
```
- **Customer:** chỉ xem file của tenant mình
- **Depot:** xem tất cả file

### 3. Forward Request
```http
PATCH /requests/:id/status
Body: { status: 'FORWARDED' }
Authorization: Bearer <token>
```
- **RBAC:** SaleAdmin/SystemAdmin
- **Điều kiện:** status = SCHEDULED

### 4. Reject Request
```http
PATCH /requests/:id/reject
Body: { reason: "Lý do từ chối" }
Authorization: Bearer <token>
```
- **RBAC:** SaleAdmin/SystemAdmin
- **Điều kiện:** status ∈ {SCHEDULED, RECEIVED}

## State Machine Flow

```
PENDING → SCHEDULED → FORWARDED | REJECTED
SCHEDULED → REJECTED
FORWARDED → COMPLETED | SENT_TO_GATE
```

## Audit Log Actions

- `DOC.UPLOADED_SUPPLEMENT` - Customer upload tài liệu bổ sung
- `REQUEST.FORWARDED` - Depot chuyển tiếp yêu cầu
- `REQUEST.REJECTED` - Depot từ chối yêu cầu (có lý do)

## UI/UX Features

### Customer Portal
- Nút "Bổ sung thông tin" hiển thị khi status = SCHEDULED
- Modal upload với drag & drop
- Validation real-time
- Success/error feedback

### Depot Portal
- Section "Tài liệu bổ sung từ KH" trong modal
- Actions: "Chuyển tiếp", "Từ chối"
- Prompt nhập lý do khi từ chối
- Download và preview file

## Testing Checklist

- [x] Upload supplement document (Customer)
- [x] List supplement documents (Depot/Customer)
- [x] Forward request (Depot)
- [x] Reject request with reason (Depot)
- [x] State transitions validation
- [x] RBAC validation
- [x] File type/size validation
- [x] Tenant scope validation
- [x] Audit logging
- [x] UI responsiveness

## Files Modified

### Backend
1. `prisma/schema.prisma` - Thêm SUPPLEMENT type
2. `modules/requests/service/RequestStateMachine.ts` - Thêm FORWARDED state
3. `modules/requests/dto/RequestDtos.ts` - Cập nhật schemas
4. `modules/requests/service/RequestService.ts` - Upload logic
5. `modules/requests/repository/RequestRepository.ts` - Filter support
6. `modules/requests/controller/RequestController.ts` - New endpoints
7. `modules/requests/controller/RequestRoutes.ts` - New routes

### Frontend
1. `components/UploadSupplementModal.tsx` - Upload UI
2. `components/SupplementDocuments.tsx` - Display UI
3. `pages/Requests/Customer.tsx` - Customer integration
4. `pages/Requests/Depot.tsx` - Depot integration
5. `components/RequestTable.tsx` - Action buttons
6. `components/index.ts` - Exports

## Next Steps

1. **Testing:** Viết unit tests cho các flows mới
2. **Performance:** Optimize file upload với chunking
3. **Security:** Thêm virus scanning cho uploaded files
4. **Notifications:** Thêm email/SMS notifications
5. **Analytics:** Track usage patterns
6. **Mobile:** Optimize cho mobile devices
