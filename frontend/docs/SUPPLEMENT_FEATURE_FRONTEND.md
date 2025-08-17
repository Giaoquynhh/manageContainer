# Tính năng Bổ sung thông tin - Frontend Implementation

## Tổng quan

Frontend implementation cho tính năng "Bổ sung thông tin & Hành động của Depot" đã được hoàn thành. Tính năng này cung cấp giao diện cho Customer upload tài liệu bổ sung và Depot xem xét, chuyển tiếp hoặc từ chối yêu cầu.

## Components đã tạo

### 1. UploadSupplementModal
**File:** `components/UploadSupplementModal.tsx`

Component modal cho Customer upload tài liệu bổ sung.

#### Features:
- **Drag & Drop:** Hỗ trợ kéo thả file
- **File Selection:** Click để chọn file từ máy
- **Validation:** 
  - File type: PDF, JPG, PNG
  - File size: ≤ 10MB
- **Upload Progress:** Loading state và error handling
- **Success Feedback:** Thông báo thành công

#### Props:
```typescript
interface UploadSupplementModalProps {
  requestId: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

#### Usage:
```tsx
<UploadSupplementModal
  requestId="request-id"
  visible={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={handleSuccess}
/>
```

### 2. SupplementDocuments
**File:** `components/SupplementDocuments.tsx`

Component hiển thị danh sách tài liệu bổ sung cho Depot.

#### Features:
- **File List:** Hiển thị danh sách file đã upload
- **File Icons:** Icon khác nhau cho PDF, ảnh
- **File Info:** Tên, size, version, upload date
- **Download:** Tải xuống file
- **Loading States:** Loading và error handling
- **Empty State:** Hiển thị khi chưa có file

#### Props:
```typescript
interface SupplementDocumentsProps {
  requestId: string;
  onDocumentAction?: () => void;
}
```

#### Usage:
```tsx
<SupplementDocuments
  requestId="request-id"
  onDocumentAction={handleRefresh}
/>
```

## Pages đã cập nhật

### 1. Customer Page
**File:** `pages/Requests/Customer.tsx`

#### Thay đổi:
- Thêm import `UploadSupplementModal`
- Thêm state `showSupplementModal`
- Thêm functions:
  - `handleOpenSupplementModal(requestId)`
  - `handleSupplementSuccess()`
- Truyền `handleOpenSupplementModal` vào RequestTable actions

#### Features:
- Nút "Bổ sung thông tin" hiển thị khi status = SCHEDULED
- Modal upload với validation
- Success message sau khi upload

### 2. Depot Page
**File:** `pages/Requests/Depot.tsx`

#### Thay đổi:
- Thêm import `SupplementDocuments`
- Thêm state `activeSupplementRequests`
- Thêm functions:
  - `toggleSupplement(requestId)`
  - `handleForward(requestId)`
  - `handleReject(requestId)`
- Thêm actions cho status SCHEDULED
- Thêm SupplementDocuments modal windows

#### Features:
- Nút "Tài liệu bổ sung" - mở modal xem file
- Nút "Chuyển tiếp" - chuyển sang FORWARDED
- Nút "Từ chối" - từ chối với lý do
- Modal hiển thị danh sách file bổ sung

### 3. RequestTable Component
**File:** `components/RequestTable.tsx`

#### Thay đổi:
- Cập nhật interface để hỗ trợ `handleOpenSupplementModal`
- Thêm nút "Bổ sung thông tin" cho status SCHEDULED (Customer only)

#### Features:
- Conditional rendering theo user role
- Integration với Customer page actions

## API Integration

### 1. Upload Supplement Document
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'SUPPLEMENT');

await api.post(`/requests/${requestId}/docs`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

### 2. List Supplement Documents
```typescript
const response = await api.get(`/requests/${requestId}/docs?type=SUPPLEMENT`);
const documents = response.data.data || [];
```

### 3. Forward Request
```typescript
await api.patch(`/requests/${requestId}/status`, { 
  status: 'FORWARDED' 
});
```

### 4. Reject Request
```typescript
await api.patch(`/requests/${requestId}/reject`, { 
  reason: 'Lý do từ chối' 
});
```

## State Management

### Customer Page States:
```typescript
const [showSupplementModal, setShowSupplementModal] = useState(false);
const [selectedRequestId, setSelectedRequestId] = useState<string>('');
```

### Depot Page States:
```typescript
const [activeSupplementRequests, setActiveSupplementRequests] = useState<Set<string>>(new Set());
const [loadingId, setLoadingId] = useState<string>('');
```

## UI/UX Features

### Customer Experience:
1. **Nút "Bổ sung thông tin":** Hiển thị khi status = SCHEDULED
2. **Modal Upload:** 
   - Drag & drop area
   - File validation real-time
   - Progress indicator
   - Success/error messages
3. **Responsive Design:** Hoạt động tốt trên mobile

### Depot Experience:
1. **Nút "Tài liệu bổ sung":** Mở modal xem danh sách file
2. **Modal Documents:**
   - File list với icons
   - Download functionality
   - File information
3. **Action Buttons:**
   - "Chuyển tiếp" - chuyển sang FORWARDED
   - "Từ chối" - prompt nhập lý do
4. **Status Updates:** Real-time status changes

## Error Handling

### Upload Errors:
- File type validation
- File size validation
- Network errors
- Server errors

### Display Errors:
- Loading states
- Empty states
- Network failures
- Permission errors

## Responsive Design

### Mobile Optimization:
- Touch-friendly buttons
- Swipe gestures
- Optimized modal sizes
- Readable text sizes

### Desktop Features:
- Hover effects
- Keyboard navigation
- Drag & drop
- Multi-select (future)

## Performance Considerations

### File Upload:
- Client-side validation
- Progress indicators
- Chunked uploads (future)
- Compression (future)

### Data Loading:
- Lazy loading
- Caching
- Optimistic updates
- Error boundaries

## Testing Scenarios

### Customer Flow:
1. Tạo request → PENDING
2. Depot tiếp nhận → SCHEDULED
3. Customer thấy nút "Bổ sung thông tin"
4. Upload file → Success
5. Depot thấy file trong modal

### Depot Flow:
1. Xem request SCHEDULED
2. Click "Tài liệu bổ sung" → mở modal
3. Xem danh sách file
4. Click "Chuyển tiếp" → FORWARDED
5. Hoặc click "Từ chối" → nhập lý do

## Future Enhancements

### UI/UX:
1. **File Preview:** Preview PDF/ảnh trong modal
2. **Bulk Actions:** Upload nhiều file cùng lúc
3. **Progress Bar:** Upload progress chi tiết
4. **Notifications:** Toast messages
5. **Animations:** Smooth transitions

### Features:
1. **File Versioning:** Xem lịch sử versions
2. **Comments:** Thêm ghi chú cho file
3. **Approval Workflow:** Multi-step approval
4. **Templates:** Pre-defined document types
5. **Integration:** Connect với external systems

## Files Modified

### New Files:
1. `components/UploadSupplementModal.tsx` - Upload modal
2. `components/SupplementDocuments.tsx` - Documents display
3. `frontend/docs/SUPPLEMENT_FEATURE_FRONTEND.md` - This documentation

### Modified Files:
1. `pages/Requests/Customer.tsx` - Customer integration
2. `pages/Requests/Depot.tsx` - Depot integration
3. `components/RequestTable.tsx` - Action buttons
4. `components/index.ts` - Component exports

## Dependencies

### Required:
- `@services/api` - API calls
- `react` - Core React
- `swr` - Data fetching
- `tailwindcss` - Styling

### Optional:
- `react-dropzone` - Drag & drop (future)
- `react-pdf` - PDF preview (future)
- `react-image-crop` - Image editing (future)

## Browser Support

### Supported:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Features:
- File API
- FormData
- Fetch API
- ES6+ syntax
- CSS Grid/Flexbox
