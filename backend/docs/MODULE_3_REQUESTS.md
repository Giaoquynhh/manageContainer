# MODULE 3: REQUESTS - Quản lý yêu cầu dịch vụ

## Tổng quan
Module này quản lý toàn bộ lifecycle của các yêu cầu dịch vụ container, từ khi tạo request đến khi hoàn thành. Hệ thống đã được cập nhật với **Request State Machine** để quản lý workflow trạng thái một cách nhất quán và có kiểm soát.

## 🚀 Tính năng mới: Upload nhiều files chứng từ + Phân biệt IMPORT/EXPORT với trạng thái IN_CAR + Container Number Validation

### **Upload nhiều files chứng từ (MỚI)**

#### **Frontend Changes:**
- **RequestForm Component:** Hỗ trợ upload nhiều files cùng lúc
- **File Input:** Thêm thuộc tính `multiple` để chọn nhiều files
- **State Management:** Thay đổi từ `selectedFile` thành `selectedFiles` array
- **UI Enhancement:** 
  - Hiển thị danh sách files đã chọn với tên và kích thước
  - Nút "Xóa tất cả" và "Xóa từng file" riêng lẻ
  - Validation cho từng file (định dạng, kích thước)

#### **Backend Changes:**
- **RequestRoutes:** Thay đổi từ `upload.single('document')` thành `upload.array('documents', 10)`
- **RequestController:** Xử lý array of files thay vì single file
- **RequestService:** Upload và lưu trữ nhiều files với tên unique

#### **File Upload Logic:**
```typescript
// Frontend - Multiple file selection
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

// Backend - Process multiple files
if (files && files.length > 0) {
  for (const file of files) {
    const fileName = `${timestamp}_${req.id}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    // Save file and create document record
  }
}
```

### **Workflow mới với trạng thái IN_CAR**

#### 1. **Import Request Workflow (Giữ nguyên):**
```
1. CHECKED → POSITIONED (Yard confirm)
2. POSITIONED → FORKLIFTING (Driver click "Bắt đầu")
3. FORKLIFTING → IN_YARD (Forklift approval)
```

#### 2. **Export Request Workflow (MỚI):**
```
1. GATE_IN → FORKLIFTING (Driver click "Bắt đầu")
2. FORKLIFTING → IN_CAR (Forklift approval) ⭐ MỚI
3. Container tự động ẩn khỏi Yard và ContainersPage
```

### **Logic mới khi approve forklift job:**
- **IMPORT requests**: `FORKLIFTING` → `IN_YARD` (giữ nguyên logic cũ)
- **EXPORT requests**: `FORKLIFTING` → `IN_CAR` (logic mới)

### **Auto Forklift Task Creation (MỚI):**
Khi EXPORT request chuyển sang trạng thái `GATE_IN`, hệ thống sẽ tự động tạo ForkliftTask:

#### **Trigger Conditions:**
- Request type = `EXPORT`
- Status = `GATE_IN`
- Container number tồn tại
- Chưa có ForkliftTask cho container này

#### **Auto-created Task Details:**
- **From Location**: Vị trí hiện tại của container trong yard
- **To Location**: Slot đặc biệt `GATE_EXPORT` (tự động tạo nếu chưa có)
- **Status**: `PENDING`
- **Purpose**: Di chuyển container từ yard ra cổng gate để xuất

#### **Implementation:**
1. **Database Trigger**: Tự động kích hoạt khi ServiceRequest được update
2. **Service Layer**: `AutoForkliftTaskService.createForkliftTaskForExport()`
3. **State Machine**: Integration trong `RequestStateMachine.executeTransition()`
4. **Audit Trail**: Ghi log đầy đủ cho mọi hoạt động tạo task

### **Ẩn container IN_CAR:**
- Container có trạng thái `IN_CAR` sẽ tự động ẩn khỏi:
  - `http://localhost:5002/Yard` - Không hiển thị trong bản đồ bãi
  - `http://localhost:5002/ContainersPage` - Không hiển thị trong danh sách container

### **Container Number Validation (MỚI)**

#### **Logic Validation:**
- **Mục đích:** Ngăn chặn việc tạo request IMPORT với container number đã tồn tại trong hệ thống
- **Áp dụng:** Chỉ cho request type `IMPORT`
- **Trigger:** Khi tạo request mới hoặc cập nhật container number

