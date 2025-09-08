# Depot Page - Modular Structure

## 📁 Cấu trúc thư mục

```
pages/Requests/
├── Depot.tsx                    # Component chính
├── components/                  # Các components con
│   ├── DepotRequestTable.tsx    # Bảng hiển thị danh sách
│   ├── DocumentViewerModal.tsx  # Modal xem PDF/ảnh
│   └── index.ts                 # Export các components
├── hooks/                       # Custom hooks
│   └── useDepotActions.ts       # Hook quản lý state và actions
└── README.md                    # Tài liệu này
```

## 🧩 Các Module

### 1. **Depot.tsx** (Component chính)
- **Chức năng**: Component chính của trang Depot
- **Trách nhiệm**: 
  - Kết nối các components con
  - Quản lý data fetching với SWR
  - Render layout tổng thể

### 2. **DepotRequestTable.tsx** (Component bảng)
- **Chức năng**: Hiển thị danh sách yêu cầu dạng bảng
- **Props**:
  - `data`: Dữ liệu danh sách
  - `loading`: Trạng thái loading
  - `onDocumentClick`: Callback khi click vào chứng từ
  - `onToggleSupplement`: Callback mở/đóng supplement
  - `onForward`, `onReject`: Callbacks cho các actions
  - `onChangeStatus`, `onSendPayment`, `onSoftDelete`: Callbacks cho status changes
  - `loadingId`: ID của item đang loading

### 3. **DocumentViewerModal.tsx** (Component modal)
- **Chức năng**: Modal xem trực tiếp PDF và ảnh
- **Props**:
  - `document`: Thông tin file cần xem
  - `visible`: Trạng thái hiển thị
  - `onClose`: Callback đóng modal

### 4. **useDepotActions.ts** (Custom hook)
- **Chức năng**: Quản lý toàn bộ state và actions
- **Returns**: 
  - `state`: Tất cả state (search, filters, modals, etc.)
  - `actions`: Tất cả actions (API calls, state setters)

### 5. Customer + RequestForm (Tạo request và xem trước tài liệu)
- `pages/Requests/Customer.tsx`: cấu hình `Modal` tạo yêu cầu, đã tăng `width` từ `500` → `900` để đủ không gian xem trước tài liệu.
- `components/RequestForm.tsx`: xử lý chọn file (PDF/JPG/PNG), validation, và hiển thị preview trực tiếp trong popup bằng `URL.createObjectURL`.
- Cách render:
  - Ảnh: `<img />`
  - PDF: `<iframe />`
  - Khác: chỉ hiển thị tên/kích thước

- UI hiện tại (đã cập nhật):
  - Không còn danh sách tên file riêng.
  - Chỉ hiển thị lưới preview nội dung file.
  - Mỗi thẻ preview có nút `✕` để xóa file đó.
  - Có nút "Xóa tất cả" phía trên khu vực preview.

### 6. Ánh xạ BE/FE cho documents
- FE rewrite: `frontend/next.config.js`
  - `source: '/backend/:path*'` → `destination: 'http://localhost:1000/:path*'`
- BE (public serve): `backend/main.ts`
  - `app.use('/requests/documents', documentRoutes);`
- FE truy cập file: `/backend/requests/documents/:storage_key`

## 🔄 Luồng dữ liệu

```
Depot.tsx
├── useDepotActions() → [state, actions]
├── useSWR() → data
├── Filter data → filteredData
├── Add actions → requestsWithActions
└── Render components:
    ├── DepotRequestTable (với props từ actions)
    ├── DocumentViewerModal (với state)
    └── Các modals khác
```

## 🎯 Lợi ích của cấu trúc mới

### ✅ **Dễ bảo trì**
- Mỗi component có trách nhiệm rõ ràng
- Logic tách biệt trong custom hook
- Dễ test từng component riêng lẻ

### ✅ **Tái sử dụng**
- `DocumentViewerModal` có thể dùng cho các trang khác
- `useDepotActions` có thể mở rộng cho các use cases khác

### ✅ **Performance**
- Chỉ re-render components cần thiết
- State management tập trung
- Memoization dễ dàng hơn

### ✅ **Type Safety**
- Interface rõ ràng cho mỗi component
- Props validation tự động
- IntelliSense tốt hơn

## 🚀 Cách sử dụng

### Import components:
```typescript
import { DepotRequestTable, DocumentViewerModal } from './components';
import { useDepotActions } from './hooks/useDepotActions';
```

### Sử dụng hook:
```typescript
const [state, actions] = useDepotActions();
```

### Truyền props:
```typescript
<DepotRequestTable
  data={requestsWithActions}
  loading={isLoading}
  onDocumentClick={actions.handleDocumentClick}
  // ... other props
/>
```

## 🔧 Mở rộng

### Thêm component mới:
1. Tạo file trong `components/`
2. Export trong `components/index.ts`
3. Import và sử dụng trong `Depot.tsx`

### Thêm action mới:
1. Thêm vào interface `DepotActions`
2. Implement trong `useDepotActions.ts`
3. Sử dụng trong components

### Thêm state mới:
1. Thêm vào interface `DepotActionsState`
2. Thêm state và setter trong `useDepotActions.ts`
3. Sử dụng trong components
