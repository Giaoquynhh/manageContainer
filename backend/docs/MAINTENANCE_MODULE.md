# MAINTENANCE MODULE - BACKEND DOCUMENTATION

## 📋 Tổng quan

Module bảo trì (Maintenance) quản lý toàn bộ quy trình kiểm tra, sửa chữa container và quản lý tồn kho phụ tùng. Module này tích hợp chặt chẽ với ServiceRequest để đồng bộ trạng thái giữa yêu cầu và phiếu sửa chữa.

## 🏗️ Kiến trúc

### Cấu trúc thư mục
```
modules/maintenance/
├── controller/          # Xử lý HTTP requests
├── service/            # Logic nghiệp vụ
├── dto/               # Validation schemas
├── routes/            # Định nghĩa API routes
└── docs/              # Tài liệu module
```

### Các thành phần chính
- **MaintenanceController**: Xử lý HTTP requests và responses
- **MaintenanceService**: Logic nghiệp vụ và tương tác database
- **MaintenanceRoutes**: Định nghĩa API endpoints
- **MaintenanceDtos**: Validation schemas cho input/output

## 🔌 API Endpoints

### 1. Quản lý phiếu sửa chữa (Repair Tickets)

#### `POST /maintenance/repairs`
- **Mô tả**: Tạo phiếu sửa chữa mới
- **Body**: `createRepairSchema`
- **Response**: Phiếu sửa chữa đã tạo

#### `GET /maintenance/repairs`
- **Mô tả**: Lấy danh sách phiếu sửa chữa
- **Query**: `listRepairsSchema` (status, container_no)
- **Response**: Danh sách phiếu sửa chữa

#### `GET /maintenance/repairs/:id`
- **Mô tả**: Lấy chi tiết phiếu sửa chữa
- **Response**: Thông tin chi tiết phiếu sửa chữa

#### `PATCH /maintenance/repairs/:id/status`
- **Mô tả**: Cập nhật trạng thái phiếu sửa chữa
- **Body**: `updateRepairDetailsSchema`
- **Response**: Phiếu sửa chữa đã cập nhật

#### `PATCH /maintenance/repairs/:id/details`
- **Mô tả**: Cập nhật thông tin chi tiết sửa chữa
- **Body**: `updateRepairDetailsSchema`
- **Response**: Phiếu sửa chữa đã cập nhật

#### `POST /maintenance/repairs/:id/complete-check`
- **Mô tả**: Hoàn thành kiểm tra container
- **Body**: `completeCheckSchema`
- **Response**: Kết quả kiểm tra

#### `POST /maintenance/repairs/:id/approve`
- **Mô tả**: Chấp nhận phiếu sửa chữa
- **Body**: `approveSchema`
- **Response**: Phiếu sửa chữa đã được chấp nhận

#### `POST /maintenance/repairs/:id/reject`
- **Mô tả**: Từ chối phiếu sửa chữa
- **Body**: `rejectSchema`
- **Response**: Phiếu sửa chữa đã bị từ chối

### 2. Quản lý tồn kho (Inventory)

#### `GET /maintenance/inventory`
- **Mô tả**: Lấy danh sách phụ tùng tồn kho
- **Response**: Danh sách phụ tùng

#### `POST /maintenance/inventory`
- **Mô tả**: Tạo phụ tùng mới
- **Body**: `createInventorySchema`
- **Response**: Phụ tùng đã tạo

#### `GET /maintenance/inventory/:id`
- **Mô tả**: Lấy chi tiết phụ tùng
- **Response**: Thông tin chi tiết phụ tùng

#### `PUT /maintenance/inventory/:id`
- **Mô tả**: Cập nhật thông tin phụ tùng
- **Body**: `updateInventorySchema`
- **Response**: Phụ tùng đã cập nhật

## 🗄️ Database Models

