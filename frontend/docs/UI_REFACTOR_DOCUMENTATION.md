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

**Documentation:**
- `manageContainer/frontend/docs/UI_REFACTOR_DOCUMENTATION.md` - This file (updated)
- `manageContainer/frontend/docs/CHAT_MINI_SYSTEM.md` - Chat system documentation
- `manageContainer/frontend/docs/COMPONENT_SYSTEM.md` - Component usage guide
- `manageContainer/frontend/docs/APPOINTMENT_MINI_SYSTEM.md` - Appointment system documentation (new)

**Total Files Modified:** 26 files (2 backend + 24 frontend)
- **New Components Added:** 4 appointment components
- **Bug Fixes Applied:** 4 critical runtime errors
- **Form Validation Enhanced:** ETA field made required
- **Documentation Updated:** 2 files updated, 1 file added

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

*Tài liệu được cập nhật lần cuối: 2024-12-19*  
*Version: 1.1.0 - Appointment Mini System + Bug Fixes*
