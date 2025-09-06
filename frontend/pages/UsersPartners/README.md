# UsersPartners Module

Module quản lý người dùng và đối tác đã được refactor thành các component nhỏ để dễ bảo trì.

## Cấu trúc thư mục

```
UsersPartners/
├── index.tsx                 # Component chính
├── types.ts                  # TypeScript types
├── constants.ts              # Constants và colors
├── translations.ts           # Bản dịch đa ngôn ngữ
├── README.md                 # Tài liệu này
├── components/               # Các component UI
│   ├── TabNavigation.tsx     # Tab chuyển đổi Users/Partners
│   ├── UserTable.tsx         # Bảng hiển thị users
│   ├── PartnersTable.tsx     # Bảng hiển thị partners
│   ├── ActionButtons.tsx     # Các nút hành động
│   ├── CompanySearch.tsx     # Tìm kiếm công ty với dropdown
│   ├── CreateEmployeeModal.tsx # Modal tạo nhân sự
│   ├── CreatePartnerModal.tsx  # Modal tạo đối tác
│   └── CompanyUsersModal.tsx   # Modal danh sách tài khoản công ty
├── hooks/                    # Custom hooks
│   └── useUsersPartners.ts   # Hook chính chứa logic và state
└── utils/                    # Utility functions
    └── roleUtils.ts          # Functions xử lý role
```

## Mô tả các file

### Core Files
- **`index.tsx`**: Component chính, chỉ chứa UI layout và kết nối các component con
- **`types.ts`**: Định nghĩa tất cả TypeScript interfaces và types
- **`constants.ts`**: Màu sắc, roles, và các hằng số khác
- **`translations.ts`**: Bản dịch tiếng Việt và tiếng Anh

### Components
- **`TabNavigation.tsx`**: Tab chuyển đổi giữa Users và Partners (ẩn cho CustomerAdmin)
- **`UserTable.tsx`**: Bảng hiển thị danh sách users với các hành động
- **`PartnersTable.tsx`**: Bảng hiển thị danh sách partners (có thể click để xem chi tiết)
- **`ActionButtons.tsx`**: Component tái sử dụng cho các nút hành động (disable, enable, lock, etc.)
- **`CompanySearch.tsx`**: Input tìm kiếm công ty với dropdown autocomplete
- **`CreateEmployeeModal.tsx`**: Modal tạo nhân sự nội bộ
- **`CreatePartnerModal.tsx`**: Modal tạo đối tác (có CompanySearch)
- **`CompanyUsersModal.tsx`**: Modal hiển thị danh sách tài khoản của một công ty

### Hooks
- **`useUsersPartners.ts`**: Custom hook chứa toàn bộ logic, state, và API calls

### Utils
- **`roleUtils.ts`**: Functions xử lý hiển thị tên role theo ngôn ngữ

## Lợi ích của cấu trúc mới

1. **Dễ bảo trì**: Mỗi component có trách nhiệm riêng biệt
2. **Tái sử dụng**: Các component như ActionButtons có thể dùng ở nhiều nơi
3. **Dễ test**: Có thể test từng component riêng lẻ
4. **Dễ đọc**: Code được tổ chức theo chức năng
5. **Type safety**: TypeScript types được định nghĩa rõ ràng
6. **Separation of concerns**: Logic tách biệt khỏi UI

## Cách sử dụng

Module này được sử dụng như trước, không có thay đổi về giao diện hay chức năng. Chỉ có cấu trúc code được cải thiện để dễ bảo trì hơn.

## Thêm tính năng mới

Khi thêm tính năng mới:
1. Thêm types vào `types.ts` nếu cần
2. Tạo component mới trong `components/` nếu cần UI mới
3. Thêm logic vào `useUsersPartners.ts` hook
4. Import và sử dụng trong `index.tsx`
