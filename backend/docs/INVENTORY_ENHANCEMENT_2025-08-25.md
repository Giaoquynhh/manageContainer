# Inventory Enhancement - 2025-08-25

## Tổng quan
Cập nhật Module 6 (Maintenance & Inventory) để thêm trường đơn giá và chức năng thêm sản phẩm mới.

## Thay đổi Database

### 1. Schema Prisma
- **File**: `prisma/schema.prisma`
- **Thay đổi**: Thêm trường `unit_price` vào model `InventoryItem`
```prisma
model InventoryItem {
  id            String               @id @default(cuid())
  name          String               @unique
  uom           String
  qty_on_hand   Int                  @default(0)
  reorder_point Int                  @default(0)
  unit_price    Int                  @default(0)  // Đơn giá (VND) - MỚI
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt
  movements     InventoryMovement[]
  repairItems   RepairTicketItem[]
}
```

### 2. Migration
- **File**: `prisma/migrations/20250825102150_add_unit_price_to_inventory/`
- **Lệnh**: `npx prisma migrate dev --name add_unit_price_to_inventory`

## Thay đổi Backend

### 1. DTO Validation
- **File**: `modules/maintenance/dto/MaintenanceDtos.ts`
- **Thêm**: `createInventorySchema` cho API tạo mới
```typescript
export const createInventorySchema = Joi.object({
  name: Joi.string().required(),
  uom: Joi.string().required(),
  qty_on_hand: Joi.number().integer().min(0).default(0),
  reorder_point: Joi.number().integer().min(0).default(0),
  unit_price: Joi.number().integer().min(0).default(0)
});
```

### 2. Service Layer
- **File**: `modules/maintenance/service/MaintenanceService.ts`
- **Thêm**: Method `createInventory()` để tạo sản phẩm mới
- **Cập nhật**: Method `updateInventory()` để xử lý trường `unit_price`

### 3. Controller
- **File**: `modules/maintenance/controller/MaintenanceController.ts`
- **Thêm**: Method `createInventory()` để xử lý request tạo mới

### 4. Routes
- **File**: `modules/maintenance/controller/MaintenanceRoutes.ts`
- **Thêm**: `POST /inventory/items` để tạo sản phẩm mới

## Thay đổi Frontend

### 1. Service API
- **File**: `frontend/services/maintenance.ts`
- **Thêm**: Method `createInventory()` để gọi API tạo mới

### 2. Inventory Page
- **File**: `frontend/pages/Maintenance/Inventory.tsx`
- **Thêm**: 
  - State `showAddForm` để hiển thị/ẩn form thêm mới
  - State `newItem` để quản lý dữ liệu form
  - Function `addNewItem()` để xử lý thêm sản phẩm
  - Form thêm sản phẩm với các trường: Tên, ĐVT, Tồn kho, Điểm đặt hàng, Đơn giá
  - Cột "Đơn giá (VND)" trong bảng hiện có
  - Nút "Thêm sản phẩm" ở header

## Seed Data

### Cập nhật seed với đơn giá
- **File**: `prisma/seed.ts`
```typescript
await prisma.inventoryItem.createMany({ data: [
  { name: 'Sơn chống rỉ', uom: 'lit', qty_on_hand: 50, reorder_point: 10, unit_price: 150000 },
  { name: 'Đinh tán', uom: 'pcs', qty_on_hand: 1000, reorder_point: 200, unit_price: 500 },
  { name: 'Ron cao su', uom: 'pcs', qty_on_hand: 500, reorder_point: 100, unit_price: 2500 }
] });
```

## API Endpoints

### Inventory Management
- `GET /maintenance/inventory/items` - Lấy danh sách vật tư
- `POST /maintenance/inventory/items` - **MỚI**: Tạo vật tư mới
- `PUT /maintenance/inventory/items/:id` - Cập nhật vật tư (bao gồm đơn giá)

### Repair Invoice Management ⭐ **MỚI**
- `POST /maintenance/repairs/:id/invoice` - Tạo hóa đơn sửa chữa
- `GET /maintenance/repairs/:id/invoice` - Xem hóa đơn sửa chữa

### Request/Response Examples

