# Tính năng Appointment Form - Frontend Documentation

## 📋 Tổng quan

Tính năng Appointment Form cho phép depot tạo và quản lý lịch hẹn cho các request container. Form này được sử dụng trong pop-up khi depot click "Tiếp nhận" request từ trạng thái PENDING.

**Tính năng mới:** Thời gian mặc định được thiết lập là thời gian hiện tại + 1 giờ thay vì hiển thị null.

## 🚀 Tính năng chính

### **1. Tạo lịch hẹn mới**
- Form pop-up hiển thị khi click "Tiếp nhận" request PENDING
- Thời gian mặc định: Thời gian hiện tại + 1 giờ
- Ngày mặc định: Ngày hiện tại
- Validation: Thời gian phải trong tương lai

### **2. Thay đổi lịch hẹn**
- Form pop-up hiển thị khi click "Reschedule" request SCHEDULED
- Giữ nguyên thông tin lịch hẹn hiện tại
- Cho phép cập nhật thời gian và địa điểm

### **3. Quản lý địa điểm**
- Chỉ hiển thị loại địa điểm "Cổng (Gate)"
- Dropdown chọn cổng cụ thể
- Tùy chọn nhập GATE REF

## 🏗️ Implementation Details

### **Component: AppointmentForm.tsx**

#### **Thời gian mặc định:**
```typescript
// Tạo thời gian mặc định (hiện tại + 1 giờ)
const getDefaultDateTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
};

const [formData, setFormData] = useState<AppointmentFormData>({
  appointment_time: getDefaultDateTime(), // Thay vì ''
  location_type: 'gate',
  location_id: '',
  gate_ref: '',
  note: ''
});
```

#### **Form Fields:**
```typescript
interface AppointmentFormData {
  appointment_time: string;        // ISO datetime string
  location_type: 'gate' | 'yard'; // Chỉ hỗ trợ 'gate'
  location_id: string;            // ID của cổng được chọn
  gate_ref?: string;              // GATE REF (tùy chọn)
  note?: string;                  // Ghi chú (tùy chọn)
}
```

#### **Validation Logic:**
```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.appointment_time) {
    newErrors.appointment_time = 'Thời gian lịch hẹn là bắt buộc';
  }

  if (!formData.location_type) {
    newErrors.location_type = 'Vui lòng chọn loại địa điểm';
  }

  if (!formData.location_id) {
    newErrors.location_id = 'Vui lòng chọn địa điểm';
  }

  // Validate appointment_time is in the future
  if (formData.appointment_time) {
    const selectedTime = new Date(formData.appointment_time);
    const now = new Date();
    if (selectedTime <= now) {
      newErrors.appointment_time = 'Thời gian lịch hẹn phải trong tương lai';
    }
    
    // Validate appointment_time is valid date
    if (isNaN(selectedTime.getTime())) {
      newErrors.appointment_time = 'Thời gian lịch hẹn không hợp lệ';
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### **Component: AppointmentMini.tsx**

#### **Props Interface:**
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
  mode?: 'create' | 'change'; // Mới: Phân biệt tạo mới hay thay đổi
}
```

#### **Draggable Modal:**
```typescript
// Drag functionality
const handleDragStart = (e: React.MouseEvent) => {
  setIsDragging(true);
  const rect = appointmentRef.current?.getBoundingClientRect();
  if (rect) {
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
};
```

### **Component: AppointmentWindow.tsx**

#### **Props Interface:**
```typescript
interface AppointmentWindowProps {
  requestId: string;
  requestData?: {
    id: string;
    container_no: string;
    type: string;
    status: string;
    created_by: string;
  };
  onClose: () => void;
  onSuccess: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  mode?: 'create' | 'change';
}
```

## 🎨 UI/UX Design

