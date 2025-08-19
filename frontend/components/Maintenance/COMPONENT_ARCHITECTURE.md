# Component Architecture - Maintenance Module

## 🎯 **Tổng quan**

Tài liệu này mô tả chi tiết kiến trúc component của Maintenance Module sau khi được tách nhỏ từ file `Repairs.tsx` gốc (~1367 dòng) thành 15 components nhỏ hơn, mỗi component <400 dòng.

## 🏗️ **Kiến trúc tổng thể**

### **Component Tree (Cây component):**
```
Maintenance Module
├── Core Components (5 components)
│   ├── CreateRepairModal
│   ├── ContainerRepairModal
│   ├── RepairTable
│   ├── RepairPageHeader
│   └── MessageDisplay
├── Pending Containers Components (6 components)
│   ├── PendingContainersModal (Main)
│   ├── PendingContainersModalContainer
│   ├── PendingContainersModalHeader
│   ├── PendingContainersModalContent
│   ├── PendingContainersModalFooter
│   └── PendingContainersTable
└── Utility Components (3 components)
    ├── ErrorDisplay
    ├── LoadingDisplay
    └── index.ts
```

## 📋 **Chi tiết từng Component**

### **🔧 Core Components**

#### **1. CreateRepairModal.tsx (~150 dòng)**
```typescript
interface CreateRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: any) => void;
}
```
- **Responsibility**: Modal tạo phiếu sửa chữa mới (general purpose)
- **State Management**: Form data, cost string, message
- **Dependencies**: `useSWR`, `maintenanceApi.listEquipments()`
- **Key Features**: 
  - Equipment selection dropdown
  - Cost input validation
  - Form reset after submission

#### **2. ContainerRepairModal.tsx (~180 dòng)**
```typescript
interface ContainerRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: any) => void;
  selectedContainer: any;
}
```
- **Responsibility**: Modal tạo phiếu sửa chữa cho container cụ thể
- **State Management**: Repair form data
- **Dependencies**: `selectedContainer` prop
- **Key Features**:
  - Pre-filled container information
  - Container-specific repair form
  - Simplified form (no equipment selection)

#### **3. RepairTable.tsx (~120 dòng)**
```typescript
interface RepairTableProps {
  repairs: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}
```
- **Responsibility**: Bảng hiển thị danh sách phiếu sửa chữa
- **State Management**: Không có (pure component)
- **Dependencies**: `repairs` array, action handlers
- **Key Features**:
  - Status display với color coding
  - Action buttons (Duyệt/Từ chối)
  - Cost formatting (Vietnamese locale)

#### **4. RepairPageHeader.tsx (~80 dòng)**
```typescript
interface RepairPageHeaderProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  onOpenPendingContainers: () => void;
  onCreateRepair: () => void;
}
```
- **Responsibility**: Header của trang với filter và action buttons
- **State Management**: Không có (controlled component)
- **Dependencies**: Filter state, action handlers
- **Key Features**:
  - Status filter dropdown
  - Navigation buttons
  - Responsive layout

#### **5. MessageDisplay.tsx (~25 dòng)**
```typescript
interface MessageDisplayProps {
  message: string;
}
```
- **Responsibility**: Hiển thị thông báo hệ thống
- **State Management**: Không có (pure component)
- **Dependencies**: `message` prop
- **Key Features**:
  - Conditional rendering
  - Consistent styling
  - Auto-hide functionality

### **📋 Pending Containers Components**

#### **6. PendingContainersModal.tsx (~200 dòng)**
```typescript
interface PendingContainersModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```
- **Responsibility**: Modal chính quản lý container đang chờ kiểm tra
- **State Management**: 
  - `requests`: Danh sách container
  - `loading`: Trạng thái loading
  - `error`: Thông báo lỗi
  - `checkResults`: Kết quả kiểm tra
  - `isCreateRepairModalOpen`: Trạng thái modal tạo phiếu
  - `selectedContainerForRepair`: Container được chọn để tạo phiếu
- **Dependencies**: `maintenanceApi`, `mutate` (SWR)
- **Key Features**:
  - Container checking workflow
  - Repair ticket creation
  - Error handling
  - API integration

#### **7. PendingContainersTable.tsx (~200 dòng)**
```typescript
interface PendingContainersTableProps {
  requests: any[];
  checkResults: {[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null};
  onCheckContainer: (requestId: string) => void;
  onCheckResult: (requestId: string, result: 'PASS' | 'FAIL') => void;
  onFailOption: (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => void;
}
```
- **Responsibility**: Bảng hiển thị danh sách container với action buttons
- **State Management**: Không có (pure component)
- **Dependencies**: `requests`, `checkResults`, action handlers
- **Key Features**:
  - Complex conditional rendering
  - Status-based action buttons
  - Type and status display với color coding
  - Responsive table design

