## Module Quản lý Người dùng & Đối tác

Tài liệu này mô tả rõ kiến trúc, RBAC, scope dữ liệu, state machine tài khoản, audit, và hợp đồng API cho các module: Auth & Account, Users (nhân sự & user khách), Customers, Partners, Audit.

### 0) Nguyên tắc kiến trúc & phạm vi
- RBAC theo vai: SystemAdmin, BusinessAdmin, HRManager, SaleAdmin, CustomerAdmin, CustomerUser.
- Scope dữ liệu:
  - tenant_id: Customer Admin/User chỉ thấy và thao tác dữ liệu trong tenant của mình.
  - partner_id: user gắn partner chỉ thấy dữ liệu của partner đó.
- State machine tài khoản: INVITED → ACTIVE → DISABLED; ACTIVE → LOCKED (unlock về ACTIVE).
- Audit: mọi thao tác create/update/disable/role-change/login đều ghi log và có thể export CSV.

### 1) Auth & Account (US 2.1–2.3)
- Login chặn DISABLED/LOCKED; cấp JWT; cập nhật last_login_at; audit LOGIN_SUCCESS.
- Account profile: cập nhật trường cho phép; role/username là read-only (API chỉ cho phép full_name/phone/address).
- Change password: kiểm tra mật khẩu cũ, enforce policy (độ dài, ký tự, không trùng cũ).
- Đăng ký/khởi tạo tài khoản:
  - Không cho đăng ký trực tiếp (POST /auth/register trả 403)
  - Cho phép kích hoạt qua link mời: POST `/auth/accept-invite { token, password, confirm }`
  - Các role có thể được mời và tự kích hoạt: `CustomerAdmin`, `CustomerUser`, Partner Admin (user gắn `partner_id`), và nhân sự nội bộ khi HR/Sys mời.
  - Các role chỉ có thể tạo qua hệ thống (không tự kích hoạt nếu chưa được mời): `SystemAdmin`, `BusinessAdmin`, `HRManager`, `SaleAdmin`.

#### Endpoints
- POST /auth/login
  - Body: { "username": string, "password": string }
  - 200: { token, user: { _id, email, role, tenant_id?, partner_id?, status } }
  - 400: { message }
- GET /auth/me (JWT)
  - 200: user (ẩn password_hash)
- PATCH /auth/me (JWT)
  - Body: { full_name?, phone?, address? }
  - 200: user cập nhật
- POST /auth/me/change-password (JWT)
  - Body: { old, new, confirm }
  - 200: { success: true }

### 2) Users (US 1.1, 1.3)
- HRManager: CRUD nhân sự nội bộ; disable; gán role nội bộ.
- SaleAdmin: bootstrap user khách (Customer*).
- CustomerAdmin: CRUD user trong tenant của mình; chỉ role Customer*.
- Scope: Customer Admin/User chỉ thấy user cùng tenant. HR không thấy user thuộc khách/đối tác.
- State: INVITED/ACTIVE/DISABLED/LOCKED; invite tạo token và hạn 7 ngày.

#### Endpoints
- GET /users?role=&tenant_id=&partner_id=&page=&limit= (JWT + RBAC)
  - Quy tắc scope:
    - Customer Admin/User: hệ thống auto filter theo tenant_id của họ, bỏ qua giá trị khác.
    - HRManager: chỉ thấy user nội bộ (tenant_id null, partner_id null).
- POST /users (JWT + RBAC)
  - HRManager: tạo nhân sự nội bộ (role ∈ {SystemAdmin,BusinessAdmin,HRManager,SaleAdmin}).
    - Body: { full_name, email, role }
  - SaleAdmin: tạo user khách (role ∈ {CustomerAdmin,CustomerUser}).
    - Body: { full_name, email, role, tenant_id }
  - CustomerAdmin: tạo user cùng tenant (role ∈ {CustomerAdmin,CustomerUser})
    - Body: { full_name, email, role, tenant_id? } (tenant_id bị ép về tenant của người tạo)
  - Kết quả: user trạng thái INVITED + audit USER.INVITED
- PATCH /users/:id (JWT + RBAC)
  - Cập nhật: { full_name?, role? } (đổi role chỉ cho SystemAdmin/BusinessAdmin)
  - Không cho đổi tenant_id/partner_id nếu không phải SystemAdmin/BusinessAdmin
- PATCH /users/:id/disable | /enable (JWT + RBAC)
  - Chuyển DISABLED hoặc ACTIVE; audit USER.DISABLED/USER.ENABLED
- PATCH /users/:id/lock | /unlock (JWT + RBAC cao)
  - Chuyển LOCKED hoặc ACTIVE; audit USER.LOCKED/USER.UNLOCKED
- POST /users/:id/send-invite (JWT + RBAC)
  - Tạo lại token invite; audit USER.INVITED

