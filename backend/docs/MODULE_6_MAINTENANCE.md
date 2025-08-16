# Module 6 — Quản lý Bảo trì & Vật Tư

## 1) Scope & Roles
- Role: SaleAdmin (tạo/duyệt/từ chối phiếu; quản lý tồn kho)

## 2) Data model (Prisma)
- Enums: `EquipmentType (CONTAINER|EQUIPMENT)`, `InventoryMoveType (IN|OUT)`, `RepairStatus (PENDING_APPROVAL|APPROVED|REJECTED)`
- Tables: `Equipment`, `InventoryItem`, `InventoryMovement`, `RepairTicket`, `RepairTicketItem`
- File: `prisma/schema.prisma`

## 3) State machine
- `PENDING_APPROVAL → APPROVED | REJECTED` (phase sau: IN_PROGRESS → COMPLETED)

## 4) API
- Repairs
  - `POST /maintenance/repairs`
  - `GET /maintenance/repairs?status=`
  - `POST /maintenance/repairs/:id/approve`
  - `POST /maintenance/repairs/:id/reject`
- Inventory
  - `GET /maintenance/inventory/items`
  - `PUT /maintenance/inventory/items/:id`

## 5) Validation
- `estimated_cost ≥ 0`, item `quantity > 0`
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

## 9) Liên kết module
- Module 5 (Yard): Khi container/thiết bị ở trạng thái `UNDER_MAINTENANCE` (rule tương lai) sẽ tạo `RepairTicket`
- Module 3 (Requests): Gợi ý tạo phiếu sau Gate IN nếu có lỗi bất thường
- Module 2 (Auth): RBAC kiểm soát role SaleAdmin

## 10) UI gợi ý
- Trang tạo/duyệt phiếu + trang quản lý vật tư

