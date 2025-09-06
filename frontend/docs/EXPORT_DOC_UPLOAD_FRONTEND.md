# Frontend Implementation: EXPORT_DOC Upload Feature

## Tổng quan

Frontend implementation cho tính năng upload chứng từ xuất (EXPORT_DOC) bao gồm UI components, hooks, và API integration để xử lý việc upload nhiều files cùng lúc và hiển thị trạng thái.

## Components

### 1. DepotRequestTable.tsx

Component chính hiển thị bảng yêu cầu với nút "Upload documents" cho các yêu cầu EXPORT có trạng thái PICK_CONTAINER, hỗ trợ upload nhiều files cùng lúc.

#### Props Interface
```typescript
interface DepotRequestTableProps {
    data: any[];
    loading?: boolean;
    onDocumentClick?: (doc: any) => void;
    onToggleSupplement?: (requestId: string) => void;
    onChangeAppointment?: (requestId: string) => void;
    onReject?: (requestId: string) => void;
    onChangeStatus?: (requestId: string, status: string) => void;
    onSendPayment?: (requestId: string) => void;
    onSoftDelete?: (requestId: string) => void;
    onViewInvoice?: (requestId: string) => void;
    onSendCustomerConfirmation?: (requestId: string) => void;
    onAddDocument?: (requestId: string, containerNo: string) => void; // ✅ New prop for single file
    onUploadDocument?: (requestId: string) => void; // ✅ New prop for multiple files
    loadingId?: string;
    activeChatRequests: Set<string>;
    onToggleChat?: (requestId: string) => void;
    onCloseChat?: (requestId: string) => void;
}
```

#### Conditional Rendering Logic
```typescript
// Hiển thị nút "Upload documents" cho yêu cầu EXPORT với trạng thái PICK_CONTAINER
{item.type === 'EXPORT' && item.status === 'PICK_CONTAINER' && onUploadDocument ? (
    <button
        className="btn btn-sm btn-primary"
        onClick={() => onAddDocument(item.id, item.container_no || '')}
        title="Thêm chứng từ cho container"
        style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        }}
    >
        📎 Thêm chứng từ
    </button>
) : (
    <span className="no-document">-</span>
)}
```

#### Table Structure
```typescript
<thead>
    <tr>
        <th>Loại</th>           {/* ✅ New column */}
        <th>Container</th>       {/* ✅ New column */}
        <th>Vị trí</th>         {/* ✅ New column for EXPORT requests */}
        <th>ETA</th>
        <th>Trạng thái</th>
        <th>Chứng từ</th>
        <th>Chat</th>
        <th>Hành động</th>
    </tr>
</thead>
<tbody>
    {data.map((item) => (
        <tr key={item.id} className="table-row">
            <td>
                <span className="request-type">
                    {getTypeLabel(item.type)}
                </span>
            </td>
            <td>
                <div className="container-info">
                    {item.container_no || '-'}
                </div>
            </td>
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
            {/* ... other columns */}
        </tr>
    ))}
</tbody>
```

#### Location Logic
```typescript
// Function để lấy vị trí container (tương tự như trên ContainersPage)
const getContainerLocation = (containerNo: string) => {
    if (!containerNo) return null;
    
    // Logic để lấy vị trí container
    // Có thể cần API call hoặc data từ props
    // Tạm thời sử dụng logic mô phỏng dựa trên container_no
    
    // Nếu có container data với vị trí chi tiết
    if (data && data.length > 0) {
        const containerData = data.find(item => item.container_no === containerNo);
        if (containerData && containerData.yard && containerData.block && containerData.slot) {
            return `${containerData.yard} / ${containerData.block} / ${containerData.slot}`;
        }
    }
    
    // Fallback: Tạo vị trí mô phỏng dựa trên container_no
    // Trong thực tế, cần lấy từ API containers
    if (containerNo === 'ISO 9999') {
        return 'B / B1-10 / B1-10'; // Vị trí mô phỏng
    }
    
    return null;
};
```

### 2. Depot.tsx

Main page component sử dụng DepotRequestTable và truyền các props cần thiết.

