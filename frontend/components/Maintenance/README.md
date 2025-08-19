# Maintenance Module Components

## 🎯 **Mục đích**

Thư mục này chứa tất cả các components liên quan đến Maintenance Module, được tách nhỏ từ file `Repairs.tsx` gốc để dễ dàng quản lý, bảo trì và tái sử dụng.

## 🏗️ **Cấu trúc Components**

### **🔧 Core Components (5 components)**
- **`CreateRepairModal.tsx`** - Modal tạo phiếu sửa chữa mới (general purpose)
- **`ContainerRepairModal.tsx`** - Modal tạo phiếu sửa chữa cho container cụ thể
- **`RepairTable.tsx`** - Bảng hiển thị danh sách phiếu sửa chữa
- **`RepairPageHeader.tsx`** - Header của trang với filter và action buttons
- **`MessageDisplay.tsx`** - Hiển thị thông báo hệ thống

### **📋 Pending Containers Components (6 components)**
- **`PendingContainersModal.tsx`** - Modal chính quản lý container đang chờ kiểm tra
- **`PendingContainersModalContainer.tsx`** - Container chính kết hợp tất cả components
- **`PendingContainersModalHeader.tsx`** - Header của modal với title và close button
- **`PendingContainersModalContent.tsx`** - Nội dung chính với conditional rendering
- **`PendingContainersModalFooter.tsx`** - Footer của modal với close button
- **`PendingContainersTable.tsx`** - Bảng hiển thị danh sách container với action buttons

### **🚨 Utility Components (3 components)**
- **`ErrorDisplay.tsx`** - Hiển thị lỗi với retry và close buttons
- **`LoadingDisplay.tsx`** - Hiển thị trạng thái loading
- **`index.ts`** - Export tất cả components

## 📊 **Thống kê Files**

- **Tổng số files**: 15 components
- **File lớn nhất**: `PendingContainersModal.tsx` (677 dòng)
- **File nhỏ nhất**: `LoadingDisplay.tsx` (15 dòng)
- **Trung bình**: ~200 dòng/file

## 🔄 **Component Hierarchy**

```
Maintenance Module
├── Core Components
│   ├── CreateRepairModal
│   ├── ContainerRepairModal
│   ├── RepairTable
│   ├── RepairPageHeader
│   └── MessageDisplay
├── Pending Containers Components
│   ├── PendingContainersModal (Main)
│   ├── PendingContainersModalContainer
│   ├── PendingContainersModalHeader
│   ├── PendingContainersModalContent
│   ├── PendingContainersModalFooter
│   └── PendingContainersTable
└── Utility Components
    ├── ErrorDisplay
    ├── LoadingDisplay
    └── index.ts
```

## 📋 **Chi tiết từng Component**

### **🔧 Core Components**

#### **CreateRepairModal**
- **Chức năng**: Tạo phiếu sửa chữa mới
- **Props**: `isOpen`, `onClose`, `onSubmit`
- **Features**: Equipment selection, cost validation, form reset

#### **ContainerRepairModal**
- **Chức năng**: Tạo phiếu sửa chữa cho container cụ thể
- **Props**: `isOpen`, `onClose`, `onSubmit`, `selectedContainer`
- **Features**: Pre-filled container info, simplified form

#### **RepairTable**
- **Chức năng**: Hiển thị danh sách phiếu sửa chữa
- **Props**: `repairs`, `onApprove`, `onReject`
- **Features**: Status display, action buttons, cost formatting

#### **RepairPageHeader**
- **Chức năng**: Header với filter và action buttons
- **Props**: `filter`, `onFilterChange`, `onOpenPendingContainers`, `onCreateRepair`
- **Features**: Status filter, navigation buttons

#### **MessageDisplay**
- **Chức năng**: Hiển thị thông báo hệ thống
- **Props**: `message`
- **Features**: Conditional rendering, auto-hide

### **📋 Pending Containers Components**

#### **PendingContainersModal**
- **Chức năng**: Modal chính quản lý container đang chờ
- **Props**: `isOpen`, `onClose`
- **Features**: Container checking workflow, repair ticket creation

#### **PendingContainersModalContainer**
- **Chức năng**: Container chính kết hợp tất cả components
- **Props**: Tất cả props cần thiết cho workflow
- **Features**: Component composition, layout management

#### **PendingContainersModalHeader**
- **Chức năng**: Header của modal
- **Props**: `onClose`
- **Features**: Title display, close button

#### **PendingContainersModalContent**
- **Chức năng**: Nội dung chính với conditional rendering
- **Props**: `loading`, `error`, `requests`, `checkResults`, handlers
- **Features**: Conditional rendering logic, component composition

#### **PendingContainersModalFooter**
- **Chức năng**: Footer của modal
- **Props**: `onClose`
- **Features**: Close button, conditional display

#### **PendingContainersTable**
- **Chức năng**: Bảng hiển thị danh sách container
- **Props**: `requests`, `checkResults`, handlers
- **Features**: Complex conditional rendering, status-based actions

### **🚨 Utility Components**

