# Module 6 — Quản lý Bảo trì & Vật Tư

## 1) Scope & Roles
- Role: SaleAdmin (tạo/duyệt/từ chối phiếu; quản lý tồn kho)

## 2) Data model (Prisma)
- Enums: `EquipmentType (CONTAINER|EQUIPMENT)`, `InventoryMoveType (IN|OUT)`, `RepairStatus (CHECKING|PENDING_ACCEPT|REPAIRING|CHECKED|REJECTED)`
- Tables: `Equipment`, `InventoryItem`, `InventoryMovement`, `RepairTicket`, `RepairTicketItem`
- File: `prisma/schema.prisma`

### Cập nhật InventoryItem (v2025-08-25)
- Thêm trường `unit_price: Int @default(0)` - Đơn giá vật tư (VND)
- Migration: `20250825102150_add_unit_price_to_inventory`

## 3) State machine
- `CHECKING → PENDING_ACCEPT | REJECTED` (phase sau: REPAIRING → CHECKED)

## 4) API
- Repairs
  - `POST /maintenance/repairs`
  - `GET /maintenance/repairs?status=`
  - `POST /maintenance/repairs/:id/approve`
  - `POST /maintenance/repairs/:id/reject`
  - `PATCH /maintenance/repairs/:id/status`
  - `POST /maintenance/repairs/:id/complete-check`
- Inventory
  - `GET /maintenance/inventory/items`
  - `POST /maintenance/inventory/items` ⭐ **MỚI**
  - `PUT /maintenance/inventory/items/:id`

## 5) Validation
- `estimated_cost ≥ 0`, item `quantity > 0`
- `unit_price ≥ 0` (đơn giá không âm)
- Approve cần đủ tồn kho cho toàn bộ vật tư

## 6) Transaction
- Approve chạy trong transaction, trừ kho + ghi `InventoryMovement`

## 7) RBAC
- Yêu cầu role `SaleAdmin` hoặc `SystemAdmin` cho tất cả route

## 8) Code map (Module 6)
- DTO: `modules/maintenance/dto/MaintenanceDtos.ts`
- Service: `modules/maintenance/service/MaintenanceService.ts`
- Controller: `modules/maintenance/controller/MaintenanceController.ts`
- Routes: `modules/maintenance/controller/MaintenanceRoutes.ts`
- Mount: `main.ts` (`app.use('/maintenance', maintenanceRoutes)`)
- Seed mẫu: `prisma/seed.ts` (Equipment & InventoryItem)

### Cập nhật DTO (v2025-08-25)
```typescript
export const createInventorySchema = Joi.object({
  name: Joi.string().required(),
  uom: Joi.string().required(),
  qty_on_hand: Joi.number().integer().min(0).default(0),
  reorder_point: Joi.number().integer().min(0).default(0),
  unit_price: Joi.number().integer().min(0).default(0)
});
```

### Cập nhật Service (v2025-08-25)
```typescript
async createInventory(actor: any, payload: { 
  name: string; uom: string; qty_on_hand: number; 
  reorder_point: number; unit_price: number 
}) {
  // Validation và tạo mới inventory item
}
```

## 9) Liên kết module
- Module 5 (Yard): Khi container/thiết bị ở trạng thái `UNDER_MAINTENANCE` (rule tương lai) sẽ tạo `RepairTicket`
- Module 3 (Requests): Gợi ý tạo phiếu sau Gate IN nếu có lỗi bất thường
- Module 2 (Auth): RBAC kiểm soát role SaleAdmin

## 10) UI gợi ý
- Trang tạo/duyệt phiếu + trang quản lý vật tư
- **Tính năng mới**: Form thêm sản phẩm mới với các trường: Tên, ĐVT, Tồn kho, Điểm đặt hàng, Đơn giá

## 11) Tính năng mới (v2025-08-25)

### Thêm sản phẩm mới
- **Frontend**: Form thêm sản phẩm với validation
- **Backend**: API `POST /maintenance/inventory/items` 
- **Validation**: Tên và ĐVT là bắt buộc, các trường số không âm
- **Audit**: Ghi log `INVENTORY.CREATED` khi tạo mới

### Cập nhật trường đơn giá
- **Database**: Thêm cột `unit_price` vào bảng `InventoryItem`
- **Frontend**: Hiển thị và cho phép chỉnh sửa đơn giá
- **Backend**: Validation và cập nhật đơn giá trong API update

### Seed data mẫu
```typescript
// Cập nhật seed với đơn giá
{ name: 'Sơn chống rỉ', uom: 'lit', qty_on_hand: 50, reorder_point: 10, unit_price: 150000 },
{ name: 'Đinh tán', uom: 'pcs', qty_on_hand: 1000, reorder_point: 200, unit_price: 500 },
{ name: 'Ron cao su', uom: 'pcs', qty_on_hand: 500, reorder_point: 100, unit_price: 2500 }
```