### RepairTicket
```prisma
model RepairTicket {
  id                    String      @id @default(cuid())
  code                  String      @unique
  container_no          String?
  equipment_id          String?
  problem_description   String
  estimated_cost        Decimal     @default(0)
  status                RepairStatus @default(CHECKING)
  manager_comment       String?
  labor_cost            Decimal?
  selected_parts        String?
  technician_notes      String?
  repair_notes          String?
  created_at            DateTime    @default(now())
  updated_at            DateTime    @updatedAt
  created_by            String
  updated_by            String?
  
  items                 RepairItem[]
}
```

### InventoryItem
```prisma
model InventoryItem {
  id            String   @id @default(cuid())
  name          String
  uom           String
  qty_on_hand  Int      @default(0)
  reorder_point Int     @default(0)
  price         Decimal  @default(0)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  created_by    String
  updated_by    String?
}
```

### RepairStatus Enum
```prisma
enum RepairStatus {
  CHECKING         // Đang kiểm tra
  PENDING_ACCEPT   // Chờ chấp nhận
  REPAIRING        // Đang sửa chữa
  CHECKED          // Đã kiểm tra
  REJECTED         // Đã từ chối
}
```

## 🔄 Quy trình nghiệp vụ

### 1. Quy trình kiểm tra container
```
GATE_IN → CHECKING → CHECKED/REJECTED
```

**Chi tiết:**
- Container có trạng thái `GATE_IN` được chọn để kiểm tra
- Khi bấm "Bắt đầu kiểm tra":
  - `ServiceRequest.status` → `CHECKING`
  - Tạo `RepairTicket` với `status = CHECKING`
- Kết quả kiểm tra:
  - **Đạt chuẩn**: `RepairTicket.status` → `CHECKED`, `ServiceRequest.status` → `CHECKED`
  - **Không đạt chuẩn**: Giữ nguyên `CHECKING`, hiển thị 2 option:
    - "Có thể sửa chữa": Mở popup hóa đơn sửa chữa
    - "Không thể sửa chữa": `RepairTicket.status` → `REJECTED`, `ServiceRequest.status` → `REJECTED`

### 2. Quy trình sửa chữa
```
CHECKING → REPAIRING → CHECKED
```

**Chi tiết:**
- Khi chọn "Có thể sửa chữa":
  - Mở popup hóa đơn sửa chữa
  - Chọn phụ tùng từ inventory
  - Nhập chi phí công sửa chữa
  - Tính toán chi phí ước tính = giá phụ tùng + công sửa chữa
  - Cập nhật `RepairTicket` với thông tin chi tiết

## 💻 Logic nghiệp vụ chính

### MaintenanceService

#### `createRepair(actor, payload)`
- Tạo phiếu sửa chữa với `status = CHECKING`
- Tự động tạo `RepairItem` nếu có

#### `updateRepairStatus(actor, id, status, manager_comment)`
- Cập nhật trạng thái phiếu sửa chữa
- Đồng bộ trạng thái với `ServiceRequest` nếu cần

#### `completeRepairCheck(actor, id, result, manager_comment)`
- Hoàn thành kiểm tra container
- Cập nhật cả `RepairTicket` và `ServiceRequest` status

#### `updateRepairDetails(actor, id, data)`
- Cập nhật thông tin chi tiết sửa chữa
- Tính toán tự động `estimated_cost` từ phụ tùng và công sửa chữa

#### `updateRequestStatusByContainer(containerNo, repairStatus)`
- Đồng bộ trạng thái `ServiceRequest` dựa trên `RepairTicket`

## 🔐 Validation Schemas

### createRepairSchema
```typescript
{
  code: string (required),
  container_no: string (optional),
  equipment_id: string (optional),
  problem_description: string (required),
  estimated_cost: number (optional),
  items: array (optional)
}
```

### listRepairsSchema
```typescript
{
  status: string (optional) - CHECKING, PENDING_ACCEPT, REPAIRING, CHECKED, REJECTED
}
```

### updateRepairDetailsSchema
```typescript
{
  problem_description: string (optional),
  selected_parts: string[] (optional),
  labor_cost: number (optional),
  technician_notes: string (optional),
  repair_notes: string (optional)
}
```

### completeCheckSchema
```typescript
{
  result: 'PASS' | 'FAIL' (required),
  manager_comment: string (optional)
}
```