#### **8. PendingContainersModalHeader.tsx (~30 dòng)**
```typescript
interface PendingContainersModalHeaderProps {
  onClose: () => void;
}
```
- **Responsibility**: Header của modal với title và close button
- **State Management**: Không có (pure component)
- **Dependencies**: `onClose` handler
- **Key Features**:
  - Title display
  - Close button
  - Consistent styling

#### **9. PendingContainersModalContent.tsx (~50 dòng)**
```typescript
interface PendingContainersModalContentProps {
  loading: boolean;
  error: string;
  requests: any[];
  checkResults: {[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null};
  onRetry: () => void;
  onClose: () => void;
  onCheckContainer: (requestId: string) => void;
  onCheckResult: (requestId: string, result: 'PASS' | 'FAIL') => void;
  onFailOption: (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => void;
}
```
- **Responsibility**: Nội dung chính của modal với conditional rendering
- **State Management**: Không có (pure component)
- **Dependencies**: Tất cả props cần thiết
- **Key Features**:
  - Conditional rendering logic
  - Component composition
  - State-based display

#### **10. PendingContainersModalFooter.tsx (~30 dòng)**
```typescript
interface PendingContainersModalFooterProps {
  onClose: () => void;
}
```
- **Responsibility**: Footer của modal với close button
- **State Management**: Không có (pure component)
- **Dependencies**: `onClose` handler
- **Key Features**:
  - Close button
  - Consistent styling
  - Conditional display

#### **11. PendingContainersModalContainer.tsx (~50 dòng)**
```typescript
interface PendingContainersModalContainerProps {
  loading: boolean;
  error: string;
  requests: any[];
  checkResults: {[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null};
  onClose: () => void;
  onRetry: () => void;
  onCheckContainer: (requestId: string) => void;
  onCheckResult: (requestId: string, result: 'PASS' | 'FAIL') => void;
  onFailOption: (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => void;
}
```
- **Responsibility**: Container chính kết hợp tất cả components
- **State Management**: Không có (pure component)
- **Dependencies**: Tất cả props cần thiết
- **Key Features**:
  - Component composition
  - Layout management
  - Conditional footer display

### **🚨 Utility Components**

#### **12. ErrorDisplay.tsx (~50 dòng)**
```typescript
interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}
```
- **Responsibility**: Hiển thị lỗi với retry và close buttons
- **State Management**: Không có (pure component)
- **Dependencies**: `error`, `onRetry`, `onClose`
- **Key Features**:
  - Error message display
  - Action buttons (Retry/Close)
  - Reusable error handling
  - Consistent styling

#### **13. LoadingDisplay.tsx (~20 dòng)**
```typescript
// Không có props interface
```
- **Responsibility**: Hiển thị trạng thái loading
- **State Management**: Không có (pure component)
- **Dependencies**: Không có
- **Key Features**:
  - Loading spinner
  - Message display
  - Reusable loading state
  - Consistent styling

#### **14. index.ts (~20 dòng)**
```typescript
// Export statements
export { default as CreateRepairModal } from './CreateRepairModal';
export { default as ContainerRepairModal } from './ContainerRepairModal';
// ... các exports khác
```
- **Responsibility**: Export tất cả components
- **State Management**: Không có
- **Dependencies**: Tất cả component files
- **Key Features**:
  - Centralized exports
  - Easy imports
  - Clean API

## 🔄 **Data Flow & State Management**

### **State Flow trong PendingContainersModal:**
```
1. Modal mở → fetchPendingContainers() → setLoading(true)
2. API call → setRequests(data) → setLoading(false)
3. User action → update local state → trigger re-render
4. Container processed → filter out from requests
5. Repair created → mutate SWR cache → refresh main table
```

### **Props Drilling:**
```
PendingContainersModal (State Owner)
├── PendingContainersModalContainer
│   ├── PendingContainersModalHeader
│   ├── PendingContainersModalContent
│   │   ├── LoadingDisplay
│   │   ├── ErrorDisplay
│   │   └── PendingContainersTable
│   └── PendingContainersModalFooter
└── ContainerRepairModal
```

## 🎨 **Styling & Design Patterns**

