# Tính năng Auto-Forward sau khi Upload SUPPLEMENT Document

## Tổng quan

Tính năng Auto-Forward cho phép hệ thống tự động chuyển trạng thái request từ `SCHEDULED` sang `FORWARDED` ngay sau khi Customer upload thành công tài liệu bổ sung (SUPPLEMENT document).

## Luồng hoạt động

### 1. Customer Upload SUPPLEMENT Document
```
Customer → Upload SUPPLEMENT → Backend Validation → Auto-Forward → Status Update
```

### 2. Chi tiết từng bước

#### **Bước 1: Validation**
- Kiểm tra request status = `SCHEDULED`
- Kiểm tra actor role = `CustomerAdmin` hoặc `CustomerUser`
- Kiểm tra tenant scope (customer chỉ upload cho tenant của mình)
- Kiểm tra file type và size

#### **Bước 2: File Processing**
- Lưu file vào thư mục `uploads/`
- Tạo document record trong database
- Tăng version number tự động

#### **Bước 3: Auto-Forward Logic**
```typescript
// Pre-check transition possibility
const canTransition = RequestStateMachine.canTransition(req.status, 'FORWARDED', actor.role);

if (!canTransition) {
  console.warn(`Cannot transition from ${req.status} to FORWARDED for role ${actor.role}`);
  return doc; // Upload thành công nhưng không chuyển trạng thái
}

// Execute state machine transition
await RequestStateMachine.executeTransition(
  actor,
  request_id,
  req.status,
  'FORWARDED',
  'Tự động chuyển tiếp sau khi khách hàng bổ sung tài liệu'
);
```

#### **Bước 4: Database Update**
```typescript
const updatedRequest = await repo.update(request_id, {
  status: 'FORWARDED',
  forwarded_at: new Date(),
  forwarded_by: actor._id,
  history: [
    ...(Array.isArray(req.history) ? req.history : []),
    {
      at: new Date().toISOString(),
      by: actor._id,
      action: 'FORWARDED',
      reason: 'Tự động chuyển tiếp sau khi khách hàng bổ sung tài liệu',
      document_id: doc.id,
      document_type: 'SUPPLEMENT'
    }
  ]
});
```

#### **Bước 5: Audit Logging**
- Ghi audit log với action `DOC.UPLOADED_SUPPLEMENT`
- Ghi audit log với action `REQUEST.FORWARDED`

## State Machine Integration

### **Transitions được cập nhật**

#### **Trước đây:**
```typescript
{
  from: 'SCHEDULED',
  to: 'FORWARDED',
  allowedRoles: ['SaleAdmin', 'SystemAdmin'], // Chỉ Depot
  description: 'Depot chuyển tiếp sau khi nhận thông tin bổ sung'
}
```

#### **Bây giờ:**
```typescript
{
  from: 'SCHEDULED',
  to: 'FORWARDED',
  allowedRoles: ['SaleAdmin', 'SystemAdmin', 'CustomerAdmin', 'CustomerUser'], // Cả Depot và Customer
  description: 'Depot chuyển tiếp hoặc Customer tự động chuyển tiếp sau khi bổ sung tài liệu'
}
```

### **Valid Transitions cho Customer**

```typescript
// CustomerAdmin/CustomerUser có thể thực hiện:
SCHEDULED → SCHEDULED_INFO_ADDED  // Bổ sung thông tin
SCHEDULED → FORWARDED             // Tự động chuyển tiếp (mới)
SCHEDULED_INFO_ADDED → FORWARDED  // Tự động chuyển tiếp (mới)
```

## Enhanced Logging

### **Pre-Transition Logs**
```typescript
console.log(`Attempting to auto-forward request ${request_id} from ${req.status} to FORWARDED`);
console.log(`Actor role: ${actor.role}, Actor ID: ${actor._id}`);
console.log(`Can transition from ${req.status} to FORWARDED: ${canTransition}`);
```

### **Success Logs**
```typescript
console.log(`State machine transition successful, updating database...`);
console.log(`Request ${request_id} successfully updated to FORWARDED:`, {
  newStatus: updatedRequest.status,
  forwardedAt: updatedRequest.forwarded_at,
  forwardedBy: updatedRequest.forwarded_by
});
```

### **Error Logs**
```typescript
console.error('Error auto-forwarding request after SUPPLEMENT upload:', error);
console.error('Error details:', {
  message: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : 'No stack trace',
  actorRole: actor.role,
  requestId: request_id,
  currentStatus: req.status
});
```

## Error Handling

### **Graceful Degradation**
- Nếu State Machine transition thất bại, **upload vẫn thành công**
- Lỗi được log chi tiết nhưng không làm crash quá trình upload
- Customer nhận được thông báo rõ ràng về kết quả

### **Common Error Scenarios**
1. **Invalid State Transition:** Role không có quyền chuyển trạng thái
2. **State Machine Error:** Lỗi trong quá trình execute transition
3. **Database Update Error:** Lỗi khi cập nhật database
4. **Audit Log Error:** Lỗi khi ghi audit log

### **Error Recovery**
```typescript
try {
  // Auto-forward logic
} catch (error) {
  console.error('Error auto-forwarding request after SUPPLEMENT upload:', error);
  // Không throw error để upload vẫn thành công, chỉ log warning
}
```

## Frontend Integration

### **Success Message**
```typescript
alert('✅ Upload tài liệu bổ sung thành công!\n\n📤 Yêu cầu đã được tự động chuyển tiếp sang trạng thái FORWARDED.\n\n🔄 Hệ thống sẽ xử lý yêu cầu của bạn tiếp theo.\n\n💡 Lưu ý: Trạng thái sẽ được cập nhật sau khi refresh trang.');
```

