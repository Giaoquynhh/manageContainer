# Module 5 — Quản lý Bãi & Container

## 1) Scope & Roles
- Role: SaleAdmin (điều độ), SystemAdmin (quản trị)

## 2) State Machines
- Container slot: `EMPTY → RESERVED → OCCUPIED → UNDER_MAINTENANCE → OCCUPIED → EXPORT`
- Forklift task: `PENDING → IN_PROGRESS → COMPLETED` và `→ CANCELLED`

## 3) API
- Yard Map:
  - GET `/yard/map`
  - GET `/yard/container/:container_no`
  - GET `/yard/suggest-position?container_no=...`
  - PATCH `/yard/assign-position` `{ container_no, slot_id }`
- Forklift:
  - GET `/forklift/tasks?status=`
  - POST `/forklift/assign`
  - PATCH `/forklift/task/:id/status` `{ status, reason? }`
- Container info:
  - GET `/containers/:container_no`
  - GET `/containers/alerts`

## 4) Thuật toán gợi ý (demo)
- Điểm = 0.4*near_gate + 0.3*cùng_loại + 0.2*(1-avoid_main) + 0.1*slot_lẻ

## 5) Realtime
- WebSocket (todo): `POSITION_ASSIGNED`, `POSITION_RELEASED`, `CONTAINER_MOVED`, `TASK.*`

## 6) Liên kết module
- M4 Gate: `IN_YARD` → gọi suggest-position/assign-position
- M3 Requests: nguồn container, lịch sử
- M6 Maintenance: khi sửa chữa → `UNDER_MAINTENANCE`
- M2 Auth: RBAC SaleAdmin/SystemAdmin

## 7) Notes
- RESERVED auto-expire (todo)
- Cảnh báo DEM/DET từ `ContainerMeta`

## 8) Bản đồ mã nguồn (Code map)
- Prisma
  - Models: `Yard`, `YardBlock`, `YardSlot`, `ContainerMeta`, `ForkliftTask` trong `prisma/schema.prisma`
  - Seed dữ liệu demo: `prisma/seed.ts`
- Backend
  - Yard
    - Service: `modules/yard/service/YardService.ts`
    - Controller: `modules/yard/controller/YardController.ts`
    - Routes: `modules/yard/controller/YardRoutes.ts` (requireRoles SaleAdmin/SystemAdmin)
  - Forklift
    - Service: `modules/forklift/service/ForkliftService.ts`
    - Controller: `modules/forklift/controller/ForkliftController.ts`
    - Routes: `modules/forklift/controller/ForkliftRoutes.ts`
  - Container Info
    - Service: `modules/containers/service/ContainerService.ts`
    - Controller: `modules/containers/controller/ContainerController.ts`
    - Routes: `modules/containers/controller/ContainerRoutes.ts`
  - Mount routes: `main.ts` (`/yard`, `/forklift`, `/containers`)
- Frontend
  - Trang điều độ: `frontend/pages/Yard/index.tsx`
  - API client: `frontend/services/yard.ts`, `frontend/services/forklift.ts`
  - Dashboard entry: `frontend/pages/Dashboard/index.tsx` (card “Điều độ bãi”)
