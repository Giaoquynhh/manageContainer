export type PermissionKey =
  | 'users_partners.view'
  | 'permissions.manage'
  | 'requests.depot'
  | 'requests.customer'
  | 'gate.use'
  | 'yard.view'
  | 'containers.manage'
  | 'forklift.view'
  | 'maintenance.repairs'
  | 'maintenance.inventory'
  | 'finance.invoices'
  | 'finance.create_invoice'
  | 'reports.view'
  | 'account.view'
  | 'driver.dashboard';

export interface PermissionItem {
  key: PermissionKey;
  label: string;
  group: 'Hệ thống' | 'Yêu cầu' | 'Vận hành' | 'Bảo trì' | 'Tài chính' | 'Báo cáo';
  adminOnly?: boolean;
}

export const PERMISSION_CATALOG: PermissionItem[] = [
  { key: 'users_partners.view', label: 'Người dùng/Đối tác', group: 'Hệ thống' },
  { key: 'permissions.manage', label: 'Phân quyền', group: 'Hệ thống', adminOnly: true },
  { key: 'account.view', label: 'Tài khoản', group: 'Hệ thống' },
  { key: 'requests.depot', label: 'Yêu cầu (Depot)', group: 'Yêu cầu' },
  { key: 'requests.customer', label: 'Yêu cầu (Khách hàng)', group: 'Yêu cầu' },
  { key: 'gate.use', label: 'Cổng (Gate)', group: 'Vận hành' },
  { key: 'yard.view', label: 'Bãi (Yard)', group: 'Vận hành' },
  { key: 'containers.manage', label: 'Quản lý container', group: 'Vận hành' },
  { key: 'forklift.view', label: 'Xe nâng', group: 'Vận hành' },
  { key: 'maintenance.repairs', label: 'Bảo trì - Phiếu sửa chữa', group: 'Bảo trì' },
  { key: 'maintenance.inventory', label: 'Bảo trì - Tồn kho', group: 'Bảo trì' },
  { key: 'finance.invoices', label: 'Tài chính - Hóa đơn', group: 'Tài chính' },
  { key: 'finance.create_invoice', label: 'Tài chính - Tạo hóa đơn', group: 'Tài chính' },
  { key: 'reports.view', label: 'Báo cáo', group: 'Báo cáo' },
  { key: 'driver.dashboard', label: 'Bảng điều khiển tài xế', group: 'Vận hành' },
];

export function hasPermission(perms: string[] | undefined | null, key: PermissionKey): boolean {
  return Array.isArray(perms) && perms.includes(key);
}
