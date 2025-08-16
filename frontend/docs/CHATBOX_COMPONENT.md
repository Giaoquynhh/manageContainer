# ChatBox Component Documentation

## Tổng quan
ChatBox component được sử dụng để hiển thị chat room cho từng đơn hàng, cho phép khách hàng và nhân viên kho trao đổi thông tin về đơn hàng.

## Components

### 1. SimpleChatBox.tsx
Component chính để hiển thị chat interface.

#### Props
```typescript
interface SimpleChatBoxProps {
  requestId: string;           // ID của đơn hàng
  requestStatus?: string;      // Trạng thái đơn hàng
  rejectedReason?: string;     // Lý do từ chối (nếu có)
  requestType?: string;        // Loại đơn hàng (Import/Export)
  containerNo?: string;        // Số container
  onClose: () => void;         // Callback khi đóng chat
}
```

#### Features
- **Real-time messaging**: Gửi và nhận tin nhắn real-time
- **Status integration**: Hiển thị trạng thái đơn hàng trong chat
- **Chat restrictions**: Chỉ cho phép chat khi đơn hàng đã được chấp nhận
- **System messages**: Hiển thị thông báo hệ thống
- **Welcome message**: Hiển thị thông tin đơn hàng khi mở chat
- **Auto-scroll**: Tự động cuộn xuống tin nhắn mới
- **Responsive design**: Giao diện responsive

#### Status Messages
Component tự động hiển thị thông báo trạng thái:

| Trạng thái | Message | Icon |
|------------|---------|------|
| PENDING | 📋 Đơn hàng đã được tạo và đang chờ xử lý | 📋 |
| RECEIVED | ✅ Đơn hàng đã được tiếp nhận và đang xử lý | ✅ |
| IN_PROGRESS | 🔄 Đơn hàng đang được xử lý tại kho | 🔄 |
| COMPLETED | ✅ Đơn hàng đã hoàn tất | ✅ |
| EXPORTED | 📦 Đơn hàng đã xuất kho | 📦 |
| REJECTED | ❌ Đơn hàng bị từ chối: [lý do] | ❌ |
| CANCELLED | ❌ Đơn hàng đã bị hủy | ❌ |
| IN_YARD | 🏭 Container đã vào kho | 🏭 |
| LEFT_YARD | 🚛 Container đã rời kho | 🚛 |

#### Chat Restrictions
- **Cho phép chat**: `APPROVED`, `IN_PROGRESS`, `COMPLETED`, `EXPORTED`
- **Không cho phép chat**: `PENDING`, `REJECTED`, `CANCELLED`

#### UI Elements
- **Header**: Tiêu đề chat với nút đóng
- **Messages area**: Khu vực hiển thị tin nhắn
- **Input area**: Ô nhập tin nhắn và nút gửi
- **Warning banner**: Hiển thị khi chat không khả dụng
- **System messages**: Tin nhắn hệ thống với icon và styling riêng

### 2. RequestTable.tsx Integration
RequestTable component tích hợp ChatBox:

#### Chat Button
- Hiển thị nút "💬 Chat" trong cột Chat
- Click để mở SimpleChatBox modal
- Truyền đầy đủ thông tin đơn hàng vào ChatBox

#### Props Passing
```typescript
<SimpleChatBox
  requestId={selectedRequestId}
  requestStatus={data?.find((r: any) => r.id === selectedRequestId)?.status}
  rejectedReason={data?.find((r: any) => r.id === selectedRequestId)?.rejected_reason}
  requestType={data?.find((r: any) => r.id === selectedRequestId)?.type}
  containerNo={data?.find((r: any) => r.id === selectedRequestId)?.container_no}
  onClose={closeChatBox}
/>
```

## API Integration

### Backend Endpoints
- `GET /chat/request/:request_id` - Lấy hoặc tạo chat room
- `GET /chat/:chat_room_id/messages` - Lấy danh sách tin nhắn
- `POST /chat/:chat_room_id/messages` - Gửi tin nhắn

### WebSocket Events
- `new_message` - Nhận tin nhắn mới
- `system_message` - Nhận system message

## Styling

### CSS Classes
- `.chat-modal` - Modal container
- `.chat-header` - Header với tiêu đề và nút đóng
- `.chat-messages` - Khu vực tin nhắn
- `.chat-input` - Khu vực nhập tin nhắn
- `.system-message` - Tin nhắn hệ thống
- `.user-message` - Tin nhắn người dùng
- `.warning-banner` - Banner cảnh báo

### Responsive Design
- Mobile-first approach
- Flexible layout với max-width
- Auto-scroll cho tin nhắn dài
- Touch-friendly buttons

## Error Handling

### Network Errors
- Hiển thị thông báo lỗi khi không kết nối được server
- Fallback messages khi API calls fail
- Retry mechanism cho failed requests

### Validation
- Kiểm tra quyền truy cập chat room
- Validate tin nhắn trước khi gửi
- Disable input khi không có quyền chat

## Performance

### Optimization
- Lazy loading cho tin nhắn cũ
- Pagination cho tin nhắn (20 tin nhắn/lần)
- Debounced input để tránh spam
- Memoized components để tránh re-render

### Memory Management
- Cleanup WebSocket connections
- Clear intervals và timeouts
- Unmount cleanup trong useEffect

## Testing

### Unit Tests
- Test props validation
- Test status message generation
- Test chat restrictions logic
- Test error handling

### Integration Tests
- Test API integration
- Test WebSocket events
- Test UI interactions
- Test responsive behavior

## Future Enhancements

### Planned Features
- File upload trong chat
- Emoji picker
- Message reactions
- Typing indicators
- Message search
- Chat history export

### Technical Improvements
- WebSocket reconnection logic
- Message encryption
- Push notifications
- Offline message queue
- Message threading


