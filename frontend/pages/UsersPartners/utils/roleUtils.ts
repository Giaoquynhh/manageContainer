// Role utility functions
import { translations } from '../translations';

export const getRoleDisplayName = (role: string, language: 'vi' | 'en' = 'vi') => {
  const roleMap = {
    vi: {
      SystemAdmin: translations.vi.systemAdminLabel,
      BusinessAdmin: translations.vi.businessAdminLabel,
      HRManager: translations.vi.hrManagerLabel,
      SaleAdmin: translations.vi.saleAdminLabel,
      Driver: translations.vi.driverLabel,
      CustomerAdmin: translations.vi.customerAdminLabel,
      CustomerUser: translations.vi.customerUserLabel,
      PartnerAdmin: translations.vi.partnerAdminLabel,
    },
    en: {
      SystemAdmin: translations.en.systemAdminLabel,
      BusinessAdmin: translations.en.businessAdminLabel,
      HRManager: translations.en.hrManagerLabel,
      SaleAdmin: translations.en.saleAdminLabel,
      Driver: translations.en.driverLabel,
      CustomerAdmin: translations.en.customerAdminLabel,
      CustomerUser: translations.en.customerUserLabel,
      PartnerAdmin: translations.en.partnerAdminLabel,
    }
  };
  return roleMap[language][role as keyof typeof roleMap.vi] || role;
};