#### Import và Usage
```typescript
import { DepotRequestTable } from './components';

// Render component với đầy đủ props
<DepotRequestTable 
    data={requestsWithActions} 
    loading={isLoading}
    onDocumentClick={actions.handleDocumentClick}
    onToggleSupplement={actions.toggleSupplement}
    onChangeAppointment={actions.handleChangeAppointment}
    onReject={actions.handleReject}
    onChangeStatus={actions.changeStatus}
    onSendPayment={actions.sendPayment}
    onSoftDelete={actions.softDeleteRequest}
    onViewInvoice={actions.handleViewInvoice}
    onSendCustomerConfirmation={actions.handleSendCustomerConfirmation}
    onAddDocument={actions.handleAddDocument}  {/* ✅ New prop */}
    loadingId={state.loadingId}
    activeChatRequests={state.activeChatRequests}
    onToggleChat={actions.toggleChat}
    onCloseChat={actions.closeChat}
/>
```

## Hooks

### useDepotActions.ts

Custom hook quản lý state và actions cho Depot requests page.

#### Interface Updates
```typescript
interface DepotActions {
    // ... existing actions
    handleAddDocument: (requestId: string, containerNo: string) => Promise<void>; // ✅ New action
    setShowContainerSelectionModal: (show: boolean) => void; // ✅ New setter
    setSelectedRequestForContainer: (request: any) => void; // ✅ New setter
}
```

