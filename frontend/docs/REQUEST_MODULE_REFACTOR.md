# Request Module Refactor Documentation

## Overview
The Request Module has been completely refactored to provide a modern, user-friendly interface while maintaining all existing functionality and API integrations. **NEW: Document upload and management feature has been added.**

## New Architecture

### Component Structure
```
components/
├── requests/
│   ├── RequestTable.tsx      # Modern data table with actions
│   ├── RequestForm.tsx       # Form for creating new requests
│   ├── RequestSearchBar.tsx  # Search and filter functionality
│   ├── DocumentUpload.tsx    # NEW: File upload component
│   └── DocumentViewer.tsx    # NEW: Document preview component
└── ui/
    └── Modal.tsx            # Reusable modal component
```

### Backend Structure
```
backend/
├── modules/requests/
│   ├── controller/
│   │   ├── RequestController.ts
│   │   ├── RequestRoutes.ts
│   │   ├── DocumentController.ts    # NEW
│   │   ├── DocumentRoutes.ts        # NEW
│   │   └── DocumentUpload.ts        # NEW: Multer config
│   ├── dto/
│   │   ├── RequestDtos.ts
│   │   └── DocumentDtos.ts          # NEW
│   ├── repository/
│   │   ├── RequestRepository.ts
│   │   └── DocumentRepository.ts    # NEW
│   └── service/
│       ├── RequestService.ts
│       └── DocumentService.ts       # NEW
├── shared/utils/
│   └── mime.ts                      # NEW: MIME validation
└── uploads/                         # NEW: File storage
```

### Page Structure
```
pages/Requests/
├── Depot.tsx                # Depot admin view (refactored)
└── Customer.tsx             # Customer view (refactored)
```

## Key Improvements

### 1. Modern UI Design
- **Clean Layout**: Single-column layout with clear hierarchy
- **Consistent Spacing**: Proper use of whitespace and padding
- **Modern Typography**: Improved font weights and sizes
- **Color System**: Consistent color palette with proper contrast

### 2. Enhanced User Experience
- **Modal Forms**: Create requests in popup modals instead of inline forms
- **Search & Filter**: Real-time search and status/type filtering
- **Loading States**: Clear loading indicators and disabled states
- **Responsive Design**: Works well on different screen sizes
- **Document Management**: NEW - Upload, view, and download documents

### 3. Better Data Presentation
- **Status Badges**: Color-coded status indicators
- **Action Buttons**: Context-aware action buttons with proper styling
- **Hover Effects**: Interactive elements with smooth transitions
- **Copy Functionality**: One-click copy for container numbers
- **Document Counter**: Shows number of attached documents

### 4. Improved Code Organization
- **Component Separation**: Each component has a single responsibility
- **Reusable Components**: Modal and form components can be reused
- **Type Safety**: Proper TypeScript interfaces
- **Error Handling**: Better error states and user feedback

## NEW: Document Management Features

### Backend API Endpoints
- `POST /requests/upload-document` - Upload document to request
- `GET /requests/:id/documents` - List documents for request
- `GET /requests/:id/documents/:docId/view` - View document inline
- `GET /requests/:id/documents/:docId/download` - Download document
- `DELETE /requests/documents/:docId` - Delete document (soft delete)

### Frontend Components
- **DocumentUpload**: Drag & drop file upload with progress tracking
- **DocumentViewer**: Modal for viewing and downloading documents
- **Document Counter**: Shows number of documents in request table

### File Validation
- **Supported Types**: JPG, PNG, PDF
- **Size Limit**: 10MB per file
- **Max Files**: 10 files per request
- **MIME Validation**: Server-side validation for security

### Recent Bug Fixes (v1.1)
- **Image Display Issue**: Fixed CORS headers and file path resolution
- **Duplicate Requests**: Added debounce and loading state to prevent double submission
- **File Path Resolution**: Fixed `path.resolve()` to `path.join(process.cwd(), storageKey)`
- **CORS Headers**: Added proper CORS headers for image serving

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

## Component Details

### RequestTable Component
- **Purpose**: Displays requests in a modern table format
- **Features**:
  - Status badges with color coding
  - Action buttons based on user role
  - Copy-to-clipboard functionality
  - Loading and empty states
  - Hover effects and animations
  - **NEW**: Document counter and viewer integration

### RequestForm Component
- **Purpose**: Handles request creation in a modal
- **Features**:
  - Form validation
  - Loading states
  - Success/error messages
  - Responsive design
  - Keyboard navigation support
  - **NEW**: Document upload after request creation

### DocumentUpload Component
- **Purpose**: Handles file upload with drag & drop
- **Features**:
  - Drag & drop interface
  - File type validation
  - Progress tracking
  - Multiple file support
  - Error handling

### DocumentViewer Component
- **Purpose**: Displays and manages documents
- **Features**:
  - Document list with metadata
  - Inline preview for images and PDFs
  - Download functionality
  - File type icons
  - Responsive design

### RequestSearchBar Component
- **Purpose**: Provides search and filter functionality
- **Features**:
  - Real-time search
  - Status and type filters
  - Clear search functionality
  - Loading indicators

