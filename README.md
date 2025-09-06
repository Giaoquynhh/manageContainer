# Container Management System

## 🚀 Tính năng mới: Gate Time Auto Fill System

### **Hệ thống tự động điền thời gian Gate**

Hệ thống đã được cập nhật với logic tự động điền thời gian vào và ra cổng, loại bỏ việc người dùng phải nhập thời gian thủ công.

#### **Tính năng chính:**
- ✅ **Tự động điền time_in**: Khi request chuyển từ `FORWARDED` → `GATE_IN`
- ✅ **Tự động điền time_out**: Khi request chuyển từ `IN_YARD/IN_CAR` → `GATE_OUT`
- ✅ **Giao diện đơn giản**: Chỉ cần nhập tên tài xế và biển số xe
- ✅ **Thời gian chính xác**: Lấy từ server, không phụ thuộc client
- ✅ **Responsive design**: Hoạt động tốt trên mọi thiết bị

#### **Workflow mới:**
```
FORWARDED → [User nhập tài xế/biển số] → GATE_IN (time_in tự động)
GATE_IN → [Forklift operations] → IN_YARD/IN_CAR
IN_YARD/IN_CAR → [User click GATE_OUT] → GATE_OUT (time_out tự động)
```

#### **Tài liệu chi tiết:**
- [GATE_TIME_SYSTEM_OVERVIEW.md](./docs/GATE_TIME_SYSTEM_OVERVIEW.md) - Tổng quan hệ thống
- [Backend: AUTO_TIME_FILL_LOGIC.md](./backend/docs/AUTO_TIME_FILL_LOGIC.md) - Logic backend
- [Frontend: GATE_TIME_DISPLAY_LOGIC.md](./frontend/docs/GATE_TIME_DISPLAY_LOGIC.md) - Logic frontend

#### **Files Modified:**
- `backend/modules/gate/service/GateService.ts` - Auto fill logic
- `backend/prisma/schema.prisma` - Database schema
- `frontend/pages/Gate/components/GateActionButtons.tsx` - UI updates
- `frontend/styles/gate.css` - Styling improvements

## 🚀 Tính năng mới: Container Duplicate Validation

### **Ngăn chặn tạo request import trùng lặp**

Hệ thống đã được cập nhật với logic validation để ngăn chặn tạo request import với container number đã tồn tại trong hệ thống.

#### **Logic Validation Nâng Cao:**
- ✅ **Kiểm tra ServiceRequest**: Container với status chưa hoàn thành (PENDING, SCHEDULED, etc.)
- ✅ **Kiểm tra RepairTicket**: Container đang trong quy trình sửa chữa (CHECKED)
- ✅ **Kiểm tra YardPlacement**: Container đã được đặt vào yard (OCCUPIED)
- ✅ **Đồng bộ với UI**: Sử dụng cùng query logic như Yard/ContainersPage
- ✅ **Cho phép tạo mới**: Chỉ khi container thực sự không có trong depot

#### **Error Messages:**
```
Container ISO 1234 đã tồn tại trong hệ thống với trạng thái PENDING. 
Chỉ có thể tạo request mới khi container không còn trong hệ thống.
```

#### **Files Modified:**
- `backend/modules/requests/service/RequestBaseService.ts` - Enhanced validation logic
- `backend/docs/ENHANCED_CONTAINER_VALIDATION.md` - Enhanced documentation
- `backend/test-enhanced-container-validation.js` - Enhanced test script
- `frontend/docs/CONTAINER_DUPLICATE_VALIDATION_FRONTEND.md` - Frontend docs

## 🚀 Tính năng mới: Phân biệt IMPORT/EXPORT với trạng thái IN_CAR và GATE_OUT

### **Workflow mới với trạng thái IN_CAR và GATE_OUT**

#### 1. **Import Request Workflow (MỚI):**
```
1. CHECKED → POSITIONED (Yard confirm)
2. POSITIONED → FORKLIFTING (Driver click "Bắt đầu")
3. FORKLIFTING → IN_YARD (Forklift approval)
4. IN_YARD → GATE_OUT (Xe đã rời kho) ⭐ MỚI
```