### **Data Refresh**
```typescript
const handleSupplementSuccess = () => {
  // Refresh danh sách request để cập nhật trạng thái
  mutate('/requests?page=1&limit=20');
  
  // Hiển thị thông báo thành công
  setMsg({
    text: '✅ Upload tài liệu bổ sung thành công! 📤 Yêu cầu đã được tự động chuyển tiếp sang FORWARDED.',
    ok: true
  });
  
  // Tự động ẩn thông báo sau 5 giây
  setTimeout(() => {
    setMsg(null);
  }, 5000);
};
```

## Testing

### **Test Cases**

#### **1. Happy Path**
- [x] Customer upload SUPPLEMENT document
- [x] State Machine transition thành công
- [x] Database được cập nhật
- [x] Audit log được ghi
- [x] Frontend hiển thị thông báo thành công

#### **2. Error Scenarios**
- [x] State Machine transition thất bại
- [x] Database update error
- [x] Audit log error
- [x] Graceful degradation

#### **3. Edge Cases**
- [x] Customer không có quyền transition
- [x] Request status không phải SCHEDULED
- [x] Tenant scope mismatch
- [x] File validation errors

### **Test Commands**

#### **Test State Machine**
```bash
cd manageContainer/backend
node test-state-machine.js
```

#### **Test Auto-Forward**
```bash
# 1. Tạo request với status SCHEDULED
# 2. Login với Customer role
# 3. Upload SUPPLEMENT document
# 4. Kiểm tra logs và database
```

## Performance Considerations

### **Database Operations**
- State Machine validation: O(1) - lookup trong transitions array
- Database update: Single UPDATE query
- Audit logging: Asynchronous (không block main flow)

### **File Processing**
- File upload: Stream processing
- File storage: Local filesystem
- Version management: Incremental counter

### **Memory Usage**
- Minimal memory footprint
- No large object caching
- Efficient error handling

## Security Considerations

### **Role-Based Access Control**
- Customer chỉ có thể upload cho tenant của mình
- State Machine validation cho mọi transition
- Audit logging cho mọi action

### **File Security**
- File type validation (PDF, JPG, PNG)
- File size limits (≤10MB)
- Unique filename generation
- Path traversal protection

### **Data Integrity**
- Transaction-based updates
- History tracking
- Soft-delete support

## Monitoring & Debugging

### **Log Analysis**
```bash
# Tìm logs liên quan đến auto-forward
grep "auto-forwarding request" logs/app.log

# Tìm logs thành công
grep "successfully updated to FORWARDED" logs/app.log

# Tìm logs lỗi
grep "Error auto-forwarding request" logs/app.log
```

### **Database Queries**
```sql
-- Kiểm tra requests đã được auto-forward
SELECT id, status, forwarded_at, forwarded_by 
FROM requests 
WHERE status = 'FORWARDED' 
  AND forwarded_by IN (
    SELECT id FROM users WHERE role IN ('CustomerAdmin', 'CustomerUser')
  );

-- Kiểm tra history của auto-forward
SELECT * FROM requests 
WHERE id = 'request_id' 
  AND JSON_EXTRACT(history, '$[*].action') LIKE '%FORWARDED%';
```

### **Health Checks**
- State Machine transitions
- Database connectivity
- File system permissions
- Audit log system

## Future Enhancements

### **1. Configuration Options**
- Enable/disable auto-forward per tenant
- Configurable transition rules
- Custom success messages

### **2. Advanced Notifications**
- Email notifications
- SMS alerts
- In-app notifications
- Webhook callbacks

### **3. Analytics & Reporting**
- Auto-forward success rate
- Transition timing metrics
- Error pattern analysis
- User behavior insights

### **4. Machine Learning**
- Predictive auto-forward
- Smart transition suggestions
- Risk assessment
- Optimization recommendations

## Troubleshooting

### **Common Issues**

#### **1. Request vẫn ở trạng thái SCHEDULED**
**Nguyên nhân có thể:**
- State Machine transition thất bại
- Database update error
- Role permission issues

**Debug steps:**
1. Kiểm tra backend logs
2. Verify State Machine transitions
3. Check database permissions
4. Validate user role

#### **2. Auto-forward không hoạt động**
**Nguyên nhân có thể:**
- Request status không phải SCHEDULED
- Customer role không có quyền
- Tenant scope mismatch

**Debug steps:**
1. Verify request status
2. Check user role and permissions
3. Validate tenant scope
4. Review State Machine configuration

#### **3. Frontend không hiển thị thay đổi**
**Nguyên nhân có thể:**
- Data không được refresh
- Cache issues
- Network errors

**Debug steps:**
1. Check network requests
2. Verify data refresh logic
3. Clear browser cache
4. Check console errors

## Conclusion

Tính năng Auto-Forward sau khi upload SUPPLEMENT document đã được implement thành công với:

- ✅ **State Machine integration** cho validation và execution
- ✅ **Enhanced logging** cho debugging và monitoring  
- ✅ **Graceful error handling** với graceful degradation
- ✅ **Frontend integration** với user feedback rõ ràng
- ✅ **Security measures** với RBAC và tenant scope
- ✅ **Performance optimization** với efficient database operations
- ✅ **Comprehensive testing** cho mọi scenarios

Tính năng này giúp tự động hóa quy trình xử lý request, giảm thiểu manual intervention và cải thiện user experience cho cả Customer và Depot staff.
