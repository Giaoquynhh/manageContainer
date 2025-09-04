# Tính năng Upload nhiều files chứng từ + Container Number Validation - Frontend

## 📋 Tổng quan

Tính năng upload nhiều files chứng từ cho phép người dùng chọn và upload nhiều file cùng lúc khi tạo yêu cầu dịch vụ container. Tính năng này cải thiện trải nghiệm người dùng và tăng hiệu quả trong việc quản lý tài liệu.

**Tính năng mới:** Container Number Validation ngăn chặn việc tạo request IMPORT với container number đã tồn tại trong hệ thống.

## 🚀 Tính năng chính

### **1. Upload nhiều files cùng lúc**
- Người dùng có thể chọn nhiều file từ máy tính cùng lúc
- Hỗ trợ các định dạng: PDF, JPG, JPEG, PNG
- Giới hạn kích thước: 10MB/file
- Giới hạn số lượng: Tối đa 10 files

### **2. Quản lý files đã chọn**
- Hiển thị danh sách files đã chọn với thông tin chi tiết
- Xem tên file và kích thước
- Xóa từng file riêng lẻ
- Xóa tất cả files cùng lúc

### **3. Validation thông minh**
- Kiểm tra định dạng file cho từng file
- Kiểm tra kích thước file cho từng file
- Hiển thị thông báo lỗi rõ ràng
- Chỉ cho phép files hợp lệ được thêm vào danh sách

### **4. Container Number Validation (MỚI)**
- Kiểm tra container number đã tồn tại trong hệ thống
- Chỉ áp dụng cho request type IMPORT
- Hiển thị thông báo lỗi chi tiết khi container đã tồn tại
- Ngăn chặn việc tạo duplicate request

## 🏗️ Implementation Details

### **Component: RequestForm.tsx**

#### **State Management:**
```typescript
// Thay đổi từ single file sang multiple files
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
```

#### **File Selection Logic:**
```typescript
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  
  const validFiles: File[] = [];
  let hasError = false;

  files.forEach(file => {
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const hasValidMimeType = allowedMimeTypes.includes(file.type);
    const hasValidExtension = fileExtension && allowedExtensions.includes(`.${fileExtension}`);
    
    if (!hasValidMimeType && !hasValidExtension) {
      setMessage('Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG)');
      hasError = true;
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('File quá lớn. Kích thước tối đa là 10MB');
      hasError = true;
      return;
    }
    
    validFiles.push(file);
  });

  if (!hasError) {
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setMessage('');
  }
};
```

#### **File Management Functions:**
```typescript
// Xóa file cụ thể
const removeFile = (index: number) => {
  setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  setMessage('');
};

// Xóa tất cả files
const removeAllFiles = () => {
  setSelectedFiles([]);
  setMessage('');
};
```

#### **Form Submission:**
```typescript
// Upload tất cả files
selectedFiles.forEach((file, index) => {
  formData.append(`documents`, file);
});
```

#### **Container Number Validation:**
```typescript
// Validation được thực hiện ở backend
// Frontend chỉ hiển thị error message từ API response
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const formData = new FormData();
    formData.append('type', 'IMPORT');
    formData.append('container_no', containerNo);
    formData.append('eta', eta);
    
    // Upload files
    selectedFiles.forEach(file => {
      formData.append('documents', file);
    });
    
    const response = await fetch('/api/requests', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      setMessage(error.message); // Hiển thị error từ backend
      return;
    }
    
    // Success
    onSuccess();
    
  } catch (error) {
    setMessage('Có lỗi xảy ra khi tạo yêu cầu');
  }
};
```

### **UI Components:**

#### **File Input với Multiple Selection:**
```tsx
<input
  id="document"
  type="file"
  accept=".pdf,.jpg,.jpeg,.png"
  onChange={handleFileChange}
  className="file-input"
  multiple
/>
```

#### **Files Preview Section:**
```tsx
{selectedFiles.length > 0 && (
  <div className="files-preview">
    <div className="files-header">
      <span className="files-count">Files đã chọn ({selectedFiles.length})</span>
      <button 
        type="button" 
        onClick={removeAllFiles}
        className="remove-all-btn"
      >
        Xóa tất cả
      </button>
    </div>
    <div className="files-list">
      {selectedFiles.map((file, index) => (
        <div key={index} className="file-preview">
          <span className="file-name">{file.name}</span>
          <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          <button 
            type="button" 
            onClick={() => removeFile(index)}
            className="file-remove"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

## 🎨 CSS Styling

### **Multiple Files Preview Styles:**
```css
/* Container cho danh sách files */
.files-preview {
  margin-top: 8px;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  background: #f9fafb;
}