### **Form Layout:**
```tsx
<form className="appointment-form" onSubmit={handleSubmit}>
  <div className="appointment-form-content">
    {/* Request Info */}
    <div className="appointment-request-info">
      <div className="appointment-info-item">
        <span className="appointment-info-label">Container:</span>
        <span className="appointment-info-value">{requestData?.container_no || requestId}</span>
      </div>
      <div className="appointment-info-item">
        <span className="appointment-info-label">Loại:</span>
        <span className="appointment-info-value">{requestData?.type || 'N/A'}</span>
      </div>
    </div>

    {/* Appointment Date */}
    <div className="appointment-form-group">
      <label className="appointment-form-label" htmlFor="appointment_date">
        Ngày lịch hẹn *
      </label>
      <input
        type="date"
        id="appointment_date"
        className={`appointment-form-input ${errors.appointment_time ? 'error' : ''}`}
        value={formData.appointment_time ? formData.appointment_time.split('T')[0] : new Date().toISOString().split('T')[0]}
        onChange={(e) => {
          const time = formData.appointment_time ? formData.appointment_time.split('T')[1] || '09:00' : '09:00';
          handleInputChange('appointment_time', `${e.target.value}T${time}`);
        }}
        min={new Date().toISOString().split('T')[0]}
        disabled={loading}
      />
    </div>

    {/* Appointment Time */}
    <div className="appointment-form-group">
      <label className="appointment-form-label" htmlFor="appointment_time">
        Giờ lịch hẹn *
      </label>
      <input
        type="time"
        id="appointment_time"
        className={`appointment-form-input ${errors.appointment_time ? 'error' : ''}`}
        value={formData.appointment_time ? formData.appointment_time.split('T')[1] || '09:00' : '09:00'}
        onChange={(e) => {
          const date = formData.appointment_time ? formData.appointment_time.split('T')[0] : new Date().toISOString().split('T')[0];
          handleInputChange('appointment_time', `${date}T${e.target.value}`);
        }}
        disabled={loading}
      />
      {errors.appointment_time && (
        <span className="appointment-form-error">{errors.appointment_time}</span>
      )}
    </div>

    {/* Location Type - Chỉ hiển thị Cổng */}
    <div className="appointment-form-group">
      <label className="appointment-form-label">Loại địa điểm *</label>
      <div className="appointment-radio-group">
        <label className="appointment-radio-item">
          <input
            type="radio"
            name="location_type"
            value="gate"
            checked={formData.location_type === 'gate'}
            onChange={(e) => handleInputChange('location_type', e.target.value)}
            disabled={loading}
          />
          <span className="appointment-radio-text">Cổng (Gate)</span>
        </label>
      </div>
    </div>

    {/* Location */}
    <div className="appointment-form-group">
      <label className="appointment-form-label" htmlFor="location_id">
        Địa điểm *
      </label>
      <select
        id="location_id"
        className={`appointment-form-select ${errors.location_id ? 'error' : ''}`}
        value={formData.location_id}
        onChange={(e) => handleInputChange('location_id', e.target.value)}
        disabled={loading}
      >
        <option value="">Chọn địa điểm</option>
        {filteredLocations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
      {errors.location_id && (
        <span className="appointment-form-error">{errors.location_id}</span>
      )}
    </div>

    {/* Gate Ref */}
    <div className="appointment-form-group">
      <label className="appointment-form-label" htmlFor="gate_ref">
        GATE REF <span className="text-gray-500 text-sm">(tùy chọn)</span>
      </label>
      <input
        type="text"
        id="gate_ref"
        className="appointment-form-input"
        value={formData.gate_ref}
        onChange={(e) => handleInputChange('gate_ref', e.target.value)}
        placeholder="Nhập GATE REF nếu có"
        maxLength={100}
        disabled={loading}
      />
    </div>

    {/* Note */}
    <div className="appointment-form-group">
      <label className="appointment-form-label" htmlFor="note">
        Ghi chú <span className="text-gray-500 text-sm">(tùy chọn)</span>
      </label>
      <textarea
        id="note"
        className="appointment-form-textarea"
        value={formData.note}
        onChange={(e) => handleInputChange('note', e.target.value)}
        placeholder="Nhập ghi chú cho lịch hẹn..."
        maxLength={500}
        rows={3}
        disabled={loading}
      />
      <div className="appointment-form-counter">
        {formData.note?.length || 0}/500
      </div>
    </div>
  </div>

  {/* Form Actions */}
  <div className="appointment-form-actions">
    <button
      type="submit"
      className="appointment-form-submit"
      disabled={loading}
    >
      {loading ? (
        <>
          <div className="appointment-loading-spinner"></div>
          <span>Đang xử lý...</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
          </svg>
          <span>{mode === 'change' ? 'Cập nhật lịch hẹn' : 'Tạo lịch hẹn'}</span>
        </>
      )}
    </button>
  </div>
</form>
```

## 🔧 API Integration

