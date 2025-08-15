# Container Manager - Smartlog

## 📋 Tổng quan dự án
Hệ thống quản lý container thông minh với các tính năng quản lý yêu cầu, chứng từ, cổng, bãi và báo cáo.

## 🏗️ Cấu trúc dự án

```
containerManager/
├── manageContainer/
│   ├── backend/                # Backend API (Node.js + Express + Prisma)
│   │   ├── docs/               # Backend documentation
│   │   ├── modules/            # Các module chức năng
│   │   ├── shared/             # Shared utilities
│   │   ├── prisma/             # Database schema & migrations
│   │   └── uploads/            # File uploads storage
│   │       └── requests/       # Request documents
│   └── frontend/               # Frontend (Next.js + React + TypeScript)
│       ├── docs/               # Frontend documentation
│       ├── components/         # React components
│       ├── pages/              # Next.js pages
│       └── services/           # API services
```

## 📚 Documentation Reference

### Backend Documentation
- **[PROJECT_OVERVIEW.md](./backend/docs/PROJECT_OVERVIEW.md)** - Tổng quan dự án và kiến trúc
- **[BACKEND_STRUCTURE.md](./backend/docs/BACKEND_STRUCTURE.md)** - Cấu trúc backend và module
- **[DOCUMENT_FEATURE.md](./backend/docs/DOCUMENT_FEATURE.md)** - Tính năng quản lý chứng từ (v1.1)
- **[MODULE_2_AUTH.md](./backend/docs/MODULE_2_AUTH.md)** - Module xác thực và phân quyền
- **[MODULE_3_REQUESTS.md](./backend/docs/MODULE_3_REQUESTS.md)** - Module quản lý yêu cầu
- **[MODULE_4_GATE.md](./backend/docs/MODULE_4_GATE.md)** - Module quản lý cổng
- **[MODULE_5_YARD.md](./backend/docs/MODULE_5_YARD.md)** - Module quản lý bãi
- **[MODULE_6_MAINTENANCE.md](./backend/docs/MODULE_6_MAINTENANCE.md)** - Module bảo trì
- **[MODULE_7_FINANCE.md](./backend/docs/MODULE_7_FINANCE.md)** - Module tài chính
- **[MODULE_8_REPORTS.md](./backend/docs/MODULE_8_REPORTS.md)** - Module báo cáo
- **[USERS_PARTNERS_API.md](./backend/docs/USERS_PARTNERS_API.md)** - API người dùng và đối tác
- **[role_permission_guide.md](./backend/docs/role_permission_guide.md)** - Hướng dẫn phân quyền

### Frontend Documentation
- **[REQUEST_MODULE_REFACTOR.md](./frontend/docs/REQUEST_MODULE_REFACTOR.md)** - Refactor UI Request Module (v1.1)

## 🚀 Tính năng chính

### ✅ Đã hoàn thành
- **Authentication & Authorization** - JWT, RBAC
- **User & Partner Management** - Quản lý người dùng và đối tác
- **Request Management** - Quản lý yêu cầu dịch vụ
- **Document Management** - Upload, view, download chứng từ (v1.1)
- **Gate Management** - Quản lý cổng container
- **Yard Management** - Quản lý bãi container
- **Maintenance** - Quản lý bảo trì
- **Finance** - Quản lý tài chính
- **Reports** - Báo cáo và thống kê

### 🔄 Đang phát triển
- **Real-time Updates** - WebSocket integration
- **Mobile App** - React Native
- **Advanced Analytics** - Business intelligence

## 🛠️ Công nghệ sử dụng

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **File Upload**: Multer
- **Validation**: Joi

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Library**: React
- **State Management**: SWR
- **HTTP Client**: Axios
- **Styling**: CSS Modules

## 📦 Cài đặt và chạy

### Backend
```bash
cd manageContainer/backend
npm install
cp .env.example .env  # Cấu hình database
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend
```bash
cd manageContainer/frontend
npm install
npm run dev
```

## 🔧 Cấu hình môi trường

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/managerContainer?schema=public
JWT_SECRET=dev-secret
JWT_EXPIRES_IN=24h
PORT=1000
GATE_DEVICE_IDS=device-local-demo
GATE_SUP_PIN=123456
```

### Frontend (next.config.js)
```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://localhost:1000/:path*',
      },
    ];
  },
};
```

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection**: Kiểm tra PostgreSQL service
2. **Port Conflicts**: Backend (1000), Frontend (1100)
3. **File Upload**: Kiểm tra thư mục `D:\containerManager\manageContainer\backend\uploads\requests\`
4. **CORS Issues**: Kiểm tra cấu hình CORS trong backend

### Debug Commands
```bash
# Check database
npx prisma studio

# Check logs
tail -f logs/access.log

# Check file uploads
ls -la uploads/requests/
# Hoặc trên Windows:
dir uploads\requests\
```

## 📈 Recent Updates (v1.1)

### Bug Fixes
- ✅ **Image Display Issue**: Fixed CORS headers và file path resolution
- ✅ **Duplicate Requests**: Added debounce và loading state prevention
- ✅ **File Path Issues**: Fixed path resolution trong DocumentService

### Performance Improvements
- ✅ Optimized file serving với proper headers
- ✅ Reduced unnecessary API calls
- ✅ Improved error handling và user feedback

### Security Enhancements
- ✅ Added CORS headers cho secure file serving
- ✅ Enhanced file validation
- ✅ Improved error message security

## 🤝 Contributing

### Development Workflow
1. **Feature Branch**: `git checkout -b feature/feature-name`
2. **Code Review**: Tạo Pull Request
3. **Testing**: Unit tests và integration tests
4. **Documentation**: Cập nhật docs tương ứng

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **File Size**: Max 400 lines per file

## 📞 Support

### Documentation
- **API Docs**: Swagger/OpenAPI (planned)
- **Component Docs**: Storybook (planned)
- **Architecture**: See docs folder

### Contact
- **Technical Issues**: Check troubleshooting section
- **Feature Requests**: Create GitHub issue
- **Documentation**: Update corresponding markdown files

## 📄 License

This project is proprietary software. All rights reserved.

---

**Last Updated**: August 2024  
**Version**: 1.1  
**Status**: Active Development