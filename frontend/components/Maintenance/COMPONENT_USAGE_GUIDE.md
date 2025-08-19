# Component Usage Guide - Maintenance Module

## 🎯 **Mục đích**

Tài liệu này cung cấp hướng dẫn chi tiết về cách sử dụng từng component trong Maintenance Module, bao gồm examples, props, và best practices.

## 📚 **Quick Start**

### **Import cơ bản:**
```tsx
import {
  CreateRepairModal,
  PendingContainersModal,
  RepairTable,
  RepairPageHeader,
  MessageDisplay
} from '@components/Maintenance';
```

### **Import chi tiết (nếu cần component cụ thể):**
```tsx
import {
  PendingContainersTable,
  ErrorDisplay,
  LoadingDisplay,
  ContainerRepairModal
} from '@components/Maintenance';
```

## 🔧 **Core Components**

### **1. CreateRepairModal**

**Mô tả**: Modal tạo phiếu sửa chữa mới (general purpose)

**Props:**
```tsx
interface CreateRepairModalProps {
  isOpen: boolean;           // Hiển thị/ẩn modal
  onClose: () => void;       // Handler đóng modal
  onSubmit: (form: any) => void; // Handler submit form
}
```

**Usage:**
```tsx
const [isModalOpen, setIsModalOpen] = useState(false);

const handleCreateRepair = async (form: any) => {
  try {
    await maintenanceApi.createRepair(form);
    setIsModalOpen(false);
    // Refresh data
  } catch (error) {
    console.error('Error creating repair:', error);
  }
};

<CreateRepairModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleCreateRepair}
/>
```

**Features:**
- Equipment selection dropdown
- Cost input validation
- Form reset after submission
- Error handling

---

### **2. ContainerRepairModal**

**Mô tả**: Modal tạo phiếu sửa chữa cho container cụ thể

**Props:**
```tsx
interface ContainerRepairModalProps {
  isOpen: boolean;           // Hiển thị/ẩn modal
  onClose: () => void;       // Handler đóng modal
  onSubmit: (form: any) => void; // Handler submit form
  selectedContainer: any;    // Container được chọn
}
```

**Usage:**
```tsx
const [isContainerRepairModalOpen, setIsContainerRepairModalOpen] = useState(false);
const [selectedContainer, setSelectedContainer] = useState(null);

const handleContainerRepair = async (form: any) => {
  try {
    const payload = {
      ...form,
      container_no: selectedContainer.container_no,
      code: `REP-${Date.now()}`
    };
    await maintenanceApi.createRepair(payload);
    setIsContainerRepairModalOpen(false);
    // Refresh data
  } catch (error) {
    console.error('Error creating container repair:', error);
  }
};

<ContainerRepairModal
  isOpen={isContainerRepairModalOpen}
  onClose={() => setIsContainerRepairModalOpen(false)}
  onSubmit={handleContainerRepair}
  selectedContainer={selectedContainer}
/>
```

**Features:**
- Pre-filled container information
- Container-specific repair form
- Simplified form (no equipment selection)

---

### **3. RepairTable**

**Mô tả**: Bảng hiển thị danh sách phiếu sửa chữa

**Props:**
```tsx
interface RepairTableProps {
  repairs: any[];            // Danh sách phiếu sửa chữa
  onApprove: (id: string) => void; // Handler duyệt phiếu
  onReject: (id: string) => void;  // Handler từ chối phiếu
}
```

**Usage:**
```tsx
const handleApprove = async (id: string) => {
  try {
    await maintenanceApi.approveRepair(id);
    // Refresh data
  } catch (error) {
    console.error('Error approving repair:', error);
  }
};

const handleReject = async (id: string) => {
  try {
    const reason = window.prompt('Lý do từ chối?') || undefined;
    await maintenanceApi.rejectRepair(id, reason);
    // Refresh data
  } catch (error) {
    console.error('Error rejecting repair:', error);
  }
};

<RepairTable
  repairs={repairs}
  onApprove={handleApprove}
  onReject={handleReject}
/>
```

**Features:**
- Status display với color coding
- Action buttons (Duyệt/Từ chối)
- Cost formatting (Vietnamese locale)
- Responsive table design

---

### **4. RepairPageHeader**

**Mô tả**: Header của trang với filter và action buttons