/* Header với số lượng files và nút xóa tất cả */
.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.files-count {
  font-size: 13px;
  color: var(--navy);
  font-weight: 500;
}

.remove-all-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.remove-all-btn:hover {
  background: #fee2e2;
}

/* Danh sách files với scroll */
.files-list {
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.files-list .file-preview {
  margin-bottom: 4px;
  background: white;
  border: 1px solid #e5e7eb;
}

.files-list .file-preview:last-child {
  margin-bottom: 0;
}

.file-size {
  font-size: 11px;
  color: #6b7280;
  margin-left: 8px;
}
```

## 🔧 Backend Integration

### **API Endpoint:**
```typescript
// POST /requests - Tạo request với upload nhiều files + container validation
router.post('/', upload.array('documents', 10), (req, res) => {
  const files = req.files as Express.Multer.File[];
  // Xử lý array of files + container number validation
});
```

### **Container Number Validation:**
```typescript
// Backend validation logic
async validateContainerNumberNotExists(containerNo: string): Promise<void> {
  const activeStatuses = [
    'PENDING', 'SCHEDULED', 'SENT_TO_GATE', 'CHECKED', 
    'POSITIONED', 'FORKLIFTING', 'IN_YARD', 'IN_CAR'
  ];

  const existingRequest = await prisma.serviceRequest.findFirst({
    where: {
      container_no: containerNo,
      type: 'IMPORT',
      status: { in: activeStatuses },
      depot_deleted_at: null,
      customer_deleted_at: null
    }
  });

  if (existingRequest) {
    throw new Error(`Container ${containerNo} đã tồn tại trong hệ thống với trạng thái ${existingRequest.status}. Chỉ có thể tạo request mới khi container này không còn trong hệ thống.`);
  }
}
```

### **Request Body Format:**
```typescript
const formData = new FormData();
formData.append('type', 'IMPORT');
formData.append('container_no', 'ISO1234');
formData.append('eta', '2024-01-01T10:00:00Z');

// Upload nhiều files
selectedFiles.forEach(file => {
  formData.append('documents', file);
});
```

## 🧪 Testing

### **Test Cases:**
1. **Upload single file:** Chọn 1 file và verify upload thành công
2. **Upload multiple files:** Chọn nhiều files và verify tất cả được upload
3. **File validation:** Test với files không hợp lệ (sai định dạng, quá lớn)
4. **File management:** Test xóa từng file và xóa tất cả
5. **UI responsiveness:** Test với danh sách files dài (scroll)
6. **Container validation:** Test tạo request IMPORT với container đã tồn tại
7. **Container validation:** Test tạo request IMPORT với container mới
8. **Error handling:** Test hiển thị error message từ backend

### **Test Data:**
```typescript
// Valid files
const validFiles = [
  new File(['content'], 'test1.pdf', { type: 'application/pdf' }),
  new File(['content'], 'test2.jpg', { type: 'image/jpeg' }),
  new File(['content'], 'test3.png', { type: 'image/png' })
];

// Invalid files
const invalidFiles = [
  new File(['content'], 'test.txt', { type: 'text/plain' }), // Wrong type
  new File(['content'], 'test.pdf', { type: 'application/pdf', size: 11 * 1024 * 1024 }) // Too large
];
```

## 🚀 Future Enhancements

### **Short-term:**
- [ ] Drag & drop support cho file upload
- [ ] File preview (PDF viewer, image viewer)
- [ ] Progress bar cho upload process
- [ ] File compression trước khi upload

### **Long-term:**
- [ ] Cloud storage integration
- [ ] File versioning
- [ ] Bulk file operations
- [ ] Advanced file validation (virus scan, content analysis)

## 📝 Changelog

### **Version 3.2.0 (2024-01-XX)**
- ✅ **NEW:** Container Number Validation cho request IMPORT
- ✅ **NEW:** Ngăn chặn duplicate container trong hệ thống
- ✅ **NEW:** Error handling cho container validation
- ✅ **IMPROVED:** User experience với validation thông minh

### **Version 3.1.0 (2024-01-XX)**
- ✅ **NEW:** Upload nhiều files chứng từ cùng lúc
- ✅ **NEW:** UI hiển thị danh sách files đã chọn
- ✅ **NEW:** Quản lý files (xóa từng file, xóa tất cả)
- ✅ **NEW:** Validation cho từng file riêng lẻ
- ✅ **NEW:** CSS styling cho multiple files preview
- ✅ **IMPROVED:** User experience khi upload files

---

**Ngày tạo:** 2024-01-XX  
**Phiên bản:** 3.2.0  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation
