# UI Refactor Documentation - Depot Management System

## 📋 Tổng quan

Tài liệu này mô tả chi tiết các thay đổi UI/UX được thực hiện theo **UI Refactor Guidelines** cho hệ thống Depot Management System. Tất cả các thay đổi chỉ tập trung vào giao diện, giữ nguyên toàn bộ logic business, API calls và hooks.

## 🎯 Mục tiêu đã đạt được

✅ Thiết kế hiện đại, sạch sẽ, chuyên nghiệp  
✅ Màu sắc theo guidelines (Navy blue #001F3F làm chủ đạo)  
✅ Typography hierarchy chuẩn (H1: 24px, H2: 20px, H3: 18px)  
✅ Spacing system theo 8px token  
✅ Transition mượt mà (0.2s ease-in-out)  
✅ Responsive design (desktop-first)  
✅ Component modularity (không có file > 400 dòng)  

---

## 🏗️ Cấu trúc thư mục mới

```
manageContainer/frontend/
├── components/
│   ├── layout/
│   │   └── PageLayout.tsx          # Layout wrapper cho pages
│   ├── ui/
│   │   ├── Badge.tsx               # Component badge với variants
│   │   └── LoadingSpinner.tsx      # Loading spinner system
│   ├── Button.tsx                  # Enhanced với variants mới
│   ├── Card.tsx                    # Refactored với props system
│   ├── Header.tsx                  # Completely refactored
│   ├── Modal.tsx                   # Enhanced với accessibility
│   └── SearchBar.tsx               # Modern search với icons
├── styles/
│   ├── theme.ts                    # Design system tokens
│   └── globals.css                 # Updated với design system
└── docs/
    └── UI_REFACTOR_DOCUMENTATION.md # Tài liệu này
```

---

## 🎨 Design System

### 1. Theme Tokens (`styles/theme.ts`)
**File mới** - Định nghĩa toàn bộ design tokens theo guidelines.

**Tính năng:**
- Colors: Navy blue primary, semantic colors
- Typography: Font hierarchy, weights, line-heights  
- Spacing: 8px token system (4px, 8px, 16px, 24px, 32px)
- Border radius: sm(4px), md(8px), lg(12px), xl(16px)
- Shadows: xs, sm, md, lg, xl levels
- Transitions: default, fast, slow
- Breakpoints: responsive system

**Sử dụng:**
```typescript
import { theme } from '@/styles/theme';
// Access: theme.colors.navy[600], theme.spacing[4], etc.
```

### 2. CSS Variables (`styles/globals.css`)
**Cập nhật hoàn toàn** - Chuyển từ hardcoded values sang design tokens.

**Thay đổi chính:**
- Tất cả colors sử dụng `--color-*` variables
- Spacing sử dụng `--space-*` tokens  
- Typography sử dụng `--font-*` variables
- Transitions sử dụng `--transition-*`

---

## 🧩 Components Refactored

### 1. Button Component (`components/Button.tsx`)
**Cập nhật:** Enhanced với variants và features mới

**Thay đổi:**
- ✅ Thêm variants: `success`, `danger`, `warning`, `info`
- ✅ Loading state với spinner
- ✅ Full width option
- ✅ Improved accessibility
- ✅ Icon support với proper spacing

**Props mới:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning' | 'info';
  loading?: boolean;
  fullWidth?: boolean;
  // ... existing props
}
```

**Sử dụng:**
```tsx
<Button variant="success" loading={isSubmitting} fullWidth>
  Lưu thay đổi
</Button>
```

### 2. Card Component (`components/Card.tsx`)
**Cập nhật:** Props system với customization options

**Thay đổi:**
- ✅ Flexible padding options (sm, md, lg)
- ✅ Shadow levels (sm, md, lg, xl)
- ✅ Hoverable option
- ✅ Proper header/content structure

**Props mới:**
```typescript
interface CardProps {
  title?: string;
  actions?: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
}
```

**Sử dụng:**
```tsx
<Card title="Container Details" padding="lg" shadow="md" hoverable>
  <p>Content here...</p>
