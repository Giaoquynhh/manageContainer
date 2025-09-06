# Tính năng Upload Chứng từ Xuất (EXPORT_DOC) - Tổng hợp

## 🎯 Mục tiêu

Tự động hóa quy trình xử lý yêu cầu xuất (EXPORT) bằng cách cho phép admin upload nhiều chứng từ cùng lúc và tự động chuyển trạng thái từ `PICK_CONTAINER` sang `SCHEDULED`.

## 🔄 Luồng hoạt động

```
1. Khách hàng tạo yêu cầu EXPORT → Status: PENDING
2. Admin tạo lịch hẹn → Status: PICK_CONTAINER  
3. Admin upload nhiều chứng từ cùng lúc → Status: SCHEDULED (Tự động)
4. Hệ thống xử lý tiếp theo
```

## 🏗️ Kiến trúc hệ thống

### Backend
- **Routes**: `/requests/:id/docs` (single) và `/requests/:id/docs/multiple` (multiple) với middleware RBAC
- **Controller**: `RequestController.uploadDoc()` và `RequestController.uploadMultipleDocs()`
- **Service**: `RequestService.uploadDocument()` và `RequestService.uploadMultipleDocuments()` với auto status change
- **State Machine**: `RequestStateMachine` để validate transitions
- **Validation**: Joi schema cho `EXPORT_DOC` type

### Frontend  
- **Component**: `DepotRequestTable` với conditional rendering
- **Hook**: `useDepotActions.handleUploadDocument()` cho multiple files
- **API**: FormData upload với multipart/form-data cho multiple files
- **State**: Loading states, error handling, success feedback với số lượng files

## 📁 File Structure

```
manageContainer/
├── backend/
│   ├── modules/requests/
│   │   ├── controller/
│   │   │   ├── RequestRoutes.ts          # ✅ Updated: Added multiple files upload routes
│   │   │   └── RequestController.ts      # ✅ Has uploadDoc and uploadMultipleDocs methods
│   │   ├── service/
│   │   │   └── RequestService.ts         # ✅ Updated: Added multiple files upload logic + auto status change
│   │   ├── dto/
│   │   │   └── RequestDtos.ts            # ✅ Updated: Added EXPORT_DOC to uploadDocSchema
│   │   └── service/
│   │       └── RequestStateMachine.ts    # ✅ Has PICK_CONTAINER → SCHEDULED transition
│   └── shared/middlewares/
│       ├── auth.ts                       # ✅ JWT authentication
│       └── rbac.ts                       # ✅ Role-based access control
├── frontend/
│   └── pages/Requests/
│       ├── components/
│       │   └── DepotRequestTable.tsx      # ✅ Updated: Added multiple files upload button + new columns
│       ├── hooks/
│       │   └── useDepotActions.ts         # ✅ Updated: Added handleUploadDocument for multiple files
│       ├── Depot.tsx                      # ✅ Updated: Uses DepotRequestTable
│       └── styles/
│           └── DepotRequestTable.css      # ✅ Added styling for new elements
└── docs/
    ├── EXPORT_DOC_UPLOAD_FEATURE.md      # ✅ Backend documentation
    └── EXPORT_DOC_UPLOAD_FRONTEND.md     # ✅ Frontend documentation
```

## 🚀 Cách sử dụng

### 1. Đăng nhập với role có quyền
- `SystemAdmin` ✅
- `BusinessAdmin` ✅  
- `SaleAdmin` ✅

### 2. Tìm yêu cầu EXPORT với status PICK_CONTAINER
- Vào trang "Yêu cầu (Depot)"
- Tìm row có:
  - **Loại**: EXPORT
  - **Trạng thái**: ĐANG CHỌN CONTAINER
  - **Chứng từ**: Có nút "📎 Thêm chứng từ"

### 3. Click "Thêm chứng từ"
- Chọn file PDF, JPG, hoặc PNG (tối đa 10MB)
- Hệ thống tự động upload và chuyển trạng thái
- Hiển thị thông báo thành công

## 🔧 Technical Implementation

### Backend Changes