### **Consistent Styling:**
- **Colors**: Sử dụng Tailwind CSS color palette
- **Spacing**: Consistent padding/margin (8px, 12px, 16px, 20px, 24px)
- **Typography**: Font sizes (12px, 14px, 18px), weights (400, 500, 600)
- **Borders**: Consistent border radius (4px, 8px, 12px)
- **Shadows**: Subtle shadows cho depth

### **Design Patterns:**
- **Modal Pattern**: Overlay + Content structure
- **Table Pattern**: Header + Body + Conditional rendering
- **Button Pattern**: Consistent button styles với variants
- **Status Pattern**: Color-coded status badges
- **Form Pattern**: Label + Input + Validation

## 🧪 **Testing Strategy**

### **Unit Testing:**
- **Pure Components**: Test props và rendering
- **State Components**: Test state changes và side effects
- **Event Handlers**: Test user interactions
- **Conditional Rendering**: Test different states

### **Integration Testing:**
- **Component Composition**: Test component interactions
- **Data Flow**: Test props passing
- **User Workflows**: Test complete user journeys

### **Mock Strategy:**
- **API Calls**: Mock maintenanceApi và fetch calls
- **Event Handlers**: Mock onClick, onChange handlers
- **State Updates**: Mock useState và useEffect

## 🚀 **Performance Considerations**

### **Optimization Techniques:**
- **React.memo**: Cho pure components
- **useCallback**: Cho event handlers
- **useMemo**: Cho expensive calculations
- **Lazy Loading**: Cho modal components

### **Bundle Size:**
- **Tree Shaking**: Chỉ import components cần thiết
- **Code Splitting**: Tách components theo feature
- **Minification**: Optimize production build

## 🔧 **Development Workflow**

### **1. Tạo Component Mới:**
```bash
# 1. Tạo file component
touch NewComponent.tsx

# 2. Export trong index.ts
export { default as NewComponent } from './NewComponent';

# 3. Cập nhật README.md
# 4. Test component
# 5. Commit changes
```

### **2. Sửa Đổi Component:**
- Chỉ sửa component cần thiết
- Không ảnh hưởng đến components khác
- Dễ dàng rollback nếu có lỗi

### **3. Code Review:**
- Review từng component riêng biệt
- Kiểm tra props interface
- Đảm bảo consistent styling
- Test functionality

## 📊 **Metrics & KPIs**

### **Code Quality Metrics:**
- **Lines per Component**: <400 dòng
- **Cyclomatic Complexity**: <10
- **Component Coupling**: Low
- **Reusability Score**: High

### **Performance Metrics:**
- **Bundle Size**: <100KB (gzipped)
- **Render Time**: <16ms
- **Memory Usage**: <50MB
- **Re-render Frequency**: Minimal

## 🎯 **Best Practices**

### **1. Component Design:**
- Single Responsibility Principle
- Props Interface Definition
- Consistent Naming Convention
- Error Boundary Implementation

### **2. State Management:**
- Local State cho UI
- Props cho data flow
- Context cho global state (nếu cần)
- SWR cho server state

### **3. Performance:**
- Memoization cho expensive operations
- Lazy loading cho heavy components
- Optimized re-renders
- Bundle size optimization

### **4. Testing:**
- Unit tests cho mỗi component
- Integration tests cho workflows
- E2E tests cho user journeys
- Mock strategy cho dependencies

## 🔮 **Future Enhancements**

### **1. TypeScript Improvements:**
- Strict type definitions
- Generic components
- Union types cho props
- Type guards cho runtime checks

### **2. Component Library:**
- Design system components
- Theme support
- Accessibility improvements
- Internationalization

### **3. Performance Optimizations:**
- Virtual scrolling cho large tables
- Lazy loading cho modals
- Code splitting strategies
- Bundle optimization

### **4. Testing Enhancements:**
- Visual regression testing
- Performance testing
- Accessibility testing
- Cross-browser testing

## 📚 **References & Resources**

### **React Patterns:**
- [React Component Patterns](https://reactpatterns.com/)
- [React Best Practices](https://reactjs.org/docs/hooks-faq.html)
- [React Performance](https://reactjs.org/docs/optimizing-performance.html)

### **TypeScript:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### **Testing:**
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### **Styling:**
- [Tailwind CSS](https://tailwindcss.com/docs)
- [CSS-in-JS Patterns](https://cssinjs.org/)

---

**Document Version**: 1.0.0  
**Last Updated**: 2024-08-19  
**Maintained By**: Development Team  
**Review Cycle**: Monthly
