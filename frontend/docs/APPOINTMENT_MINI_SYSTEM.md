# 📅 Appointment Mini System Documentation

## 🎯 Overview

**AppointmentMini System** là một popup hiện đại được thiết kế tương tự ChatMini để tạo lịch hẹn cho depot. System này thay thế modal cũ với trải nghiệm người dùng tốt hơn, có khả năng kéo thả, thu nhỏ và thiết kế responsive.

## 📁 Cấu trúc Components

```
components/appointment/
├── AppointmentMini.tsx           # Main container với drag/drop functionality
├── AppointmentWindow.tsx         # Appointment window với form và logic
├── AppointmentHeader.tsx         # Header với title và action buttons  
├── AppointmentForm.tsx           # Form tạo lịch hẹn với validation
└── appointment-mini.css          # Dedicated styling
```

## 🧩 Chi tiết Components

### 1. AppointmentMini.tsx (Main Component)
**Chức năng:** Container chính quản lý state và position của appointment window

**Features:**
- ✅ Trigger button để mở appointment popup
- ✅ Draggable positioning với mouse events
- ✅ Minimize/restore functionality
- ✅ Auto positioning (bottom-right corner)
- ✅ State management cho drag operations
- ✅ Close/success callbacks

**Props:**
```typescript
interface AppointmentMiniProps {
  requestId: string;
  requestData?: {
    id: string;
    container_no: string;
    type: string;
    status: string;
    created_by: string;
  };
  onClose?: () => void;
  onSuccess?: () => void;
}
```

**States:**
- `isOpen` - Popup visibility
- `isMinimized` - Minimize state
- `position` - Window position
- `isDragging` - Drag state

### 2. AppointmentWindow.tsx (Window Container)
**Chức năng:** Main window container với header và form

**Features:**
- ✅ Loading state management
- ✅ Error handling và display
- ✅ Form submission coordination
- ✅ Header integration
- ✅ Success/error callbacks

**Props:**
```typescript
interface AppointmentWindowProps {
  requestId: string;
  requestData?: RequestData;
  onClose: () => void;
  onSuccess: () => void;
  onMinimize: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}
```

### 3. AppointmentHeader.tsx (Header Component)
**Chức năng:** Header với title, subtitle và action buttons

**Features:**
- ✅ Draggable area (onMouseDown trigger)
- ✅ Calendar icon
- ✅ Title và subtitle display
- ✅ Minimize và close buttons
- ✅ Hover effects

**Props:**
```typescript
interface AppointmentHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onMinimize: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}
```

### 4. AppointmentForm.tsx (Form Component)
**Chức năng:** Form tạo lịch hẹn với validation và API integration

**Features:**
- ✅ Request info display (container, type)
- ✅ DateTime picker với minimum time validation
- ✅ Location type selection (Gate/Yard)
- ✅ Location dropdown với filtering
- ✅ Gate REF input (optional)
- ✅ Note textarea với character counter
- ✅ Form validation
- ✅ API integration (`/requests/{id}/accept`)
- ✅ Loading states
- ✅ Error handling

**Props:**
```typescript
interface AppointmentFormProps {
  requestId: string;
  requestData?: RequestData;
  onSubmit: (data: AppointmentFormData) => void;
  onError: (error: string) => void;
  onSuccess: () => void;
}
```

**Form Fields:**
```typescript
interface AppointmentFormData {
  appointment_time: string;        // ISO datetime
  location_type: 'gate' | 'yard'; // Location type
  location_id: string;            // Selected location
  gate_ref?: string;              // Optional gate reference
  note?: string;                  // Optional note
}
```

## 🎨 Design System Integration

