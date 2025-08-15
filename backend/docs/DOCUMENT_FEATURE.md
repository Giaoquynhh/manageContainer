# Document Management Feature

## Tổng quan
Tính năng quản lý chứng từ cho phép khách hàng đính kèm các file (ảnh/PDF) vào yêu cầu dịch vụ, giúp bảo vệ đối chiếu nhanh tại cổng và rút ngắn thời gian xử lý.

## Kiến trúc hệ thống

### Database Schema
```prisma
model DocumentFile {
  id           String   @id @default(cuid())
  request_id   String
  request      ServiceRequest @relation(fields: [request_id], references: [id])
  type         String   // DOCUMENT | EIR | LOLO | INVOICE
  originalName String
  storedName   String
  mimeType     String
  sizeBytes    Int
  version      Int      @default(1)
  storageKey   String   // path hoặc S3 key
  uploaderId   String
  createdAt    DateTime @default(now())
  deletedAt    DateTime?
  deletedBy    String?
  deleteReason String?

  @@index([request_id])
  @@index([createdAt])
}

model ServiceRequest {
  // ... existing fields
  documentsCount Int     @default(0) // Cache cho UI
  docs           DocumentFile[]
}
```

### File Storage
- **Development**: Local storage trong thư mục `uploads/requests/`
- **Production**: Có thể nâng cấp lên S3 hoặc CDN
- **Security**: Files được lưu với tên unique để tránh conflict

## API Endpoints

