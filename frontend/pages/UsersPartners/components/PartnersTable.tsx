// Partners Table component
import React from 'react';
import { Partner, Language } from '../types';

interface PartnersTableProps {
  partners: Partner[];
  language: Language;
  translations: any;
  onCompanyClick: (company: Partner) => void;
}

export const PartnersTable: React.FC<PartnersTableProps> = ({
  partners,
  language,
  translations,
  onCompanyClick
}) => {
  return (
    <tbody>
      {partners.map((partner: Partner) => (
        <tr 
          key={partner.id}
          onClick={() => onCompanyClick(partner)}
          style={{
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <td style={{fontWeight: 600, color: '#1e40af'}}>{partner.company_name}</td>
          <td style={{fontFamily: 'monospace', color: '#6b7280'}}>{partner.company_code}</td>
          <td>
            <span className="badge" style={{
              background: '#059669',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {partner.account_count} tài khoản
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  );
};
