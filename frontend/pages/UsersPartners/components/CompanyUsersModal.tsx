// Company Users Modal component
import React from 'react';
import Modal from '@components/Modal';
import { User, UserAction, Language } from '../types';
import { UserTable } from './UserTable';
import { ROLE_COLORS, STATUS_COLORS } from '../constants';

interface CompanyUsersModalProps {
  visible: boolean;
  onCancel: () => void;
  selectedCompany: any;
  companyUsers: User[];
  modalInviteToken: string;
  role: string;
  language: Language;
  translations: any;
  onModalUserAction: (id: string, action: UserAction) => void;
  getRoleDisplayName: (role: string) => string;
}

export const CompanyUsersModal: React.FC<CompanyUsersModalProps> = ({
  visible,
  onCancel,
  selectedCompany,
  companyUsers,
  modalInviteToken,
  role,
  language,
  translations,
  onModalUserAction,
  getRoleDisplayName
}) => {
  return (
    <Modal 
      title={`Danh sách tài khoản - ${selectedCompany?.company_name || ''}`}
      visible={visible} 
      onCancel={onCancel} 
      size="lg"
    >
      <div className="table-container">
        <table className="table">
          <thead style={{background: '#f8fafc'}}>
            <tr>
              <th>{translations[language].email}</th>
              <th>{translations[language].fullName}</th>
              <th>{translations[language].role}</th>
              <th>{translations[language].status}</th>
              <th>{translations[language].actions}</th>
            </tr>
          </thead>
          <UserTable
            users={companyUsers}
            role={role}
            language={language}
            translations={translations}
            onUserAction={onModalUserAction}
            getRoleDisplayName={getRoleDisplayName}
          />
        </table>
      </div>
      
      {companyUsers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#6b7280',
          fontSize: '16px'
        }}>
          Không có tài khoản nào trong công ty này
        </div>
      )}
      
      {/* Hiển thị token mời trong modal */}
      {modalInviteToken && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#fef3c7',
          color: '#92400e',
          borderRadius: '8px',
          border: '1px solid #fde68a',
          fontSize: '14px'
        }}>
          <strong>{translations[language].inviteToken}</strong> <code>{modalInviteToken}</code>
          <br />
          <a href={`/Register?token=${modalInviteToken}`} style={{color: '#0891b2', textDecoration: 'underline'}}>
            {translations[language].openRegisterToActivate}
          </a>
        </div>
      )}
    </Modal>
  );
};