#### **Các trạng thái được coi là "Active":**
```typescript
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
```

#### **Validation Rules:**
1. **Container được coi là "đã tồn tại" nếu:**
   - `type: 'IMPORT'`
   - `container_no` trùng với request khác
   - `status` trong danh sách active statuses
   - Chưa bị xóa (soft delete)

2. **Container được coi là "đã có trong bãi" nếu:**
   - `container_no` có trong `YardPlacement`
   - `status` là `HOLD` hoặc `OCCUPIED`
   - `removed_at` là null (chưa bị xóa khỏi yard)

3. **Container được coi là "available" nếu:**
   - Chưa có request nào sử dụng
   - Hoặc request cũ đã có status: `REJECTED`, `COMPLETED`, `GATE_OUT`
   - Và không có trong YardPlacement với status active

#### **Error Messages:**
```
// Khi container có trong ServiceRequest
"Container {container_no} đã tồn tại trong hệ thống với trạng thái {status}. 
Chỉ có thể tạo request mới khi container này không còn trong hệ thống."

// Khi container có trong YardPlacement
"Container {container_no} đã có trong bãi (Yard) với trạng thái {status}. 
Chỉ có thể tạo request mới khi container này không còn trong bãi."
```

#### **Implementation:**
- **Method:** `validateContainerNumberNotExists(containerNo: string)`
- **File:** `modules/requests/service/RequestService.ts` (lines 252-301)
- **Called by:** 
  - `createByCustomer()` (line 22)
  - `createBySaleAdmin()` (line 82)
- **Logic Flow:**
  1. **ServiceRequest Check:** Query `prisma.serviceRequest.findFirst()` với active statuses
  2. **YardPlacement Check:** Query `prisma.yardPlacement.findFirst()` với HOLD/OCCUPIED status
  3. **Error Handling:** Throw specific error message cho từng trường hợp
  4. **Success:** Allow request creation nếu không có conflict

#### **Code Implementation:**
```typescript
// File: modules/requests/service/RequestService.ts
async validateContainerNumberNotExists(containerNo: string): Promise<void> {
  const activeStatuses = ['PENDING', 'PICK_CONTAINER', 'SCHEDULED', ...];
  
  // 1. Check ServiceRequest
  const existingRequest = await prisma.serviceRequest.findFirst({
    where: {
      container_no: containerNo,
      type: 'IMPORT',
      status: { in: activeStatuses },
      depot_deleted_at: null,
      customer_deleted_at: null
    }
  });
  
  if (existingRequest) {
    throw new Error(`Container ${containerNo} đã tồn tại trong hệ thống...`);
  }
  
  // 2. Check YardPlacement
  const existingYardPlacement = await prisma.yardPlacement.findFirst({
    where: {
      container_no: containerNo,
      status: { in: ['HOLD', 'OCCUPIED'] },
      removed_at: null
    }
  });
  
  if (existingYardPlacement) {
    throw new Error(`Container ${containerNo} đã có trong bãi (Yard)...`);
  }
}
```

#### **Logic Flow Diagram:**
```
┌─────────────────────────────────────────────────────────────┐
│                Container Validation Flow                    │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   Input: containerNo    │
                    │   Type: IMPORT only     │
                    └─────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  Check ServiceRequest   │
                    │  - Active statuses      │
                    │  - Not soft deleted     │
                    └─────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌─────────────┐         ┌─────────────┐
            │   Found?    │         │   Found?    │
            │      YES    │         │     NO      │
            └─────────────┘         └─────────────┘
                    │                       │
                    ▼                       ▼
            ┌─────────────┐         ┌─────────────────────────┐
            │   Throw     │         │  Check YardPlacement   │
            │   Error     │         │  - HOLD/OCCUPIED       │
            │             │         │  - Not removed         │
            └─────────────┘         └─────────────────────────┘
                                            │
                                ┌───────────┴───────────┐
                                │                       │
                                ▼                       ▼
                        ┌─────────────┐         ┌─────────────┐
                        │   Found?    │         │   Found?    │
                        │      YES    │         │     NO      │
                        └─────────────┘         └─────────────┘
                                │                       │
                                ▼                       ▼
                        ┌─────────────┐         ┌─────────────┐
                        │   Throw     │         │   Allow     │
                        │   Error     │         │ Creation    │
                        │             │         │             │
                        └─────────────┘         └─────────────┘
```

