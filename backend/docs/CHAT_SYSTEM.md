# Chat System Documentation

## 🎯 Tổng quan

Hệ thống **Chat** là một module backend cung cấp khả năng giao tiếp real-time giữa **Depot Staff** và **Customer** về các đơn hàng container. System này hỗ trợ chat room, message persistence, và real-time updates.

## 📁 Cấu trúc Module

```
modules/chat/
├── controller/
│   ├── ChatController.ts        # API endpoints và business logic
│   └── ChatRoutes.ts            # Route definitions
├── service/
│   └── ChatService.ts           # Business logic và data processing
├── repository/
│   └── ChatRepository.ts        # Database operations
├── dto/
│   └── ChatDtos.ts              # Data validation schemas
└── websocket/
    └── ChatWebSocket.ts         # Real-time communication
```

## 🚀 **Features Implemented**

### ✅ **Core Chat Features**
- [x] **Chat Room Management:** Tạo và quản lý chat room theo request
- [x] **Message Persistence:** Lưu trữ tin nhắn vào database
- [x] **Status-based Access Control:** Chat chỉ hoạt động từ SCHEDULED trở lên
- [x] **Role-based Permissions:** Kiểm tra quyền truy cập theo user role
- [x] **Real-time Updates:** WebSocket integration cho instant messaging
- [x] **Message History:** Lưu trữ và truy xuất lịch sử chat
- [x] **Audit Logging:** Ghi log tất cả chat activities

### ✅ **Security Features**
- [x] **Authentication Required:** Tất cả endpoints cần JWT token
- [x] **Role-based Access:** Kiểm tra quyền theo user role
- [x] **Tenant Isolation:** Customer chỉ thấy chat room của tenant mình
- [x] **Request Validation:** Validate input data với Joi schemas
- [x] **SQL Injection Protection:** Sử dụng Prisma ORM

## 🔌 **API Endpoints**

### **Chat Room Management**