#### 2. **Export Request Workflow (MỚI):**
```
1. GATE_IN → FORKLIFTING (Driver click "Bắt đầu")
2. FORKLIFTING → IN_CAR (Forklift approval)
3. IN_CAR → GATE_OUT (Xe đã rời kho) ⭐ MỚI
4. Container tự động ẩn khỏi Yard và ContainersPage
```

### **Logic mới khi approve forklift job:**
- **IMPORT requests**: `FORKLIFTING` → `IN_YARD` → `GATE_OUT` (logic mới)
- **EXPORT requests**: `FORKLIFTING` → `IN_CAR` → `GATE_OUT` (logic mới)

### **Trạng thái GATE_OUT:**
- **GATE_OUT**: Xe đã rời kho (cho cả IMPORT và EXPORT)
- Đánh dấu hoàn tất quy trình xử lý container
- Xe không còn ở trong depot

### **Ẩn container IN_CAR:**
- Container có trạng thái `IN_CAR` sẽ tự động ẩn khỏi:
  - `http://localhost:5002/Yard` - Không hiển thị trong bản đồ bãi
  - `http://localhost:5002/ContainersPage` - Không hiển thị trong danh sách container

## 📋 Mô tả dự án

Hệ thống quản lý container toàn diện với các module chính: Auth, Requests, Gate, Yard, Forklift, Maintenance, Finance, Reports và Chat. Hệ thống đã được cập nhật với **Request State Machine** và **logic phân biệt IMPORT/EXPORT** để quản lý workflow trạng thái một cách nhất quán.

## 🏗️ Cấu trúc dự án

```
manageContainer/
├── backend/                 # Backend API (Node.js + TypeScript)
│   ├── modules/            # Các module chức năng
│   │   ├── auth/          # Xác thực và phân quyền
│   │   ├── requests/      # Quản lý yêu cầu dịch vụ + State Machine
│   │   ├── gate/          # Quản lý cổng ra/vào
│   │   ├── yard/          # Quản lý bãi container + Lọc bỏ container IN_CAR
│   │   ├── forklift/      # Quản lý xe nâng + Logic phân biệt IMPORT/EXPORT
│   │   ├── maintenance/   # Quản lý bảo trì
│   │   ├── finance/       # Quản lý tài chính
│   │   ├── reports/       # Báo cáo và thống kê
│   │   └── chat/          # Hệ thống chat
│   ├── shared/            # Shared utilities và middlewares
│   └── prisma/            # Database schema và migrations
├── frontend/               # Frontend (Next.js + TypeScript)
│   ├── pages/             # Các trang chính
│   │   ├── Requests/      # Quản lý yêu cầu dịch vụ
│   │   ├── Yard/          # Quản lý bãi container + Ẩn container IN_CAR
│   │   ├── Forklift/      # Quản lý xe nâng + Hiển thị trạng thái mới
│   │   ├── ContainersPage/# Danh sách container + Logic ẩn container IN_CAR
│   │   └── ...            # Các trang khác
│   ├── components/         # Các component tái sử dụng
│   │   ├── RequestTable.tsx        # Hiển thị trạng thái IN_CAR
│   │   ├── DepotRequestTable.tsx   # Hiển thị trạng thái IN_CAR
│   │   ├── SimpleChatBox.tsx       # Hiển thị trạng thái IN_CAR
│   │   └── ...                     # Các component khác
│   └── services/          # API calls
└── docs/                  # Tài liệu dự án
```

## 🚀 Tính năng chính

### **1. Quản lý yêu cầu dịch vụ (Requests)**
- **State Machine**: Quản lý workflow trạng thái một cách nhất quán
- **Logic mới**: Phân biệt IMPORT/EXPORT khi approve forklift job
- **Trạng thái mới**: 
  - IN_CAR cho container đã lên xe
  - GATE_OUT cho xe đã rời kho (cả IMPORT và EXPORT)
- **Ẩn container IN_CAR**: Tự động ẩn khỏi Yard và ContainersPage