**Props:**
```tsx
interface RepairPageHeaderProps {
  filter: string;            // Filter hiện tại
  onFilterChange: (filter: string) => void; // Handler thay đổi filter
  onOpenPendingContainers: () => void;      // Handler mở modal container đang chờ
  onCreateRepair: () => void;               // Handler mở modal tạo phiếu
}
```

**Usage:**
```tsx
const [filter, setFilter] = useState('PENDING_APPROVAL');

const handleFilterChange = (newFilter: string) => {
  setFilter(newFilter);
  // Refresh data với filter mới
};

const handleOpenPendingContainers = () => {
  setIsPendingContainersModalOpen(true);
};

const handleCreateRepair = () => {
  setIsCreateRepairModalOpen(true);
};

<RepairPageHeader
  filter={filter}
  onFilterChange={handleFilterChange}
  onOpenPendingContainers={handleOpenPendingContainers}
  onCreateRepair={handleCreateRepair}
/>
```

**Features:**
- Status filter dropdown
- Navigation buttons
- Responsive layout
- Consistent styling

---

### **5. MessageDisplay**

**Mô tả**: Hiển thị thông báo hệ thống

**Props:**
```tsx
interface MessageDisplayProps {
  message: string;           // Nội dung thông báo
}
```

**Usage:**
```tsx
const [message, setMessage] = useState('');

// Hiển thị thông báo
setMessage('Đã tạo phiếu thành công');

// Tự động ẩn sau 3 giây
setTimeout(() => setMessage(''), 3000);

<MessageDisplay message={message} />
```

**Features:**
- Conditional rendering
- Consistent styling
- Auto-hide functionality
- Reusable component

## 📋 **Pending Containers Components**

### **6. PendingContainersModal**

**Mô tả**: Modal chính quản lý container đang chờ kiểm tra

**Props:**
```tsx
interface PendingContainersModalProps {
  isOpen: boolean;           // Hiển thị/ẩn modal
  onClose: () => void;       // Handler đóng modal
}
```

**Usage:**
```tsx
const [isPendingContainersModalOpen, setIsPendingContainersModalOpen] = useState(false);

<PendingContainersModal
  isOpen={isPendingContainersModalOpen}
  onClose={() => setIsPendingContainersModalOpen(false)}
/>
```

**Features:**
- Container checking workflow
- Repair ticket creation
- Error handling
- API integration
- Component composition

---

### **7. PendingContainersTable**

**Mô tả**: Bảng hiển thị danh sách container với action buttons

**Props:**
```tsx
interface PendingContainersTableProps {
  requests: any[];           // Danh sách container
  checkResults: {[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null};
  onCheckContainer: (requestId: string) => void;     // Handler bắt đầu kiểm tra
  onCheckResult: (requestId: string, result: 'PASS' | 'FAIL') => void; // Handler kết quả kiểm tra
  onFailOption: (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => void; // Handler lựa chọn hỏng hóc
}
```

**Usage:**
```tsx
const handleCheckContainer = (requestId: string) => {
  // Cập nhật trạng thái container thành CHECKING
  setRequests(prev => prev.map(req => 
    req.id === requestId 
      ? { ...req, status: 'CHECKING' }
      : req
  ));
};

const handleCheckResult = (requestId: string, result: 'PASS' | 'FAIL') => {
  if (result === 'PASS') {
    // Xóa container khỏi danh sách chờ
    setRequests(prev => prev.filter(req => req.id !== requestId));
  } else {
    // Hiển thị options cho hỏng hóc
    setCheckResults(prev => ({
      ...prev,
      [requestId]: 'FAIL_WITH_OPTIONS'
    }));
  }
};

const handleFailOption = (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => {
  if (option === 'UNREPAIRABLE') {
    // Xóa container khỏi danh sách chờ
    setRequests(prev => prev.filter(req => req.id !== requestId));
  } else {
    // Mở modal tạo phiếu sửa chữa
    setIsCreateRepairModalOpen(true);
  }
};

<PendingContainersTable
  requests={requests}
  checkResults={checkResults}
  onCheckContainer={handleCheckContainer}
  onCheckResult={handleCheckResult}
  onFailOption={handleFailOption}
/>
```

**Features:**
- Complex conditional rendering
- Status-based action buttons
- Type and status display với color coding
- Responsive table design

---

### **8. PendingContainersModalHeader**

**Mô tả**: Header của modal với title và close button

**Props:**
```tsx
interface PendingContainersModalHeaderProps {
  onClose: () => void;       // Handler đóng modal
}
```

