# Module 7 — Finance & Invoicing Management

Tài liệu techlead rút gọn cho Dev Intern/Jr. Module chịu trách nhiệm phát hành hóa đơn, ghi nhận thanh toán và báo cáo cơ bản.

## Scope & RBAC
- Vai trò: `SaleAdmin` (hoặc `SystemAdmin` cho mục đích demo)
- Endpoints mount: `/finance/*` (JWT + RBAC)

## Data model (Prisma)
- Bảng: `Invoice`, `InvoiceLineItem`, `Payment`, `PaymentAllocation`, `ExportJob` — định nghĩa trong `prisma/schema.prisma`
- Numeric: tiền `Decimal(18,2)`, đơn giá `Decimal(18,4)`, số lượng `Decimal(12,3)`

## API chính
- Invoices
  - `GET /finance/invoices`
  - `POST /finance/invoices` (DRAFT, backend tính subtotal/tax/total)
  - `POST /finance/invoices/:id/issue` (DRAFT → UNPAID, cấp `invoice_no`)
  - `GET /finance/invoices/:id`
  - `PATCH /finance/invoices/:id` (chỉ `due_date`, `notes`)
  - `POST /finance/invoices/:id/cancel` (UNPAID, `paid_total=0`)
- Payments
  - `GET /finance/payments`
  - `POST /finance/payments` (header `Idempotency-Key`)

## Rounding
- `qty(3)`, `unit_price(4)`, `line/tax/total(2)` half-up — triển khai trong `InvoiceService.calcTotals`

## Code map (Module 7)
- DTO: `modules/finance/dto/FinanceDtos.ts`
- Services: `modules/finance/service/InvoiceService.ts`, `modules/finance/service/PaymentService.ts`
- Controllers: `modules/finance/controller/InvoiceController.ts`, `modules/finance/controller/PaymentController.ts`
- Routes: `modules/finance/controller/FinanceRoutes.ts`
- Mount: `main.ts` → `app.use('/finance', financeRoutes)`

## Liên kết module
- M3 Requests / M4 Gate / M5 Yard có thể đẩy `source_module/source_id` vào invoice để truy xuất nguồn.
- M2 Auth: RBAC SaleAdmin, scope theo `org_id` (placeholder sẵn trong schema).

## To-do/Phase2
- Reports & export job, credit/debit note, sequence service chuẩn.

