// Create Employee Modal component
import React from 'react';
import Modal from '@components/Modal';
import { Language } from '../types';

interface CreateEmployeeModalProps {
  visible: boolean;
  onCancel: () => void;
  language: Language;
  translations: any;
  empFullName: string;
  setEmpFullName: (value: string) => void;
  empEmail: string;
  setEmpEmail: (value: string) => void;
  empRole: string;
  setEmpRole: (value: string) => void;
  onCreateEmployee: () => void;
  getRoleDisplayName: (role: string) => string;
}

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  visible,
  onCancel,
  language,
  translations,
  empFullName,
  setEmpFullName,
  empEmail,
  setEmpEmail,
  empRole,
  setEmpRole,
  onCreateEmployee,
  getRoleDisplayName
}) => {
  return (
    <Modal 
      title={translations[language].createEmployeeTitle} 
      visible={visible} 
      onCancel={onCancel} 
      size="sm"
    >
      <div className="grid" style={{gap:12}}>
        <input 
          type="text" 
          placeholder={translations[language].fullNamePlaceholder} 
          value={empFullName} 
          onChange={e => setEmpFullName(e.target.value)} 
        />
        <input 
          type="email" 
          placeholder={translations[language].emailPlaceholder} 
          value={empEmail} 
          onChange={e => setEmpEmail(e.target.value)} 
        />
        <select value={empRole} onChange={e => setEmpRole(e.target.value)}>
          <option value="SystemAdmin">{getRoleDisplayName('SystemAdmin')}</option>
          <option value="BusinessAdmin">{getRoleDisplayName('BusinessAdmin')}</option>
          <option value="HRManager">{getRoleDisplayName('HRManager')}</option>
          <option value="SaleAdmin">{getRoleDisplayName('SaleAdmin')}</option>
          <option value="Driver">{getRoleDisplayName('Driver')}</option>
        </select>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
          <button className="btn btn-outline" onClick={onCancel}>
            {translations[language].close}
          </button>
          <button 
            className="btn" 
            onClick={onCreateEmployee} 
            style={{background:'#059669', color:'#fff'}}
          >
            {translations[language].create}
          </button>
        </div>
      </div>
    </Modal>
  );
};