**Usage:**
```tsx
<PendingContainersModalHeader
  onClose={() => setIsModalOpen(false)}
/>
```

**Features:**
- Title display
- Close button
- Consistent styling

---

### **9. PendingContainersModalContent**

**Mô tả**: Nội dung chính của modal với conditional rendering

**Props:**
```tsx
interface PendingContainersModalContentProps {
  loading: boolean;           // Trạng thái loading
  error: string;              // Thông báo lỗi
  requests: any[];            // Danh sách container
  checkResults: {[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null};
  onRetry: () => void;        // Handler thử lại
  onClose: () => void;        // Handler đóng modal
  onCheckContainer: (requestId: string) => void;
  onCheckResult: (requestId: string, result: 'PASS' | 'FAIL') => void;
  onFailOption: (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => void;
}
```

**Usage:**
```tsx
<PendingContainersModalContent
  loading={loading}
  error={error}
  requests={requests}
  checkResults={checkResults}
  onRetry={handleRetry}
  onClose={() => setIsModalOpen(false)}
  onCheckContainer={handleCheckContainer}
  onCheckResult={handleCheckResult}
  onFailOption={handleFailOption}
/>
```

**Features:**
- Conditional rendering logic
- Component composition
- State-based display

---

### **10. PendingContainersModalFooter**

**Mô tả**: Footer của modal với close button

**Props:**
```tsx
interface PendingContainersModalFooterProps {
  onClose: () => void;       // Handler đóng modal
}
```

**Usage:**
```tsx
<PendingContainersModalFooter
  onClose={() => setIsModalOpen(false)}
/>
```

**Features:**
- Close button
- Consistent styling
- Conditional display

---

### **11. PendingContainersModalContainer**

**Mô tả**: Container chính kết hợp tất cả components

**Props:**
```tsx
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

**Usage:**
```tsx
<PendingContainersModalContainer
  loading={loading}
  error={error}
  requests={requests}
  checkResults={checkResults}
  onClose={() => setIsModalOpen(false)}
  onRetry={handleRetry}
  onCheckContainer={handleCheckContainer}
  onCheckResult={handleCheckResult}
  onFailOption={handleFailOption}
/>
```

**Features:**
- Component composition
- Layout management
- Conditional footer display

## 🚨 **Utility Components**

### **12. ErrorDisplay**

**Mô tả**: Hiển thị lỗi với retry và close buttons

**Props:**
```tsx
interface ErrorDisplayProps {
  error: string;              // Nội dung lỗi
  onRetry: () => void;        // Handler thử lại
  onClose: () => void;        // Handler đóng
}
```

**Usage:**
```tsx
<ErrorDisplay
  error="Không thể kết nối đến server"
  onRetry={() => fetchData()}
  onClose={() => setIsModalOpen(false)}
/>
```

**Features:**
- Error message display
- Action buttons (Retry/Close)
- Reusable error handling
- Consistent styling

---

### **13. LoadingDisplay**

**Mô tả**: Hiển thị trạng thái loading

**Props:**
```tsx
// Không có props
```

**Usage:**
```tsx
<LoadingDisplay />
```

**Features:**
- Loading spinner
- Message display
- Reusable loading state
- Consistent styling

---

### **14. index.ts**

**Mô tả**: Export tất cả components

**Usage:**
```tsx
// Import từ index
import { CreateRepairModal, RepairTable } from '@components/Maintenance';

// Thay vì import trực tiếp
import CreateRepairModal from '@components/Maintenance/CreateRepairModal';
import RepairTable from '@components/Maintenance/RepairTable';
```

**Features:**
- Centralized exports
- Easy imports
- Clean API

## 🎯 **Complete Example**

### **Trang Repairs hoàn chỉnh:**

```tsx
import React, { useState } from 'react';
import {
  CreateRepairModal,
  PendingContainersModal,
  RepairTable,
  RepairPageHeader,
  MessageDisplay
} from '@components/Maintenance';
import { maintenanceApi } from '@services/maintenance';
import useSWR, { mutate } from 'swr';

