# Chat Mini System Documentation

## 🎯 Tổng quan

Hệ thống **Chat Mini** là một giao diện chat hiện đại, dễ sử dụng được thiết kế để thay thế giao diện chat thô sơ hiện tại. System này cung cấp trải nghiệm người dùng tốt hơn với khả năng di chuyển, thu nhỏ và thiết kế responsive.

## 🆕 **Depot Chat System (Mới)**

### **Tổng quan Depot Chat**
Hệ thống chat mới được thiết kế đặc biệt cho **Depot Staff** để giao tiếp với **Customer** về các đơn hàng container. Chat được kích hoạt khi đơn hàng ở trạng thái `SCHEDULED` trở lên.

### **Components Depot Chat**

```
components/chat/
├── DepotChatWindow.tsx         # Main chat window với API integration
├── DepotChatMini.tsx           # Chat trigger và window management
└── DepotChatDemo.tsx           # Demo version cho testing
```

### **Depot Chat Features**
- ✅ **Status-based Activation:** Chat chỉ hoạt động khi request status ≥ SCHEDULED
- ✅ **Real-time API Integration:** Kết nối với backend chat system
- ✅ **Message Polling:** Tự động cập nhật tin nhắn mới mỗi 3 giây
- ✅ **Draggable Interface:** Cửa sổ chat có thể di chuyển tự do
- ✅ **Minimize/Restore:** Khả năng thu nhỏ và khôi phục chat window
- ✅ **Fallback Demo Mode:** Hoạt động offline khi backend không khả dụng
- ✅ **🆕 Supplement Notification:** Tự động thông báo khi khách hàng bổ sung thông tin

### **Status Requirements**
```typescript
const isChatAllowed = requestStatus === 'SCHEDULED' || 
                     requestStatus === 'APPROVED' || 
                     requestStatus === 'IN_PROGRESS' || 
                     requestStatus === 'COMPLETED' || 
                     requestStatus === 'EXPORTED';
```

### **API Endpoints Used**
- `GET /chat/request/${requestId}` - Khởi tạo hoặc lấy chat room
- `GET /chat/${chatRoomId}/messages` - Lấy danh sách tin nhắn
- `POST /chat/${chatRoomId}/messages` - Gửi tin nhắn mới

### **Message Structure**
```typescript
interface ChatMessage {
  id: string;
  message: string;
  sender: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}
```

### **🆕 Supplement Notification System**
```typescript
interface DepotChatWindowProps {
  // ... existing props
  hasSupplementDocuments?: boolean;      // Có tài liệu bổ sung không
  lastSupplementUpdate?: string;         // Thời gian cập nhật cuối cùng
}
```

**Tính năng:** Tự động hiển thị thông báo system message khi khách hàng bổ sung thông tin cho đơn hàng.

**Message Format:**
```
📋 **THÔNG BÁO:** Khách hàng đã bổ sung thông tin cho đơn hàng!

📅 Thời gian cập nhật: 17/08/2025 11:56:39
📦 Container: ISO 1236

Vui lòng kiểm tra và xử lý thông tin mới.
```

**Styling:** System message có background màu vàng cam với border và shadow đặc biệt để nổi bật.

### **Usage trong Depot Request Table**
```tsx
<DepotChatMini
  requestId={item.id}
  containerNo={item.container_no}
  requestType={item.type}
  requestStatus={item.status}
/>
```

### **Integration với Depot.tsx**
```tsx
// Thay thế chat button cũ
<DepotChatMini
  requestId={item.id}
  containerNo={item.container_no}
  requestType={item.type}
  requestStatus={item.status}
/>
```

## 📁 Cấu trúc Components

```
components/chat/
├── ChatMini.tsx                # Main container với drag/drop functionality  
├── ChatWindow.tsx              # Chat window với messages và logic
├── ChatWindowStandalone.tsx    # Standalone chat window for table integration
├── ChatHeader.tsx              # Header với title và action buttons
├── ChatMessage.tsx             # Individual message component
└── ChatInput.tsx               # Input area với send functionality
```

## 🧩 Chi tiết Components

### 1. ChatMini.tsx (Main Component)
**Chức năng:** Container chính quản lý state và position của chat window

**Props:**
```typescript
interface ChatMiniProps {
  requestId: string;
  requestStatus?: string;
  rejectedReason?: string;
  requestType?: string;
  containerNo?: string;
  onStatusChange?: (status: string) => void;
}
```

