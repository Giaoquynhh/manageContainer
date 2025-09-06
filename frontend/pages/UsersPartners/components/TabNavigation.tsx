// Tab Navigation component
import React from 'react';
import { ActiveTab, Language } from '../types';

interface TabNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  role: string;
  language: Language;
  translations: any;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  role,
  language,
  translations
}) => {
  // Chỉ hiển thị tabs cho các role có quyền quản lý cả nhân viên và customer
  const canManageBoth = ['SystemAdmin', 'BusinessAdmin', 'admin'].includes(role);
  
  if (!canManageBoth) {
    return null; // Chỉ hiển thị tab "Người dùng" cho các role khác
  }

  return (
    <div style={{display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid #e5e7eb'}}>
      <button 
        onClick={() => setActiveTab('users')}
        style={{
          padding: '12px 24px',
          border: 'none',
          background: activeTab === 'users' ? '#0b2b6d' : 'transparent',
          color: activeTab === 'users' ? 'white' : '#6b7280',
          borderBottom: activeTab === 'users' ? '2px solid #0b2b6d' : '2px solid transparent',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          borderRadius: '6px 6px 0 0'
        }}
      >
        {translations[language].usersTab}
      </button>
      <button 
        onClick={() => {
          console.log('Switching to partners tab, current role:', role);
          setActiveTab('partners');
        }}
        style={{
          padding: '12px 24px',
          border: 'none',
          background: activeTab === 'partners' ? '#0b2b6d' : 'transparent',
          color: activeTab === 'partners' ? 'white' : '#6b7280',
          borderBottom: activeTab === 'partners' ? '2px solid #0b2b6d' : '2px solid transparent',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          borderRadius: '6px 6px 0 0'
        }}
      >
        {translations[language].partnersTab}
      </button>
    </div>
  );
};
