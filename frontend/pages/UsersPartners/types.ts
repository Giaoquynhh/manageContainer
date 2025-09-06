// Types cho UsersPartners module
export interface User {
  id: string;
  _id?: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  tenant_id?: string;
  company_name?: string;
}

export interface Partner {
  id: string;
  company_name: string;
  company_code: string;
  account_count: number;
}

export interface Company {
  id: string;
  name: string;
  tax_code: string;
}

export type UserAction = 'disable' | 'enable' | 'lock' | 'unlock' | 'invite' | 'delete';
export type ActiveTab = 'users' | 'partners';
export type Language = 'vi' | 'en';
