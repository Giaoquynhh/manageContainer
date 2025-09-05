# Toast Notifications System

## Tổng quan

Hệ thống Toast Notifications được thiết kế để thay thế các thông báo `alert()` cơ bản của browser bằng các thông báo hiện đại, đẹp mắt hiển thị ở góc phải màn hình.

## Tính năng

- ✅ **Vị trí**: Hiển thị ở góc phải màn hình
- ✅ **Animation**: Slide-in mượt mà từ bên phải
- ✅ **Auto-close**: Tự động đóng sau thời gian nhất định
- ✅ **Manual close**: Có thể đóng thủ công bằng nút X
- ✅ **Responsive**: Tối ưu cho cả desktop và mobile
- ✅ **4 loại**: Success, Error, Warning, Info
- ✅ **Icon & Color**: Mỗi loại có icon và màu sắc riêng
- ✅ **Stack**: Có thể hiển thị nhiều toast cùng lúc
- ✅ **Customizable**: Có thể tùy chỉnh thời gian hiển thị

## Cách sử dụng

### 1. Import hook useToast

```typescript
import { useToast } from '../hooks/useToast';
```

### 2. Sử dụng trong component

```typescript
function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo, ToastContainer } = useToast();

  const handleAction = () => {
    // Hiển thị toast thành công
    showSuccess(
      '✅ Thành công!',
      'Đã thực hiện thành công hành động',
      5000 // 5 giây
    );
  };

  return (
    <div>
      {/* Nội dung component */}
      <button onClick={handleAction}>Thực hiện</button>
      
      {/* Bắt buộc phải thêm ToastContainer */}
      <ToastContainer />
    </div>
  );
}
```

### 3. Các loại toast

```typescript
// Success - Màu xanh lá
showSuccess('Tiêu đề', 'Nội dung', 5000);

// Error - Màu đỏ
showError('Tiêu đề', 'Nội dung', 5000);

// Warning - Màu vàng
showWarning('Tiêu đề', 'Nội dung', 5000);

// Info - Màu xanh dương
showInfo('Tiêu đề', 'Nội dung', 5000);
```

## API Reference

### useToast Hook

```typescript
interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // milliseconds, default: 5000
}

const {
  addToast,        // Thêm toast tùy chỉnh
  removeToast,     // Xóa toast theo ID
  showSuccess,     // Hiển thị success toast
  showError,       // Hiển thị error toast
  showWarning,     // Hiển thị warning toast
  showInfo,        // Hiển thị info toast
  ToastContainer   // Component container (bắt buộc)
} = useToast();
```

### ToastNotification Component

```typescript
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}
```

## Styling

### CSS Classes

```css
.toast-container          /* Container chứa tất cả toast */
.toast-notification       /* Toast notification */
.toast-success           /* Success toast */
.toast-error             /* Error toast */
.toast-warning           /* Warning toast */
.toast-info              /* Info toast */
.toast-visible           /* Animation hiện */
.toast-leaving           /* Animation ẩn */
.toast-content           /* Nội dung toast */
.toast-icon              /* Icon toast */
.toast-text              /* Text content */
.toast-title             /* Tiêu đề */
.toast-message           /* Nội dung */
.toast-close             /* Nút đóng */
```

### Customization

Bạn có thể tùy chỉnh màu sắc và style trong file `styles/gate.css`:

```css
/* Thay đổi màu success */
.toast-success::before {
  background: linear-gradient(90deg, #your-color-1, #your-color-2);
}

.toast-success {
  border-left: 4px solid #your-color;
}
```

## Responsive Design

### Desktop
- Vị trí: Góc phải màn hình
- Kích thước: 320px - 400px width
- Animation: Slide từ phải sang trái

### Mobile
- Vị trí: Toàn bộ chiều rộng màn hình
- Padding: 12px từ các cạnh
- Font size: Nhỏ hơn cho phù hợp

## Best Practices

### 1. Luôn thêm ToastContainer
```typescript
// ✅ Đúng
return (
  <div>
    <MyContent />
    <ToastContainer />
  </div>
);

// ❌ Sai - Không có ToastContainer
return <MyContent />;
```

### 2. Sử dụng duration phù hợp
```typescript
// ✅ Thông báo quan trọng - hiển thị lâu hơn
showSuccess('Thành công', 'Đã lưu dữ liệu', 6000);

// ✅ Thông báo thông thường - thời gian mặc định
showInfo('Thông tin', 'Đang xử lý...');
```

### 3. Title ngắn gọn, message chi tiết
```typescript
// ✅ Tốt
showSuccess(
  '✅ Đã lưu',
  'Dữ liệu đã được lưu thành công vào cơ sở dữ liệu'
);

// ❌ Không tốt
showSuccess(
  'Dữ liệu đã được lưu thành công vào cơ sở dữ liệu và đồng bộ với các hệ thống khác',
  'OK'
);
```

### 4. Sử dụng emoji trong title
```typescript
// ✅ Tốt - Dễ nhận biết
showSuccess('✅ Thành công', 'Đã hoàn thành');
showError('❌ Lỗi', 'Có lỗi xảy ra');
showWarning('⚠️ Cảnh báo', 'Chú ý');
showInfo('ℹ️ Thông tin', 'Đang xử lý');
```

## Migration từ Alert

### Trước (Alert)
```typescript
alert('Đã lưu thành công');
alert('Lỗi: ' + error.message);
```

### Sau (Toast)
```typescript
showSuccess('✅ Đã lưu thành công');
showError('❌ Lỗi', error.message);
```

## Troubleshooting

### Toast không hiển thị
1. Kiểm tra đã thêm `<ToastContainer />` chưa
2. Kiểm tra import `useToast` đúng chưa
3. Kiểm tra console có lỗi không

### Toast hiển thị sai vị trí
1. Kiểm tra CSS có bị conflict không
2. Kiểm tra z-index có đủ cao không (9999)

### Animation không mượt
1. Kiểm tra CSS transition có đúng không
2. Kiểm tra browser có hỗ trợ CSS3 không

## Demo

Xem file `pages/ToastDemo.tsx` để test các tính năng của toast notifications.
