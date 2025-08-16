# Tài liệu Phân Quyền & Set Role Hệ Thống Depot Management

## 1. Danh sách Vai trò & Quyền hạn

### 1.1. **SystemAdmin**

- Toàn quyền hệ thống: quản lý cấu hình, người dùng, khách hàng, đối tác.
- Truy cập mọi module, không giới hạn phạm vi dữ liệu.
- Quản lý và thay đổi vai trò người dùng.

### 1.2. **BusinessAdmin**

- Quyền gần tương đương SystemAdmin nhưng giới hạn ở phạm vi nghiệp vụ.
- Quản lý khách hàng, đối tác, cấu hình giá dịch vụ.
- Không can thiệp sâu vào cấu hình hệ thống lõi.

### 1.3. **HRManager**

- CRUD nhân sự nội bộ.
- Không xem/điều chỉnh dữ liệu khách hàng hoặc đối tác.
- Quản lý tài khoản nhân viên nội bộ (SystemAdmin, BusinessAdmin, HRManager, SaleAdmin).

### 1.4. **SaleAdmin**

- Quản lý khách hàng, tạo hợp đồng, bảng giá.
- Tiếp nhận yêu cầu dịch vụ từ khách hàng.
- Xuất phiếu EIR, LOLO, hóa đơn, yêu cầu thanh toán.
- Quản lý hãng tàu, hãng xe.

### 1.5. **CustomerAdmin**

- Quản lý user thuộc cùng một khách hàng (tenant).
- Tạo và quản lý yêu cầu dịch vụ.
- Chỉ xem được dữ liệu của tenant mình.

### 1.6. **CustomerUser**

- Tạo yêu cầu dịch vụ cho công ty mình.
- Xem trạng thái yêu cầu, hóa đơn, chứng từ liên quan.

### 1.7. **PartnerAdmin**

- Quản lý user thuộc đối tác (partner\_id).
- Xem dữ liệu thuộc đối tác mình.

### 1.8. **Bảo vệ (Security)**

- Đối chiếu chứng từ với lịch hẹn.
- Thực hiện Check-in/Check-out, in phiếu Gate IN/OUT.

### 1.9. **Quản lý bãi (Yard Manager)**

- Quản lý sơ đồ bãi, block, vị trí container.
- Thiết lập quy tắc nhập/xuất bãi.

### 1.10. **Quản lý bảo trì (Maintenance Manager)**

- Quản lý danh mục vật tư, lập kế hoạch sửa chữa.
- Nhận yêu cầu kiểm cont khi Check-in.

### 1.11. **Kế toán (Accountant)**

- Xem và xử lý báo cáo doanh thu, công nợ.
- Xác nhận thanh toán.

---

## 2. Phân quyền thao tác theo module

| Module                        | SystemAdmin | BusinessAdmin | HRManager  | SaleAdmin | CustomerAdmin | CustomerUser | PartnerAdmin | Security | Yard Manager | Maintenance Manager | Accountant |
| ----------------------------- | ----------- | ------------- | ---------- | --------- | ------------- | ------------ | ------------ | -------- | ------------ | ------------------- | ---------- |
| Quản lý người dùng            | ✅           | ✅             | ✅ (nội bộ) | ✅ (khách) | ✅ (tenant)    | ❌            | ✅ (partner)  | ❌        | ❌            | ❌                   | ❌          |
| Quản lý khách hàng            | ✅           | ✅             | ❌          | ✅         | ❌             | ❌            | ❌            | ❌        | ❌            | ❌                   | ❌          |
| Quản lý đối tác               | ✅           | ✅             | ❌          | ✅         | ❌             | ❌            | ✅            | ❌        | ❌            | ❌                   | ❌          |
| Yêu cầu dịch vụ (tạo/quản lý) | ✅           | ✅             | ❌          | ✅         | ✅             | ✅            | ✅            | ❌        | ❌            | ❌                   | ❌          |
| Quản lý hãng tàu, hãng xe     | ✅           | ✅             | ❌          | ✅         | ❌             | ❌            | ❌            | ❌        | ❌            | ❌                   | ❌          |
| Quản lý vật tư bảo trì        | ✅           | ✅             | ❌          | ❌         | ❌             | ❌            | ❌            | ❌        | ❌            | ✅                   | ❌          |
| Quản lý sơ đồ bãi             | ✅           | ✅             | ❌          | ❌         | ❌             | ❌            | ❌            | ❌        | ✅            | ❌                   | ❌          |
| Check-in/Check-out            | ✅           | ✅             | ❌          | ❌         | ❌             | ❌            | ❌            | ✅        | ❌            | ❌                   | ❌          |
| Xuất báo cáo                  | ✅           | ✅             | ❌          | ✅         | ❌             | ❌            | ❌            | ❌        | ❌            | ❌                   | ✅          |

---

## 3. Quy tắc Scope dữ liệu

- **tenant\_id**: Customer Admin/User chỉ thao tác trong tenant của mình.
- **partner\_id**: PartnerAdmin và user thuộc đối tác chỉ thao tác trong partner\_id của mình.
- **Internal (nội bộ)**: HRManager, SystemAdmin, BusinessAdmin, SaleAdmin có thể truy cập dữ liệu chung.

---

## 4. State Machine Tài khoản

```
INVITED → ACTIVE → DISABLED
ACTIVE → LOCKED → ACTIVE
```

- **INVITED**: Đã gửi lời mời, chờ người dùng kích hoạt.
- **ACTIVE**: Tài khoản hoạt động bình thường.
- **DISABLED**: Bị vô hiệu hóa, không đăng nhập được.
- **LOCKED**: Tạm khóa, cần mở khóa thủ công.

---

## 5. Audit Log

- Ghi nhận các hành động: `USER.INVITED`, `USER.ACTIVATED`, `USER.DISABLED`, `USER.LOCKED`, `ROLE_CHANGED`, `CUSTOMER.CREATED`, `PARTNER.CREATED`, `LOGIN_SUCCESS`, v.v.
- Có thể export CSV theo bộ lọc.

---

## 6. Lưu ý triển khai

1. Bật **middleware RBAC** kiểm tra quyền cho từng API.
2. Áp dụng **filter scope dữ liệu** ngay tại query DB.
3. Sử dụng **audit middleware** để log lại mọi thao tác.
4. Role & Permission nên cấu hình động để dễ mở rộng.

---

📌 File này có thể đưa trực tiếp cho team nghiệp vụ để họ rà soát quyền hạn từng vai trò trước khi lập trình.

