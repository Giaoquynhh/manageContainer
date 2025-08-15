# 📚 Documentation Index

## 🎯 Quick Navigation

### 🏠 [Main README](../README.md)
Tổng quan dự án, cài đặt, cấu hình và troubleshooting

---

## 📖 Backend Documentation

### 🏗️ Architecture & Overview
- **[PROJECT_OVERVIEW.md](../backend/docs/PROJECT_OVERVIEW.md)** - Tổng quan dự án và kiến trúc hệ thống
- **[BACKEND_STRUCTURE.md](../backend/docs/BACKEND_STRUCTURE.md)** - Cấu trúc backend và module organization

### 🔐 Authentication & Authorization
- **[MODULE_2_AUTH.md](../backend/docs/MODULE_2_AUTH.md)** - Module xác thực và phân quyền
- **[role_permission_guide.md](../backend/docs/role_permission_guide.md)** - Hướng dẫn phân quyền chi tiết

### 📋 Core Modules
- **[MODULE_3_REQUESTS.md](../backend/docs/MODULE_3_REQUESTS.md)** - Module quản lý yêu cầu dịch vụ
- **[MODULE_4_GATE.md](../backend/docs/MODULE_4_GATE.md)** - Module quản lý cổng container
- **[MODULE_5_YARD.md](../backend/docs/MODULE_5_YARD.md)** - Module quản lý bãi container
- **[MODULE_6_MAINTENANCE.md](../backend/docs/MODULE_6_MAINTENANCE.md)** - Module bảo trì
- **[MODULE_7_FINANCE.md](../backend/docs/MODULE_7_FINANCE.md)** - Module tài chính
- **[MODULE_8_REPORTS.md](../backend/docs/MODULE_8_REPORTS.md)** - Module báo cáo

### 📄 Document Management (v1.1)
- **[DOCUMENT_FEATURE.md](../backend/docs/DOCUMENT_FEATURE.md)** - Tính năng quản lý chứng từ chi tiết

### 👥 User Management
- **[USERS_PARTNERS_API.md](../backend/docs/USERS_PARTNERS_API.md)** - API người dùng và đối tác

---

## 🎨 Frontend Documentation

### 🎯 UI/UX
- **[REQUEST_MODULE_REFACTOR.md](../frontend/docs/REQUEST_MODULE_REFACTOR.md)** - Refactor UI Request Module (v1.1)

---

## 🔧 Development Guides

### 🚀 Getting Started
1. **[Main README](../README.md)** - Cài đặt và chạy dự án
2. **[BACKEND_STRUCTURE.md](../backend/docs/BACKEND_STRUCTURE.md)** - Hiểu cấu trúc backend
3. **[REQUEST_MODULE_REFACTOR.md](../frontend/docs/REQUEST_MODULE_REFACTOR.md)** - Hiểu cấu trúc frontend

### 🐛 Troubleshooting
- **Database Issues**: [Main README](../README.md#troubleshooting)
- **File Upload Issues**: [DOCUMENT_FEATURE.md](../backend/docs/DOCUMENT_FEATURE.md#troubleshooting)
- **UI Issues**: [REQUEST_MODULE_REFACTOR.md](../frontend/docs/REQUEST_MODULE_REFACTOR.md#recent-updates-v11)

### 📝 API Reference
- **Authentication**: [MODULE_2_AUTH.md](../backend/docs/MODULE_2_AUTH.md)
- **Requests**: [MODULE_3_REQUESTS.md](../backend/docs/MODULE_3_REQUESTS.md)
- **Documents**: [DOCUMENT_FEATURE.md](../backend/docs/DOCUMENT_FEATURE.md#api-endpoints)
- **Users & Partners**: [USERS_PARTNERS_API.md](../backend/docs/USERS_PARTNERS_API.md)

---

## 📈 Recent Updates (v1.1)

### 🐛 Bug Fixes
- **Image Display Issue**: Fixed CORS headers và file path resolution
- **Duplicate Requests**: Added debounce và loading state prevention
- **File Path Issues**: Fixed path resolution trong DocumentService

### ⚡ Performance Improvements
- Optimized file serving với proper headers
- Reduced unnecessary API calls
- Improved error handling và user feedback

### 🔒 Security Enhancements
- Added CORS headers cho secure file serving
- Enhanced file validation
- Improved error message security

---

## 🎯 Quick Reference

### 🔑 Common Commands
```bash
# Backend
cd manageContainer/backend
npm run dev                    # Start development server
npx prisma studio             # Open database GUI
npx prisma migrate dev        # Run migrations
npx prisma db seed           # Seed database

# Frontend
cd manageContainer/frontend
npm run dev                   # Start development server
npm run build                # Build for production
```

### 🌐 Ports
- **Backend**: http://localhost:1000
- **Frontend**: http://localhost:1100
- **Database**: localhost:5432

### 📁 Key Directories
- **Backend API**: `manageContainer/backend/`
- **Frontend App**: `manageContainer/frontend/`
- **Database**: `manageContainer/backend/prisma/`
- **Uploads**: `manageContainer/backend/uploads/`
- **Documentation**: `manageContainer/backend/docs/`

---

## 📞 Need Help?

### 🔍 Search Documentation
- **Architecture**: [PROJECT_OVERVIEW.md](../backend/docs/PROJECT_OVERVIEW.md)
- **API Issues**: Check corresponding module docs
- **UI Issues**: [REQUEST_MODULE_REFACTOR.md](../frontend/docs/REQUEST_MODULE_REFACTOR.md)
- **File Upload**: [DOCUMENT_FEATURE.md](../backend/docs/DOCUMENT_FEATURE.md)

### 🐛 Common Issues
- **Database Connection**: Check PostgreSQL service
- **Port Conflicts**: Backend (1000), Frontend (1100)
- **File Upload**: Check `D:\containerManager\manageContainer\backend\uploads\requests\` directory
- **CORS Issues**: Check backend CORS configuration

---

**Last Updated**: August 2024  
**Version**: 1.1  
**Status**: Active Development