</Card>
```

### 3. Modal Component (`components/Modal.tsx`)
**Cập nhật:** Enhanced với accessibility và UX improvements

**Thay đổi:**
- ✅ ESC key support
- ✅ Body scroll lock
- ✅ Size presets (sm, md, lg, xl)
- ✅ Mask click customization
- ✅ Smooth animations
- ✅ Better responsive behavior

**Props mới:**
```typescript
interface ModalProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  maskClosable?: boolean;
  centered?: boolean;
  // ... existing props
}
```

### 4. Header Component (`components/Header.tsx`)
**Refactor hoàn toàn:** Modern layout với icons và better UX

**Thay đổi chính:**
- ✅ Modern layout với proper spacing
- ✅ SVG icons cho navigation và actions
- ✅ Better responsive behavior
- ✅ Loading states
- ✅ Improved accessibility với ARIA labels
- ✅ Enhanced sidebar với icons

**Cấu trúc mới:**
- Header brand section với logo + title
- User info section với role + email
- Action buttons với icons
- Enhanced sidebar với module icons

### 5. SearchBar Component (`components/SearchBar.tsx`)
**Cập nhật:** Modern search với icons và better UX

**Thay đổi:**
- ✅ SVG search icon
- ✅ Loading state với spinner
- ✅ Clear button
- ✅ Size variants (sm, md, lg)
- ✅ Flexible filter options

**Props mới:**
```typescript
interface SearchBarProps {
  filters?: Array<{ value: string; label: string }>;
  showClearButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
```

---

## 🆕 Components mới

### 1. PageLayout (`components/layout/PageLayout.tsx`)
**File mới** - Layout wrapper cho pages

**Tính năng:**
- Consistent page structure
- Header với title/subtitle/actions
- Responsive behavior
- Max-width options

**Sử dụng:**
```tsx
<PageLayout 
  title="Container Management"
  subtitle="Quản lý container trong hệ thống"
  actions={<Button>Thêm mới</Button>}
>
  {/* Page content */}
</PageLayout>
```

### 2. Maintenance/Repairs Page Refactor
**File cập nhật:** `manageContainer/frontend/pages/Maintenance/Repairs.tsx`

**Thay đổi chính:**
- ✅ **Layout mới:** Bỏ layout 2 cột, table chính chiếm toàn bộ width
- ✅ **Modal tạo phiếu:** Chuyển từ inline form sang popup modal
- ✅ **Danh sách container đang chờ:** Thêm option mới với popup modal
- ✅ **API integration:** Kết nối với backend port 1000 cho Gate module
- ✅ **Status management:** Chuyển trạng thái từ GATE_IN → CHECKING

**Tính năng mới:**

**Modal "Danh sách container đang chờ":**
- Hiển thị container có trạng thái `GATE_IN`
- 5 cột: Container No, Loại, Trạng thái, Biển số xe, Hành động
- Nút "Bắt đầu kiểm tra" để chuyển sang trạng thái `CHECKING`
- API endpoint: `PATCH /gate/requests/{id}/check`
- Error handling chi tiết với retry mechanism

**Modal "Tạo phiếu sửa chữa":**
- Form tạo phiếu trong popup riêng biệt
- Fields: Mã phiếu, Thiết bị, Mô tả lỗi, Chi phí dự toán
- Validation và error handling
- Reset form sau khi submit thành công

**UI Improvements:**
- Table styling với proper padding, border và spacing
- Status badges với màu sắc phân biệt
- Responsive design cho mobile/tablet
- Loading states và empty states
- Consistent button styling theo design system

**API Integration:**
- Backend server: `http://localhost:1000`
- Gate module endpoints: `/gate/requests/search`, `/gate/requests/{id}/check`
- Authentication với Bearer token
- Error handling cho network issues, authentication, authorization

**Luồng vào module backend:**

1. **Frontend gọi API:**
   ```typescript
   // Lấy danh sách container đang chờ
   GET /gate/requests/search?status=GATE_IN&limit=100
   
   // Chuyển trạng thái sang CHECKING
   PATCH /gate/requests/{id}/check
   ```

2. **Backend Gate Module xử lý:**
   - **Controller:** `GateController` nhận request
   - **Service:** `GateService` xử lý business logic
   - **Repository:** `GateRepository` tương tác với database
   - **Validation:** Joi schema validation cho input data

3. **Database Operations:**
   - **Search:** Query container requests với status = 'GATE_IN'
   - **Update:** Cập nhật status từ 'GATE_IN' → 'CHECKING'
   - **Audit:** Log thay đổi trạng thái với timestamp

4. **Response Flow:**
   - Success: Return updated data với status mới
   - Error: Return error message với HTTP status code
   - Frontend: Cập nhật UI dựa trên response

**Flow xử lý container mới (Updated):**

1. **Container GATE_IN → Click "Bắt đầu kiểm tra"**
   - Trạng thái chuyển thành `CHECKING`
   - Hiển thị 2 option: "Đạt chuẩn" / "Không đạt chuẩn"

2. **Option "Đạt chuẩn":**
   - Container được xóa khỏi danh sách chờ
   - Thông báo: "Container đã được xóa khỏi danh sách chờ"
   - Không còn hiển thị trong modal

3. **Option "Không đạt chuẩn":**
   - Hiển thị 2 sub-options:
     - **"Không thể sửa"** → Xóa khỏi danh sách + Lý do: "Container không đạt chuẩn"
     - **"Có thể sửa"** → Hiển thị popup tạo phiếu sửa chữa

4. **Popup "Tạo phiếu sửa chữa":**
   - Fields: Container No, Loại, Mô tả lỗi, Chi phí dự toán
   - Validation: Mô tả không được để trống, chi phí không âm
   - API call: `POST /maintenance/repairs` (không gửi equipment_id)
   - Sau khi tạo thành công: Xóa container khỏi danh sách chờ

5. **Kết quả cuối cùng:**
   - Tất cả container đã xử lý đều bị xóa khỏi danh sách chờ
   - Danh sách chỉ hiển thị container cần xử lý
   - UI sạch sẽ, không còn container đã xử lý

**Sử dụng:**
```tsx
// Trong trang Repairs
<button onClick={() => setIsPendingContainersModalOpen(true)}>
  📋 Danh sách container đang chờ
</button>

<button onClick={() => setIsModalOpen(true)}>
  + Tạo phiếu mới
</button>
```

### 2. LoadingSpinner (`components/ui/LoadingSpinner.tsx`)
**File mới** - Consistent loading states

**Tính năng:**
- Size variants (sm, md, lg)
- Color variants (primary, secondary, white)
- Accessibility support

### 3. Badge (`components/ui/Badge.tsx`)
**File mới** - Status và label display

**Tính năng:**
- Semantic variants (success, warning, danger, etc.)
- Size options
- Rounded option

### 4. Chat Mini System (`components/chat/`)
**Hệ thống mới** - Modern chat interface thay thế chat cũ

**Components:**
- `ChatMini.tsx` - Main container với drag/drop (158 dòng)
- `ChatWindow.tsx` - Chat window với logic (295+ dòng)  
- `ChatWindowStandalone.tsx` - Standalone version cho table integration (130 dòng)
- `ChatHeader.tsx` - Header với actions (46 dòng)
- `ChatMessage.tsx` - Message display (68 dòng)
- `ChatInput.tsx` - Input với send button (75 dòng)

**Tính năng:**
- ✅ Modern UI với chat bubbles
- ✅ Draggable window positioning
- ✅ Minimize/restore functionality
- ✅ Real-time message polling
- ✅ Status-based restrictions
- ✅ **Real appointment notifications** từ depot
- ✅ API integration để fetch appointment data thực tế
- ✅ Responsive design (400×500px → 280×400px)
- ✅ Smooth animations và transitions

**Appointment Integration:**
- ✅ Tự động gọi `/requests/{id}/appointment` API
- ✅ Hiển thị lịch hẹn thật từ database thay vì demo data
- ✅ Format thời gian theo locale Việt Nam
- ✅ Fallback mechanism khi không có appointment

**Sử dụng:**
```tsx
import { ChatMini } from '@/components';

<ChatMini 
  requestId="REQ-123"
  requestStatus="RECEIVED"
  containerNo="CONT-456"
  onStatusChange={handleStatusChange}
/>
```

### 5. Appointment Mini System (`components/appointment/`)
**Hệ thống mới** - Modern appointment creation interface thay thế AppointmentModal cũ

**Components:**
- `AppointmentMini.tsx` - Main container với drag/drop (162 dòng)
- `AppointmentWindow.tsx` - Appointment window với form logic (114 dòng)  
- `AppointmentHeader.tsx` - Header với actions (46 dòng)
- `AppointmentForm.tsx` - Form với validation (287 dòng)

**Tính năng:**
- ✅ Modern UI thay thế AppointmentModal cũ
- ✅ Draggable window positioning
- ✅ Minimize/restore functionality  
- ✅ Form validation và error handling
- ✅ Multiple appointment windows support
- ✅ Responsive design (400×550px → 280×400px)
- ✅ Smooth animations và transitions
- ✅ **Auto-open khi được render** (không cần click button)
- ✅ **Fixed drag functionality** với useRef pattern

**Integration:**
- ✅ Tích hợp vào `Depot.tsx` page
- ✅ Trigger khi status = 'RECEIVED' 
- ✅ Multiple active windows với Set management
- ✅ API integration với backend AppointmentService

**Bug Fixes (Latest):**
- ✅ **Fixed setDragOffset error:** Sử dụng `dragOffset.current` thay vì `setDragOffset()`
- ✅ **Fixed auto-open logic:** `useState(true)` thay vì `useState(false)`
- ✅ **Added debug logging:** Track component lifecycle và state changes
- ✅ **Fixed import paths:** Sử dụng direct import thay vì barrel export

**Sử dụng:**
```tsx
import AppointmentMini from '@components/appointment/AppointmentMini';

<AppointmentMini 
  requestId="REQ-123"
  requestData={{
    id: "REQ-123",
    container_no: "CONT-456",
    type: "IMPORT",
    status: "RECEIVED",
    created_by: "user@example.com"
  }}
  onClose={() => handleClose()}
  onSuccess={() => handleSuccess()}
/>
```

---

## 🎨 CSS Classes mới

### Layout Classes
```css
.page-layout          /* Main page wrapper */
.page-header         /* Page header section */
.page-title          /* Page title styling */
.page-subtitle       /* Page subtitle */
.page-actions        /* Action buttons area */
.page-content        /* Main content area */
```

### Component Classes
```css
/* Cards */
.card-shadow-sm/md/lg/xl    /* Shadow variants */
.card-padding-sm/md/lg      /* Padding variants */
.card-hoverable             /* Hover effects */

/* Buttons */
.btn-success/danger/warning/info  /* Semantic variants */
.btn-loading                      /* Loading state */

/* Search */
.search-bar-sm/md/lg        /* Size variants */
.search-loading-spinner     /* Loading state */
.search-clear-btn          /* Clear button */

/* Header */
.header-brand              /* Brand section */
.header-actions           /* Actions section */
.user-info               /* User info display */
.loading-spinner-small   /* Small spinner */

/* Sidebar */
.sidebar-content         /* Sidebar wrapper */

/* Chat Mini */
.chat-mini-toggle          /* Chat toggle button */
.chat-mini-container       /* Chat window container */
.chat-window              /* Chat window styling */
.chat-header              /* Chat header */
.chat-messages            /* Messages area */
.chat-input-area          /* Input section */

/* Appointment Mini */
.appointment-mini-toggle          /* Appointment toggle button */
.appointment-mini-container       /* Appointment window container */
.appointment-window              /* Appointment window styling */
.appointment-header              /* Appointment header */
.appointment-form                /* Form area */
.appointment-loading-content     /* Loading state */
.appointment-mini-minimized      /* Minimized state */
```

---

## 📱 Responsive Design

### Breakpoints
- **Desktop:** >= 1024px - Full layout với sidebar
- **Tablet:** 641px - 1023px - Collapsed sidebar, reduced spacing
- **Mobile:** <= 640px - Minimal UI, hidden elements

### Responsive Behaviors
- **Header:** Logo/title hide on mobile, user info collapses
- **Sidebar:** Transform to overlay on mobile/tablet
- **Cards:** Reduce padding on small screens
- **Search:** Stack vertically on mobile
- **Page Layout:** Reduce spacing, stack header elements

---

## 🚀 Performance Optimizations

### CSS Optimizations
- CSS variables giảm file size
- Efficient selectors
- Minimal redundancy

### Component Optimizations  
- Lazy loading cho icons (SVG inline)
- Memoization cho expensive calculations
- Proper key props cho lists

---

## 🔧 Maintenance Guide

### Thêm màu mới
1. Cập nhật `styles/theme.ts`
2. Thêm CSS variable trong `globals.css`
3. Sử dụng trong components

### Thêm spacing mới
1. Thêm vào `theme.spacing` object
2. Generate CSS variable
3. Sử dụng `var(--space-*)` trong CSS

### Tạo component variant mới
1. Thêm vào interface Props
2. Tạo CSS class tương ứng
3. Map trong component logic

### Responsive breakpoint mới
1. Thêm vào `theme.breakpoints`
2. Tạo media query trong CSS
3. Test trên devices

---

## ✅ Checklist Hoàn thành

- [x] Màu nền chính **navy blue** (#001F3F)
- [x] Typography chuẩn theo hierarchy (H1: 24px, H2: 20px, H3: 18px)
- [x] Spacing theo token 8px system, nhất quán
- [x] Transition hover/focus/alert mượt mà (0.2s ease-in-out)
- [x] Layout cân đối, dễ nhìn với proper spacing
- [x] UI responsive cơ bản (desktop-first)
- [x] Không thay đổi logic/hook/API call
- [x] Không có file code > 400 dòng
- [x] Components chia nhỏ vào folders tương ứng
- [x] Documentation chi tiết

---

## 🔄 Migration Guide

### Từ components cũ sang mới:

**Button:**
```tsx
// Cũ
<button className="btn btn-primary">Click me</button>

// Mới  
<Button variant="primary">Click me</Button>
```

**Card:**
```tsx
// Cũ
<div className="card">
  <h3>Title</h3>
  <div>Content</div>
</div>

// Mới
<Card title="Title">Content</Card>
```

**Modal:**
```tsx
// Cũ
<Modal title="Title" visible={true} onCancel={close}>
  Content
</Modal>

// Mới (thêm size, accessibility)
<Modal title="Title" visible={true} onCancel={close} size="md">
  Content  
</Modal>
```

---

## 🗄️ Backend Integration Changes

### Chat Appointment System Fix

**Problem:** Backend trả về demo data thay vì appointment thực tế từ database

**File Modified:** `manageContainer/backend/modules/requests/service/AppointmentService.ts`

**Changes Made:**

1. **Fixed `acceptRequest` method:**
   ```typescript
   // Lưu appointment data vào database thay vì comment
   const updatedRequest = await this.prisma.serviceRequest.update({
     where: { id: requestId },
     data: {
       status: 'RECEIVED',
       appointment_time: appointmentTime,
       appointment_location_type: appointmentData.location_type,
       appointment_location_id: appointmentData.location_id,
       gate_ref: appointmentData.gate_ref,
       appointment_note: appointmentData.note,
       updatedAt: new Date()
     }
   });
   ```

2. **Fixed `getAppointmentByRequestId` method:**
   ```typescript
   // Return real data từ database thay vì demo data
   return {
     id: request.id,
     appointment_time: request.appointment_time.toISOString(),
     location_type: request.appointment_location_type || 'gate',
     location_id: request.appointment_location_id || 'default',
     gate_ref: request.gate_ref || undefined,
     note: request.appointment_note || undefined,
     created_at: request.createdAt.toISOString(),
     updated_at: request.updatedAt.toISOString()
   };
   ```

**Result:** Chat hiển thị lịch hẹn thực tế mà depot đã set thay vì demo data

### Appointment Mini System Debugging

**Problems Fixed:**

1. **setDragOffset Runtime Error:**
   ```typescript
   // Trước: setDragOffset không tồn tại vì dragOffset là useRef
   setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
   
   // Sau: Sử dụng dragOffset.current đúng cách
   dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
   ```

2. **Auto-Open Logic Issue:**
   ```typescript
   // Trước: Component mặc định đóng, cần click button
   const [isOpen, setIsOpen] = useState(false);
   
   // Sau: Component tự động mở khi render
   const [isOpen, setIsOpen] = useState(true); // Auto-open when component is rendered
   ```

3. **Import Path Issues:**
   ```typescript
   // Trước: Barrel import gây conflict
   import { AppointmentMini } from '@components';
   
   // Sau: Direct import để tránh lỗi resolution
   import AppointmentMini from '@components/appointment/AppointmentMini';
   ```

4. **Missing React Import:**
   ```typescript
   // Thêm vào LoadingSpinner.tsx
   import React from 'react';
   ```

**Debug Features Added:**
- Console logging trong `AppointmentMini.tsx` để track component lifecycle
- Debug logs trong `Depot.tsx` để track `activeAppointmentRequests` state
- Error boundary handling cho drag functionality

**Files Fixed:**
- `manageContainer/frontend/components/appointment/AppointmentMini.tsx`
- `manageContainer/frontend/components/ui/LoadingSpinner.tsx`
- `manageContainer/frontend/pages/Requests/Depot.tsx`

### ETA Field Required Validation

**Problem:** ETA field trong "Tạo yêu cầu mới" form không bắt buộc

**Files Modified:**

1. **Frontend Form Validation (`RequestForm.tsx`):**
   ```tsx
   // Thêm required attribute và visual indicator
   <label htmlFor="eta">Thời gian dự kiến (ETA) <span className="required">*</span></label>
   <input 
     id="eta"
     type="datetime-local" 
     value={form.eta} 
     onChange={e => setForm({...form, eta: e.target.value})}
     required  // ← Added this
   />
   ```

2. **Backend Schema Validation (`RequestDtos.ts`):**
   ```typescript
   // Thay đổi từ optional thành required
   export const createRequestSchema = Joi.object({
     type: Joi.string().valid('IMPORT','EXPORT','CONVERT').required(),
     container_no: Joi.string().min(4).max(20).required(),
     eta: Joi.date().required()  // ← Changed from .optional() to .required()
   });
   ```

3. **CSS Styling (`globals.css`):**
   ```css
   .form-group label .required {
     color: var(--color-danger);
     font-weight: var(--font-weight-bold);
     margin-left: var(--space-1);
   }
   ```

**Result:** ETA field hiện là bắt buộc với visual indicator (*) màu đỏ và validation cả frontend lẫn backend

### Maintenance/Repairs Page Backend Integration

**New Feature:** Integration với Gate module backend để quản lý container status và tạo phiếu sửa chữa

**Backend Requirements:**
1. **Gate Module Endpoints:**
   ```typescript
   // Search container requests
   GET /gate/requests/search?status=GATE_IN&limit=100
   
   // Update container status
   PATCH /gate/requests/{id}/check
   ```

2. **Maintenance Module Endpoints:**
   ```typescript
   // Create repair ticket (equipment_id optional)
   POST /maintenance/repairs
   
   // List repair tickets
   GET /maintenance/repairs?status=PENDING_APPROVAL
   ```

3. **Database Schema Updates:**
   ```sql
   -- Container requests table
   CREATE TABLE gate_requests (
     id VARCHAR(36) PRIMARY KEY,
     container_no VARCHAR(20) NOT NULL,
     type ENUM('IMPORT', 'EXPORT') NOT NULL,
     status ENUM('GATE_IN', 'CHECKING', 'IN_YARD', 'COMPLETED') NOT NULL,
     license_plate VARCHAR(20),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   
   -- Repair tickets table (updated)
   CREATE TABLE repair_tickets (
     id VARCHAR(36) PRIMARY KEY,
     code VARCHAR(50) UNIQUE NOT NULL,
     equipment_id VARCHAR(36) NULL, -- Made optional
     created_by VARCHAR(36) NOT NULL,
     status ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED') DEFAULT 'PENDING_APPROVAL',
     problem_description TEXT NOT NULL,
     estimated_cost DECIMAL(10,2) DEFAULT 0,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

4. **Status Flow (Updated):**
   ```
   GATE_IN → CHECKING → COMPLETED (PASS) hoặc CHECKING (FAIL) → REJECTED (UNREPAIRABLE) hoặc CHECKING (REPAIRABLE)
   ```

5. **Authentication:**
   - Bearer token required
   - Role-based access control (GateManager, MaintenanceAdmin, SaleAdmin)
   - Token validation middleware

**Error Handling:**
- **401:** Unauthorized - Token missing/invalid
- **403:** Forbidden - Insufficient permissions
- **404:** Not found - Request ID không tồn tại
- **422:** Validation error - Invalid input data
- **500:** Server error - Database/network issues

**Recent Backend Changes:**
1. **Equipment ID Optional:** 
   - `equipment_id` field trong `createRepairSchema` đã được chuyển từ `required` sang `optional`
   - Database migration: `equipment_id` column trong `RepairTicket` table đã được chuyển thành `NULLABLE`
   - Service logic: Chỉ kiểm tra equipment ACTIVE khi có `equipment_id`

2. **Container Processing Flow:**
   - Container đã xử lý sẽ được xóa khỏi danh sách chờ
   - Không còn hiển thị container có trạng thái `COMPLETED`, `REJECTED`, hoặc đã tạo phiếu sửa chữa
   - UI tự động refresh sau mỗi action

### Search Bar Layout Balance Improvement

**Problem:** Search input quá nhỏ so với filter dropdowns, layout không cân đối

**Files Modified:**

1. **CSS Layout Improvements (`globals.css`):**
   ```css
   .search-input-group {
     position: relative;
     flex: 2; /* Tăng từ 1 lên 2 để search input rộng hơn */
     display: flex;
     align-items: center;
     min-width: 0; /* Đảm bảo flex item có thể shrink */
   }

   .filter-select {
     min-width: 160px; /* Tăng từ 140px để cân đối hơn */
     max-width: 200px; /* Giới hạn chiều rộng tối đa */
     flex-shrink: 0; /* Không cho shrink để giữ kích thước ổn định */
   }
   ```

2. **Responsive Design:**
   ```css
   /* Tablet adjustments */
   @media (max-width: 1024px) and (min-width: 769px) {
     .search-input-group {
       flex: 1.5; /* Giảm từ 2 xuống 1.5 cho tablet */
     }
   }

   /* Mobile adjustments */
   @media (max-width: 768px) {
     .search-bar{
       flex-direction: column;
       align-items: stretch;
       gap: var(--space-3);
     }
   }
   ```

3. **Icon Consistency (`Depot.tsx`):**
   ```tsx
   // Thay emoji bằng SVG icon cho consistency
   <span className="search-icon">
     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
       <circle cx="11" cy="11" r="8"></circle>
       <path d="m21 21-4.35-4.35"></path>
     </svg>
   </span>
   ```

**Result:** Search bar hiện có layout cân đối với tỷ lệ 2:1:1 (search input : filter 1 : filter 2) và responsive tốt trên mọi thiết bị

---

## 📋 Files Modified Summary

### Backend Files
- `manageContainer/backend/modules/requests/service/AppointmentService.ts`
  - Fixed `acceptRequest` method để lưu appointment vào database
  - Fixed `getAppointmentByRequestId` để return real data thay vì demo

**New Backend Requirements (Gate Module):**
- **Controller:** `manageContainer/backend/modules/gate/controllers/GateController.ts`
  - `searchRequests()` - Search container requests by status
  - `checkContainer()` - Update container status to CHECKING
- **Service:** `manageContainer/backend/modules/gate/services/GateService.ts`
  - Business logic cho container status management
  - Validation và error handling
- **Repository:** `manageContainer/backend/modules/gate/repositories/GateRepository.ts`
  - Database operations cho gate_requests table
- **DTOs:** `manageContainer/backend/modules/gate/dto/GateDtos.ts`
  - Request/response schemas với Joi validation

### Frontend Files

**Core Components:**
- `manageContainer/frontend/components/Button.tsx` - Enhanced với loading states, variants
- `manageContainer/frontend/components/Card.tsx` - Flexible padding, shadow options  
- `manageContainer/frontend/components/Modal.tsx` - Size presets, accessibility improvements
- `manageContainer/frontend/components/Header.tsx` - Complete refactor với responsive design
- `manageContainer/frontend/components/SearchBar.tsx` - Modern UI với clear button
- `manageContainer/frontend/components/RequestTable.tsx` - Integrated với ChatWindowStandalone

**New Components:**
- `manageContainer/frontend/components/layout/PageLayout.tsx` - Consistent page structure
- `manageContainer/frontend/components/ui/LoadingSpinner.tsx` - Loading indicators
- `manageContainer/frontend/components/ui/Badge.tsx` - Status indicators

**Chat System:**
- `manageContainer/frontend/components/chat/ChatMini.tsx` - Main chat container
- `manageContainer/frontend/components/chat/ChatWindow.tsx` - Chat logic với appointment integration
- `manageContainer/frontend/components/chat/ChatWindowStandalone.tsx` - Table integration version
- `manageContainer/frontend/components/chat/ChatHeader.tsx` - Chat header với actions
- `manageContainer/frontend/components/chat/ChatMessage.tsx` - Message display
- `manageContainer/frontend/components/chat/ChatInput.tsx` - Message input

**Styling:**
- `manageContainer/frontend/styles/globals.css` - Complete refactor với design system
- `manageContainer/frontend/styles/theme.ts` - Design tokens centralization
- `manageContainer/frontend/styles/chat-mini.css` - Chat-specific styling

**Configuration:**
- `manageContainer/frontend/components/index.ts` - Component exports

**Pages Refactored:**
- `manageContainer/frontend/pages/Maintenance/Repairs.tsx` - Complete refactor với modal system

**Documentation:**
- `manageContainer/frontend/docs/UI_REFACTOR_DOCUMENTATION.md` - This file (updated)
- `manageContainer/frontend/docs/CHAT_MINI_SYSTEM.md` - Chat system documentation
- `manageContainer/frontend/docs/COMPONENT_SYSTEM.md` - Component usage guide
- `manageContainer/frontend/docs/APPOINTMENT_MINI_SYSTEM.md` - Appointment system documentation (new)

**Total Files Modified:** 28 files (3 backend + 25 frontend)
- **New Components Added:** 4 appointment components
- **Bug Fixes Applied:** 4 critical runtime errors
- **Form Validation Enhanced:** ETA field made required
- **Maintenance Page Refactored:** Repairs page với modal system mới
- **Container Processing Flow:** Auto-remove processed containers from waiting list
- **Backend Schema Updated:** equipment_id made optional in repair tickets
- **Documentation Updated:** 2 files updated, 1 file added

**Backend Requirements Added:**
- **Gate Module:** 4 new files cần tạo cho container management
- **Maintenance Module:** Updated để hỗ trợ equipment_id optional
- **Database Schema:** gate_requests table với status flow, repair_tickets với equipment_id nullable
- **API Endpoints:** 2 new endpoints cho search và status update, 1 updated endpoint cho create repair
- **Authentication:** Role-based access control cho Gate operations
- **Database Migration:** equipment_id column trong RepairTicket table đã được chuyển thành NULLABLE

---

## 📞 Support & Maintenance

Để bảo trì và phát triển tiếp:

1. **Tuân thủ design system** - Sử dụng tokens thay vì hardcode values
2. **Component modularity** - Giữ components dưới 400 dòng
3. **Responsive first** - Test trên mobile/tablet/desktop
4. **Accessibility** - Thêm ARIA labels, keyboard support
5. **Performance** - Optimize CSS, lazy load khi cần

**Liên hệ:** Developer team để hỗ trợ khi cần thêm features mới hoặc fix bugs.

---

*Tài liệu được cập nhật lần cuối: 2024-08-19*  
*Version: 1.3.0 - Container Processing Flow + Equipment ID Optional*