### **2. Quản lý bãi container (Yard)**
- **Sơ đồ bãi trực quan**: Hiển thị vị trí container theo block và slot
- **Gợi ý vị trí**: Tự động gợi ý vị trí tối ưu cho container mới
- **Stacking logic**: Quản lý container theo tầng (tier)
- **Lọc bỏ container IN_CAR**: Không hiển thị container đã lên xe

### **3. Quản lý xe nâng (Forklift)**
- **Workflow mới**: PENDING → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → COMPLETED
- **Logic phân biệt IMPORT/EXPORT**: 
  - IMPORT: FORKLIFTING → IN_YARD
  - EXPORT: FORKLIFTING → IN_CAR
- **Gán tài xế**: Quản lý việc gán tài xế cho công việc
- **Duyệt công việc**: Admin duyệt sau khi tài xế hoàn thành

### **4. Quản lý cổng (Gate)**
- **Check-in/Check-out**: Quản lý xe ra/vào bãi
- **Phiếu hẹn**: Đối chiếu với lịch hẹn
- **In phiếu**: Tự động in phiếu Gate IN/OUT

### **5. Hệ thống chat**
- **Real-time communication**: Giao tiếp giữa depot staff và customer
- **Status-based activation**: Chat chỉ hoạt động khi request status ≥ SCHEDULED
- **Message persistence**: Lưu trữ tin nhắn vào database

## 🔧 Cài đặt và chạy

### **Backend**
```bash
cd backend
npm install
npm run dev
```

### **Frontend**
```bash
cd frontend
npm install
npm run dev
```

### **Database**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

## 📊 API Endpoints

### **Forklift (Logic mới)**
- `PATCH /forklift/jobs/:jobId/assign-driver` - Gán tài xế
- `PATCH /forklift/jobs/:jobId/start` - Bắt đầu công việc
- `PATCH /forklift/jobs/:jobId/complete` - Hoàn thành công việc
- `PATCH /forklift/jobs/:jobId/approve` - Duyệt công việc (Logic phân biệt IMPORT/EXPORT)

### **Requests (State Machine)**
- `PATCH /requests/:id/schedule` - Đặt lịch hẹn
- `PATCH /requests/:id/add-info` - Bổ sung thông tin
- `PATCH /requests/:id/send-to-gate` - Chuyển Gate
- `PATCH /requests/:id/complete` - Hoàn tất

### **Yard (Lọc bỏ container IN_CAR)**
- `GET /yard/stack-map` - Bản đồ bãi (không hiển thị container IN_CAR)
- `GET /yard/stack/:slotId` - Chi tiết slot (không hiển thị container IN_CAR)
- `GET /yard/container/:containerNo` - Vị trí container (null nếu IN_CAR)

## 🔄 Workflow Integration

### **Container Yard Workflow Integration mới:**

#### **Import Request Workflow (MỚI):**
```
1. CHECKED → POSITIONED (Yard confirm)
2. POSITIONED → FORKLIFTING (Driver click "Bắt đầu")
3. FORKLIFTING → IN_YARD (Forklift approval)
4. IN_YARD → GATE_OUT (Xe đã rời kho) ⭐ MỚI
```

#### **Export Request Workflow (MỚI):**
```
1. GATE_IN → FORKLIFTING (Driver click "Bắt đầu")
2. FORKLIFTING → IN_CAR (Forklift approval)
3. IN_CAR → GATE_OUT (Xe đã rời kho) ⭐ MỚI
4. Container tự động ẩn khỏi Yard và ContainersPage
```

### **State Machine Integration:**
- **RequestStateMachine** quản lý tất cả transitions
- **Phân biệt IMPORT/EXPORT** khi approve forklift job
- **Tự động ẩn container IN_CAR** khỏi giao diện quản lý bãi

## 🎯 Business Logic mới

### **Khi approve forklift job:**
- **IMPORT requests**: Container được đặt vào vị trí trong bãi → Hiển thị trong Yard và ContainersPage
- **EXPORT requests**: Container được đặt lên xe → Tự động ẩn khỏi Yard và ContainersPage