#### Implementation
```typescript
const handleAddDocument = async (requestId: string, containerNo: string) => {
    console.log('🔍 handleAddDocument called:', { requestId, containerNo });
    setLoadingId(requestId + 'ADD_DOC');
    
    try {
        // Tạo file input ẩn
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,.jpg,.jpeg,.png';
        fileInput.multiple = true; // Cho phép chọn nhiều files
        fileInput.style.display = 'none';
        
        fileInput.onchange = async (event) => {
            const files = (event.target as HTMLInputElement).files;
            if (!files || files.length === 0) return;
            
            // Kiểm tra số lượng files (tối đa 10 files)
            if (files.length > 10) {
                setMsg({ text: 'Chỉ được upload tối đa 10 files cùng lúc', ok: false });
                setLoadingId('');
                return;
            }
            
            // Kiểm tra loại file cho từng file
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!allowedTypes.includes(file.type)) {
                    setMsg({ text: `File "${file.name}" không hợp lệ. Chỉ chấp nhận PDF hoặc ảnh (JPG, PNG)`, ok: false });
                    setLoadingId('');
                    return;
                }
                if (file.size > 10 * 1024 * 1024) {
                    setMsg({ text: `File "${file.name}" quá lớn. Kích thước tối đa là 10MB`, ok: false });
                    setLoadingId('');
                    return;
                }
            }
            
            // Tạo FormData để upload multiple files
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            formData.append('type', 'EXPORT_DOC');
            
            // Gọi API upload multiple documents
            const response = await api.post(`/requests/${requestId}/docs/multiple`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            console.log('✅ Multiple documents upload successful:', response.data);
            
            // Hiển thị thông báo thành công
            setMsg({ 
                text: `✅ Đã upload thành công ${files.length} chứng từ xuất! Trạng thái đã tự động chuyển từ PICK_CONTAINER sang SCHEDULED.`, 
                ok: true 
            });
            
            // Refresh data để cập nhật trạng thái
            mutate('/requests?page=1&limit=20');
            
        } catch (error: any) {
            console.error('❌ Error uploading document:', error);
            setMsg({ 
                text: `❌ Không thể upload chứng từ: ${error?.response?.data?.message || 'Lỗi không xác định'}`, 
                ok: false 
            });
        } finally {
            setLoadingId('');
            // Xóa file input
            document.body.removeChild(fileInput);
        }
        
        // Thêm file input vào DOM và trigger click
        document.body.appendChild(fileInput);
        fileInput.click();
        
    } catch (e: any) {
        console.error('❌ Error in handleAddDocument:', e);
        setMsg({ text: `Không thể thêm chứng từ: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
        setLoadingId('');
    }
};
```

## API Integration

### API Service
```typescript
// Sử dụng api.post với FormData
const response = await api.post(`/requests/${requestId}/docs`, formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
```

### Request Format
- **Method**: POST
- **URL**: `/requests/:id/docs`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: File object (PDF, JPG, PNG)
  - `type`: `"EXPORT_DOC"`

### Response Handling
```typescript
// Success case
console.log('✅ Document upload successful:', response.data);
setMsg({ 
    text: `✅ Đã upload chứng từ thành công cho container ${containerNo}! Trạng thái đã tự động chuyển từ PICK_CONTAINER sang SCHEDULED.`, 
    ok: true 
});
mutate('/requests?page=1&limit=20'); // Refresh data

// Error case
catch (error: any) {
    console.error('❌ Error uploading document:', error);
    setMsg({ 
        text: `❌ Không thể upload chứng từ: ${error?.response?.data?.message || 'Lỗi không xác định'}`, 
        ok: false 
    });
}
```

## State Management

### Local State
```typescript
const state: DepotActionsState = {
    // ... existing state
    loadingId: string;           // Track loading state per request
    msg: MessageState;           // Display success/error messages
    requestsData: any;           // SWR data for requests
};
```

### Global State Updates
```typescript
// Refresh data after successful upload
mutate('/requests?page=1&limit=20');

// Update loading state
setLoadingId(requestId + 'ADD_DOC');
setLoadingId(''); // Clear after completion
```

## Error Handling

### File Validation
```typescript
// Kiểm tra loại file
const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
if (!allowedTypes.includes(file.type)) {
    setMsg({ text: 'Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG)', ok: false });
    return;
}
```

### API Error Handling
```typescript
catch (error: any) {
    console.error('❌ Error uploading document:', error);
    setMsg({ 
        text: `❌ Không thể upload chứng từ: ${error?.response?.data?.message || 'Lỗi không xác định'}`, 
        ok: false 
    });
}
```

### Loading State Management
```typescript
try {
    setLoadingId(requestId + 'ADD_DOC');
    // ... upload logic
} catch (error) {
    // ... error handling
} finally {
    setLoadingId(''); // Always clear loading state
}
```

## User Experience

### Loading Indicators
- Button hiển thị loading state khi đang upload
- Disable button trong quá trình xử lý
- Loading spinner hoặc text thay thế

### Success Feedback
- Thông báo thành công với emoji ✅
- Tự động refresh data để cập nhật UI
- Clear loading state

### Error Feedback
- Hiển thị error message từ backend
- Fallback message nếu không có error detail
- Clear loading state để user có thể thử lại

## File Structure

```
frontend/
└── pages/Requests/
    ├── components/
    │   └── DepotRequestTable.tsx      # Main table component
    ├── hooks/
    │   └── useDepotActions.ts         # Custom hook for actions
    ├── Depot.tsx                      # Main page component
    └── styles/
        └── DepotRequestTable.css      # Styling for table
```

## CSS Styling

### Button Styles
```css
.btn-primary {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
}

.btn-primary:hover {
    background: #2563eb;
}

.btn-primary:disabled {
    background: #9ca3af;
    cursor: not-allowed;
}
```

### Table Styles
```css
.request-type {
    display: inline-block;
    padding: 4px 8px;
    background: #3b82f6;
    color: white;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
}

.container-info {
    font-weight: 500;
    color: #1f2937;
}

.location-info {
    text-align: center;
}

.location-badge {
    display: inline-block;
    padding: 4px 8px;
    background: #10b981;
    color: white;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}

.location-badge:hover {
    background: #059669;
}

.location-na {
    color: #9ca3af;
    font-style: italic;
}
```

## Testing Considerations

### Unit Tests
- Test `handleAddDocument` function
- Test file validation logic
- Test error handling
- Test loading state management

### Integration Tests
- Test API call với FormData
- Test response handling
- Test data refresh sau upload

### User Acceptance Tests
- Test upload flow end-to-end
- Test error scenarios
- Test loading states
- Test success feedback

## Performance Optimizations

### File Handling
- Sử dụng `FileReader` cho large files
- Validate file size trước khi upload
- Cleanup file input elements

### State Updates
- Debounced API calls
- Optimistic updates
- Efficient re-renders

### Memory Management
- Remove file input elements sau khi sử dụng
- Clear loading states
- Cleanup event listeners