**Features:**
- ✅ Draggable window positioning
- ✅ Minimize/restore functionality
- ✅ Show/hide chat trigger button
- ✅ Fixed positioning (bottom-right default)
- ✅ Responsive behavior

**States:**
- `isOpen` - Chat window visibility
- `isMinimized` - Minimized state
- `position` - Window position {x, y}
- `isDragging` - Drag state management

### 2. ChatWindow.tsx (Core Logic)
**Chức năng:** Main chat functionality với message handling

**Features:**
- ✅ Message loading từ API
- ✅ Real-time message polling (3s interval)
- ✅ Send message functionality
- ✅ Status-based chat restrictions
- ✅ Auto-scroll to bottom
- ✅ Loading states

**API Integration:**
- `GET /chat/request/${requestId}` - Initialize chat room
- `GET /chat/${chatRoomId}/messages` - Load messages
- `POST /chat/${chatRoomId}/messages` - Send message

**Message Types:**
- `text` - User/agent messages
- `system` - Status và system notifications

### 3. ChatHeader.tsx (Header Component)
**Chức năng:** Header với title, subtitle và action buttons

**Features:**
- ✅ Draggable handle (onMouseDown event)
- ✅ Minimize button
- ✅ Close button
- ✅ Icon và title display
- ✅ Subtitle support (container info)

**UI Elements:**
- Chat icon
- Title: "Hỗ trợ Chat"
- Subtitle: Container number (optional)
- Minimize button (-)
- Close button (×)

### 4. ChatMessage.tsx (Message Display)
**Chức năng:** Display individual messages với different styles

**Message Types:**
- **System Messages:** Center-aligned, gray background, info icon
- **User Messages:** Right-aligned, blue background
- **Agent Messages:** Left-aligned, white background với sender info

**Features:**
- ✅ Avatar display cho agent messages
- ✅ Sender name và role
- ✅ Timestamp formatting (HH:mm)
- ✅ Message bubble styling
- ✅ Text wrapping

### 5. ChatInput.tsx (Input Component)
**Chức năng:** Message input với send functionality

**Features:**
- ✅ Auto-resize textarea
- ✅ Enter to send (Shift+Enter for new line)
- ✅ Send button với icon
- ✅ Disabled states
- ✅ Placeholder customization
- ✅ Character input detection

**States:**
- `message` - Current input text
- `isTyping` - Typing indicator

### 6. ChatWindowStandalone.tsx (Table Integration)
**Chức năng:** Standalone chat window for integration with RequestTable

**Features:**
- ✅ Same functionality as ChatWindow
- ✅ Draggable positioning
- ✅ Minimize/restore capability
- ✅ Custom positioning support
- ✅ Close callback integration

**Props:**
```typescript
interface ChatWindowStandaloneProps {
  requestId: string;
  requestStatus?: string;
  rejectedReason?: string;
  requestType?: string;
  containerNo?: string;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
  position?: { x: number; y: number };
}
```

**Usage trong RequestTable:**
```tsx
<ChatWindowStandalone
  requestId={requestId}
  requestStatus={status}
  containerNo={containerNo}
  appointmentTime={request.appointment_time}
  appointmentLocation={`${request.appointment_location_type} ${request.appointment_location_id}`}
  appointmentNote={request.appointment_note}
  position={{ x: 100, y: 100 }}
  onClose={() => closeChat(requestId)}
/>
```

## 📅 **Appointment Notifications**

### **Feature mới: Hiển thị lịch hẹn trong chat**

**Functionality:**
- ✅ Tự động hiển thị thông tin lịch hẹn từ depot
- ✅ Format thời gian theo locale Việt Nam
- ✅ Hiển thị địa điểm (gate/yard + ID)
- ✅ Hiển thị ghi chú nếu có
- ✅ Chỉ hiển thị khi status là RECEIVED hoặc APPROVED

**Message Format:**
```
📅 Lịch hẹn: 25/12/2024 14:30 tại gate gate-1
📝 Ghi chú: Mang theo giấy tờ tùy thân
```

**Props được thêm:**
- `appointmentTime?: string` - ISO datetime string
- `appointmentLocation?: string` - Formatted location
- `appointmentNote?: string` - Optional note

## 🔧 **Real Appointment Data Integration**

### **Problem Fixed: Demo Data vs Real Data**

**Vấn đề ban đầu:**
- Backend trả về demo data thay vì appointment thực tế từ database
- Frontend hiển thị thời gian sai (02:34 17/08/2025) thay vì lịch hẹn depot đã set
- Appointment data không được lưu vào database khi depot tạo lịch hẹn

