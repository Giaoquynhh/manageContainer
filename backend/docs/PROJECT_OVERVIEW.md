# 📦 Tobe Depot Management System — Mô tả bài toán tổng quan

## 1. Bối cảnh & Mục tiêu dự án
Hệ thống **Tobe Depot Management System (TDMS)** là nền tảng phần mềm hỗ trợ quản lý toàn bộ quy trình **xuất – nhập – lưu trữ – bảo trì container** tại kho bãi.

### Mục tiêu:
- Quản lý **tài nguyên**: nhân sự, khách hàng, phương tiện, container, sơ đồ bãi.
- Quản lý **tác nghiệp**: nhập/xuất container, check-in/check-out, điều độ, nâng/hạ, bảo trì.
- Quản lý **dịch vụ & tài chính**: dịch vụ phát sinh, báo giá, hóa đơn, công nợ, báo cáo.
- Hỗ trợ **tự động hóa quy trình** và giảm thao tác thủ công.

---

## 2. Quy trình nghiệp vụ container

### 2.1 Quy trình nhập container (Import)
1. **Tiếp nhận**
   - Container đến cổng bãi.
   - Kiểm tra booking & hồ sơ (vận đơn, hải quan).
2. **Kiểm tra container**
   - Kiểm tra tình trạng, seal (niêm phong).
3. **Xử lý hàng hóa**
   - Dỡ hàng, kiểm tra số lượng & chất lượng.
   - Thủ tục hải quan (nếu cần).
4. **Lưu kho**
   - Xếp vào vị trí kho bãi.
   - Cập nhật hệ thống quản lý.

### 2.2 Quy trình xuất container (Export)
1. **Chuẩn bị**
   - Nhận yêu cầu xuất hàng.
   - Kiểm tra hồ sơ xuất khẩu.
2. **Chuẩn bị hàng hóa**
   - Thu gom hàng từ kho.
   - Đóng gói, xếp container.
3. **Hoàn thiện**
   - Kiểm tra container sau xếp hàng, niêm phong.
   - Thủ tục hải quan.
   - Bàn giao cho vận chuyển.

---

## 3. Các phân hệ chức năng

### 3.1 Quản lý danh mục & tài nguyên (Module 1, 9)
- Nhân sự, khách hàng, người dùng.
- Danh mục dịch vụ & bảng giá.
- Danh mục vật tư bảo trì.
- Thông tin hãng tàu & hãng xe.
- Thiết lập sơ đồ & vị trí bãi.

### 3.2 Quản lý người dùng & tài khoản (Module 2)
- Đăng nhập, đổi mật khẩu.
- Cập nhật thông tin cá nhân.

### 3.3 Quản lý yêu cầu dịch vụ (Module 3)
- Khách hàng tạo yêu cầu nhập/xuất/chuyển đổi container.
- Depot tiếp nhận & phân công công việc.
- Xuất phiếu EIR/LOLO & hóa đơn.
- Gửi yêu cầu thanh toán.
- Kết nối hệ thống Reuse container.
- **🆕 Hệ thống Chat:** Giao tiếp real-time giữa depot staff và customer về đơn hàng.

### 3.4 Quản lý cổng bãi (Module 4)
- Đối chiếu phiếu hẹn với lịch hẹn.
- Check-in / Check-out phương tiện.
- In phiếu Gate IN/OUT.

### 3.5 Quản lý điều độ & container (Module 5)
- Sơ đồ bãi trực quan, tìm kiếm container.
- Gợi ý vị trí nhập bãi.
- Quản lý xe nâng & phân công công việc.
- Nâng/hạ container.
- Quản lý trạng thái container & cảnh báo DEM/DET.

### 3.6 Quản lý bảo trì (Module 6)
- Tạo & duyệt phiếu sửa chữa/kiểm tra.
- Quản lý vật tư bảo trì.
- Cập nhật trạng thái container sau sửa chữa.
- Khách hàng chấp nhận/từ chối sửa chữa.

### 3.7 Quản lý hóa đơn & công nợ (Module 7)
- Danh sách hóa đơn.
- Tạo hóa đơn từ dịch vụ.
- Cập nhật thanh toán & công nợ.
- Gửi hóa đơn qua email.
- Báo cáo tài chính.

### 3.8 Báo cáo & Dashboard (Module 8)
- Báo cáo doanh thu, công nợ.
- Báo cáo vận hành: tình trạng bãi, hiệu suất cổng, bảo trì.
- Dashboard tổng quan KPI.
- Xuất báo cáo PDF/Excel.
  
  Tham chiếu chi tiết: xem `backend/docs/MODULE_8_REPORTS.md`.

---

## 4. Các điểm kiểm soát quan trọng
- **Tài liệu**: Booking, hải quan, EIR/LOLO, hóa đơn.
- **Chất lượng**: Container, seal, hàng hóa.

## 5. 🆕 **Hệ thống Chat (Module Chat)**

### **Tổng quan**
Hệ thống chat mới được tích hợp vào TDMS để hỗ trợ giao tiếp real-time giữa **Depot Staff** và **Customer** về các đơn hàng container.

### **Features chính**
- ✅ **Status-based Activation:** Chat chỉ hoạt động khi request status ≥ SCHEDULED
- ✅ **Real-time Communication:** WebSocket integration cho instant messaging
- ✅ **Message Persistence:** Lưu trữ tin nhắn vào database
- ✅ **Role-based Access:** Kiểm tra quyền theo user role và tenant
- ✅ **Container-specific Chat:** Mỗi container có chat room riêng biệt

### **Trạng thái được phép chat**
```typescript
const allowedStatuses = [
  'SCHEDULED',        // Đơn hàng đã được lên lịch
  'APPROVED',         // Đơn hàng đã được chấp nhận
  'IN_PROGRESS',      // Đơn hàng đang được xử lý
  'COMPLETED',        // Đơn hàng đã hoàn tất
  'EXPORTED'          // Đơn hàng đã xuất kho
];
```

### **API Endpoints**
- `POST /chat` - Tạo chat room mới
- `GET /chat/request/:request_id` - Lấy chat room theo request
- `POST /chat/:chat_room_id/messages` - Gửi tin nhắn
- `GET /chat/:chat_room_id/messages` - Lấy danh sách tin nhắn
- `GET /chat/user/rooms` - Lấy chat rooms của user

### **Tích hợp với Frontend**
- **DepotChatWindow:** Main chat interface với API integration
- **DepotChatMini:** Chat trigger và window management
- **DepotChatDemo:** Demo version cho testing

**Tham chiếu chi tiết:** Xem `backend/docs/CHAT_SYSTEM.md`
- **An ninh**: Camera, kiểm soát niêm phong, giám sát nâng/hạ.

---

## 5. Yêu cầu kỹ thuật chính
- **Phân quyền**: Quản lý nhân sự, Sale Admin, Điều độ, Bảo trì, Bảo vệ, Kế toán, Khách hàng.
- **Real-time update**: Vị trí container, trạng thái công việc, KPI dashboard.
- **Tích hợp**: Thanh toán online, COS Reuse, máy in cổng, email.
- **Báo cáo động**: Tùy chỉnh theo thời gian, loại dịch vụ, khách hàng.

---

## 6. Kết luận
Hệ thống TDMS là giải pháp tổng thể giúp số hóa toàn bộ hoạt động depot container, giảm giấy tờ, tối ưu vận hành, tăng tính minh bạch & khả năng kiểm soát.
