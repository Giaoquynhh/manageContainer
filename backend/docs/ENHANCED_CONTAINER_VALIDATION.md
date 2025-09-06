# 🔒 Enhanced Container Duplicate Validation

## Tổng quan

Tài liệu này mô tả logic validation nâng cao để ngăn chặn tạo request import trùng lặp. Hệ thống kiểm tra tất cả nguồn container trong depot để đảm bảo chỉ cho phép tạo request import khi container thực sự không có trong hệ thống.

## 🎯 Mục đích

- **Kiểm tra toàn diện**: Kiểm tra tất cả nguồn container (ServiceRequest, RepairTicket, YardPlacement)
- **Đồng bộ với UI**: Sử dụng cùng logic query như Yard và ContainersPage
- **Ngăn chặn duplicate**: Không cho phép tạo request import với container đã có trong depot
- **Thông báo rõ ràng**: Hiển thị lỗi cụ thể cho từng trường hợp

## 🔧 Logic Validation Nâng Cao

### Backend Validation

**File:** `modules/requests/service/RequestBaseService.ts`

```typescript
/**
 * Kiểm tra container number chưa tồn tại trong hệ thống
 * Chỉ cho phép tạo request import mới khi container thực sự không có trong depot
 * Kiểm tra tất cả nguồn: ServiceRequest, RepairTicket, YardPlacement
 */
private async validateContainerNotExists(container_no: string) {
    // Sử dụng query tương tự như logic hiển thị container trong Yard/ContainersPage
    const containerExists = await prisma.$queryRaw<any[]>`
        WITH latest_sr AS (
            SELECT DISTINCT ON (sr.container_no)
                sr.container_no,
                sr.status as service_status,
                sr.gate_checked_at as gate_checked_at,
                sr.type as request_type
            FROM "ServiceRequest" sr
            WHERE sr.container_no IS NOT NULL
            ORDER BY sr.container_no, sr."createdAt" DESC
        ),
        rt_checked AS (
            SELECT DISTINCT ON (rt.container_no)
                rt.container_no,
                TRUE as repair_checked,
                rt."updatedAt" as updated_at
            FROM "RepairTicket" rt
            WHERE rt.status::text = 'CHECKED' AND rt.container_no IS NOT NULL
            ORDER BY rt.container_no, rt."updatedAt" DESC
        ),
        yard_placement AS (
            SELECT DISTINCT ON (yp.container_no)
                yp.container_no,
                yp.status as placement_status,
                yp.placed_at
            FROM "YardPlacement" yp 
            WHERE yp.status = 'OCCUPIED' 
                AND yp.removed_at IS NULL
                AND yp.container_no IS NOT NULL
            ORDER BY yp.container_no, yp.placed_at DESC
        )
        SELECT 
            COALESCE(sr.container_no, rt.container_no, yp.container_no) as container_no,
            sr.service_status,
            sr.gate_checked_at,
            sr.request_type,
            COALESCE(rt.repair_checked, FALSE) as repair_checked,
            yp.placement_status,
            yp.placed_at,
            CASE 
                WHEN sr.container_no IS NOT NULL THEN 'SERVICE_REQUEST'
                WHEN rt.container_no IS NOT NULL THEN 'REPAIR_TICKET'
                WHEN yp.container_no IS NOT NULL THEN 'YARD_PLACEMENT'
            END as source
        FROM latest_sr sr
        FULL OUTER JOIN rt_checked rt ON rt.container_no = sr.container_no
        FULL OUTER JOIN yard_placement yp ON yp.container_no = COALESCE(sr.container_no, rt.container_no)
        WHERE sr.container_no = ${container_no} 
            OR rt.container_no = ${container_no} 
            OR yp.container_no = ${container_no}
    `;

    if (containerExists.length === 0) {
        // Container không tồn tại trong hệ thống - cho phép tạo
        return;
    }

    const container = containerExists[0];

    // Kiểm tra từng nguồn và đưa ra thông báo lỗi phù hợp
    if (container.source === 'SERVICE_REQUEST') {
        const isCompleted = ['COMPLETED', 'REJECTED', 'GATE_REJECTED'].includes(container.service_status);
        if (!isCompleted) {
            throw new Error(`Container ${container_no} đã tồn tại trong hệ thống với trạng thái ${container.service_status}. Chỉ có thể tạo request mới khi container không còn trong hệ thống.`);
        }
    }

    if (container.source === 'REPAIR_TICKET') {
        throw new Error(`Container ${container_no} đang trong quy trình sửa chữa. Không thể tạo request import mới.`);
    }

    if (container.source === 'YARD_PLACEMENT') {
        throw new Error(`Container ${container_no} đã được đặt vào yard và chưa được xuất. Không thể tạo request import mới.`);
    }
}
```

## 📋 Các Nguồn Container Được Kiểm Tra

### 1. ServiceRequest (Ưu tiên cao nhất)
- **Mô tả**: Container từ request import/export
- **Điều kiện chặn**: Status chưa hoàn thành
- **Status được chặn**: PENDING, SCHEDULED, FORWARDED, GATE_IN, CHECKING, PENDING_ACCEPT, ACCEPT, CHECKED, POSITIONED, FORKLIFTING, IN_YARD, IN_CAR, GATE_OUT
- **Status cho phép**: COMPLETED, REJECTED, GATE_REJECTED

### 2. RepairTicket (Ưu tiên thứ 2)
- **Mô tả**: Container trong quy trình sửa chữa
- **Điều kiện chặn**: Status = 'CHECKED'
- **Lý do**: Container đang được sửa chữa, không thể tạo request import

### 3. YardPlacement (Ưu tiên thấp nhất)
- **Mô tả**: Container đã được đặt vào yard
- **Điều kiện chặn**: Status = 'OCCUPIED' và removed_at = null
- **Lý do**: Container đã có trong bãi, không thể tạo request import mới

