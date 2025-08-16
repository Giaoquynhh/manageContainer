# Module 4 — Quản lý Cổng (Gate Management)

## 1) Mục tiêu
- Check-in/Check-out tại cổng, tốc độ và chính xác
- Đối chiếu lịch hẹn, in phiếu Gate IN/OUT, audit đầy đủ

## 2) RBAC & Gate Mode
- Gate Mode chỉ cho phép khi request kèm header `x-device-type: gate` và `x-device-id` thuộc danh sách tin cậy `GATE_DEVICE_IDS` (ENV)
- Quyền: SaleAdmin trên Gate Device, hoặc SystemAdmin
- Check-out: nếu chính người đã RECEIVED, bắt buộc `supervisor_pin` (ENV: `GATE_SUP_PIN`)

## 3) Data model liên quan (Prisma)
- Sử dụng `ServiceRequest.status` mở rộng: `IN_YARD`, `LEFT_YARD`
- Lịch sử lưu trong `ServiceRequest.history` với các action: `GATE_CHECKIN`, `GATE_CHECKOUT`

## 4) API
- `GET /gate/lookup?code=` → tìm request theo mã (id/container_no). SLA ≤ 300ms. Audit: `GATE.LOOKUP`
- `POST /gate/checkin` body `{ request_id, plate_no }` → trạng thái `IN_YARD`. Audit: `GATE.CHECKIN`
- `POST /gate/checkout` body `{ request_id, supervisor_pin? }` → trạng thái `LEFT_YARD`. Audit: `GATE.CHECKOUT`
- `POST /gate/print` body `{ request_id, type: 'IN'|'OUT' }` → trả metadata in phiếu. Audit: `GATE.PRINT`

## 5) Liên kết Module
- Module 3: sử dụng `ServiceRequest` và history để đồng bộ luồng. Cho phép `IN_YARD` từ `RECEIVED|COMPLETED`, `LEFT_YARD` từ `IN_YARD`.
- Module 2: JWT dùng để xác định `role` và audit `actor_id`. Middleware GateMode kế thừa `authenticate`.
- Module 1: Audit log dùng cơ chế chung; scope tenant không thay đổi vì Gate chạy nội bộ depot.

## 6) Checklist triển khai
- Middleware `gateMode` kiểm tra thiết bị
- Dto validation: lookup/checkin/checkout/print
- Controller/Service cho lookup, checkin, checkout, print
- Cập nhật prisma + Request state machine

## 7) Ghi chú in ấn
- Bản demo trả metadata; sản phẩm thực dùng service sinh PDF (PDFKit) + lưu S3/Blob + gửi lệnh in cục bộ

## 8) Bản đồ mã nguồn (Code map)
- Backend
  - DTO: `modules/gate/dto/GateDtos.ts`
  - Middleware Gate Mode: `modules/gate/middleware/gateMode.ts`
  - Service: `modules/gate/service/GateService.ts`
  - Controller: `modules/gate/controller/GateController.ts`
  - Routes: `modules/gate/controller/GateRoutes.ts`
  - Mount routes: `main.ts` (`app.use('/gate', gateRoutes)`)
  - Liên quan Module 3 (Requests): cập nhật state machine hỗ trợ `IN_YARD`/`LEFT_YARD` tại `modules/requests/service/RequestService.ts` và DTO `modules/requests/dto/RequestDtos.ts`
  - Prisma (không tạo bảng riêng cho Gate; tái sử dụng `ServiceRequest`)
- Frontend
  - Trang Gate: `frontend/pages/Gate/index.tsx`
  - API client: `frontend/services/gate.ts` (gửi headers `x-device-type`, `x-device-id`)
  - RBAC helper: `frontend/utils/rbac.ts` (`canUseGate`)
  - Dashboard entry: `frontend/pages/Dashboard/index.tsx` (card Gate)