## 🏗️ Kiến trúc hệ thống

### 1. **Request State Machine** (`modules/requests/service/RequestStateMachine.ts`)
- **Chức năng:** Quản lý toàn bộ logic state machine
- **Tính năng chính:**
  - Validate transitions hợp lệ
  - Kiểm tra quyền theo role
  - Ghi audit log tự động
  - Gửi system message vào chat room
  - Cung cấp helper methods cho UI

**Các trạng thái hợp lệ mới:**
- `PENDING` → Chờ xử lý
- `SCHEDULED` → Đã đặt lịch hẹn  
- `SCHEDULED_INFO_ADDED` → Đã bổ sung thông tin
- `SENT_TO_GATE` → Đã chuyển sang Gate
- `REJECTED` → Bị từ chối
- `COMPLETED` → Hoàn tất
- `ACCEPT` → Đã chấp nhận
- `CHECKED` → Đã kiểm tra
- `POSITIONED` → Đã xếp chỗ trong bãi
- `FORKLIFTING` → Đang nâng/hạ container
- `IN_YARD` → Đã ở trong bãi (cho IMPORT)
- `IN_CAR` → Đã lên xe (cho EXPORT) ⭐ **MỚI**

**Transitions mới:**
```typescript
{
  from: 'FORKLIFTING',
  to: 'IN_YARD',
  allowedRoles: ['SaleAdmin', 'SystemAdmin'],
  description: 'Container đã được đặt vào vị trí trong bãi (cho IMPORT)'
},
{
  from: 'FORKLIFTING',
  to: 'IN_CAR',
  allowedRoles: ['SaleAdmin', 'SystemAdmin'],
  description: 'Container đã được đặt lên xe (cho EXPORT)'
}
```

### 2. **Appointment Service** (`modules/requests/service/AppointmentService.ts`)
- **Chức năng:** Quản lý riêng biệt các thao tác liên quan đến lịch hẹn
- **Tính năng chính:**
  - Đặt lịch hẹn (schedule)
  - Cập nhật lịch hẹn
  - Hủy lịch hẹn
  - Lấy thông tin lịch hẹn
  - Danh sách lịch hẹn theo ngày
- **Frontend Integration:**
  - AppointmentForm component với thời gian mặc định (hiện tại + 1 giờ)
  - Draggable pop-up modal (AppointmentMini)
  - Form validation và error handling
  - API endpoints: `/requests/{id}/schedule` và `/requests/{id}/update-appointment`

### 3. **Request Service** (`modules/requests/service/RequestService.ts`)
**Các method mới được thêm:**
- `scheduleRequest()` - Đặt lịch hẹn
- `addInfoToRequest()` - Bổ sung thông tin
- `sendToGate()` - Chuyển tiếp sang Gate
- `completeRequest()` - Hoàn tất request
- `getValidTransitions()` - Lấy transitions hợp lệ
- `getStateInfo()` - Lấy thông tin trạng thái

**Các method được cập nhật:**
- `updateStatus()` - Sử dụng State Machine
- `rejectRequest()` - Sử dụng State Machine

## 🔄 Luồng trạng thái (State Transitions)

### **Transitions được định nghĩa:**

1. **PENDING → SCHEDULED**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Mô tả:** Depot tiếp nhận và đặt lịch hẹn

2. **PENDING → REJECTED**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Requires:** Lý do từ chối
   - **Mô tả:** Depot từ chối request

3. **SCHEDULED → SCHEDULED_INFO_ADDED**
   - **Actor:** CustomerAdmin, CustomerUser
   - **Mô tả:** Customer bổ sung thông tin

4. **SCHEDULED → SENT_TO_GATE**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Mô tả:** Depot chuyển tiếp sang Gate

5. **SCHEDULED → REJECTED**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Requires:** Lý do từ chối
   - **Mô tả:** Depot từ chối request

6. **SCHEDULED_INFO_ADDED → SENT_TO_GATE**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Mô tả:** Depot chuyển tiếp sang Gate

