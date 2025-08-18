# Module 4 — Quản lý Bãi Container (Yard Management)

## Tổng quan
Module Yard Management cung cấp các chức năng quản lý sơ đồ bãi, gợi ý vị trí tối ưu và gán container vào các slot trong bãi. Module này hỗ trợ quy trình Gate In → Yard Assignment một cách hiệu quả.

## Chức năng chính

### 1. Sơ đồ bãi (Yard Map)
- **Hiển thị sơ đồ bãi dạng grid** với các block và slot
- **Màu sắc phân biệt trạng thái slot**:
  - Trống (EMPTY): Xám nhạt
  - Gợi ý (SUGGESTED): Xanh dương nhạt + border highlight
  - Đã chọn (SELECTED): Xanh dương đậm + border đậm
  - Đã chiếm (OCCUPIED): Xám đậm
  - Bảo trì (UNDER_MAINTENANCE): Cam + icon 🔧
  - Xuất khẩu (EXPORT): Xanh lá

### 2. Gợi ý vị trí tự động
- **API gợi ý vị trí**: `/yard/suggest-position?container_no=...`
- **Thuật toán tối ưu**: Gần gate, cùng loại, tránh khu bảo trì
- **Hiển thị 3-5 vị trí gợi ý** với điểm số và khoảng cách
- **Highlight vị trí gợi ý** trên sơ đồ bãi

### 3. Chọn vị trí thủ công
- **Click chọn slot trống** trên sơ đồ bãi
- **Tooltip thông tin**: Block code, trạng thái, khoảng cách từ gate
- **Fallback option** khi gợi ý tự động không phù hợp

### 4. Xác nhận vị trí
- **Modal xác nhận** với thông tin chi tiết
- **API gán vị trí**: `PATCH /yard/assign-position`
- **In phiếu hướng dẫn** cho tài xế
- **Cập nhật real-time** trạng thái slot

## API Endpoints

### GET /yard/map
Lấy sơ đồ bãi hiện tại
```json
{
  "id": "yard_001",
  "name": "Depot A",
  "blocks": [
    {
      "id": "block_a1",
      "code": "A1",
      "slots": [
        {
          "id": "slot_a1_01",
          "code": "A1-01",
          "status": "EMPTY"
        }
      ]
    }
  ]
}
```

### GET /yard/suggest-position?container_no=ABC1234567
Gợi ý vị trí tối ưu cho container
```json
[
  {
    "slot_id": "slot_a1_01",
    "slot_code": "A1-01",
    "score": 0.85,
    "distance_from_gate": 45,
    "block_code": "A1"
  }
]
```

### PATCH /yard/assign-position
Gán container vào vị trí đã chọn
```json
{
  "container_no": "ABC1234567",
  "slot_id": "slot_a1_01"
}
```

### POST /gate/in/print-ticket
In phiếu hướng dẫn cho tài xế
```json
{
  "container_no": "ABC1234567",
  "slot_id": "slot_a1_01",
  "driver_info": {
    "name": "Nguyễn Văn A",
    "phone": "0123456789"
  }
}
```

## Luồng xử lý (User Flow)

### 1. Xe container Gate In
1. Nhân viên cổng quét phiếu hẹn/booking
2. Nhập Container No vào hệ thống
3. Hệ thống gọi API gợi ý vị trí

### 2. Gợi ý vị trí tự động
1. UI hiển thị danh sách vị trí gợi ý
2. Slot gợi ý được highlight trên sơ đồ
3. Nhân viên có thể chọn vị trí gợi ý hoặc chọn thủ công

### 3. Xác nhận & In phiếu
1. Nhấn nút "Xác nhận vị trí"
2. Modal xác nhận hiển thị thông tin chi tiết
3. Hệ thống gán vị trí và cập nhật database
4. In phiếu hướng dẫn cho tài xế

## Quyền hạn (RBAC)

### SaleAdmin
- ✅ Xem sơ đồ bãi
- ✅ Gợi ý vị trí
- ✅ Chọn vị trí thủ công
- ✅ Xác nhận vị trí
- ✅ In phiếu hướng dẫn

### YardManager
- ✅ Xem sơ đồ bãi
- ✅ Gợi ý vị trí
- ✅ Chọn vị trí thủ công
- ✅ Xác nhận vị trí
- ✅ In phiếu hướng dẫn

### SystemAdmin
- ✅ Tất cả quyền của SaleAdmin
- ✅ Quản lý cấu hình bãi
- ✅ Xem logs và báo cáo

### Security
- ❌ Không thể chọn vị trí
- ✅ Chỉ in phiếu tại Gate

## Cấu trúc Database

### Yard Table
```sql
CREATE TABLE yards (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  capacity INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Block Table
```sql
CREATE TABLE blocks (
  id VARCHAR(50) PRIMARY KEY,
  yard_id VARCHAR(50) REFERENCES yards(id),
  code VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Slot Table
```sql
CREATE TABLE slots (
  id VARCHAR(50) PRIMARY KEY,
  block_id VARCHAR(50) REFERENCES blocks(id),
  code VARCHAR(20) NOT NULL,
  status ENUM('EMPTY', 'RESERVED', 'OCCUPIED', 'UNDER_MAINTENANCE', 'EXPORT'),
  container_no VARCHAR(50),
  assigned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Tính năng nâng cao

### Real-time Updates
- **WebSocket connection** để cập nhật trạng thái slot real-time
- **Auto-refresh** sơ đồ bãi khi có thay đổi
- **Notification** khi slot được gán hoặc giải phóng

### QR Code Integration
- **QR code trên phiếu** để xe nâng scan xác nhận
- **Mobile app** cho tài xế xem thông tin vị trí
- **GPS tracking** để theo dõi vị trí thực tế

### Analytics & Reporting
- **Thống kê sử dụng bãi** theo thời gian
- **Báo cáo hiệu suất** gợi ý vị trí
- **Dashboard** quản lý capacity và utilization

## Tích hợp với các Module khác

### Module 3 - Requests
- **Container info** từ yêu cầu dịch vụ
- **Booking details** để gợi ý vị trí phù hợp
- **Status tracking** từ Gate In đến Yard Assignment

### Module 5 - Forklift
- **Công việc xe nâng** tự động tạo khi gán vị trí
- **Route optimization** cho xe nâng di chuyển
- **Task assignment** dựa trên vị trí container

### Module 6 - Maintenance
- **Slot maintenance** khi cần bảo trì
- **Equipment tracking** trong khu bảo trì
- **Preventive maintenance** scheduling

## Troubleshooting

### Vấn đề thường gặp
1. **Slot không hiển thị đúng trạng thái**
   - Kiểm tra database connection
   - Verify WebSocket connection
   - Clear browser cache

2. **Gợi ý vị trí không chính xác**
   - Kiểm tra thuật toán scoring
   - Verify slot availability
   - Check maintenance schedule

3. **Modal xác nhận không hiển thị**
   - Kiểm tra JavaScript console
   - Verify component state
   - Check CSS loading

### Logs & Monitoring
- **API access logs** trong `/logs/api/`
- **Error tracking** với Sentry integration
- **Performance metrics** với New Relic
- **Database query logs** với Prisma logging

## Tài liệu tham khảo

- [Module 3 - Requests](./MODULE_3_REQUESTS.md)
- [Module 5 - Forklift](./MODULE_5_FORKLIFT.md)
- [Module 6 - Maintenance](./MODULE_6_MAINTENANCE.md)
- [API Documentation](../api/README.md)
- [Database Schema](../database/schema.md)
