// Create Partner Modal component
import React from 'react';
import Modal from '@components/Modal';
import { Language } from '../types';
import { CompanySearch } from './CompanySearch';

interface CreatePartnerModalProps {
  visible: boolean;
  onCancel: () => void;
  language: Language;
  translations: any;
  partnerFullName: string;
  setPartnerFullName: (value: string) => void;
  partnerEmail: string;
  setPartnerEmail: (value: string) => void;
  partnerRole: string;
  setPartnerRole: (value: string) => void;
  partnerTenantId: string;
  setPartnerTenantId: (value: string) => void;
  partnerCompanyName: string;
  setPartnerCompanyName: (value: string) => void;
  showCompanySearch: boolean;
  setShowCompanySearch: (value: boolean) => void;
  availableCompanies: any[];
  onLoadAvailableCompanies: () => void;
  onSelectCompany: (company: any) => void;
  onCreatePartner: () => void;
  getRoleDisplayName: (role: string) => string;
  role: string;
}

export const CreatePartnerModal: React.FC<CreatePartnerModalProps> = ({
  visible,
  onCancel,
  language,
  translations,
  partnerFullName,
  setPartnerFullName,
  partnerEmail,
  setPartnerEmail,
  partnerRole,
  setPartnerRole,
  partnerTenantId,
  setPartnerTenantId,
  partnerCompanyName,
  setPartnerCompanyName,
  showCompanySearch,
  setShowCompanySearch,
  availableCompanies,
  onLoadAvailableCompanies,
  onSelectCompany,
  onCreatePartner,
  getRoleDisplayName,
  role
}) => {
  return (
    <Modal 
      title={translations[language].createPartnerTitle} 
      visible={visible} 
      onCancel={onCancel} 
      size="sm"
    >
      <div className="grid" style={{gap:12}}>
        <input 
          type="text" 
          placeholder={translations[language].fullNamePlaceholder} 
          value={partnerFullName} 
          onChange={e => setPartnerFullName(e.target.value)} 
        />
        <input 
          type="email" 
          placeholder={translations[language].emailPlaceholder} 
          value={partnerEmail} 
          onChange={e => setPartnerEmail(e.target.value)} 
        />
        
        {/* Chỉ hiển thị CompanySearch cho SystemAdmin/BusinessAdmin */}
        {role !== 'CustomerAdmin' && (
          <CompanySearch
            value={partnerCompanyName}
            onChange={setPartnerCompanyName}
            showDropdown={showCompanySearch}
            availableCompanies={availableCompanies}
            onSelectCompany={onSelectCompany}
            onToggleDropdown={() => {
              onLoadAvailableCompanies();
              setShowCompanySearch(!showCompanySearch);
            }}
            language={language}
            translations={translations}
          />
        )}
        
        <select value={partnerRole} onChange={e => setPartnerRole(e.target.value)}>
          <option value="CustomerUser">{getRoleDisplayName('CustomerUser')}</option>
          <option value="CustomerAdmin">{getRoleDisplayName('CustomerAdmin')}</option>
        </select>
        
        {role !== 'CustomerAdmin' && (
          <>
            <input 
              type="text" 
              placeholder={translations[language].tenantIdPlaceholder} 
              value={partnerTenantId} 
              onChange={e => setPartnerTenantId(e.target.value)} 
            />
            <div className="muted">{translations[language].tenantIdInfo}</div>
          </>
        )}
        
        {role === 'CustomerAdmin' && (
          <div className="muted" style={{
            padding: '8px 12px',
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '6px',
            color: '#0c4a6e',
            fontSize: '14px'
          }}>
            Mã công ty và tên công ty sẽ tự động được gán từ tài khoản của bạn.
          </div>
        )}
        
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button className="btn btn-outline" onClick={onCancel}>
            {translations[language].close}
          </button>
          <button 
            className="btn" 
            onClick={onCreatePartner} 
            style={{background:'#7c3aed', color:'#fff'}}
          >
            {translations[language].create}
          </button>
        </div>
      </div>
    </Modal>
  );
};