### Colors (Theo UI guidelines)
- **Primary:** `var(--color-primary)` (#007BFF)
- **Success:** `var(--color-success)` (#28A745)
- **Danger:** `var(--color-danger)` (#DC3545)
- **Background:** `var(--color-bg-primary)` (#FFFFFF)
- **Gray tones:** `var(--color-gray-50)` to `var(--color-gray-900)`

### Typography
- **Headers:** `var(--font-weight-semibold)` (600)
- **Body text:** `var(--font-size-sm)` (14px)
- **Labels:** `var(--font-weight-medium)` (500)

### Spacing
- **8px system:** `var(--space-1)` to `var(--space-12)`
- **Form gaps:** `var(--space-4)` (16px)
- **Button padding:** `var(--space-3) var(--space-4)`

### Border Radius
- **Popup:** `var(--radius-xl)` (16px)
- **Form elements:** `var(--radius-md)` (8px)
- **Minimized:** `var(--radius-full)` (9999px)

### Shadows
- **Popup:** `var(--shadow-xl)`
- **Hover effects:** `var(--shadow-sm)`

### Transitions
- **All interactions:** `var(--transition-default)` (all 0.2s ease-in-out)

## 📱 Responsive Design

### Desktop (Default)
- **Size:** 420×550px
- **Position:** Bottom-right corner
- **Multi-window:** Auto offset by 420px

### Mobile/Tablet (<480px)
- **Size:** calc(100vw - 32px) × calc(100vh - 100px)
- **Max size:** 400×600px
- **Form:** Reduced padding và gaps
- **Radio:** Vertical layout
- **Header:** Smaller padding

## 🔧 Integration Guide

### 1. Import Components
```typescript
import { AppointmentMini } from '@components';
```

### 2. State Management
```typescript
const [activeAppointmentRequests, setActiveAppointmentRequests] = 
  useState<Set<string>>(new Set());

const toggleAppointment = (requestId: string) => {
  setActiveAppointmentRequests(prev => {
    const newSet = new Set(prev);
    if (newSet.has(requestId)) {
      newSet.delete(requestId);
    } else {
      newSet.add(requestId);
    }
    return newSet;
  });
};
```

### 3. Render Components
```tsx
{Array.from(activeAppointmentRequests).map((requestId) => {
  const request = data?.find((r: any) => r.id === requestId);
  if (!request) return null;
  
  return (
    <AppointmentMini
      key={requestId}
      requestId={requestId}
      requestData={{
        id: request.id,
        container_no: request.container_no,
        type: request.type,
        status: request.status,
        created_by: request.created_by
      }}
      onClose={() => handleAppointmentClose(requestId)}
      onSuccess={() => handleAppointmentSuccess(requestId)}
    />
  );
})}
```

### 4. Trigger Action
```typescript
// Thay vì mở modal cũ
setShowAppointmentModal(true);

// Sử dụng AppointmentMini
setActiveAppointmentRequests(prev => new Set(prev).add(requestId));
```

## 🎯 Features Comparison

| Feature | Old Modal | AppointmentMini |
|---------|-----------|-----------------|
| **UI Style** | Static modal | Modern popup |
| **Positioning** | Fixed center | Draggable |
| **Multi-instance** | ❌ Single | ✅ Multiple |
| **Minimize** | ❌ No | ✅ Yes |
| **Mobile UX** | Basic | Optimized |
| **Animations** | Basic | Smooth |
| **Error Handling** | Basic | Enhanced |
| **Loading States** | Basic | Advanced |

## 🚀 Usage Examples

### Basic Usage
```tsx
<AppointmentMini
  requestId="req-123"
  requestData={{
    id: "req-123",
    container_no: "ISO 1234",
    type: "IMPORT",
    status: "PENDING",
    created_by: "user-456"
  }}
  onClose={() => console.log('Closed')}
  onSuccess={() => console.log('Success')}
/>
```

### Integration trong Depot Page
```tsx
// Trigger khi click "Tiếp nhận"
} else if (status === 'RECEIVED') {
  setActiveAppointmentRequests(prev => new Set(prev).add(id));
  setLoadingId('');
  return;
}
```

## 📋 Files Modified

**New Components:**
- `components/appointment/AppointmentMini.tsx` (143 lines)
- `components/appointment/AppointmentWindow.tsx` (89 lines)
- `components/appointment/AppointmentHeader.tsx` (46 lines)
- `components/appointment/AppointmentForm.tsx` (285 lines)

**Styling:**
- `styles/appointment-mini.css` (482 lines)
- `styles/globals.css` - Added import

**Integration:**
- `pages/Requests/Depot.tsx` - Added AppointmentMini integration
- `components/index.ts` - Added exports

**Documentation:**
- `docs/APPOINTMENT_MINI_SYSTEM.md` - This file

**Total:** 8 files (4 new components + 4 modified)

## 🎉 Result

✅ **Modern Appointment UI** thay thế modal cũ  
✅ **Draggable positioning** với smooth animations  
✅ **Multi-appointment support** - mở nhiều appointment cùng lúc  
✅ **Minimize/restore** functionality  
✅ **Enhanced form validation** và error handling  
✅ **Mobile responsive** với optimized UX  
✅ **Consistent design** theo UI guidelines  
✅ **Easy integration** vào existing codebase  

**AppointmentMini system đã sẵn sàng thay thế hoàn toàn appointment modal cũ!** 🎯





