## Module 2 — Xác thực & Thông tin cá nhân

Mục tiêu: triển khai đăng nhập/phiên, đổi mật khẩu, hồ sơ cá nhân an toàn; ràng buộc RBAC/multi-tenant/partner; đồng bộ Module "Quản lý Người dùng & Đối tác".

### Phạm vi & nguyên tắc
- Không self‑signup: tài khoản được tạo/mời từ Module Users & Partners. Module này chỉ xác thực + tự phục vụ (profile/password).
- JWT embed: roles, tenant_id, partner_id, status. Mọi API bắt buộc áp scope.
- Anti‑enumeration: sai user/pass trả 401; LOCKED/DISABLED trả 423.
- State: INVITED → ACTIVE → DISABLED; ACTIVE → LOCKED.
- Audit: LOGIN_SUCCESS/FAIL, PASSWORD_CHANGE, PROFILE_UPDATE, TOKEN_ROTATED…
- Phiên: Access 15′ (hiện dùng access 24h demo), Refresh 7 ngày (có rotate), đổi/reset pass → revoke all refresh.
- 2FA: sườn TOTP đã scaffold (cần lib thực tế cho verify).

### Data model (Prisma)
- Bảng `User` mở rộng: username, phone, roles(Json), failed_attempts, locked_until, flags verified/mfa…
- Bảng bổ trợ: `RefreshToken`, `PasswordResetToken`, `MfaSecret`, `EmailVerification`, `PhoneOtp`, `AuditLog`.

### API chính
- POST `/auth/login` → `{ access_token, refresh_token, user }` (audit LOGIN_SUCCESS)
- POST `/auth/refresh` → rotate refresh, cấp access mới
- POST `/auth/accept-invite` → đặt mật khẩu đầu, ACTIVE, audit USER.ACTIVATED
- POST `/auth/register` → 403 (bị chặn)
- GET `/auth/me` → xem thông tin (đang ở `authController.me`)
- PATCH `/auth/me` → cập nhật thông tin cho phép; nếu đổi email/phone có thể trả 202 (cần bổ sung verify)
- POST `/auth/me/change-password` → đổi mật khẩu; revoke all refresh; audit PASSWORD_CHANGED

Xem routes tại `backend/modules/auth/controller/authRoutes.ts`.

### RBAC/Scope
- Kiểm tra JWT ở middleware `shared/middlewares/auth.ts`.
- Module Users & Partners giới hạn scope list/search theo tenant/partner; Auth/Account sử dụng cùng payload để FE hiển thị đúng.

### Liên kết Module Users & Partners
- Invite/Accept: Module Users mời user (USER.INVITED) → FE/BE dùng `/auth/accept-invite` để kích hoạt.
- Quản trị người dùng: tạo/đổi role/lock/disable ở Module Users; Auth chỉ xử lý đăng nhập/đổi mật khẩu/refresh.

### References
- Users & Partners (Module 1):
  - API: xem `docs/USERS_PARTNERS_API.md`
  - Invite từ Users → Accept ở Auth (`POST /auth/accept-invite`)
- Middleware dùng chung:
  - JWT: `shared/middlewares/auth.ts`
  - RBAC/Scope: `shared/middlewares/rbac.ts`
  - Audit: `shared/middlewares/audit.ts`
- Prisma models liên quan:
  - `prisma/schema.prisma` (User, RefreshToken, PasswordResetToken, MfaSecret, EmailVerification, PhoneOtp, AuditLog)
- Frontend tham chiếu:
  - Login: `frontend/pages/Login/index.tsx`
  - Accept invite: `frontend/pages/Register/index.tsx`
  - Me/Change password: `frontend/pages/Account/index.tsx`
  - Interceptor refresh: `frontend/services/api.ts`

### TODO/khuyến nghị mở rộng
- Anti‑enumeration đầy đủ (thống nhất thông điệp 401), lockout theo cửa sổ thời gian, `locked_until` auto‑unlock.
- Access token TTL 15′ + refresh 7d, store httpOnly cookies (hiện dùng JSON trả về cho demo).
- 2FA TOTP dùng thư viện (speakeasy/otplib) + recovery codes.
- Reset password: `/auth/request-reset`, `/auth/reset` + email.
- Xác minh email/phone: `/auth/verify-email`, `/auth/verify-phone`.
- Rate limit: login/reset theo IP/email.

### Mapping mã nguồn
- Service: `modules/auth/service/{AuthService.ts,TokenService.ts,MfaService.ts}`
- Controller/Routes: `modules/auth/controller/{authController.ts,authRoutes.ts}`
- Middleware: `shared/middlewares/{auth.ts,rbac.ts,audit.ts}`
- Prisma schema: `prisma/schema.prisma` (User/RefreshToken/...)

### QA (rút gọn)
- Login đúng → 200; sai → 401; user LOCKED/DISABLED → 423.
- Refresh trả access mới + refresh mới; refresh cũ bị revoke.
- Change password → revoke all refresh; login lại bắt buộc.
- Accept invite → ACTIVE; sau đó login được.