### 3) Customers (US 1.2)
- SaleAdmin: tạo/sửa/disable khách hàng.
- Unique: tax_code không trùng.
- Auto-provision: khi tạo customer có contact_email → tạo CustomerAdmin ở trạng thái INVITED.
- Disable: chuyển INACTIVE, không xóa (giữ lịch sử).

#### Endpoints
- GET /customers?status=&page=&limit= (JWT + RBAC: SystemAdmin/BusinessAdmin/SaleAdmin)
- POST /customers (JWT + RBAC: SystemAdmin/BusinessAdmin/SaleAdmin)
  - Body: { name, tax_code, address?, contact_email? }
  - 201: customer; audit CUSTOMER.CREATED (+ USER.INVITED nếu auto-provision)
- PATCH /customers/:id (JWT + RBAC)
  - Body: { name?, address?, contact_email? }
  - audit CUSTOMER.UPDATED
- PATCH /customers/:id/disable (JWT + RBAC)
  - audit CUSTOMER.DISABLED

### 4) Partners (US 9.2)
- Lifecycle: DRAFT → ACTIVE → INACTIVE
- Unique: name không trùng.
- Primary admin: tạo user INVITED gắn partner_id.

#### Endpoints
- GET /partners?type=&status=&page=&limit= (JWT + RBAC: SystemAdmin/BusinessAdmin/SaleAdmin)
- POST /partners (JWT + RBAC: SystemAdmin/BusinessAdmin/SaleAdmin)
  - Body: { type, name, tax_code?, contact_email? }
  - 201: partner DRAFT; audit PARTNER.CREATED
- PATCH /partners/:id (JWT + RBAC: SystemAdmin/BusinessAdmin)
  - audit PARTNER.UPDATED
- POST /partners/:id/activate (JWT + RBAC: SystemAdmin/BusinessAdmin)
  - audit PARTNER.ACTIVATED
- POST /partners/:id/deactivate (JWT + RBAC: SystemAdmin/BusinessAdmin)
  - audit PARTNER.DEACTIVATED
- POST /partners/:id/primary-admin (JWT + RBAC: SystemAdmin/BusinessAdmin/SaleAdmin)
  - Body: { email, full_name }
  - 201: user CustomerAdmin (partner) ở trạng thái INVITED; audit USER.INVITED

### 5) Audit (US 8.5)
- Ghi log cho: USER.INVITED|ACTIVATED|DISABLED|LOCKED|ROLE_CHANGED|ENABLED|UNLOCKED, CUSTOMER.CREATED|UPDATED|DISABLED, PARTNER.CREATED|ACTIVATED|DEACTIVATED, LOGIN_SUCCESS.
- Export CSV theo bộ lọc.

#### Endpoint
- GET /audit?entity=&entity_id=&actor=&date_from=&date_to=&export_type=csv
  - export_type=csv → trả file CSV; ngược lại trả JSON.

### 6) Validation & Rule chặn
- email unique; customers.tax_code unique; partners.name unique.
- Không cho chọn role ngoài nhóm hợp lệ theo người tạo.
- Không đổi tenant_id/partner_id nếu không có quyền Business/System Admin.
- DISABLED/LOCKED không login.
- Disable customer: chuyển INACTIVE, không xóa.

### 7) Ví dụ payload
- POST /customers
```json
{ "name": "ACME Logistics", "tax_code": "0312345678", "address": "Q1, HCMC", "contact_email": "ops@acme.com" }
```
- POST /users (Customer Admin tạo user cùng tenant)
```json
{ "email": "user@acme.com", "full_name": "Nguyen Van A", "role": "CustomerUser" }
```
- POST /partners
```json
{ "type": "TRUCKING", "name": "XYZ Transport", "tax_code": "0400123456", "contact_email": "hello@xyz.com" }
```
- POST /partners/{id}/primary-admin
```json
{ "email": "admin@xyz.com", "full_name": "Pham B" }
```

### 8) Mapping code
- Cấu trúc thư mục: `backend/modules/{auth,users,customers,partners,audit}/...`
- Middlewares: `shared/middlewares/auth.ts`, `rbac.ts`, `audit.ts`
- Server: `backend/main.ts` mount routes: `/auth`, `/users`, `/customers`, `/partners`, `/audit`.

### 9) Checklist QA
- HRManager: tạo/sửa/disable nhân sự nội bộ; không thấy dữ liệu khách/đối tác.
- SaleAdmin: tạo khách (MST không trùng) + auto-provision CustomerAdmin INVITED; disable khách giữ lịch sử.
- CustomerAdmin: CRUD user trong tenant; list filter đúng tenant.
- Auth: login/change password đúng policy và chặn DISABLED/LOCKED.
- Partners: lifecycle & primary admin invite.
- Audit: có log và export CSV.