### **Appointment Creation:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  try {
    // Convert datetime-local to Date object and map fields to match backend DTO
    const appointmentData = {
      appointment_time: new Date(formData.appointment_time), // Backend expects Date object, not string
      appointment_location_type: formData.location_type,
      appointment_location_id: formData.location_id,
      gate_ref: formData.gate_ref?.trim() || undefined,
      appointment_note: formData.note?.trim() || undefined
    };
    
    // Chọn API endpoint dựa trên mode
    const endpoint = mode === 'change' ? 'update-appointment' : 'schedule';
    console.log('Calling API endpoint:', `/requests/${requestId}/${endpoint}`);
    
    const response = await api.patch(`/requests/${requestId}/${endpoint}`, appointmentData);
    console.log('API response:', response);
    
    // Backend đã tự động xử lý chuyển trạng thái:
    // - IMPORT: PENDING → SCHEDULED
    // - EXPORT: PENDING → PICK_CONTAINER
    console.log('🔍 Appointment created successfully, backend handled status transition');
    
    onSuccess();
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    
    // Handle specific errors
    if (error.response?.status === 400) {
      const errorMessage = error.response.data?.message || 'Dữ liệu không hợp lệ';
      onError(`Lỗi validation: ${errorMessage}`);
    } else if (error.response?.status === 422) {
      onError('Khung giờ này không khả dụng, vui lòng chọn thời gian khác');
    } else if (error.response?.data?.message) {
      onError(error.response.data.message);
    } else {
      onError('Có lỗi xảy ra, vui lòng thử lại');
    }
  } finally {
    setLoading(false);
  }
};
```

### **API Endpoints:**
- **Tạo lịch hẹn:** `PATCH /requests/{requestId}/schedule`
- **Cập nhật lịch hẹn:** `PATCH /requests/{requestId}/update-appointment`

### **Request Body Format:**
```typescript
{
  appointment_time: Date,           // Date object
  appointment_location_type: string, // 'gate' | 'yard'
  appointment_location_id: string,   // ID của địa điểm
  gate_ref?: string,                // GATE REF (tùy chọn)
  appointment_note?: string         // Ghi chú (tùy chọn)
}
```

## 🎯 Workflow Integration

### **Depot Request Flow:**
1. **PENDING Request** → Click "Tiếp nhận"
2. **AppointmentMini** pop-up hiển thị với thời gian mặc định (hiện tại + 1 giờ)
3. **User điền form** → Chọn ngày, giờ, địa điểm
4. **Submit form** → API call tạo lịch hẹn
5. **Backend xử lý** → Chuyển trạng thái request
6. **Success** → Đóng pop-up, refresh danh sách

### **Status Transitions:**
- **IMPORT PENDING** → **SCHEDULED** (sau khi tạo lịch hẹn)
- **EXPORT PENDING** → **PICK_CONTAINER** (sau khi tạo lịch hẹn)

## 📋 Related Components

### **RequestForm.tsx - Customer Request Creation**
Component tạo yêu cầu mới cho khách hàng với thời gian mặc định hiện tại.

#### **Default Time Logic:**
```typescript
// Tạo thời gian mặc định (hiện tại)
const getDefaultDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5); // Format: HH:MM
  return { date, time };
};

const defaultDateTime = getDefaultDateTime();

const [form, setForm] = useState({ 
  type: 'IMPORT', 
  container_no: '', 
  etaDate: defaultDateTime.date, 
  etaTime: defaultDateTime.time
});
```

#### **Features:**
- ✅ **Default time:** Thời gian hiện tại (khác với AppointmentForm là +1 giờ)
- ✅ **Multiple file upload:** Hỗ trợ upload nhiều files chứng từ
- ✅ **Container validation:** Kiểm tra container number đã tồn tại
- ✅ **Form validation:** Validation đầy đủ cho tất cả fields

## 📁 File Structure & Code Mapping

### **Core Components:**
```
frontend/
├── components/
│   ├── RequestForm.tsx                # Customer request creation form
│   │   ├── Default time logic (lines 13-28)
│   │   ├── Form state management (lines 23-28)
│   │   ├── File upload handling (lines 84-129)
│   │   └── Form validation (lines 22-45)
│   └── appointment/
│       ├── AppointmentForm.tsx        # Depot appointment form
│       │   ├── Default time logic (lines 42-46)
│       │   ├── Form state management (lines 48-54)
│       │   ├── Validation logic (lines 83-114)
│       │   └── API integration (lines 116-200)
│       ├── AppointmentMini.tsx        # Draggable pop-up
│       │   ├── Drag functionality (lines 59-80)
│       │   ├── Position management (lines 50-56)
│       │   └── Modal state (lines 25-43)
│       ├── AppointmentWindow.tsx      # Window wrapper
│       │   ├── Error handling (lines 46-49)
│       │   ├── Loading states (lines 51-66)
│       │   └── Form integration (lines 103-110)
│       └── AppointmentHeader.tsx      # Header với drag handle
├── pages/
│   └── Requests/
│       ├── Depot.tsx                  # Trang depot chính
│       │   ├── SWR data fetching (lines 20-21)
│       │   ├── Filter logic (lines 68-81)
│       │   ├── Pagination (lines 97-108)
│       │   └── Modal management (lines 301-416)
│       ├── Customer.tsx               # Trang customer chính
│       └── hooks/
│           └── useDepotActions.ts     # Hook quản lý actions
│               ├── State management (lines 66-81)
│               ├── Change status logic (lines 122-171)
│               ├── Container selection (lines 413-472)
│               └── Document handling (lines 475-635)
└── styles/
    ├── request-form.css               # CSS cho RequestForm
    └── appointment/
        ├── form.css                   # CSS cho AppointmentForm
        ├── modal.css                  # CSS cho pop-up
        └── appointment.css            # CSS chính
