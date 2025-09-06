// User Table component
import React from 'react';
import { User, UserAction, Language } from '../types';
import { ActionButtons } from './ActionButtons';
import { ROLE_COLORS, STATUS_COLORS } from '../constants';

interface UserTableProps {
  users: User[];
  role: string;
  language: Language;
  translations: any;
  onUserAction: (id: string, action: UserAction) => void;
  getRoleDisplayName: (role: string) => string;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  role,
  language,
  translations,
  onUserAction,
  getRoleDisplayName
}) => {
  return (
    <tbody>
      {users.map((u: User) => {
        console.log('User data:', u);
        return (
          <tr key={u.id || u._id}>
            <td style={{fontWeight: 600, color: '#1e40af'}}>{u.email}</td>
            <td>{u.full_name}</td>
            <td>
              <span className="badge" style={{
                background: ROLE_COLORS[u.role as keyof typeof ROLE_COLORS] || '#6b7280',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {getRoleDisplayName(u.role)}
              </span>
            </td>
            <td>
              <span className="badge" style={{
                background: STATUS_COLORS[u.status as keyof typeof STATUS_COLORS] || '#6b7280',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {u.status}
              </span>
            </td>
            <ActionButtons
              user={u}
              role={role}
              language={language}
              translations={translations}
              onUserAction={onUserAction}
            />
          </tr>
        );
      })}
    </tbody>
  );
};