7. **SCHEDULED_INFO_ADDED → REJECTED**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Requires:** Lý do từ chối
   - **Mô tả:** Depot từ chối request

8. **SENT_TO_GATE → GATE_IN** (Gate Check-in) ⭐ **MỚI**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Trigger:** Click "Check-in" button trên Gate page
   - **Mô tả:** Container đã vào cổng gate
   - **Side effect:** 
     - Cập nhật gate_checked_by và gate_checked_at
     - **Auto-create ForkliftTask** (cho EXPORT requests) ⭐ **MỚI**

9. **GATE_IN → FORKLIFTING** (Driver Start - EXPORT)
   - **Actor:** Driver, SaleAdmin, SystemAdmin
   - **Trigger:** Click "Bắt đầu" button trên DriverDashboard
   - **Mô tả:** Tài xế bắt đầu nâng/hạ container (cho EXPORT)
   - **Side effect:** Cập nhật ForkliftTask.status từ 'PENDING' → 'IN_PROGRESS'

10. **GATE_IN → CHECKING** (Gate Inspection)
    - **Actor:** SaleAdmin, SystemAdmin
    - **Trigger:** Click "Kiểm tra" button trên Gate page
    - **Mô tả:** Bắt đầu kiểm tra container

11. **CHECKING → CHECKED** (Inspection Complete)
    - **Actor:** SaleAdmin, SystemAdmin
    - **Trigger:** Click "Duyệt" button sau khi kiểm tra
    - **Mô tả:** Hoàn thành kiểm tra - đạt chuẩn

12. **CHECKING → REJECTED** (Inspection Failed)
    - **Actor:** SaleAdmin, SystemAdmin
    - **Requires:** Lý do từ chối
    - **Mô tả:** Hoàn thành kiểm tra - không đạt chuẩn

13. **SENT_TO_GATE → COMPLETED**
    - **Actor:** SaleAdmin, SystemAdmin, System
    - **Mô tả:** Hoàn tất xử lý tại Gate

### **Container Yard Workflow Integration mới:**

14. **CHECKED → POSITIONED** (Yard Confirm)
    - **Actor:** SaleAdmin, SystemAdmin
    - **Trigger:** Click "Confirm" button trên Yard page
    - **Mô tả:** Container đã được xếp chỗ trong bãi
    - **Side effect:** Tạo ForkliftTask với status = 'PENDING'

15. **POSITIONED → FORKLIFTING** (Driver Start - IMPORT)
    - **Actor:** Driver, SaleAdmin, SystemAdmin
    - **Trigger:** Click "Bắt đầu" button trên DriverDashboard
    - **Mô tả:** Tài xế bắt đầu nâng/hạ container (cho IMPORT)
    - **Side effect:** Cập nhật ForkliftTask.status từ 'PENDING' → 'IN_PROGRESS'

16. **FORKLIFTING → IN_YARD** (Forklift Approval - IMPORT)
    - **Actor:** SaleAdmin, SystemAdmin
    - **Trigger:** Click "Duyệt" button trên Forklift page
    - **Mô tả:** Container đã được đặt vào vị trí trong bãi (cho IMPORT)
    - **Side effect:** Cập nhật ForkliftTask.status thành 'COMPLETED'

17. **FORKLIFTING → IN_CAR** (Forklift Approval - EXPORT) ⭐ **MỚI**
    - **Actor:** SaleAdmin, SystemAdmin
    - **Trigger:** Click "Duyệt" button trên Forklift page
    - **Mô tả:** Container đã được đặt lên xe (cho EXPORT)
    - **Side effect:** Cập nhật ForkliftTask.status thành 'COMPLETED'
    - **Logic mới:** Container tự động ẩn khỏi Yard và ContainersPage

## 🎨 UI/UX Support