export default function RepairsPage() {
  // State management
  const [filter, setFilter] = useState<string>('PENDING_APPROVAL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPendingContainersModalOpen, setIsPendingContainersModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Data fetching
  const key = ['repairs', filter].join(':');
  const { data: repairs } = useSWR(key, async () => 
    maintenanceApi.listRepairs(filter || undefined)
  );

  // Event handlers
  const handleCreateRepair = async (form: any) => {
    setMessage('');
    try {
      await maintenanceApi.createRepair(form);
      setMessage('Đã tạo phiếu thành công');
      setIsCreateModalOpen(false);
      mutate(key);
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Lỗi tạo phiếu');
    }
  };

  const handleApprove = async (id: string) => {
    setMessage('');
    try {
      await maintenanceApi.approveRepair(id);
      mutate(key);
      setMessage('Đã duyệt phiếu');
      setTimeout(() => setMessage(''), 3000);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Lỗi duyệt');
    }
  };

  const handleReject = async (id: string) => {
    setMessage('');
    try {
      const reason = window.prompt('Lý do từ chối?') || undefined;
      await maintenanceApi.rejectRepair(id, reason);
      mutate(key);
      setMessage('Đã từ chối phiếu');
      setTimeout(() => setMessage(''), 3000);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Lỗi từ chối');
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    mutate(key);
  };

  return (
    <>
      <Header />
      <main className="container">
        <Card title="Danh sách phiếu sửa chữa">
          <RepairPageHeader
            filter={filter}
            onFilterChange={handleFilterChange}
            onOpenPendingContainers={() => setIsPendingContainersModalOpen(true)}
            onCreateRepair={() => setIsCreateModalOpen(true)}
          />

          <MessageDisplay message={message} />

          <RepairTable
            repairs={repairs || []}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </Card>

        <CreateRepairModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateRepair}
        />

        <PendingContainersModal
          isOpen={isPendingContainersModalOpen}
          onClose={() => setIsPendingContainersModalOpen(false)}
        />
      </main>
    </>
  );
}
```

## 🔧 **Best Practices**

### **1. Component Composition:**
- Sử dụng composition thay vì inheritance
- Tách logic phức tạp thành các components nhỏ
- Sử dụng props để truyền data và handlers

### **2. State Management:**
- Giữ state ở component cha gần nhất
- Sử dụng props để truyền data xuống
- Sử dụng callbacks để truyền events lên

### **3. Error Handling:**
- Luôn có error boundaries
- Hiển thị user-friendly error messages
- Cung cấp retry mechanisms

### **4. Performance:**
- Sử dụng React.memo cho pure components
- Sử dụng useCallback cho event handlers
- Sử dụng useMemo cho expensive calculations

### **5. Accessibility:**
- Sử dụng semantic HTML
- Cung cấp ARIA labels
- Đảm bảo keyboard navigation

## 🧪 **Testing Examples**

### **Unit Test cho RepairTable:**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import RepairTable from './RepairTable';

const mockRepairs = [
  {
    id: '1',
    code: 'REP-001',
    container_no: 'CONT-001',
    status: 'PENDING_APPROVAL',
    problem_description: 'Test problem',
    estimated_cost: 1000000
  }
];

const mockOnApprove = jest.fn();
const mockOnReject = jest.fn();

describe('RepairTable', () => {
  it('renders repairs correctly', () => {
    render(
      <RepairTable
        repairs={mockRepairs}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText('REP-001')).toBeInTheDocument();
    expect(screen.getByText('CONT-001')).toBeInTheDocument();
    expect(screen.getByText('Test problem')).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', () => {
    render(
      <RepairTable
        repairs={mockRepairs}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    const approveButton = screen.getByText('Duyệt');
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledWith('1');
  });
});
```

### **Integration Test cho CreateRepairModal:**
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateRepairModal from './CreateRepairModal';

const mockOnSubmit = jest.fn();
const mockOnClose = jest.fn();

describe('CreateRepairModal', () => {
  it('submits form with correct data', async () => {
    render(
      <CreateRepairModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText('Mã phiếu'), {
      target: { value: 'REP-001' }
    });
    fireEvent.change(screen.getByLabelText('Mô tả lỗi'), {
      target: { value: 'Test problem' }
    });

    // Submit form
    const submitButton = screen.getByText('Tạo phiếu');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        code: 'REP-001',
        problem_description: 'Test problem',
        // ... other form data
      });
    });
  });
});
```

## 📚 **Tài liệu tham khảo**

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [SWR Documentation](https://swr.vercel.app/)

---

**Document Version**: 1.0.0  
**Last Updated**: 2024-08-19  
**Maintained By**: Development Team  
**Review Cycle**: Monthly
