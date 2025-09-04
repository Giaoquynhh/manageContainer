# Forklift Features Overview - Tổng quan tính năng Forklift

## Overview
Tài liệu này tổng hợp tất cả các tính năng liên quan đến module Forklift trong hệ thống quản lý container, bao gồm cả tính năng mới về auto-create forklift task.

## 📋 Danh sách tính năng

### 1. **Forklift Task Management** (Cơ bản)
- **File**: `modules/forklift/controller/ForkliftController.ts`
- **Mô tả**: Quản lý các task forklift cơ bản
- **Tính năng**:
  - Tạo task mới
  - Cập nhật trạng thái task
  - Gán tài xế
  - Cập nhật chi phí
  - Hủy task

### 2. **Forklift Action Mapping** (UI Integration)
- **File**: `docs/FORKLIFT_ACTION_MAPPING.md`
- **Mô tả**: Mapping giữa backend API và frontend actions
- **Tính năng**:
  - Action flow changes (PENDING → CANCELLED)
  - Status-based action buttons
  - Error handling
  - API response mapping

### 3. **Enhanced Location Display** (UI Enhancement)
- **File**: `docs/Forklift.md`
- **Mô tả**: Hiển thị thông tin vị trí container chi tiết
- **Tính năng**:
  - Vị trí nguồn chi tiết (yard/block/slot + tier)
  - Vị trí đích chi tiết
  - Tọa độ (row/column coordinates)
  - Capacity information
  - Color coding cho trạng thái slot

### 4. **Auto Forklift Task Creation** (MỚI) ⭐
- **Files**: 
  - `prisma/migrations/20250904_auto_create_forklift_task.sql`
  - `modules/forklift/service/AutoForkliftTaskService.ts`
  - `modules/requests/service/RequestStateMachine.ts`
- **Mô tả**: Tự động tạo forklift task cho EXPORT requests
- **Tính năng**:
  - Database trigger tự động
  - Service layer với error handling
  - State machine integration
  - Audit trail đầy đủ

## 🔄 Workflow Integration

### **Import Request Workflow:**
```
1. CHECKED → POSITIONED (Yard confirm)
2. POSITIONED → FORKLIFTING (Driver start)
3. FORKLIFTING → IN_YARD (Forklift approval)
```

### **Export Request Workflow:**
```
1. SENT_TO_GATE → GATE_IN (Gate check-in)
   ↓ Auto-create ForkliftTask ⭐ MỚI
2. GATE_IN → FORKLIFTING (Driver start)
3. FORKLIFTING → IN_CAR (Forklift approval)
```

## 📁 File Structure

### **Backend Files:**
```
modules/forklift/
├── controller/
│   └── ForkliftController.ts          # Main controller
├── service/
│   └── AutoForkliftTaskService.ts     # Auto-creation service ⭐ MỚI
└── ...

modules/requests/service/
└── RequestStateMachine.ts             # State machine integration

prisma/migrations/
└── 20250904_auto_create_forklift_task.sql  # Database trigger ⭐ MỚI
```

### **Documentation Files:**
```
docs/
├── FORKLIFT_ACTION_MAPPING.md         # Action mappings
├── Forklift.md                        # Enhanced location display
├── AUTO_FORKLIFT_TASK_CREATION.md    # Auto-creation feature ⭐ MỚI
└── FORKLIFT_FEATURES_OVERVIEW.md     # This file
```

## 🚀 Tính năng mới: Auto Forklift Task Creation

### **Trigger Conditions:**
- Request type = `EXPORT`
- Status = `GATE_IN`
- Container number tồn tại
- Chưa có ForkliftTask cho container này

### **Auto-created Task Details:**
- **From Location**: Vị trí hiện tại của container trong yard
- **To Location**: Slot đặc biệt `GATE_EXPORT` (tự động tạo nếu chưa có)
- **Status**: `PENDING`
- **Purpose**: Di chuyển container từ yard ra cổng gate để xuất

### **Implementation Layers:**
1. **Database Trigger**: Tự động kích hoạt khi ServiceRequest được update
2. **Service Layer**: `AutoForkliftTaskService.createForkliftTaskForExport()`
3. **State Machine**: Integration trong `RequestStateMachine.executeTransition()`
4. **Audit Trail**: Ghi log đầy đủ cho mọi hoạt động tạo task

## 🎯 Key Benefits

### **1. Automation**
- Tự động tạo forklift task cho EXPORT requests
- Giảm thiểu thao tác thủ công
- Đảm bảo không bỏ sót task

### **2. Consistency**
- Workflow nhất quán cho tất cả EXPORT requests
- State machine integration đảm bảo logic đúng
- Audit trail đầy đủ cho tracking

### **3. Error Handling**
- Non-blocking errors không ảnh hưởng state transition
- Detailed logging cho debugging
- Retry logic có thể implement

### **4. Monitoring**
- Audit logs track mọi hoạt động
- Console logs cho development
- Database logs cho production monitoring

## 🔧 Configuration

### **Environment Variables:**
```env
# Enable/disable auto-creation
AUTO_FORKLIFT_CREATION_ENABLED=true

# Gate slot configuration
GATE_SLOT_CODE=GATE_EXPORT
GATE_BLOCK_CODE=GATE
GATE_YARD_NAME=Gate Yard
```

### **Database Configuration:**
```sql
-- Gate slot properties
near_gate: 10        -- High priority for gate
avoid_main: 0        -- Not avoid main area
is_odd: false        -- Not odd position
status: 'RESERVED'   -- Reserved for gate operations
kind: 'EXPORT'       -- Export-specific slot
```