#### **ErrorDisplay**
- **Chức năng**: Hiển thị lỗi với action buttons
- **Props**: `error`, `onRetry`, `onClose`
- **Features**: Error message, retry/close buttons

#### **LoadingDisplay**
- **Chức năng**: Hiển thị trạng thái loading
- **Props**: Không có
- **Features**: Loading spinner, message

#### **index.ts**
- **Chức năng**: Export tất cả components
- **Features**: Centralized exports, easy imports

## 🔄 **Data Flow & State Management**

### **State Flow:**
1. **Parent Component** (`Repairs.tsx`) quản lý state chính
2. **Props** được truyền xuống các child components
3. **Event handlers** được truyền lên qua callbacks
4. **Local state** được quản lý trong từng component khi cần thiết

### **Key States:**
- `filter`: Trạng thái filter hiện tại
- `requests`: Danh sách container đang chờ
- `checkResults`: Kết quả kiểm tra từng container
- `loading`: Trạng thái loading
- `error`: Thông báo lỗi

## 🎨 **Styling & Design Patterns**

### **Styling Approach:**
- **Inline styles** cho consistency và maintainability
- **Color coding** cho status và type
- **Responsive design** với maxWidth và overflow
- **Consistent spacing** và typography

### **Design Patterns:**
- **Component composition** thay vì inheritance
- **Props drilling** cho data flow
- **Conditional rendering** cho dynamic UI
- **Reusable components** cho common patterns

## 🧪 **Testing Strategy**

### **Testing Levels:**
1. **Unit Tests**: Test từng component riêng biệt
2. **Integration Tests**: Test interaction giữa components
3. **E2E Tests**: Test complete workflow

### **Testing Tools:**
- **React Testing Library** cho component testing
- **Jest** cho test runner
- **Mock functions** cho API calls

## 🚀 **Performance Considerations**

### **Optimization Techniques:**
- **React.memo** cho pure components
- **useCallback** cho event handlers
- **useMemo** cho expensive calculations
- **Lazy loading** cho large components

### **Bundle Size:**
- **Tree shaking** với ES6 modules
- **Code splitting** cho large components
- **Dynamic imports** khi cần thiết

## 🔧 **Development Workflow**

### **Component Creation:**
1. **Define interface** cho props
2. **Implement component** logic
3. **Add to index.ts** export
4. **Update documentation**
5. **Write tests**

### **Refactoring Process:**
1. **Identify large components** (>400 lines)
2. **Extract logical parts** thành separate components
3. **Update imports/exports**
4. **Test functionality**
5. **Update documentation**

## 📊 **Metrics & KPIs**

### **Code Quality:**
- **Lines per file**: <400 (target)
- **Component complexity**: Low
- **Reusability**: High
- **Test coverage**: >80%

### **Performance:**
- **Bundle size**: Optimized
- **Render time**: <16ms
- **Memory usage**: Minimal

## 🎯 **Best Practices**

### **Component Design:**
- **Single responsibility** principle
- **Props interface** definition
- **Error boundaries** implementation
- **Accessibility** compliance

### **Code Organization:**
- **Logical grouping** của related components
- **Consistent naming** conventions
- **Clear separation** của concerns
- **Documentation** cho complex logic

## 🔮 **Future Enhancements**

### **Planned Improvements:**
- **TypeScript strict mode** implementation
- **Storybook** integration cho component documentation
- **Performance monitoring** tools
- **Automated testing** pipeline

### **Potential Additions:**
- **Theme system** cho consistent styling
- **Animation library** cho smooth transitions
- **Internationalization** support
- **Accessibility** improvements

## 📚 **References & Resources**

### **Documentation:**
- **React Documentation**: Component patterns và best practices
- **TypeScript Handbook**: Type safety và interfaces
- **Testing Library**: Component testing strategies

### **Tools:**
- **ESLint**: Code quality và consistency
- **Prettier**: Code formatting
- **Husky**: Git hooks cho quality checks

---

## 📝 **Changelog**

### **Version 1.3.0** (2024-08-19)
- ✅ Tách `PendingContainersModal.tsx` thành 8 components nhỏ hơn
- ✅ Tạo `COMPONENT_ARCHITECTURE.md` cho architectural overview
- ✅ Tạo `COMPONENT_USAGE_GUIDE.md` cho usage examples
- ✅ Cập nhật documentation và README

### **Version 1.2.0** (2024-08-19)
- ✅ Tách `Repairs.tsx` thành 15 components nhỏ hơn
- ✅ Tất cả components <400 dòng
- ✅ Cải thiện maintainability và reusability

### **Version 1.1.0** (2024-08-19)
- ✅ Refactor UI của Maintenance/Repairs page
- ✅ Thêm "Danh sách container đang chờ" functionality
- ✅ Backend integration cho container processing

### **Version 1.0.0** (2024-08-19)
- 🎉 Initial release
- ✅ Basic Maintenance/Repairs functionality

---

**Document Version**: 1.3.0  
**Last Updated**: 2024-08-19  
**Maintained By**: Development Team  
**Review Cycle**: Monthly
