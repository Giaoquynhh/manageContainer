// Action Buttons component
import React from 'react';
import { User, UserAction, Language } from '../types';
import { canLockUnlockUsers, canDeleteUsers, canLockSpecificUser } from '@utils/rbac';

interface ActionButtonsProps {
  user: User;
  role: string;
  language: Language;
  translations: any;
  onUserAction: (id: string, action: UserAction) => void;
  isModal?: boolean;
  onModalUserAction?: (id: string, action: UserAction) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  user,
  role,
  language,
  translations,
  onUserAction,
  isModal = false,
  onModalUserAction
}) => {
  const handleAction = (action: UserAction) => {
    if (isModal && onModalUserAction) {
      onModalUserAction(user.id || user._id, action);
    } else {
      onUserAction(user.id || user._id, action);
    }
  };

  return (
    <td style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
      <button 
        className="btn btn-sm" 
        style={{
          background: user.status === 'DISABLED' ? '#059669' : '#dc2626',
          color: 'white',
          fontSize: '12px',
          padding: '4px 8px'
        }}
        title={user.status === 'DISABLED' ? translations[language].enableTooltip : translations[language].disableTooltip} 
        onClick={() => handleAction(user.status === 'DISABLED' ? 'enable' : 'disable')}
      >
        {user.status === 'DISABLED' ? translations[language].enable : translations[language].disable}
      </button>
      
      {canLockUnlockUsers(role) && canLockSpecificUser(role, user.role) && (
        <button 
          className="btn btn-sm" 
          style={{
            background: user.status === 'LOCKED' ? '#059669' : '#d97706',
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px'
          }}
          title={user.status === 'LOCKED' ? translations[language].unlockTooltip : translations[language].lockTooltip} 
          onClick={() => handleAction(user.status === 'LOCKED' ? 'unlock' : 'lock')}
        >
          {user.status === 'LOCKED' ? translations[language].unlock : translations[language].lock}
        </button>
      )}
      
      <button 
        className="btn btn-sm" 
        style={{
          background: '#0891b2',
          color: 'white',
          fontSize: '12px',
          padding: '4px 8px'
        }}
        title={translations[language].resendTooltip} 
        onClick={() => handleAction('invite')}
      >
        {translations[language].resendInvite}
      </button>
      
      {user.status === 'DISABLED' && canDeleteUsers(role) && (
        <button 
          className="btn btn-sm" 
          style={{
            background: '#dc2626',
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px'
          }} 
          title={translations[language].deleteTooltip} 
          onClick={() => handleAction('delete')}
        >
          {translations[language].delete}
        </button>
      )}
    </td>
  );
};