## 🧪 Testing

### **Unit Tests:**
```typescript
// Test AutoForkliftTaskService
describe('AutoForkliftTaskService', () => {
  it('should create forklift task for EXPORT request', async () => {
    const result = await AutoForkliftTaskService.createForkliftTaskForExport(
      'TEST1234567', 
      'user-id'
    );
    expect(result).toBeDefined();
  });
});
```

### **Integration Tests:**
```typescript
// Test state machine integration
describe('RequestStateMachine', () => {
  it('should auto-create forklift task on GATE_IN transition', async () => {
    await RequestStateMachine.executeTransition(
      mockActor,
      'request-id',
      'SENT_TO_GATE',
      'GATE_IN',
      undefined,
      { requestType: 'EXPORT', containerNo: 'TEST1234567' }
    );
    
    const task = await prisma.forkliftTask.findFirst({
      where: { container_no: 'TEST1234567' }
    });
    expect(task).toBeDefined();
  });
});
```

### **Database Trigger Tests:**
```sql
-- Test trigger functionality
UPDATE "ServiceRequest" 
SET status = 'GATE_IN' 
WHERE type = 'EXPORT' AND container_no = 'TEST1234567';

-- Verify forklift task was created
SELECT * FROM "ForkliftTask" WHERE container_no = 'TEST1234567';
```

## 📊 Monitoring & Logging

### **Audit Logs:**
```typescript
// Audit log structure
{
  actor_id: string,
  action: 'FORKLIFT.AUTO_CREATED',
  entity: 'ForkliftTask',
  entity_id: string,
  meta: {
    container_no: string,
    trigger: 'GATE_IN_EXPORT' | 'AUTO_SERVICE_GATE_IN_EXPORT',
    from_slot_id: string | null,
    to_slot_id: string,
    task_purpose: string
  }
}
```

### **Console Logs:**
```typescript
// Success logs
console.log(`✅ Auto-created forklift task for EXPORT container ${containerNo}`);

// Error logs  
console.error(`❌ Error auto-creating forklift task for container ${containerNo}:`, error);

// Info logs
console.log(`🔍 Checking for missing forklift tasks...`);
console.log(`📋 Found ${exportGateInRequests.length} EXPORT requests with GATE_IN status`);
```

## 🚨 Troubleshooting

### **Common Issues:**
1. **Missing Gate Infrastructure**: System will auto-create if missing
2. **Container Not in Yard**: Task created with null from_slot_id
3. **Duplicate Tasks**: Prevention logic should handle this
4. **Permission Errors**: Ensure proper role permissions

### **Debug Steps:**
1. Check ServiceRequest status and type
2. Verify container_no exists
3. Check existing ForkliftTask records
4. Review audit logs for errors
5. Test manual task creation

### **Recovery Procedures:**
- **Manual Task Creation**: Use `AutoForkliftTaskService.createMissingForkliftTasks()`
- **Data Cleanup**: Remove duplicate or invalid tasks
- **Infrastructure Setup**: Ensure gate yard/block/slot exist
- **Permission Fix**: Update user roles and permissions

## 🔮 Future Enhancements

### **1. Advanced Features**
- **Priority Management**: Different priorities for different container types
- **Route Optimization**: Calculate optimal routes for forklift operations
- **Capacity Planning**: Predict gate slot capacity needs
- **Real-time Updates**: WebSocket notifications for task creation

### **2. Integration Improvements**
- **Mobile Notifications**: Notify drivers about new tasks
- **Dashboard Updates**: Real-time dashboard updates
- **Reporting**: Analytics on auto-created tasks
- **Bulk Operations**: Handle multiple containers at once

### **3. Performance Optimizations**
- **Batch Processing**: Process multiple requests in batches
- **Caching**: Cache frequently accessed data
- **Async Processing**: Use message queues for heavy operations
- **Database Indexing**: Optimize database queries

## 📚 Related Documentation

- [FORKLIFT_ACTION_MAPPING.md](./FORKLIFT_ACTION_MAPPING.md) - Action mappings
- [Forklift.md](./Forklift.md) - Enhanced location display
- [AUTO_FORKLIFT_TASK_CREATION.md](./AUTO_FORKLIFT_TASK_CREATION.md) - Auto-creation feature
- [MODULE_3_REQUESTS.md](./MODULE_3_REQUESTS.md) - Requests module with auto-creation integration
- [REQUEST_STATE_MACHINE_API.md](./REQUEST_STATE_MACHINE_API.md) - State machine API

## 📝 Changelog

### **v3.3.0** (2025-01-09)
- ✅ **Added**: Auto Forklift Task Creation for EXPORT requests
- ✅ **Added**: Database trigger for automatic task creation
- ✅ **Added**: Service layer with error handling
- ✅ **Added**: State machine integration
- ✅ **Added**: Comprehensive audit trail
- ✅ **Added**: Documentation and testing

### **v3.2.0** (2024-08-16)
- ✅ **Added**: Upload nhiều files chứng từ
- ✅ **Added**: Container Yard Workflow Integration
- ✅ **Added**: IN_CAR Status cho EXPORT requests
- ✅ **Added**: Container Number Validation
- ✅ **Added**: Enhanced location display

### **v3.1.0** (2024-08-15)
- ✅ **Added**: Forklift Action Mapping
- ✅ **Added**: Enhanced UI/UX support
- ✅ **Added**: Error handling improvements

---

**Ngày tạo:** 2025-01-09  
**Phiên bản:** 3.3.0 - Auto Forklift Task Creation  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation và documentation