#### `POST /chat`
**Tạo chat room mới**
```typescript
// Request Body
{
  "request_id": "string"  // ID của request
}

// Response
{
  "id": "chat_room_id",
  "request_id": "request_id",
  "participants": ["user_id1", "user_id2"],
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### `GET /chat/request/:request_id`
**Lấy hoặc tạo chat room cho request**
```typescript
// Response
{
  "id": "chat_room_id",
  "request_id": "request_id",
  "participants": ["user_id1", "user_id2"],
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### **Message Management**

#### `POST /chat/:chat_room_id/messages`
**Gửi tin nhắn mới**
```typescript
// Request Body
{
  "message": "string",           // Nội dung tin nhắn
  "type": "text",                // Loại tin nhắn (text, system)
  "file_url": "string",          // URL file (optional)
  "file_name": "string",         // Tên file (optional)
  "file_size": "number"          // Kích thước file (optional)
}

// Response
{
  "id": "message_id",
  "chat_room_id": "chat_room_id",
  "sender_id": "user_id",
  "message": "message_content",
  "type": "text",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### `GET /chat/:chat_room_id/messages`
**Lấy danh sách tin nhắn**
```typescript
// Query Parameters
{
  "page": "number",              // Trang (default: 1)
  "limit": "number"              // Số tin nhắn mỗi trang (default: 20, max: 100)
}

// Response
{
  "data": [
    {
      "id": "message_id",
      "chat_room_id": "chat_room_id",
      "sender_id": "user_id",
      "message": "message_content",
      "type": "text",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

### **User Chat Rooms**

#### `GET /chat/user/rooms`
**Lấy danh sách chat room của user**
```typescript
// Query Parameters
{
  "page": "number",              // Trang (default: 1)
  "limit": "number"              // Số chat room mỗi trang (default: 20, max: 50)
}

// Response
{
  "data": [
    {
      "id": "chat_room_id",
      "request_id": "request_id",
      "status": "active",
      "lastMessage": "last_message_content",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 3
}
```

## 🔐 **Access Control**

### **Role-based Permissions**

#### **Allowed Roles**
```typescript
const allowedRoles = [
  'CustomerAdmin',    // Customer admin users
  'CustomerUser',     // Customer regular users
  'SaleAdmin',        // Depot staff admin
  'SystemAdmin'       // System administrators
];
```

#### **Permission Matrix**
| Role | Create Chat Room | Send Messages | View Messages | Access All Rooms |
|------|------------------|---------------|---------------|------------------|
| CustomerAdmin | ✅ | ✅ | ✅ | ❌ (Tenant only) |
| CustomerUser | ✅ | ✅ | ✅ | ❌ (Tenant only) |
| SaleAdmin | ✅ | ✅ | ✅ | ✅ (Depot only) |
| SystemAdmin | ✅ | ✅ | ✅ | ✅ (All) |

### **Status-based Restrictions**

#### **Chat Activation Rules**
```typescript
const allowedStatuses = [
  'SCHEDULED',        // Đơn hàng đã được lên lịch
  'APPROVED',         // Đơn hàng đã được chấp nhận
  'IN_PROGRESS',      // Đơn hàng đang được xử lý
  'COMPLETED',        // Đơn hàng đã hoàn tất
  'EXPORTED'          // Đơn hàng đã xuất kho
];
```

**Lưu ý:** Chat chỉ hoạt động khi request status nằm trong danh sách trên.

## 🗄️ **Database Schema**

### **ChatRoom Model**
```prisma
model ChatRoom {
  id          String   @id @default(cuid())
  request_id  String   @unique
  participants Json    // Array of user IDs
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  request     Request  @relation(fields: [request_id], references: [id])
  messages    ChatMessage[]
  
  @@map("chat_rooms")
}
```

### **ChatMessage Model**
```prisma
model ChatMessage {
  id            String   @id @default(cuid())
  chat_room_id  String
  sender_id     String
  message       String
  type          String   @default("text")
  file_url      String?
  file_name     String?
  file_size     Int?
  createdAt     DateTime @default(now())
  
  // Relations
  chatRoom     ChatRoom @relation(fields: [chat_room_id], references: [id])
  
  @@map("chat_messages")
}
```

## 🔧 **Service Layer**

### **ChatService Class**

#### **Key Methods**

##### `createChatRoom(actor, request_id)`
```typescript
async createChatRoom(actor: any, request_id: string) {
  // Kiểm tra chat room đã tồn tại
  const existingChatRoom = await repo.findChatRoomByRequestId(request_id);
  if (existingChatRoom) {
    return existingChatRoom;
  }

  // Xác định participants dựa trên role
  let participants = [actor._id];
  
  if (['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
    // Customer tạo chat room, thêm depot staff
    participants.push('system_depot');
  } else if (['SaleAdmin', 'SystemAdmin'].includes(actor.role)) {
    // Depot staff tạo chat room, thêm customer
    // Logic để tìm customer của request
  }

  const chatRoom = await repo.createChatRoom({
    request_id,
    participants,
    status: 'active'
  });

  await audit(actor._id, 'CHAT_ROOM.CREATED', 'CHAT_ROOM', chatRoom.id);
  return chatRoom;
}
```

##### `sendMessage(actor, chat_room_id, payload)`
```typescript
async sendMessage(actor: any, chat_room_id: string, payload: any) {
  // Kiểm tra quyền truy cập
  const canAccess = await repo.canUserAccessChatRoom(actor._id, chat_room_id);
  if (!canAccess) {
    throw new Error('Không có quyền truy cập chat room này');
  }

  // Kiểm tra trạng thái request
  const chatRoom = await repo.findChatRoomById(chat_room_id);
  if (chatRoom && chatRoom.request) {
    const requestStatus = chatRoom.request.status;
    const allowedStatuses = ['SCHEDULED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'EXPORTED'];
    
    if (!allowedStatuses.includes(requestStatus)) {
      throw new Error('Chỉ có thể chat khi đơn hàng đã được lên lịch (SCHEDULED) trở lên');
    }
  }

  const message = await repo.createMessage({
    chat_room_id,
    sender_id: actor._id,
    message: payload.message,
    type: payload.type || 'text',
    file_url: payload.file_url,
    file_name: payload.file_name,
    file_size: payload.file_size
  });

  // Cập nhật updatedAt của chat room
  await repo.updateChatRoom(chat_room_id, { updatedAt: new Date() });

  await audit(actor._id, 'CHAT_MESSAGE.SENT', 'CHAT_MESSAGE', message.id);
  return message;
}
```

## 🌐 **WebSocket Integration**

### **ChatWebSocket Class**

#### **Features**
- **Real-time Communication:** Instant message delivery
- **Room-based Broadcasting:** Messages sent to specific chat rooms
- **User Connection Management:** Track online users
- **System Messages:** Broadcast system notifications

#### **Events**
```typescript
// Client to Server
socket.on('join_chat_room', (payload: { chat_room_id: string }) => {
  // Join specific chat room
});

socket.on('leave_chat_room', (payload: { chat_room_id: string }) => {
  // Leave specific chat room
});

// Server to Client
socket.emit('new_message', {
  chat_room_id: string,
  message: ChatMessage
});

socket.emit('system_message', {
  chat_room_id: string,
  message: string
});
```

## 📊 **Data Validation**

### **Joi Schemas**

#### **Create Chat Room Schema**
```typescript
export const createChatRoomSchema = Joi.object({
  request_id: Joi.string().required()
});
```

#### **Send Message Schema**
```typescript
export const sendMessageSchema = Joi.object({
  message: Joi.string().required().max(1000),
  type: Joi.string().valid('text', 'system', 'file').default('text'),
  file_url: Joi.string().uri().optional(),
  file_name: Joi.string().max(255).optional(),
  file_size: Joi.number().positive().max(10 * 1024 * 1024).optional() // 10MB max
});
```

#### **Query Messages Schema**
```typescript
export const queryMessagesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});
```

## 🔍 **Error Handling**

### **Common Error Messages**

```typescript
// Access Control Errors
'Không có quyền truy cập chat room này'
'Chỉ có thể chat khi đơn hàng đã được lên lịch (SCHEDULED) trở lên'

// Validation Errors
'request_id is required'
'message must be a string'
'type must be one of [text, system, file]'

// Database Errors
'Chat room not found'
'Failed to create message'
'Failed to update chat room'
```

### **HTTP Status Codes**
- `200` - Success
- `201` - Created (new chat room, new message)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (chat room not found)
- `500` - Internal Server Error

## 🧪 **Testing**

### **Unit Tests**
```bash
# Run chat service tests
npm test -- --grep "ChatService"

# Run chat controller tests
npm test -- --grep "ChatController"
```

### **Integration Tests**
```bash
# Test chat API endpoints
npm run test:integration -- --grep "chat"
```

### **Manual Testing**
1. **Create Chat Room:**
   ```bash
   curl -X POST http://localhost:3000/chat \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"request_id": "REQ-123"}'
   ```

2. **Send Message:**
   ```bash
   curl -X POST http://localhost:3000/chat/CHAT-456/messages \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello from depot!"}'
   ```

3. **Get Messages:**
   ```bash
   curl -X GET "http://localhost:3000/chat/CHAT-456/messages?page=1&limit=20" \
     -H "Authorization: Bearer <token>"
   ```

## 🚀 **Performance Considerations**

### **Optimizations**
- **Message Pagination:** Limit message loading (max 100 per request)
- **Efficient Queries:** Use database indexes on frequently queried fields
- **Connection Pooling:** Optimize database connections
- **Caching:** Consider Redis for frequently accessed chat rooms

### **Monitoring**
- **Message Volume:** Track number of messages per day
- **Response Times:** Monitor API response times
- **Database Performance:** Watch for slow queries
- **Memory Usage:** Monitor WebSocket connection memory

## 🔄 **Future Enhancements**

### **Phase 2 Features**
- [ ] **File Upload Support:** Image, document sharing
- [ ] **Message Encryption:** End-to-end encryption
- [ ] **Push Notifications:** Mobile app notifications
- [ ] **Chat Analytics:** Message statistics, user engagement
- [ ] **Multi-language Support:** Internationalization
- [ ] **Message Search:** Full-text search in chat history
- [ ] **Chat Export:** Export chat history to PDF/CSV

### **Technical Improvements**
- [ ] **Message Queuing:** Redis-based message queuing
- [ ] **Rate Limiting:** Prevent spam messages
- [ ] **Message Moderation:** Content filtering
- [ ] **Backup & Recovery:** Automated chat data backup
- [ ] **Scalability:** Horizontal scaling support

## 📋 **Maintenance Tasks**

### **Regular Maintenance**
- **Database Cleanup:** Archive old messages (older than 1 year)
- **Performance Monitoring:** Check slow queries, optimize indexes
- **Security Updates:** Regular dependency updates
- **Backup Verification:** Test backup and recovery procedures

### **Troubleshooting**
- **High Memory Usage:** Check for WebSocket memory leaks
- **Slow Response Times:** Optimize database queries
- **Connection Issues:** Verify WebSocket server status
- **Permission Errors:** Check user roles and permissions

## 📞 **Support & Contact**

### **File Locations**
- **Controllers:** `modules/chat/controller/`
- **Services:** `modules/chat/service/`
- **Routes:** `modules/chat/controller/ChatRoutes.ts`
- **Documentation:** `docs/CHAT_SYSTEM.md`

### **Team Contacts**
- **Backend Team:** Chat system development
- **DevOps:** Deployment và monitoring
- **QA:** Testing và quality assurance

### **Issue Reporting**
- **GitHub Issues:** Create issue với label `chat-system`
- **Priority Levels:** High, Medium, Low
- **Response Time:** Within 24 hours for high priority

---

*Tài liệu được cập nhật lần cuối: $(date)*  
*Version: 1.0.0*  
*Author: Backend Development Team*
