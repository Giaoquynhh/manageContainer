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

## Testing

### Backend
1. Chạy migration: `npx prisma migrate dev`
2. Chạy seed: `npx prisma db seed`
3. Test API endpoints với Postman/Insomnia

### Frontend
1. Khởi động frontend: `npm run dev`
2. Truy cập `/Maintenance/Inventory`
3. Test chức năng thêm sản phẩm mới
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