### **Khi xe rời kho (GATE_OUT):**
- **IMPORT requests**: Container đã được đặt trong bãi, xe rời kho → Đánh dấu hoàn tất
- **EXPORT requests**: Container đã lên xe, xe rời kho → Đánh dấu hoàn tất

### **Lý do logic mới:**
- Container EXPORT đã lên xe không còn ở depot
- Cần ẩn khỏi giao diện quản lý bãi
- Logic phân biệt rõ ràng giữa nhập và xuất

## 📈 Performance Impact

### **Database Queries:**
- Thêm filter để loại bỏ container IN_CAR trong yard operations
- Không ảnh hưởng đến performance vì chỉ filter thêm điều kiện

### **Frontend Rendering:**
- Container IN_CAR được ẩn hoàn toàn
- Giảm số lượng item hiển thị
- Cải thiện UX cho người dùng

## 🚀 Future Enhancements

### **Short-term:**
- [ ] Add export status tracking cho container IN_CAR
- [ ] Implement container departure workflow
- [ ] Add notifications khi container chuyển sang IN_CAR

### **Long-term:**
- [ ] Add workflow engine cho complex business rules
- [ ] Implement state machine visualization
- [ ] Add bulk operations cho Depot
- [ ] Implement auto-completion rules

## 📝 Documentation

### **Core Documentation:**
- `docs/PROJECT_OVERVIEW.md` - Tổng quan dự án
- `docs/README_DRIVER_EXPORT_UPDATE.md` - Cập nhật driver export
- `docs/README_EXPORT_DOC_FEATURE.md` - Tính năng export document

### **Module Documentation:**
- `docs/MODULE_2_AUTH.md` - Xác thực và phân quyền
- `docs/MODULE_3_REQUESTS.md` - Quản lý yêu cầu dịch vụ + State Machine
- `docs/MODULE_4_GATE.md` - Quản lý cổng ra/vào
- `docs/MODULE_4_YARD.md` - Quản lý bãi container
- `docs/MODULE_5_ContainerManager.md` - Quản lý container
- `docs/MAINTENANCE_MODULE.md` - Quản lý bảo trì
- `docs/MODULE_7_FINANCE.md` - Quản lý tài chính
- `docs/MODULE_8_REPORTS.md` - Báo cáo và thống kê

### **Feature Documentation:**
- `docs/CHAT_SYSTEM.md` - Hệ thống chat
- `docs/FORKLIFT_STATUS_UPDATE.md` - Cập nhật trạng thái forklift + Logic mới
- `docs/REQUEST_STATE_MACHINE_IMPLEMENTATION.md` - Implementation State Machine + Logic mới
- `docs/GATE_OUT_STATUS_UPDATE.md` - Thêm trạng thái GATE_OUT cho xe rời kho ⭐ MỚI
- `docs/FORKLIFT_ACTION_MAPPING.md` - Mapping hành động forklift
- `docs/FORKLIFT_ISSUE_ANALYSIS.md` - Phân tích vấn đề forklift

## 🔗 Related Files

### **Backend Implementation:**
- `modules/forklift/controller/ForkliftController.ts` - Logic approve job mới
- `modules/requests/service/RequestStateMachine.ts` - Thêm trạng thái IN_CAR, GATE_OUT và transitions
- `modules/yard/service/YardService.ts` - Lọc bỏ container IN_CAR

### **Frontend Implementation:**
- `pages/Forklift/index.tsx` - Hiển thị trạng thái mới
- `pages/ContainersPage/index.tsx` - Ẩn container IN_CAR
- `components/RequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/DepotRequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/SimpleChatBox.tsx` - Hiển thị trạng thái IN_CAR

---

**Ngày tạo:** 2024-08-16  
**Phiên bản:** 4.1.0 - Container Yard Workflow Integration + Logic phân biệt IMPORT/EXPORT + Trạng thái GATE_OUT  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation và debug + Container Yard Workflow + Logic phân biệt IMPORT/EXPORT + Ẩn container IN_CAR + Trạng thái GATE_OUT cho xe rời kho