### **State Colors & Descriptions mới:**
```typescript
// Màu sắc cho từng trạng thái
PENDING: 'yellow'
SCHEDULED: 'blue' 
SCHEDULED_INFO_ADDED: 'cyan'
SENT_TO_GATE: 'purple'
REJECTED: 'red'
COMPLETED: 'green'
POSITIONED: 'blue'
FORKLIFTING: 'orange'
IN_YARD: 'green'
IN_CAR: 'yellow' ⭐ MỚI

// Mô tả tiếng Việt
PENDING: 'Chờ xử lý'
SCHEDULED: 'Đã đặt lịch hẹn'
SCHEDULED_INFO_ADDED: 'Đã bổ sung thông tin'
SENT_TO_GATE: 'Đã chuyển sang Gate'
REJECTED: 'Bị từ chối'
COMPLETED: 'Hoàn tất'
POSITIONED: 'Đã xếp chỗ trong bãi'
FORKLIFTING: 'Đang nâng/hạ container'
IN_YARD: 'Đã ở trong bãi'
IN_CAR: 'Đã lên xe' ⭐ MỚI
```

### **System Messages mới:**
- 📋 Yêu cầu đã được tạo và đang chờ xử lý
- 📅 Lịch hẹn đã được đặt
- 📄 Thông tin bổ sung đã được cập nhật
- 🚪 Yêu cầu đã được chuyển tiếp sang Gate
- ❌ Yêu cầu bị từ chối: [lý do]
- ✅ Yêu cầu đã hoàn tất
- 📍 Container đã được xếp chỗ trong bãi
- 🚛 Tài xế đang nâng/hạ container
- 🏭 Container đã được đặt vào vị trí trong bãi
- 🚛 Container đã được đặt lên xe ⭐ **MỚI**

## 🔒 Security & Validation

### **Role-based Access Control:**
- **Customer:** Chỉ có thể bổ sung thông tin khi ở trạng thái SCHEDULED
- **Depot:** Có thể đặt lịch, chuyển Gate, từ chối, hoàn tất
- **System:** Có thể hoàn tất request
- **Driver:** Có thể bắt đầu và hoàn thành forklift job

### **Validation Rules:**
- Transition phải hợp lệ theo state machine
- Lý do bắt buộc khi reject
- Chỉ update appointment khi ở trạng thái SCHEDULED
- Không thể chuyển trực tiếp từ PENDING sang SENT_TO_GATE
- **Logic mới:** Phân biệt IMPORT/EXPORT khi approve forklift job
- **Container Validation:** Không thể tạo request IMPORT với container number đã tồn tại

## 📊 Audit & Logging

### **Audit Events:**
Mỗi transition sẽ tạo audit log với:
- Actor ID
- Action type (REQUEST.SCHEDULED, REQUEST.REJECTED, etc.)
- Entity: REQUEST
- Entity ID
- Metadata: from state, to state, reason, additional data

### **History Tracking:**
Mỗi request lưu history array với:
- Timestamp
- Actor ID
- Action
- Additional data (appointment info, documents, etc.)

## 🔗 Related Files

### **Core Implementation:**
- `modules/requests/service/RequestStateMachine.ts` - State machine logic với trạng thái mới
- `modules/requests/service/AppointmentService.ts` - Appointment management
- `modules/requests/service/RequestService.ts` - Main service với state machine + Container validation
  - `validateContainerNumberNotExists()` (lines 252-301) - Container duplicate validation
  - `createByCustomer()` (lines 11-77) - Customer request creation với validation
  - `createBySaleAdmin()` (lines 79-88) - Admin request creation với validation

### **Yard & Forklift Integration:**
- `modules/yard/service/YardService.ts` - Yard confirm logic (CHECKED → POSITIONED)
- `modules/forklift/controller/ForkliftController.ts` - Forklift approval logic mới (FORKKLIFTING → IN_YARD/IN_CAR)
- `modules/driver-dashboard/service/DriverDashboardService.ts` - Driver start logic (POSITIONED → FORKLIFTING)

### **Auto Forklift Task Creation (MỚI):**
- `modules/forklift/service/AutoForkliftTaskService.ts` - Tự động tạo forklift task cho EXPORT requests
- `modules/requests/service/RequestStateMachine.ts` - Integration với state machine
- `prisma/migrations/20250904_auto_create_forklift_task.sql` - Database trigger tự động

### **Frontend Components:**
- `pages/ContainersPage/index.tsx` - Logic derived_status và ẩn container IN_CAR
- `pages/Forklift/index.tsx` - Hiển thị trạng thái mới
- `components/RequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/DepotRequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/SimpleChatBox.tsx` - Hiển thị trạng thái IN_CAR
- `components/RequestForm.tsx` - **MỚI:** Hỗ trợ upload nhiều files chứng từ