## 🔗 Tích hợp với các module khác

### ServiceRequest Module
- Đồng bộ trạng thái giữa `ServiceRequest` và `RepairTicket`
- Sử dụng `RequestStateMachine` để quản lý trạng thái

### Container Module
- Liên kết container với phiếu sửa chữa qua `container_no`

### Inventory Module
- Quản lý phụ tùng và tính toán chi phí

## 🧪 Testing

### Test Cases chính
1. **Tạo phiếu sửa chữa**: Kiểm tra tạo thành công với status `CHECKING`
2. **Kiểm tra container**: Kiểm tra chuyển trạng thái từ `GATE_IN` → `CHECKING`
3. **Hoàn thành kiểm tra**: Kiểm tra chuyển trạng thái → `CHECKED` hoặc `REJECTED`
4. **Đồng bộ trạng thái**: Kiểm tra `ServiceRequest` và `RepairTicket` đồng bộ
5. **Cập nhật chi tiết**: Kiểm tra tính toán chi phí tự động

### API Testing
```bash
# Test tạo phiếu sửa chữa
curl -X POST http://localhost:1100/backend/maintenance/repairs \
  -H "Content-Type: application/json" \
  -d '{"code":"REP-001","container_no":"CONT-001","problem_description":"Test"}'

# Test lấy danh sách
curl http://localhost:1100/backend/maintenance/repairs

# Test hoàn thành kiểm tra
curl -X POST http://localhost:1100/backend/maintenance/repairs/1/complete-check \
  -H "Content-Type: application/json" \
  -d '{"result":"PASS"}'
```

## 🚀 Deployment

### Yêu cầu hệ thống
- Node.js 16+
- PostgreSQL 12+
- Prisma ORM

### Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5432/container_manager"
JWT_SECRET="your-jwt-secret"
```

### Build và Deploy
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run migrations
npx prisma migrate deploy

# Start production
npm start
```

## 🔒 Bảo mật

### Authentication
- Tất cả endpoints yêu cầu JWT token
- Sử dụng `AuthRequest` middleware

### Authorization
- Kiểm tra quyền truy cập dựa trên role
- Validation input data với Joi schemas

### Data Validation
- Sanitize input data
- Validate với strict schemas
- SQL injection protection qua Prisma

## 📝 Changelog

### Version 1.0.0
- ✅ Tạo module bảo trì cơ bản
- ✅ Quản lý phiếu sửa chữa
- ✅ Quản lý tồn kho phụ tùng
- ✅ Tích hợp với ServiceRequest
- ✅ Quy trình kiểm tra container
- ✅ Tính toán chi phí tự động

### Version 1.1.0 (Planned)
- 🔄 Dashboard thống kê bảo trì
- 🔄 Báo cáo chi phí sửa chữa
- 🔄 Quản lý lịch sử sửa chữa
- 🔄 Notification system

## 🐛 Troubleshooting

### Lỗi thường gặp

#### 1. Lỗi 400 Bad Request
- **Nguyên nhân**: Validation schema không khớp với input
- **Giải pháp**: Kiểm tra `MaintenanceDtos.ts` và input data

#### 2. Lỗi đồng bộ trạng thái
- **Nguyên nhân**: `ServiceRequest` và `RepairTicket` không đồng bộ
- **Giải pháp**: Kiểm tra `updateRequestStatusByContainer` method

#### 3. Lỗi tính toán chi phí
- **Nguyên nhân**: Phụ tùng không có giá hoặc `labor_cost` không hợp lệ
- **Giải pháp**: Kiểm tra `InventoryItem.price` và validation

### Debug Commands
```bash
# Kiểm tra logs
npm run dev

# Kiểm tra database
npx prisma studio

# Reset database
npx prisma migrate reset
```

## 📚 Tài liệu tham khảo

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Joi Validation](https://joi.dev/api/)
- [Express.js](https://expressjs.com/)
- [Node.js](https://nodejs.org/)

---

**Lưu ý**: Module này đang trong quá trình phát triển. Vui lòng báo cáo bugs và đề xuất cải tiến qua issue tracker.