**Solution được implement:**

#### 🗄️ **Backend Changes:**

**File: `manageContainer/backend/modules/requests/service/AppointmentService.ts`**

1. **Fixed `acceptRequest` method (line 56-68):**
   ```typescript
   // Trước: Appointment data bị comment, không lưu DB
   // appointment_time: appointmentTime,
   // appointment_location_type: appointmentData.location_type,
   
   // Sau: Lưu thực sự vào database
   data: {
     status: 'RECEIVED',
     appointment_time: appointmentTime,
     appointment_location_type: appointmentData.location_type,
     appointment_location_id: appointmentData.location_id,
     gate_ref: appointmentData.gate_ref,
     appointment_note: appointmentData.note,
     updatedAt: new Date()
   }
   ```

2. **Fixed `getAppointmentByRequestId` method (line 234-257):**
   ```typescript
   // Trước: Return demo data
   appointment_time: new Date().toISOString(), // Demo
   location_type: 'gate', // Demo
   
   // Sau: Return real data từ database
   appointment_time: request.appointment_time.toISOString(),
   location_type: request.appointment_location_type || 'gate',
   location_id: request.appointment_location_id || 'default',
   gate_ref: request.gate_ref || undefined,
   note: request.appointment_note || undefined,
   ```

#### 🎨 **Frontend Changes:**

**File: `manageContainer/frontend/components/chat/ChatWindow.tsx`**

1. **Added Real Appointment API Call (line 146-162):**
   ```typescript
   // Fetch real appointment data từ API
   try {
     const appointmentResponse = await api.get(`/requests/${requestId}/appointment`);
     if (appointmentResponse.data?.data) {
       const appt = appointmentResponse.data.data;
       realAppointmentTime = appt.appointment_time;
       realAppointmentLocation = `${appt.location_type} ${appt.location_id}`;
       realAppointmentNote = appt.note;
       console.log('Fetched real appointment data:', appt);
     }
   } catch (error) {
     console.log('No appointment data from API, using props or demo data');
   }
   ```

2. **Added `getRealAppointmentMessage` function (line 115-138):**
   ```typescript
   const getRealAppointmentMessage = (time?: string, location?: string, note?: string) => {
     if (!time) return '';
     
     const formattedTime = new Date(time).toLocaleString('vi-VN', {
       year: 'numeric', month: '2-digit', day: '2-digit',
       hour: '2-digit', minute: '2-digit'
     });
     
     let message = `📅 Lịch hẹn: ${formattedTime}`;
     if (location) message += ` tại ${location}`;
     if (note) message += `\n📝 Ghi chú: ${note}`;
     return message;
   };
   ```

**File: `manageContainer/frontend/components/chat/ChatWindowStandalone.tsx`**

3. **Updated Props Interface (line 4-16):**
   ```typescript
   interface ChatWindowStandaloneProps {
     requestId: string;
     requestStatus?: string;
     rejectedReason?: string;
     requestType?: string;
     containerNo?: string;
     appointmentTime?: string;        // Added
     appointmentLocation?: string;    // Added  
     appointmentNote?: string;        // Added
     onClose: () => void;
     onStatusChange?: (status: string) => void;
     position?: { x: number; y: number };
   }
   ```

**File: `manageContainer/frontend/components/RequestTable.tsx`**

4. **Updated ChatWindowStandalone Props (line 355-359):**
   ```typescript
   appointmentTime={request.appointment_time}
   appointmentLocation={request.appointment_location_type && request.appointment_location_id ? 
     `${request.appointment_location_type} ${request.appointment_location_id}` : undefined}
   appointmentNote={request.appointment_note}
   ```

**File: `manageContainer/frontend/components/index.ts`**

5. **Added ChatWindowStandalone Export (line 18):**
   ```typescript
   export { default as ChatWindowStandalone } from './chat/ChatWindowStandalone';
   ```

### 🎯 **Results:**

✅ **Real Appointment Data:** Chat hiển thị thời gian thật từ depot  
✅ **Database Integration:** Appointment được lưu và lấy từ database  
✅ **API Priority:** Ưu tiên data từ API over props  
✅ **Fallback Mechanism:** Graceful handling khi không có appointment data  
✅ **Debug Logging:** Console logs để debug appointment data flow  

### 📋 **Files Modified:**

**Backend:**
- `manageContainer/backend/modules/requests/service/AppointmentService.ts`

