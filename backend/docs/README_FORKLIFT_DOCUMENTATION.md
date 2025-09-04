# Forklift Documentation - Tài liệu Forklift

## 📚 Tổng quan
Tài liệu này cung cấp hướng dẫn đầy đủ về module Forklift trong hệ thống quản lý container, bao gồm cả tính năng mới về auto-create forklift task.

## 📖 Danh sách tài liệu

### **1. Tài liệu chính**
- **[FORKLIFT_FEATURES_OVERVIEW.md](./FORKLIFT_FEATURES_OVERVIEW.md)** - Tổng quan tất cả tính năng forklift
- **[AUTO_FORKLIFT_TASK_CREATION.md](./AUTO_FORKLIFT_TASK_CREATION.md)** - Tính năng tự động tạo phiếu forklift ⭐ **MỚI**

### **2. Tài liệu chuyên sâu**
- **[FORKLIFT_ACTION_MAPPING.md](./FORKLIFT_ACTION_MAPPING.md)** - Mapping giữa backend API và frontend actions
- **[Forklift.md](./Forklift.md)** - Enhanced location display và UI improvements
- **[MODULE_3_REQUESTS.md](./MODULE_3_REQUESTS.md)** - Integration với module Requests

### **3. Tài liệu liên quan**
- **[REQUEST_STATE_MACHINE_API.md](./REQUEST_STATE_MACHINE_API.md)** - State machine API
- **[REQUEST_STATE_MACHINE_IMPLEMENTATION.md](./REQUEST_STATE_MACHINE_IMPLEMENTATION.md)** - State machine implementation
- **[MODULE_4_YARD.md](./MODULE_4_YARD.md)** - Yard module integration

## 🚀 Tính năng mới: Auto Forklift Task Creation

### **Tổng quan**
Khi EXPORT request chuyển sang trạng thái `GATE_IN`, hệ thống sẽ tự động tạo ForkliftTask để di chuyển container từ bãi yard ra cổng gate.

### **Files liên quan**
- `prisma/migrations/20250904_auto_create_forklift_task.sql` - Database trigger
- `modules/forklift/service/AutoForkliftTaskService.ts` - Service layer
- `modules/requests/service/RequestStateMachine.ts` - State machine integration

### **Workflow**
```
EXPORT Request: SENT_TO_GATE → GATE_IN
                                    ↓
                            Auto-create ForkliftTask
                                    ↓
                            Status: PENDING
                            From: Yard Slot (current location)
                            To: GATE_EXPORT Slot
```

## 🔧 Implementation Guide

### **1. Database Setup**
```sql
-- Chạy migration để tạo trigger
-- File: prisma/migrations/20250904_auto_create_forklift_task.sql
```

### **2. Service Integration**
```typescript
// Import service trong RequestStateMachine
import { AutoForkliftTaskService } from '../../forklift/service/AutoForkliftTaskService';

// Sử dụng trong executeTransition
if (newState === 'GATE_IN' && additionalData?.requestType === 'EXPORT') {
  await AutoForkliftTaskService.createForkliftTaskForExport(
    additionalData.containerNo, 
    actor._id
  );
}
```

### **3. Manual Trigger**
```typescript
// Tạo forklift tasks cho các EXPORT requests hiện tại
await AutoForkliftTaskService.createMissingForkliftTasks();

// Chạy scheduled check
await AutoForkliftTaskService.runScheduledCheck();
```

## 🧪 Testing

### **Unit Tests**
```bash
# Test AutoForkliftTaskService
npm test -- --testNamePattern="AutoForkliftTaskService"

# Test RequestStateMachine integration
npm test -- --testNamePattern="RequestStateMachine.*forklift"
```

### **Integration Tests**
```bash
# Test database trigger
psql -d container_db -f test_trigger.sql

# Test API endpoints
curl -X POST http://localhost:5000/api/forklift/auto-create-missing
```

### **Manual Testing**
```bash
# 1. Tạo EXPORT request
# 2. Chuyển sang GATE_IN status
# 3. Kiểm tra ForkliftTask được tạo tự động
# 4. Verify audit logs
```

## 📊 Monitoring

### **Audit Logs**
```sql
-- Xem logs tạo forklift task
SELECT * FROM "AuditLog" 
WHERE action = 'FORKLIFT.AUTO_CREATED' 
ORDER BY created_at DESC;
```

### **Console Logs**
```bash
# Xem logs trong console
tail -f logs/access.log | grep "forklift"
```

### **Database Monitoring**
```sql
-- Kiểm tra forklift tasks được tạo
SELECT 
  ft.id,
  ft.container_no,
  ft.status,
  ft.created_at,
  al.meta
FROM "ForkliftTask" ft
LEFT JOIN "AuditLog" al ON al.entity_id = ft.id
WHERE al.action = 'FORKLIFT.AUTO_CREATED'
ORDER BY ft.created_at DESC;
```

## 🚨 Troubleshooting

### **Common Issues**

#### **1. ForkliftTask không được tạo tự động**
- **Kiểm tra**: Request type = 'EXPORT' và status = 'GATE_IN'
- **Kiểm tra**: Container number tồn tại
- **Kiểm tra**: Chưa có ForkliftTask cho container này
- **Kiểm tra**: Database trigger đã được tạo

#### **2. Lỗi tạo Gate Slot**
- **Kiểm tra**: Gate Yard và Block đã tồn tại
- **Kiểm tra**: Permissions cho tạo slot
- **Kiểm tra**: Database constraints

#### **3. Lỗi State Machine**
- **Kiểm tra**: RequestStateMachine.executeTransition()
- **Kiểm tra**: additionalData có đúng format
- **Kiểm tra**: Actor permissions

### **Debug Steps**
1. **Check ServiceRequest**: Verify type, status, container_no
2. **Check ForkliftTask**: Look for existing tasks
3. **Check Audit Logs**: Review error logs
4. **Check Database**: Verify trigger execution
5. **Test Manual**: Try manual task creation

### **Recovery Procedures**
```typescript
// 1. Manual task creation
await AutoForkliftTaskService.createMissingForkliftTasks();

// 2. Clean up duplicate tasks
await prisma.forkliftTask.deleteMany({
  where: { /* duplicate conditions */ }
});

// 3. Recreate gate infrastructure
await AutoForkliftTaskService.createForkliftTaskForExport(
  'TEST1234567', 
  'admin-user-id'
);
```

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

## 📞 Support

### **Development Team**
- **Backend**: Container Management Team
- **Frontend**: UI/UX Team
- **Database**: DBA Team

### **Contact**
- **Email**: dev-team@container-management.com
- **Slack**: #container-management
- **Jira**: Container Management Project

### **Documentation Updates**
- **Version**: 3.3.0
- **Last Updated**: 2025-01-09
- **Next Review**: 2025-02-09

---

**Ngày tạo:** 2025-01-09  
**Phiên bản:** 3.3.0 - Auto Forklift Task Creation  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation và documentation