### 1. Upload Document
```http
POST /requests/upload-document
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- file: File (JPG, PNG, PDF, max 10MB)
- request_id: string
- type: "DOCUMENT"
```

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "data": {
    "id": "doc_123",
    "originalName": "invoice.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 1024000,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. List Documents
```http
GET /requests/{requestId}/documents
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Documents retrieved successfully",
  "data": [
    {
      "id": "doc_123",
      "originalName": "invoice.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 1024000,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 3. View Document (Inline)
```http
GET /requests/{requestId}/documents/{docId}/view
Authorization: Bearer <token>
```

**Response:** File content với Content-Type phù hợp

**Headers được thêm:**
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Content-Type: {mimeType}`
- `Content-Disposition: inline; filename="{originalName}"`

### 4. Download Document
```http
GET /requests/{requestId}/documents/{docId}/download
Authorization: Bearer <token>
```

**Response:** File content với Content-Disposition: attachment

### 5. Delete Document
```http
DELETE /requests/documents/{docId}
Authorization: Bearer <token>

Body:
{
  "reason": "Optional reason for deletion"
}
```

## Validation Rules

### File Validation
- **Supported Types**: JPG, PNG, PDF
- **Max Size**: 10MB per file
- **Max Files**: 10 files per request
- **MIME Validation**: Server-side validation

### Business Rules
- Chỉ cho phép upload khi request chưa kết thúc
- Chỉ uploader hoặc admin mới được xóa file
- Soft delete để bảo toàn dữ liệu

## Security Features

### File Upload Security
1. **MIME Type Validation**: Kiểm tra content-type
2. **File Extension Validation**: Whitelist approach
3. **File Size Limits**: Ngăn chặn upload file lớn
4. **Storage Isolation**: Files lưu riêng biệt
5. **Access Control**: RBAC cho document access

### API Security
1. **Authentication**: JWT token required
2. **Authorization**: Role-based access control
3. **Input Validation**: Joi schemas
4. **Error Handling**: Secure error messages

## Error Handling

### Common Errors
```json
{
  "REQUEST_NOT_FOUND": "Request không tồn tại",
  "REQUEST_CLOSED": "Request đã kết thúc, không thể upload",
  "UNSUPPORTED_FILE_TYPE": "Loại file không được hỗ trợ",
  "MAX_FILES_EXCEEDED": "Vượt quá số lượng file cho phép",
  "DOC_NOT_FOUND": "Document không tồn tại",
  "PERMISSION_DENIED": "Không có quyền thực hiện",
  "FILE_NOT_FOUND": "File không tồn tại trên disk"
}
```

## Frontend Integration

### Components
1. **DocumentUpload**: Drag & drop upload với progress
2. **DocumentViewer**: Modal xem và download documents
3. **Document Counter**: Hiển thị số lượng documents

### Usage Examples
```tsx
// Upload document
<DocumentUpload
  requestId={requestId}
  onUploadSuccess={() => console.log('Success')}
  onUploadError={(error) => console.error(error)}
/>

// View documents
<DocumentViewer
  requestId={requestId}
  visible={showViewer}
  onClose={() => setShowViewer(false)}
/>
```

## Performance Considerations

### Optimization
1. **File Streaming**: Stream files thay vì load toàn bộ vào memory
2. **Caching**: Cache document metadata
3. **Compression**: Nén files lớn
4. **CDN**: Sử dụng CDN cho production

### Monitoring
1. **File Size Tracking**: Monitor disk usage
2. **Upload Analytics**: Track upload patterns
3. **Error Tracking**: Monitor upload failures

## Deployment

### Environment Setup
```bash
# Tạo thư mục uploads
mkdir -p uploads/requests

# Set permissions
chmod 755 uploads/requests

# Add to .gitignore
echo "uploads/" >> .gitignore
```

### Production Considerations
1. **S3 Integration**: Migrate to cloud storage
2. **CDN Setup**: Configure content delivery
3. **Backup Strategy**: Regular file backups
4. **Monitoring**: File system monitoring

## Testing

### Unit Tests
```typescript
describe('DocumentService', () => {
  it('should upload document successfully', async () => {
    // Test upload logic
  });

  it('should validate file type', () => {
    // Test validation
  });

  it('should handle upload errors', async () => {
    // Test error handling
  });
});
```

### Integration Tests
```typescript
describe('Document API', () => {
  it('should upload and retrieve document', async () => {
    // Test full workflow
  });
});
```

## Migration Guide

### From Local to S3
1. **Install AWS SDK**: `npm install aws-sdk`
2. **Configure S3**: Set up bucket and credentials
3. **Update Storage**: Modify DocumentService
4. **Migrate Files**: Transfer existing files
5. **Update URLs**: Change file serving logic

### Database Migration
```sql
-- Add documentsCount column
ALTER TABLE "ServiceRequest" ADD COLUMN "documentsCount" INTEGER DEFAULT 0;

-- Create DocumentFile table
CREATE TABLE "DocumentFile" (
  "id" TEXT NOT NULL,
  "request_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "storedName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "storageKey" TEXT NOT NULL,
  "uploaderId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" DATETIME,
  "deletedBy" TEXT,
  "deleteReason" TEXT,
  PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX "DocumentFile_request_id_idx" ON "DocumentFile"("request_id");
CREATE INDEX "DocumentFile_createdAt_idx" ON "DocumentFile"("createdAt");
```

## Troubleshooting

### Common Issues
1. **413 Payload Too Large**: Tăng file size limit
2. **File Upload Fails**: Kiểm tra disk space
3. **Permission Denied**: Kiểm tra file permissions
4. **MIME Type Error**: Validate file type
5. **Image Not Displaying**: Kiểm tra CORS headers và file path resolution

### Debug Steps cho Image Display Issues
1. **Kiểm tra file tồn tại**: `Test-Path "uploads/requests/{filename}"`
2. **Kiểm tra API response**: Test endpoint với curl/Postman
3. **Kiểm tra CORS**: Đảm bảo headers được set đúng
4. **Kiểm tra file path**: Debug log trong `DocumentService.getFilePath()`
5. **Kiểm tra MIME type**: Đảm bảo Content-Type đúng

### Recent Fixes (v1.1)
- **CORS Headers**: Thêm CORS headers cho viewDocument endpoint
- **Path Resolution**: Sửa `path.resolve()` thành `path.join(process.cwd(), storageKey)`
- **Debug Logging**: Thêm console.log để debug file path issues

### Debug Commands
```bash
# Check disk space
df -h

# Check file permissions
ls -la uploads/requests/

# Check logs
tail -f logs/access.log
```

## Future Enhancements

### Planned Features
1. **Document Versioning**: Track changes
2. **Digital Signatures**: Document signing
3. **OCR Integration**: Extract text from images
4. **Virus Scanning**: Security scanning
5. **Watermarking**: Add watermarks
6. **Bulk Operations**: Batch upload/download

### Performance Improvements
1. **Image Thumbnails**: Generate previews
2. **Progressive Loading**: Lazy load documents
3. **Compression**: Automatic compression
4. **Caching**: Redis caching layer

## Support

### Documentation
- API documentation
- Component usage guide
- Troubleshooting guide

### Contact
- Technical support: dev@company.com
- Bug reports: bugs@company.com
- Feature requests: features@company.com