#### **RequestForm Component mới:**
```typescript
// State management cho multiple files
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

// File validation cho từng file
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  // Validate từng file (type, size)
  // Add valid files to selectedFiles array
};

// UI hiển thị danh sách files
{selectedFiles.map((file, index) => (
  <div key={index} className="file-preview">
    <span className="file-name">{file.name}</span>
    <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
    <button onClick={() => removeFile(index)}>✕</button>
  </div>
))}
```

#### **CSS Styling mới:**
```css
/* Multiple files preview styles */
.files-preview {
  margin-top: 8px;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  background: #f9fafb;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f3f4f6;
}

.files-list {
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
}
```

### **API Layer:**
- `modules/requests/controller/RequestController.ts` - API endpoints với hỗ trợ upload nhiều files + container validation
  - `create()` (lines 8-43) - Customer request creation với file upload + validation
  - `createBySale()` (lines 44-48) - Admin request creation với validation
- `modules/requests/controller/RequestRoutes.ts` - Route definitions với `upload.array('documents', 10)`
  - `POST /` (line 40) - Create request endpoint với container validation
- `modules/requests/dto/RequestDtos.ts` - Validation schemas với trạng thái mới
  - `createRequestSchema` - Joi validation cho request creation

#### **API Endpoints mới:**
```typescript
// POST /requests - Tạo request với upload nhiều files
router.post('/', upload.array('documents', 10), (req, res) => {
  // Xử lý array of files thay vì single file
  const files = req.files as Express.Multer.File[];
  // Validation cho từng file
  // Upload và lưu trữ nhiều files
});
```

#### **Request Body Format:**
```typescript
// FormData với multiple files
const formData = new FormData();
formData.append('type', 'IMPORT');
formData.append('container_no', 'ISO1234');
formData.append('eta', '2024-01-01T10:00:00Z');
// Multiple files
selectedFiles.forEach(file => {
  formData.append('documents', file);
});
```

### **Database:**
- `prisma/schema.prisma` - Updated schema với trạng thái mới
- `prisma/migrations/` - Migration cho status enum updates

## 🚀 Future Enhancements

### **Short-term:**
- [x] **Upload nhiều files chứng từ** - Hoàn thành implementation
- [x] **Container Number Validation** - Hoàn thành implementation
- [ ] Add export status tracking cho container IN_CAR
- [ ] Implement container departure workflow
- [ ] Add notifications khi container chuyển sang IN_CAR
- [ ] Implement document upload logic trong addInfoToRequest
- [ ] Add validation cho appointment time (không được quá khứ)
- [ ] Add drag & drop support cho file upload
- [ ] Add file preview (PDF viewer, image viewer)

### **Long-term:**
- [ ] Add workflow engine cho complex business rules
- [ ] Implement state machine visualization
- [ ] Add bulk operations cho Depot
- [ ] Implement auto-completion rules
- [ ] Add slot availability check
- [ ] Implement notification system cho state changes

## 📝 TODO & Future Enhancements

### **Short-term**
- [x] **Upload nhiều files chứng từ** - Hoàn thành implementation
- [x] **Container Number Validation** - Hoàn thành implementation
- [ ] Implement document upload logic trong addInfoToRequest
- [ ] Add validation cho appointment time (không được quá khứ)
- [ ] Add slot availability check
- [ ] Implement notification system cho state changes
- [ ] Add drag & drop support cho file upload
- [ ] Add file preview (PDF viewer, image viewer)

### **Long-term**
- [ ] Add workflow engine cho complex business rules
- [ ] Implement state machine visualization
- [ ] Add bulk operations cho Depot
- [ ] Implement auto-completion rules

## 📅 Appointment Form Integration

### **Frontend Components & Code Mapping:**

#### **AppointmentForm.tsx** - Depot appointment form
- **File:** `frontend/components/appointment/AppointmentForm.tsx`
- **Default time logic:** Lines 42-46 (hiện tại + 1 giờ)
- **Form state management:** Lines 48-54
- **Validation logic:** Lines 83-114
- **API integration:** Lines 116-200

#### **RequestForm.tsx** - Customer request creation form
- **File:** `frontend/components/RequestForm.tsx`
- **Default time logic:** Lines 13-28 (thời gian hiện tại)
- **Form state management:** Lines 23-28
- **File upload handling:** Lines 84-129
- **Form validation:** Lines 22-45

#### **AppointmentMini.tsx** - Draggable pop-up modal
- **File:** `frontend/components/appointment/AppointmentMini.tsx`
- **Drag functionality:** Lines 59-80
- **Position management:** Lines 50-56
- **Modal state:** Lines 25-43

#### **AppointmentWindow.tsx** - Window wrapper
- **File:** `frontend/components/appointment/AppointmentWindow.tsx`
- **Error handling:** Lines 46-49
- **Loading states:** Lines 51-66
- **Form integration:** Lines 103-110

#### **Depot.tsx** - Main depot page
- **File:** `frontend/pages/Requests/Depot.tsx`
- **SWR data fetching:** Lines 20-21
- **Filter logic:** Lines 68-81
- **Pagination:** Lines 97-108
- **Modal management:** Lines 301-416

#### **useDepotActions.ts** - Depot actions hook
- **File:** `frontend/pages/Requests/hooks/useDepotActions.ts`
- **State management:** Lines 66-81
- **Change status logic:** Lines 122-171
- **Container selection:** Lines 413-472
- **Document handling:** Lines 475-635

### **API Endpoints:**
```typescript
// Tạo lịch hẹn mới
PATCH /requests/{requestId}/schedule
Body: {
  appointment_time: Date,
  appointment_location_type: 'gate' | 'yard',
  appointment_location_id: string,
  gate_ref?: string,
  appointment_note?: string
}

// Cập nhật lịch hẹn
PATCH /requests/{requestId}/update-appointment
Body: Same as above
```

### **Status Transitions:**
- **IMPORT PENDING** → **SCHEDULED** (sau khi tạo lịch hẹn)
- **EXPORT PENDING** → **PICK_CONTAINER** (sau khi tạo lịch hẹn)

### **Validation Rules:**
- Thời gian lịch hẹn phải trong tương lai
- Địa điểm là bắt buộc
- Loại địa điểm chỉ hỗ trợ 'gate'
- GATE REF và ghi chú là tùy chọn

### **Code Examples:**

#### **RequestForm.tsx - Default Time Logic:**
```typescript
// File: frontend/components/RequestForm.tsx (lines 13-28)
const getDefaultDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5); // Format: HH:MM
  return { date, time };
};

const defaultDateTime = getDefaultDateTime();

const [form, setForm] = useState({ 
  type: 'IMPORT', 
  container_no: '', 
  etaDate: defaultDateTime.date, 
  etaTime: defaultDateTime.time
});
```

#### **AppointmentForm.tsx - Default Time Logic:**
```typescript
// File: frontend/components/appointment/AppointmentForm.tsx (lines 42-52) - FIXED timezone
const getDefaultDateTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  // Sử dụng local time thay vì UTC để tránh vấn đề timezone
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const [formData, setFormData] = useState<AppointmentFormData>({
  appointment_time: getDefaultDateTime(),
  location_type: 'gate',
  location_id: '',
  gate_ref: '',
  note: ''
});
```

#### **Depot.tsx - Modal Integration:**
```typescript
// File: frontend/pages/Requests/Depot.tsx (lines 301-343)
{Array.from(state.activeAppointmentRequests).map((requestId, index) => {
  let request = state.requestsData.find((r: any) => r.id === requestId);
  if (!request) {
    request = data?.data?.find((r: any) => r.id === requestId);
  }
  
  const isChangeMode = request.status === 'SCHEDULED';
  
  return (
    <AppointmentMini
      key={requestId}
      requestId={requestId}
      requestData={{
        id: request.id,
        container_no: request.container_no,
        type: request.type,
        status: request.status,
        created_by: request.created_by
      }}
      onClose={() => actions.handleAppointmentClose(requestId)}
      onSuccess={() => actions.handleAppointmentMiniSuccess(requestId)}
      mode={isChangeMode ? 'change' : 'create'}
    />
  );
})}
```

#### **useDepotActions.ts - Status Management:**
```typescript
// File: frontend/pages/Requests/hooks/useDepotActions.ts (lines 122-171)
const changeStatus = async (id: string, status: string) => {
  if (status === 'RECEIVED') {
    const request = requestsData.find(r => r.id === id);
    
    if (request && request.type === 'EXPORT') {
      // EXPORT: Mở container selection modal
      setSelectedRequestForContainer(request);
      setShowContainerSelectionModal(true);
    } else {
      // IMPORT: Mở appointment mini trực tiếp
      setActiveAppointmentRequests(prev => {
        const newSet = new Set(prev).add(id);
        return newSet;
      });
    }
  }
  // ... other status handling
};
```

### **Recent Updates (v1.3.0):**
- ✅ **Fixed:** Vấn đề timezone trong AppointmentForm - hiển thị 12:00 PM thay vì 6:00 AM
- ✅ **Improved:** Sử dụng local time thay vì UTC time để tránh vấn đề timezone
- ✅ **Enhanced:** Consistent time display across all forms

### **Previous Updates (v1.2.0):**
- ✅ **Fixed:** Thời gian mặc định trong RequestForm hiển thị null → Thời gian hiện tại
- ✅ **Added:** Default time logic cho Customer request creation form
- ✅ **Consistent:** Cùng logic thời gian mặc định cho cả AppointmentForm và RequestForm

### **Previous Updates (v1.1.0):**
- ✅ **Fixed:** Thời gian mặc định hiển thị null → Thời gian hiện tại + 1 giờ
- ✅ **Improved:** Fallback values cho date/time inputs
- ✅ **Enhanced:** Better error handling và validation

---

## 🔄 Auto Forklift Task Creation

### **Tính năng mới: Tự động tạo phiếu forklift cho EXPORT requests**

Khi EXPORT request chuyển sang trạng thái `GATE_IN`, hệ thống sẽ tự động tạo ForkliftTask để di chuyển container từ bãi yard ra cổng gate.

#### **Files liên quan:**
- `prisma/migrations/20250904_auto_create_forklift_task.sql` - Database trigger
- `modules/forklift/service/AutoForkliftTaskService.ts` - Service layer
- `modules/requests/service/RequestStateMachine.ts` - State machine integration

#### **Workflow:**
```
EXPORT Request: SENT_TO_GATE → GATE_IN
                                    ↓
                            Auto-create ForkliftTask
                                    ↓
                            Status: PENDING
                            From: Yard Slot (current location)
                            To: GATE_EXPORT Slot
```

#### **Trigger Conditions:**
- Request type = `EXPORT`
- Status = `GATE_IN`
- Container number tồn tại
- Chưa có ForkliftTask cho container này

#### **Auto-created Task Details:**
- **From Location**: Vị trí hiện tại của container trong yard
- **To Location**: Slot đặc biệt `GATE_EXPORT` (tự động tạo nếu chưa có)
- **Status**: `PENDING`
- **Purpose**: Di chuyển container từ yard ra cổng gate để xuất

#### **Implementation:**
1. **Database Trigger**: Tự động kích hoạt khi ServiceRequest được update
2. **Service Layer**: `AutoForkliftTaskService.createForkliftTaskForExport()`
3. **State Machine**: Integration trong `RequestStateMachine.executeTransition()`
4. **Audit Trail**: Ghi log đầy đủ cho mọi hoạt động tạo task

#### **Error Handling:**
- **Non-blocking**: Lỗi không ảnh hưởng đến state transition
- **Logging**: Ghi log chi tiết để debug
- **Retry Logic**: Có thể retry sau khi state transition hoàn tất

#### **Monitoring:**
- **Audit Logs**: Track mọi hoạt động tạo task
- **Console Logs**: Success/error logs chi tiết
- **Database Logs**: Trigger execution logs

---

**Ngày tạo:** 2024-08-16  
**Phiên bản:** 3.3.0 - Upload nhiều files chứng từ + Container Yard Workflow Integration + IN_CAR Status + Container Number Validation + Auto Forklift Task Creation  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation và debug + Upload nhiều files + Container Yard Workflow + Logic phân biệt IMPORT/EXPORT + Container Number Validation + Auto Forklift Task Creation
