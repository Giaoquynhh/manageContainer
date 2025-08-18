# Gate Module - Tính năng Xem Chứng từ

## Tổng quan

Module Gate đã được cập nhật để hỗ trợ xem danh sách chứng từ và xem trực tiếp file trên server. Thay vì chỉ hiển thị số lượng chứng từ, người dùng giờ đây có thể:

1. **Xem danh sách chứng từ**: Hiển thị tất cả chứng từ của một request
2. **Xem trực tiếp file**: Xem preview của PDF và hình ảnh ngay trong ứng dụng
3. **Tải xuống file**: Tải xuống file để xem offline

## Các Component Mới

### 1. DocumentsModal
- Hiển thị danh sách tất cả chứng từ của một request
- Thông tin chi tiết: tên file, loại, kích thước, phiên bản, ngày tạo
- Nút "Xem" để mở DocumentViewer

### 2. DocumentViewer
- Xem preview file trực tiếp trong ứng dụng
- Hỗ trợ PDF và hình ảnh (PNG, JPG, GIF)
- Nút tải xuống cho các loại file khác
- Responsive design cho mobile

## Cách Sử Dụng

### Xem Danh Sách Chứng Từ
1. Trong Gate Dashboard, tìm request cần xem chứng từ
2. Ở cột "Chứng từ", click nút "👁️ Xem"
3. Modal hiển thị danh sách tất cả chứng từ

### Xem File Trực Tiếp
1. Trong danh sách chứng từ, click nút "👁️ Xem" bên cạnh file
2. DocumentViewer mở ra với preview của file
3. Với PDF: xem trực tiếp trong iframe
4. Với hình ảnh: xem full-size với zoom

### Tải Xuống File
1. Trong DocumentViewer, click nút "📥 Tải xuống"
2. File sẽ được tải về máy tính

## API Endpoints

### Backend (Gate Service)
- `GET /gate/requests/:id/documents` - Lấy danh sách chứng từ
- `GET /gate/requests/:requestId/documents/:documentId/view` - Xem file

### Frontend (API Proxy)
- `GET /api/gate/documents/:requestId/:documentId/view` - Proxy để xem file

## Cấu Trúc Dữ Liệu

### Document Interface
```typescript
interface Document {
  id: string;
  type: string;        // EIR, LOLO, INVOICE, SUPPLEMENT
  name: string;        // Tên file
  size: number;        // Kích thước (bytes)
  version: number;     // Phiên bản
  created_at: string;  // Ngày tạo
  storage_key: string; // Key lưu trữ trên server
}
```

## Tính Năng Bảo Mật

- **Authentication**: Yêu cầu token hợp lệ
- **Authorization**: Chỉ SaleAdmin và YardManager có quyền truy cập
- **File Validation**: Kiểm tra file tồn tại trước khi truy cập
- **Path Security**: Sử dụng storage_key thay vì đường dẫn trực tiếp

## Responsive Design

- **Desktop**: Modal full-size với preview tối ưu
- **Tablet**: Modal vừa vặn màn hình
- **Mobile**: Modal chiếm 95% màn hình, layout dọc

## Hỗ Trợ File Types

### Preview được
- **PDF**: Xem trực tiếp trong iframe
- **Images**: PNG, JPG, JPEG, GIF, BMP

### Chỉ tải xuống
- **Documents**: DOC, DOCX
- **Spreadsheets**: XLS, XLSX
- **Others**: Tất cả file types khác

## Troubleshooting

### Lỗi thường gặp
1. **"File không tồn tại"**: Kiểm tra storage_key trong database
2. **"Không thể đọc file"**: Kiểm tra quyền truy cập thư mục uploads
3. **"Preview không hiển thị"**: Kiểm tra Content-Type header

### Debug
- Kiểm tra console browser cho lỗi frontend
- Kiểm tra logs backend cho lỗi server
- Verify file permissions trên server

## Tương Lai

- [ ] Hỗ trợ preview Office documents
- [ ] Zoom và pan cho hình ảnh
- [ ] Thumbnail preview cho danh sách
- [ ] Batch download nhiều file
- [ ] OCR cho PDF và hình ảnh