#### Tạo vật tư mới
```http
POST /maintenance/inventory/items
Content-Type: application/json

{
  "name": "Vít ốc M6",
  "uom": "pcs",
  "qty_on_hand": 200,
  "reorder_point": 50,
  "unit_price": 1500
}
```

#### Cập nhật vật tư
```http
PUT /maintenance/inventory/items/:id
Content-Type: application/json

{
  "qty_on_hand": 180,
  "reorder_point": 50,
  "unit_price": 1500
}
```

#### Tạo hóa đơn sửa chữa ⭐ **MỚI**
```http
POST /maintenance/repairs/:id/invoice
Content-Type: application/json

{
  "repair_ticket_id": "repair_123",
  "labor_cost": 500000,
  "selected_parts": [
    {
      "inventory_item_id": "inv_456",
      "quantity": 2
    },
    {
      "inventory_item_id": "inv_789",
      "quantity": 1
    }
  ]
}
```

**Response Example:**
```json
{
  "id": "repair_123",
  "code": "REP-1756122766815",
  "container_no": "ISO 1111",
  "status": "REPAIRING",
  "estimated_cost": 3500000,
  "labor_cost": 500000,
  "parts_cost": 3000000,
  "total_cost": 3500000,
  "items": [
    {
      "id": "item_1",
      "inventory_item_id": "inv_456",
      "quantity": 2,
      "inventoryItem": {
        "name": "Sơn chống rỉ",
        "uom": "lit",
        "unit_price": 1500000
      }
    }
  ]
}
```

## Validation Rules

### Tạo mới
- `name`: Bắt buộc, string
- `uom`: Bắt buộc, string (đơn vị tính)
- `qty_on_hand`: Tùy chọn, số nguyên ≥ 0, mặc định 0
- `reorder_point`: Tùy chọn, số nguyên ≥ 0, mặc định 0
- `unit_price`: Tùy chọn, số nguyên ≥ 0, mặc định 0

### Cập nhật
- `qty_on_hand`: Bắt buộc, số nguyên ≥ 0
- `reorder_point`: Bắt buộc, số nguyên ≥ 0
- `unit_price`: Bắt buộc, số nguyên ≥ 0

## Audit Logging

### Events
- `INVENTORY.CREATED`: Khi tạo vật tư mới
- `INVENTORY.UPDATED`: Khi cập nhật vật tư (bao gồm đơn giá)

### Metadata
- Lưu toàn bộ payload trong audit log để tracking

## UI/UX Improvements (v2025-08-25) ⭐ **MỚI**

### Popup Hóa đơn Sửa chữa
- **Component**: `RepairInvoiceModal.tsx`
- **Tính năng chính**:
  - **Input Validation**: Chi phí công và số lượng phụ tùng chỉ cho phép nhập số nguyên
  - **Table phụ tùng**: Hiển thị rõ ràng với cột: Tên phụ tùng, Đơn giá (VND), Số lượng, Thành tiền (VND)
  - **Tính toán tự động**: Chi phí phụ tùng + Chi phí công = Tổng chi phí
  - **Real-time updates**: Cập nhật tổng chi phí ngay khi thay đổi input

### Validation Rules
- **Chi phí công sửa chữa**: Số nguyên ≥ 0, regex `/^\d+$/`
- **Số lượng phụ tùng**: Số nguyên > 0, regex `/^\d+$/`
- **Phụ tùng**: Phải chọn ít nhất 1 phụ tùng

### Styling & Layout
- **Modal responsive**: Max-width 800px, scrollable khi cần
- **Table design**: Border, màu sắc, căn chỉnh text phù hợp
- **Color scheme**: 
  - Header: #1f2937 (dark gray)
  - Success: #059669 (green)
  - Warning: #dc2626 (red)
  - Info: #1e40af (blue)

## Testing

### Backend
1. Chạy migration: `npx prisma migrate dev`
2. Chạy seed: `npx prisma db seed`
3. Test API endpoints với Postman/Insomnia

### Frontend
1. Khởi động frontend: `npm run dev`
2. Truy cập `/Maintenance/Inventory` - Test thêm sản phẩm mới
3. Truy cập `/Maintenance/Repairs` - Test popup hóa đơn sửa chữa
4. Test chỉnh sửa đơn giá