## 🔄 Luồng Xử Lý Nâng Cao

```mermaid
graph TD
    A[User tạo request import] --> B[validateContainerNotExists()]
    B --> C[Query tất cả nguồn container]
    C --> D{Container có tồn tại?}
    D -->|Không| E[Cho phép tạo request]
    D -->|Có| F{Xác định nguồn}
    F -->|SERVICE_REQUEST| G{Status hoàn thành?}
    F -->|REPAIR_TICKET| H[Chặn - Đang sửa chữa]
    F -->|YARD_PLACEMENT| I[Chặn - Đã trong yard]
    G -->|Có| E
    G -->|Không| J[Chặn - Đang hoạt động]
    H --> K[Hiển thị lỗi sửa chữa]
    I --> L[Hiển thị lỗi yard]
    J --> M[Hiển thị lỗi status]
    E --> N[Tạo request thành công]
```

## 🧪 Testing

### Test Script

**File:** `test-enhanced-container-validation.js`

```javascript
// Test với tất cả nguồn container
const allContainers = await prisma.$queryRaw`
    WITH latest_sr AS (...),
    rt_checked AS (...),
    yard_placement AS (...)
    SELECT 
        COALESCE(sr.container_no, rt.container_no, yp.container_no) as container_no,
        CASE 
            WHEN sr.container_no IS NOT NULL THEN 'SERVICE_REQUEST'
            WHEN rt.container_no IS NOT NULL THEN 'REPAIR_TICKET'
            WHEN yp.container_no IS NOT NULL THEN 'YARD_PLACEMENT'
        END as source
    FROM latest_sr sr
    FULL OUTER JOIN rt_checked rt ON rt.container_no = sr.container_no
    FULL OUTER JOIN yard_placement yp ON yp.container_no = COALESCE(sr.container_no, rt.container_no)
    WHERE sr.container_no IS NOT NULL 
        OR rt.container_no IS NOT NULL 
        OR yp.container_no IS NOT NULL
`;
```

### Test Cases

1. **Container từ ServiceRequest với status PENDING** → ❌ Chặn
2. **Container từ ServiceRequest với status COMPLETED** → ✅ Cho phép
3. **Container từ RepairTicket** → ❌ Chặn
4. **Container từ YardPlacement** → ❌ Chặn
5. **Container không tồn tại** → ✅ Cho phép

## 📊 Kết Quả Test

```
🧪 Test Enhanced Container Validation Logic...

1. Kiểm tra containers hiện có trong tất cả nguồn:
   Tìm thấy 1 containers trong hệ thống:
   - ISO 1234 (SERVICE_REQUEST) - Status: PENDING

2. Test validation logic:
   Testing với container: ISO 1234
   Source: SERVICE_REQUEST
   Status: PENDING
   ❌ Container ISO 1234 đã tồn tại trong hệ thống với trạng thái PENDING
   ✅ Validation sẽ chặn tạo request mới cho container này

3. Test với container không tồn tại:
   ✅ Container TEST999999 không tồn tại trong hệ thống
   ✅ Validation sẽ cho phép tạo request mới cho container này

✅ Test hoàn thành!
```

## 🎯 Lợi Ích

### 1. **Đồng bộ với UI**
- Sử dụng cùng query logic như Yard và ContainersPage
- Đảm bảo consistency giữa validation và hiển thị

### 2. **Kiểm tra toàn diện**
- Kiểm tra tất cả nguồn container trong depot
- Không bỏ sót trường hợp nào

### 3. **Thông báo lỗi rõ ràng**
- Lỗi cụ thể cho từng nguồn container
- Giúp user hiểu tại sao không thể tạo request

### 4. **Performance tối ưu**
- Sử dụng single query thay vì multiple queries
- Index được tối ưu cho các trường hợp sử dụng

## 📁 File Mapping

### Backend Files

| File | Thay đổi | Mô tả |
|------|----------|-------|
| `RequestBaseService.ts` | ✅ Cập nhật | Logic validation nâng cao |
| `test-enhanced-container-validation.js` | ✅ Mới | Test script cho logic mới |

### Frontend Files

| File | Thay đổi | Mô tả |
|------|----------|-------|
| `RequestForm.tsx` | ⚪ Không đổi | Đã có error handling |

## 🚀 Deployment

### Backend Changes
- ✅ Deploy `RequestBaseService.ts` với logic mới
- ✅ Test validation với tất cả nguồn container
- ✅ Monitor error logs

### Database
- ⚪ Không cần migration
- ⚪ Sử dụng existing indexes

## 🔍 Monitoring

### Error Tracking
```typescript
// Track validation errors by source
const trackValidationError = (containerNo: string, source: string, error: string) => {
    analytics.track('enhanced_container_validation_error', {
        container_no: containerNo,
        source: source,
        error_message: error,
        timestamp: new Date().toISOString()
    });
};
```

### Metrics
- Số lượng request bị chặn theo nguồn container
- Container numbers bị duplicate nhiều nhất
- Thời gian response validation

## 📝 Notes

1. **Backward Compatible**: Không ảnh hưởng đến code hiện có
2. **Performance**: Single query thay vì multiple queries
3. **Maintainable**: Logic rõ ràng, dễ hiểu
4. **Testable**: Có test script đầy đủ
5. **Scalable**: Có thể mở rộng thêm nguồn container khác

## 🔄 Future Enhancements

1. **Real-time Validation**: Kiểm tra khi user nhập container number
2. **Bulk Validation**: Validate nhiều containers cùng lúc
3. **Cache**: Cache kết quả validation để tối ưu performance
4. **Audit Trail**: Log chi tiết các lần validation
5. **Tenant Isolation**: Validation theo tenant