**Frontend:**
- `manageContainer/frontend/components/chat/ChatWindow.tsx`
- `manageContainer/frontend/components/chat/ChatWindowStandalone.tsx`  
- `manageContainer/frontend/components/RequestTable.tsx`
- `manageContainer/frontend/components/index.ts`
- `manageContainer/frontend/docs/CHAT_MINI_SYSTEM.md` (this file)

## 🎨 Design System Integration

### Colors (Theo guidelines)
- **Primary:** `var(--color-primary)` (#007BFF)
- **Background:** `var(--color-bg-primary)` (#ffffff)
- **Text:** `var(--color-text-primary)` (#1f2937)
- **Gray shades:** `var(--color-gray-*)` series

### Typography
- **Font Family:** `var(--font-family-primary)` (Inter)
- **Font Sizes:** `var(--font-size-*)` tokens
- **Font Weights:** `var(--font-weight-*)` tokens

### Spacing
- **8px Token System:** `var(--space-*)` (1-12)
- **Border Radius:** `var(--radius-*)` (sm, md, lg, xl)
- **Shadows:** `var(--shadow-*)` (sm, md, lg, xl)

### Transitions
- **Default:** `var(--transition-default)` (0.2s ease-in-out)
- **Animations:** Fade-in, scale effects

## 📱 Responsive Design

### Desktop (≥768px)
- **Window Size:** 400px × 500px
- **Full functionality:** Drag, resize, all features
- **Position:** Bottom-right corner

### Tablet (641px - 767px)
- **Window Size:** 320px × 450px
- **Reduced padding:** Smaller spacing
- **Touch-friendly:** Larger touch targets

### Mobile (≤640px)
- **Window Size:** 280px × 400px
- **Minimal UI:** Essential features only
- **Smaller trigger:** 50px circle button

## 🔧 Usage Examples

### Basic Usage
```tsx
import { ChatMini } from '@/components';

function MyPage() {
  return (
    <div>
      {/* Page content */}
      
      <ChatMini 
        requestId="REQ-123"
        requestStatus="RECEIVED"
        containerNo="CONT-456"
      />
    </div>
  );
}
```

### With Status Change Handler
```tsx
import { ChatMini } from '@/components';

function RequestPage() {
  const handleStatusChange = (newStatus: string) => {
    console.log('Request status changed:', newStatus);
    // Update parent component state
  };

  return (
    <ChatMini 
      requestId="REQ-123"
      requestStatus="IN_PROGRESS"
      requestType="IMPORT"
      containerNo="CONT-456"
      onStatusChange={handleStatusChange}
    />
  );
}
```

### Replace Existing Chat Button
```tsx
// Thay thế button Chat cũ
// Từ:
<button onClick={() => setShowChat(true)}>Chat</button>

// Thành:
<ChatMini requestId={request.id} requestStatus={request.status} />
```

## 🚀 Features Implemented

### ✅ Core Features
- [x] Modern UI design với chat bubbles
- [x] Draggable window positioning
- [x] Minimize/restore functionality
- [x] Real-time message polling
- [x] Send message functionality
- [x] Status-based chat restrictions
- [x] Auto-scroll to bottom
- [x] Loading states
- [x] Error handling
- [x] Responsive design

### ✅ Depot Chat Features (Mới)
- [x] **Status-based Activation:** Chat chỉ hoạt động từ SCHEDULED trở lên
- [x] **Backend Integration:** Kết nối với chat API thật
- [x] **Message Persistence:** Tin nhắn được lưu vào database
- [x] **Real-time Updates:** Polling mỗi 3 giây để cập nhật tin nhắn
- [x] **Fallback Demo Mode:** Hoạt động offline khi backend fail
- [x] **Container-specific Chat:** Mỗi container có chat room riêng
- [x] **Role-based Access:** Depot staff và customer có thể chat
- [x] **Request Status Integration:** Chat status theo trạng thái đơn hàng

### ✅ UI/UX Features
- [x] Smooth animations (fade-in, scale)
- [x] Hover effects
- [x] Visual feedback
- [x] Modern chat bubble design
- [x] Avatar system
- [x] Timestamp display
- [x] System message styling
- [x] Disabled states indication

### ✅ Technical Features
- [x] TypeScript interfaces
- [x] Component modularity (<400 lines each)
- [x] CSS variables integration
- [x] API integration preserved
- [x] Error boundaries
- [x] Memory leak prevention

## 📋 Migration Guide

### Thay thế Chat cũ
1. **Import ChatMini component:**
   ```tsx
   import { ChatMini } from '@/components';
   ```

2. **Replace existing chat logic:**
   ```tsx
   // Cũ
   {showChat && (
     <SimpleChatBox 
       requestId={requestId}
       onClose={() => setShowChat(false)}
     />
   )}
   
   // Mới
   <ChatMini requestId={requestId} />
   ```

3. **Remove old state management:**
   ```tsx
   // Không cần nữa
   const [showChat, setShowChat] = useState(false);
   ```

### CSS Import
Đảm bảo `chat-mini.css` được import trong `globals.css`:
```css
@import url('./chat-mini.css');
```

## 🔧 Customization

### Thay đổi vị trí mặc định
```tsx
// Trong ChatMini.tsx, sửa useEffect:
useEffect(() => {
  if (typeof window !== 'undefined') {
    setPosition({
      x: window.innerWidth - 420,  // Điều chỉnh x
      y: window.innerHeight - 520  // Điều chỉnh y
    });
  }
}, []);
```

### Thay đổi kích thước window
```css
/* Trong chat-mini.css */
.chat-window {
  width: 450px;    /* Thay đổi width */
  height: 600px;   /* Thay đổi height */
}
```

### Thêm custom styling
```css
/* Custom theme */
.chat-window.custom-theme {
  border: 2px solid var(--color-primary);
}

.chat-header.custom-theme {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Chat không hiển thị:**
   - Kiểm tra `requestId` có hợp lệ
   - Verify API endpoints hoạt động
   - Check console errors

2. **Drag không hoạt động:**
   - Kiểm tra `onMouseDown` event
   - Verify event listeners cleanup
   - Check CSS cursor styles

3. **Messages không load:**
   - Kiểm tra API response format
   - Verify polling interval
   - Check network connectivity

4. **Responsive issues:**
   - Test trên different screen sizes
   - Check CSS media queries
   - Verify viewport meta tag

### Depot Chat Specific Issues

5. **Chat không kích hoạt:**
   - Kiểm tra `requestStatus` có ≥ SCHEDULED không
   - Verify `isChatAllowed` logic
   - Check backend chat service status

6. **Tin nhắn không gửi được:**
   - Kiểm tra backend chat API endpoints
   - Verify chat room creation
   - Check user permissions và role

7. **Customer không thấy tin nhắn:**
   - Verify backend message persistence
   - Check chat room participants
   - Verify real-time polling hoạt động

8. **Demo mode không hoạt động:**
   - Check fallback logic trong DepotChatWindow
   - Verify demo message structure
   - Check console errors

### Debug Tips
```tsx
// Thêm debug logging
useEffect(() => {
  console.log('ChatMini Debug:', {
    requestId,
    requestStatus,
    chatRoomId,
    messagesCount: messages.length
  });
}, [requestId, requestStatus, chatRoomId, messages]);
```

## 📊 Performance Considerations

### Optimizations Implemented
- **Component memoization:** React.memo cho expensive components
- **Efficient polling:** Clear intervals on unmount
- **Lazy loading:** Components load on demand
- **CSS optimization:** Efficient selectors, minimal repaints
- **Memory management:** Proper cleanup of event listeners

### Best Practices
- Limit polling frequency (3s recommended)
- Cleanup event listeners
- Use CSS transforms for animations
- Minimize DOM manipulations
- Implement proper error boundaries

## 🔄 Future Enhancements

### Phase 2 Features
- [ ] WebSocket integration for real-time
- [ ] File attachment support
- [ ] Emoji picker
- [ ] Typing indicators
- [ ] Message search
- [ ] Chat history export
- [ ] Multi-language support
- [ ] Dark mode theme

### Technical Improvements
- [ ] Virtual scrolling for large message lists
- [ ] Message caching
- [ ] Offline support
- [ ] Push notifications
- [ ] Voice message support

---

## 📞 Support & Maintenance

### File Locations
- **Components:** `components/chat/*.tsx`
- **Styles:** `styles/chat-mini.css`
- **Documentation:** `docs/CHAT_MINI_SYSTEM.md`

### Maintenance Tasks
- Regular API endpoint testing
- Performance monitoring
- User feedback collection
- Browser compatibility testing
- Mobile device testing

### Contact
- **Development Team:** Frontend team
- **Issues:** Create GitHub issue với label `chat-system`
- **Questions:** Check documentation first, then ask team

---

*Tài liệu được cập nhật lần cuối: $(date)*  
*Version: 1.0.0*  
*Author: UI Refactor Team*