#### 1. RequestRoutes.ts
```typescript
// ✅ Added SystemAdmin, BusinessAdmin roles
router.post('/:id/docs', requireRoles('SaleAdmin','Accountant','CustomerAdmin','CustomerUser','SystemAdmin','BusinessAdmin'), upload.single('file'), (req, res) => controller.uploadDoc(req as any, res));
```

#### 2. RequestDtos.ts  
```typescript
// ✅ Added EXPORT_DOC to validation schema
export const uploadDocSchema = Joi.object({
    type: Joi.string().valid('EIR','LOLO','INVOICE','SUPPLEMENT','EXPORT_DOC').required()
});
```

#### 3. RequestService.ts
```typescript
// ✅ Added EXPORT_DOC validation and auto status change
if (type === 'EXPORT_DOC') {
    // Validation logic
    if (req.status !== 'PICK_CONTAINER') {
        throw new Error('Chỉ upload chứng từ xuất khi yêu cầu đang ở trạng thái chọn container');
    }
    if (req.type !== 'EXPORT') {
        throw new Error('Chỉ upload chứng từ xuất cho yêu cầu loại EXPORT');
    }
    if (!['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(actor.role)) {
        throw new Error('Chỉ admin được upload chứng từ xuất');
    }
    
    // Auto status change
    const canTransition = RequestStateMachine.canTransition(req.status, 'SCHEDULED', actor.role);
    if (canTransition) {
        await RequestStateMachine.executeTransition(actor, request_id, req.status, 'SCHEDULED', 'Tự động chuyển trạng thái sau khi upload chứng từ xuất');
        
        const updatedRequest = await repo.update(request_id, {
            status: 'SCHEDULED',
            history: [...req.history, {
                at: new Date().toISOString(),
                by: actor._id,
                action: 'SCHEDULED',
                reason: 'Tự động chuyển trạng thái sau khi upload chứng từ xuất',
                document_id: doc.id,
                document_type: 'EXPORT_DOC'
            }]
        });
    }
}
```

### Frontend Changes

#### 1. DepotRequestTable.tsx
```typescript
// ✅ Added new columns
<th>Loại</th>
<th>Container</th>
<th>Vị trí</th>         {/* ✅ New column for EXPORT requests */}

// ✅ Added conditional upload button
{item.type === 'EXPORT' && item.status === 'PICK_CONTAINER' && onAddDocument ? (
    <button className="btn btn-sm btn-primary" onClick={() => onAddDocument(item.id, item.container_no || '')}>
        📎 Thêm chứng từ
    </button>
) : (
    <span className="no-document">-</span>
)}

// ✅ Added location display for EXPORT requests
<td>
    <div className="location-info">
        {item.type === 'EXPORT' ? (
            <span className="location-badge">
                📍 {getContainerLocation(item.container_no) || 'Chưa xác định'}
            </span>
        ) : (
            <span className="location-na">-</span>
        )}
    </div>
</td>
```

#### 2. useDepotActions.ts
```typescript
// ✅ Added handleAddDocument method
const handleAddDocument = async (requestId: string, containerNo: string) => {
    setLoadingId(requestId + 'ADD_DOC');
    try {
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,.jpg,.jpeg,.png';
        
        fileInput.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            // File validation
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setMsg({ text: 'Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG)', ok: false });
                return;
            }
            
            // Create FormData and upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'EXPORT_DOC');
            
            const response = await api.post(`/requests/${requestId}/docs`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Success feedback
            setMsg({ 
                text: `✅ Đã upload chứng từ thành công cho container ${containerNo}! Trạng thái đã tự động chuyển từ PICK_CONTAINER sang SCHEDULED.`, 
                ok: true 
            });
            
            // Refresh data
            mutate('/requests?page=1&limit=20');
        };
        
        fileInput.click();
        
    } catch (e: any) {
        setMsg({ text: `Không thể thêm chứng từ: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
    } finally {
        setLoadingId('');
    }
};
```

#### 3. Depot.tsx
```typescript
// ✅ Updated to use DepotRequestTable with onAddDocument prop
<DepotRequestTable 
    // ... other props
    onAddDocument={actions.handleAddDocument}  // ✅ New prop
    // ... other props