```

### **Key Code Sections:**

#### **RequestForm.tsx - Default Time Logic:**
```typescript
// Lines 13-28: Default time initialization
const getDefaultDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5); // Format: HH:MM
  return { date, time };
};

const defaultDateTime = getDefaultDateTime();

const [form, setForm] = useState({ 
  type: 'IMPORT', 
  container_no: '', 
  etaDate: defaultDateTime.date, 
  etaTime: defaultDateTime.time
});
```

#### **AppointmentForm.tsx - Default Time Logic:**
```typescript
// Lines 42-52: Default time initialization (+1 hour) - FIXED timezone issue
const getDefaultDateTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  // Sử dụng local time thay vì UTC để tránh vấn đề timezone
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const [formData, setFormData] = useState<AppointmentFormData>({
  appointment_time: getDefaultDateTime(),
  location_type: 'gate',
  location_id: '',
  gate_ref: '',
  note: ''
});
```

#### **Depot.tsx - Modal Integration:**
```typescript
// Lines 301-343: AppointmentMini rendering
{Array.from(state.activeAppointmentRequests).map((requestId, index) => {
  let request = state.requestsData.find((r: any) => r.id === requestId);
  if (!request) {
    request = data?.data?.find((r: any) => r.id === requestId);
  }
  
  const isChangeMode = request.status === 'SCHEDULED';
  
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
      onClose={() => actions.handleAppointmentClose(requestId)}
      onSuccess={() => actions.handleAppointmentMiniSuccess(requestId)}
      mode={isChangeMode ? 'change' : 'create'}
    />
  );
})}
```

#### **useDepotActions.ts - Status Management:**
```typescript
// Lines 122-171: Change status logic
const changeStatus = async (id: string, status: string) => {
  if (status === 'RECEIVED') {
    const request = requestsData.find(r => r.id === id);
    
    if (request && request.type === 'EXPORT') {
      // EXPORT: Mở container selection modal
      setSelectedRequestForContainer(request);
      setShowContainerSelectionModal(true);
    } else {
      // IMPORT: Mở appointment mini trực tiếp
      setActiveAppointmentRequests(prev => {
        const newSet = new Set(prev).add(id);
        return newSet;
      });
    }
  }
  // ... other status handling
};
```

## 🔄 Recent Updates

### **v1.3.0 - Timezone Fix (2024-12-19)**
- ✅ **Fixed:** Vấn đề timezone trong AppointmentForm - hiển thị 12:00 PM thay vì 6:00 AM
- ✅ **Improved:** Sử dụng local time thay vì UTC time để tránh vấn đề timezone
- ✅ **Enhanced:** Consistent time display across all forms

### **v1.2.0 - RequestForm Default Time Fix (2024-12-19)**
- ✅ **Fixed:** Thời gian mặc định trong RequestForm hiển thị null → Thời gian hiện tại
- ✅ **Added:** Default time logic cho Customer request creation form
- ✅ **Consistent:** Cùng logic thời gian mặc định cho cả AppointmentForm và RequestForm

### **v1.1.0 - AppointmentForm Default Time Fix (2024-12-19)**
- ✅ **Fixed:** Thời gian mặc định hiển thị null → Thời gian hiện tại + 1 giờ
- ✅ **Improved:** Fallback values cho date/time inputs
- ✅ **Enhanced:** Better error handling và validation

### **v1.0.0 - Initial Release**
- ✅ **Feature:** Tạo lịch hẹn mới cho request PENDING
- ✅ **Feature:** Thay đổi lịch hẹn cho request SCHEDULED
- ✅ **Feature:** Draggable pop-up modal
- ✅ **Feature:** Form validation và error handling
- ✅ **Feature:** API integration với backend

## 🚀 Future Enhancements

### **Short-term:**
- [ ] **Time slot availability** - Kiểm tra khung giờ trống
- [ ] **Recurring appointments** - Lịch hẹn định kỳ
- [ ] **Appointment reminders** - Nhắc nhở lịch hẹn
- [ ] **Calendar view** - Xem lịch hẹn theo dạng calendar

### **Long-term:**
- [ ] **Multi-language support** - Hỗ trợ đa ngôn ngữ
- [ ] **Mobile optimization** - Tối ưu cho mobile
- [ ] **Offline support** - Hoạt động offline
- [ ] **Advanced scheduling** - Lập lịch nâng cao

---

**Last Updated:** 2024-12-19  
**Version:** 1.1.0  
**Maintainer:** Smartlog Development Team
