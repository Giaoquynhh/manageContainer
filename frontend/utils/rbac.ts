export type AppRole = 'SystemAdmin' | 'BusinessAdmin' | 'HRManager' | 'SaleAdmin' | 'CustomerAdmin' | 'CustomerUser' | 'PartnerAdmin' | 'Security' | 'YardManager' | 'MaintenanceManager' | 'Accountant';

export function homeFor(role: AppRole): string {
    if (canViewUsersPartners(role)) return '/UsersPartners';
    if (isCustomerRole(role)) return '/Requests/Customer';
    if (isSaleAdmin(role) || isAccountant(role)) return '/Requests/Depot';
    if (canUseGate(role)) return '/Gate';
    return '/Account';
}

export function canViewUsersPartners(role?: string): boolean {
	return ['SystemAdmin','BusinessAdmin','HRManager','SaleAdmin','CustomerAdmin'].includes(String(role));
}

export function showInternalForm(role?: string): boolean {
	return ['SystemAdmin','BusinessAdmin','HRManager'].includes(String(role));
}

export function showCustomerForm(role?: string): boolean {
	return ['SystemAdmin','BusinessAdmin','SaleAdmin','CustomerAdmin'].includes(String(role));
}

export function isCustomerRole(role?: string): boolean {
	return ['CustomerAdmin','CustomerUser'].includes(String(role));
}

export function isSaleAdmin(role?: string): boolean {
	return String(role) === 'SaleAdmin';
}

export function isAccountant(role?: string): boolean {
	return String(role) === 'Accountant';
}

export function canUseGate(role?: string): boolean {
	// FE chỉ kiểm tra role; backend sẽ xác thực Gate Mode theo thiết bị
	return ['SaleAdmin','SystemAdmin'].includes(String(role));
}

// Extra helpers for sidebar mapping
export function isSystemAdmin(role?: string): boolean { return String(role) === 'SystemAdmin'; }
export function isBusinessAdmin(role?: string): boolean { return String(role) === 'BusinessAdmin'; }
export function isPartnerAdmin(role?: string): boolean { return String(role) === 'PartnerAdmin'; }
export function isSecurity(role?: string): boolean { return String(role) === 'Security'; }
export function isYardManager(role?: string): boolean { return String(role) === 'YardManager'; }
export function isMaintenanceManager(role?: string): boolean { return String(role) === 'MaintenanceManager'; }