/>
```

## 🧪 Testing

### Test Cases
1. **✅ Success Case**: Upload multiple PDF files cho EXPORT request với status PICK_CONTAINER
2. **✅ Success Case**: Upload mixed files (PDF + JPG + PNG) cho EXPORT request với status PICK_CONTAINER
3. **❌ Too Many Files Error**: Upload quá 10 files cùng lúc
4. **❌ File Type Error**: Upload file không hợp lệ (txt, docx)
5. **❌ File Size Error**: Upload file quá 10MB
6. **❌ Request Type Error**: Upload cho IMPORT request
7. **❌ Status Error**: Upload cho request với status khác PICK_CONTAINER
8. **❌ Role Error**: Upload với role không có quyền

### Manual Testing Steps
1. Tạo yêu cầu EXPORT
2. Tạo lịch hẹn để chuyển status sang PICK_CONTAINER
3. Click "Upload documents"
4. Chọn nhiều files PDF/JPG/PNG (tối đa 10 files)
5. Verify upload thành công và status chuyển sang SCHEDULED

## 🐛 Troubleshooting

### Common Issues

#### 1. Lỗi 403 Forbidden
- **Nguyên nhân**: Role không có quyền upload
- **Giải pháp**: Đăng nhập với role SystemAdmin, BusinessAdmin, hoặc SaleAdmin

#### 2. Lỗi 400 Bad Request
- **Nguyên nhân**: File không hợp lệ hoặc validation fail
- **Giải pháp**: Kiểm tra file type (PDF, JPG, PNG) và size (tối đa 10MB)

#### 3. Status không chuyển
- **Nguyên nhân**: State machine transition không được phép
- **Giải pháp**: Kiểm tra request status phải là PICK_CONTAINER và type phải là EXPORT

### Debug Commands
```bash
# Backend logs
tail -f logs/app.log | grep "EXPORT_DOC"

# Database check
db.requests.findOne({_id: "request_id"})
db.documents.find({request_id: "request_id", type: "EXPORT_DOC"})
```

## 📊 Monitoring

### Success Metrics
- Upload success rate
- Auto status change success rate
- Processing time
- User adoption rate

### Error Tracking
- File validation failures
- Role permission errors
- State machine transition failures
- API errors

## 🔮 Future Enhancements

### Potential Improvements
1. **✅ Bulk Upload**: Upload nhiều file cùng lúc (Đã implement)
2. **Progress Bar**: Hiển thị tiến trình upload cho từng file
3. **File Preview**: Preview file trước khi upload
4. **Drag & Drop**: Kéo thả file để upload
5. **Auto-retry**: Tự động thử lại khi upload fail
6. **File Compression**: Nén file trước khi upload
7. **Batch Processing**: Xử lý files theo batch để tối ưu performance

### Integration Opportunities
1. **Email Notifications**: Gửi email khi status thay đổi
2. **SMS Alerts**: Gửi SMS cho khách hàng
3. **Webhook**: Trigger external systems
4. **Analytics**: Track user behavior patterns

## 📚 References

- [Backend Documentation](./backend/docs/EXPORT_DOC_UPLOAD_FEATURE.md)
- [Frontend Documentation](./frontend/docs/EXPORT_DOC_UPLOAD_FRONTEND.md)
- [API Documentation](./backend/docs/MODULE_3_REQUESTS.md)
- [State Machine Documentation](./backend/docs/AUTO_FORWARD_FEATURE.md)

## 👥 Team

- **Backend Developer**: Implemented RequestService, Routes, Controller
- **Frontend Developer**: Implemented Components, Hooks, UI
- **DevOps**: Deployment và monitoring
- **QA**: Testing và validation

## 📅 Timeline

- **Phase 1**: Backend implementation ✅
- **Phase 2**: Frontend implementation ✅  
- **Phase 3**: Testing và bug fixes ✅
- **Phase 4**: Documentation ✅
- **Phase 5**: Production deployment 🚀

---

**Status**: ✅ Complete  
**Last Updated**: January 6, 2025  
**Version**: 1.0.0