### Modal Component
- **Purpose**: Reusable modal for forms and dialogs
- **Features**:
  - Backdrop click to close
  - Escape key to close
  - Smooth animations
  - Responsive sizing
  - Body scroll lock

## Usage Examples

### Creating a New Request with Documents
```tsx
const [showCreateModal, setShowCreateModal] = useState(false);

<button onClick={() => setShowCreateModal(true)}>
  + Tạo yêu cầu
</button>

<Modal
  title="Tạo yêu cầu mới"
  visible={showCreateModal}
  onCancel={() => setShowCreateModal(false)}
>
  <RequestForm
    onSuccess={() => {
      setShowCreateModal(false);
      refetchData();
    }}
    onCancel={() => setShowCreateModal(false)}
  />
</Modal>
```

### Displaying Requests with Document Counter
```tsx
<RequestTable
  data={requests}
  loading={isLoading}
  onStatusChange={handleStatusChange}
  onPaymentRequest={handlePaymentRequest}
  loadingId={loadingId}
  userRole={userRole}
/>
```

### Uploading Documents
```tsx
<DocumentUpload
  requestId={requestId}
  onUploadSuccess={() => {
    console.log('Document uploaded successfully');
  }}
  onUploadError={(error) => {
    console.error('Upload failed:', error);
  }}
/>
```

### Viewing Documents
```tsx
<DocumentViewer
  requestId={requestId}
  visible={showViewer}
  onClose={() => setShowViewer(false)}
/>
```

## Styling Guidelines

### Color Palette
- **Primary**: #3b82f6 (Blue)
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Yellow)
- **Danger**: #ef4444 (Red)
- **Neutral**: #6b7280 (Gray)

### Spacing
- **Small**: 8px
- **Medium**: 16px
- **Large**: 24px
- **Extra Large**: 32px

### Typography
- **Headings**: Inter, 800 weight
- **Body**: Inter, 400 weight
- **Monospace**: For container numbers

## Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Adaptations
- Stacked layout for search/filter
- Full-width modals
- Simplified table on small screens
- Touch-friendly button sizes
- Optimized file upload interface

## Performance Considerations

### Optimizations
- **Lazy Loading**: Components load only when needed
- **Memoization**: Prevents unnecessary re-renders
- **Debounced Search**: Reduces API calls during typing
- **Efficient Filtering**: Client-side filtering for better UX
- **File Upload**: Progress tracking and chunked uploads

### Bundle Size
- **Component Splitting**: Each component is a separate file
- **Tree Shaking**: Unused code is eliminated
- **Minimal Dependencies**: Only essential libraries used

## Security Features

### File Upload Security
- **MIME Type Validation**: Server-side validation
- **File Size Limits**: Prevents large file uploads
- **File Extension Validation**: Whitelist approach
- **Storage Isolation**: Files stored in secure location
- **Access Control**: RBAC for document access

### API Security
- **Authentication**: JWT token required
- **Authorization**: Role-based access control
- **Input Validation**: Joi schemas for all inputs
- **Error Handling**: Secure error messages

## Future Enhancements

### Planned Features
- **Pagination**: Server-side pagination for large datasets
- **Export**: CSV/Excel export functionality
- **Bulk Actions**: Select multiple requests for batch operations
- **Advanced Filters**: Date range, customer filters
- **Real-time Updates**: WebSocket integration for live updates
- **S3 Integration**: Cloud storage for documents
- **Document Versioning**: Track document changes
- **Digital Signatures**: Document signing capabilities

### Accessibility Improvements
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and descriptions
- **High Contrast**: Better color contrast ratios
- **Focus Management**: Proper focus handling in modals

## Migration Notes

### Breaking Changes
- None - all existing functionality preserved
- API endpoints remain unchanged
- Data structure remains the same

### Backward Compatibility
- All existing features work as before
- User roles and permissions unchanged
- Database schema unchanged

## Testing

### Component Testing
- Unit tests for each component
- Integration tests for form submission
- E2E tests for user workflows
- File upload testing

### Browser Testing
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- Different screen sizes and orientations

## Deployment

### Build Process
- TypeScript compilation
- CSS optimization
- Asset minification
- Bundle splitting

### Environment Variables
- API endpoints
- Feature flags
- Analytics configuration
- File storage configuration

## Support

### Documentation
- Component API documentation
- Usage examples
- Troubleshooting guide

### Maintenance
- Regular dependency updates
- Security patches
- Performance monitoring
- User feedback collection

## Recent Updates (v1.1)

### Bug Fixes
1. **Image Display Issue**: 
   - Fixed CORS headers in DocumentController
   - Corrected file path resolution in DocumentService
   - Added debug logging for troubleshooting

2. **Duplicate Request Creation**:
   - Added loading state prevention in RequestForm
   - Implemented debounce mechanism
   - Fixed button state management

3. **File Path Issues**:
   - Changed from `path.resolve()` to `path.join(process.cwd(), storageKey)`
   - Added proper error handling for missing files
   - Enhanced debug logging

### Performance Improvements
- Optimized file serving with proper headers
- Reduced unnecessary API calls
- Improved error handling and user feedback

### Security Enhancements
- Added CORS headers for secure file serving
- Enhanced file validation
- Improved error message security