## Rollback

### Nếu cần rollback
1. Xóa migration: `npx prisma migrate reset`
2. Khôi phục schema cũ
3. Xóa code frontend liên quan

## Notes
- Đơn giá được lưu dưới dạng số nguyên (VND) để tránh vấn đề floating point
- Form thêm mới có validation client-side và server-side
- UI responsive với grid layout cho form
- Tất cả thay đổi đều có audit logging

## Cải tiến gần đây (v2025-08-25)

### Popup Hóa đơn Sửa chữa
- **Input Validation**: Chi phí công và số lượng phụ tùng chỉ cho phép nhập số nguyên
- **Table phụ tùng**: Hiển thị rõ ràng với cột: Tên phụ tùng, Đơn giá (VND), Số lượng, Thành tiền (VND)
- **Real-time calculation**: Tự động tính toán và cập nhật tổng chi phí
- **Enhanced UX**: Modal responsive, styling chuyên nghiệp, validation real-time

### Technical Improvements
- **Regex validation**: `/^\d+$/` cho input số nguyên
- **State management**: Sử dụng string state cho input, convert sang number khi submit
- **Error handling**: Validation messages rõ ràng cho từng trường
- **Performance**: Optimized re-renders với proper state updates

## Trạng thái PENDING_ACCEPT (v2025-08-26) ⭐ **MỚI**

### Mô tả
- **Trạng thái mới**: `PENDING_ACCEPT` (Chờ chấp nhận)
- **Áp dụng cho**: Cả `RepairTicket` và `ServiceRequest`
- **Điều kiện kích hoạt**: Khi tạo hóa đơn sửa chữa

### Logic hoạt động
1. **User tạo hóa đơn** → Bấm "Tạo hóa đơn & PDF"
2. **Backend `createRepairInvoice`** → Cập nhật phiếu thành `PENDING_ACCEPT`
3. **Tự động cập nhật request** → Tìm request theo `container_no` và set `PENDING_ACCEPT`
4. **Kết quả**: Cả phiếu sửa chữa và request đều có trạng thái `PENDING_ACCEPT`

### Cập nhật Database Schema
```prisma
model ServiceRequest {
  // ... existing fields
  status        String   // PENDING | SCHEDULED | FORWARDED | GATE_IN | CHECKING | GATE_REJECTED | REJECTED | COMPLETED | EXPORTED | IN_YARD | LEFT_YARD | PENDING_ACCEPT
}
```

### Cập nhật Backend Service
```typescript
async createRepairInvoice(actor: any, payload: { 
  repair_ticket_id: string; labor_cost: number; 
  selected_parts: Array<{ inventory_item_id: string; quantity: number }> 
}) {
  // ... existing logic
  
  // Cập nhật phiếu sửa chữa thành PENDING_ACCEPT
  const updatedTicket = await prisma.repairTicket.update({
    where: { id: payload.repair_ticket_id },
    data: {
      estimated_cost: totalCost,
      labor_cost: payload.labor_cost,
      status: 'PENDING_ACCEPT', // Thay đổi từ REPAIRING
      items: { /* ... */ }
    }
  });

  // Tự động cập nhật trạng thái request thành PENDING_ACCEPT
  if (repairTicket.container_no) {
    await prisma.serviceRequest.updateMany({
      where: { 
        container_no: repairTicket.container_no,
        status: { not: 'COMPLETED' }
      },
      data: { status: 'PENDING_ACCEPT' }
    });
  }
}
```

### Frontend Display
- **Màu sắc**: Cam (`#f59e0b`)
- **Label**: "Chờ chấp nhận"
- **Vị trí**: Cột "Trạng thái" trong bảng phiếu sửa chữa

### Migration
```bash
npx prisma migrate dev --name add_pending_accept_status
```

### Lợi ích
- **Quản lý trạng thái rõ ràng**: Phân biệt giữa "đang kiểm tra" và "chờ chấp nhận"
- **Đồng bộ trạng thái**: Request và phiếu sửa chữa có trạng thái tương ứng
- **Workflow hoàn chỉnh**: Từ kiểm tra → tạo hóa đơn → chờ chấp nhận → sửa chữa
