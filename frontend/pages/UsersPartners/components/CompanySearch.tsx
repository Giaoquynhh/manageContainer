// Company Search component
import React from 'react';
import { Company, Language } from '../types';

interface CompanySearchProps {
  value: string;
  onChange: (value: string) => void;
  showDropdown: boolean;
  availableCompanies: Company[];
  onSelectCompany: (company: Company) => void;
  onToggleDropdown: () => void;
  language: Language;
  translations: any;
}

export const CompanySearch: React.FC<CompanySearchProps> = ({
  value,
  onChange,
  showDropdown,
  availableCompanies,
  onSelectCompany,
  onToggleDropdown,
  language,
  translations
}) => {
  return (
    <div style={{position: 'relative'}} data-company-search>
      <input 
        type="text" 
        placeholder={translations[language].companyNamePlaceholder} 
        value={value} 
        onChange={e => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={onToggleDropdown}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: '#6b7280'
        }}
      >
        🔍
      </button>
      
      {/* Dropdown danh sách công ty */}
      {showDropdown && availableCompanies.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {availableCompanies.map((company: Company) => (
            <div
              key={company.id}
              onClick={() => onSelectCompany(company)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{fontWeight: '500', color: '#1f2937'}}>
                {company.name}
              </div>
              <div style={{fontSize: '12px', color: '#6b7280'}}>
                Mã: {company.tax_code}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
