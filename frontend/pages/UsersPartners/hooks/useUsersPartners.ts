// Custom hooks cho UsersPartners
import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '@services/api';
import { canViewUsersPartners } from '@utils/rbac';
import { User, Partner, Company, UserAction, Language } from '../types';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export const useUsersPartners = (role: string, currentUser: any) => {
  // State
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showCompanyUsersModal, setShowCompanyUsersModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [modalInviteToken, setModalInviteToken] = useState<string>('');
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [message, setMessage] = useState('');
  const [lastInviteToken, setLastInviteToken] = useState<string>('');

  // Form states
  const [empFullName, setEmpFullName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState('HRManager');
  const [partnerFullName, setPartnerFullName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerRole, setPartnerRole] = useState('CustomerUser');
  const [partnerTenantId, setPartnerTenantId] = useState('');
  const [partnerCompanyName, setPartnerCompanyName] = useState('');
  const [userCompanyMap, setUserCompanyMap] = useState<{[key: string]: string}>({});

  // API URLs
  const usersUrl = role === 'CustomerAdmin' && currentUser?.tenant_id 
    ? `/users?tenant_id=${currentUser.tenant_id}&page=1&limit=50`
    : '/users?role=&page=1&limit=50';
  
  const { data: users } = useSWR(canViewUsersPartners(role) ? [usersUrl] : null, ([u]) => fetcher(u));
  const { data: partners } = useSWR(canViewUsersPartners(role) && role !== 'CustomerAdmin' ? ['/customers/partners?page=1&limit=50'] : null, ([u]) => fetcher(u));

  // Filter users
  const filteredUsers = (users?.data || []).filter((u: User) => {
    if (role === 'CustomerAdmin') {
      return u.tenant_id === currentUser?.tenant_id;
    }
    return !['CustomerAdmin', 'PartnerAdmin', 'CustomerUser'].includes(u.role);
  });

  // Functions
  const loadAvailableCompanies = async () => {
    try {
      const response = await api.get('/customers?page=1&limit=100');
      setAvailableCompanies(response.data?.data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const selectCompany = (company: Company) => {
    setPartnerCompanyName(company.name);
    setPartnerTenantId(company.id);
    setShowCompanySearch(false);
  };

  const showCompanyUsers = async (company: any) => {
    setSelectedCompany(company);
    setModalInviteToken('');
    try {
      const response = await api.get(`/users?tenant_id=${company.id}&page=1&limit=100`);
      setCompanyUsers(response.data?.data || []);
      setShowCompanyUsersModal(true);
    } catch (error) {
      console.error('Error fetching company users:', error);
      setMessage('Lỗi khi tải danh sách tài khoản');
    }
  };

  const modalUserAction = async (id: string, action: UserAction) => {
    setMessage(''); 
    setModalInviteToken('');
    try{
      if (action === 'invite') {
        const res = await api.post(`/users/${id}/send-invite`);
        setModalInviteToken(res.data?.invite_token || '');
        setMessage('Email mời đã được gửi!');
        setTimeout(() => setMessage(''), 3000);
      } else if (action === 'delete') {
        await api.delete(`/users/${id}`);
        setMessage(`Đã ${action} user`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        await api.patch(`/users/${id}/${action}`);
        setMessage(`Đã ${action} user`);
        setTimeout(() => setMessage(''), 3000);
      }
      
      // Refresh danh sách trong modal
      if (selectedCompany) {
        const response = await api.get(`/users?tenant_id=${selectedCompany.id}&page=1&limit=100`);
        setCompanyUsers(response.data?.data || []);
      }
      
      // Refresh bảng chính với URL chính xác
      if (role === 'CustomerAdmin' && currentUser?.tenant_id) {
        mutate([`/users?tenant_id=${currentUser.tenant_id}&page=1&limit=50`]);
      } else {
        mutate(['/users?role=&page=1&limit=50']);
      }
      // Refresh partners (chỉ cho SystemAdmin/BusinessAdmin)
      if (role !== 'CustomerAdmin') {
        mutate(['/customers/partners?page=1&limit=50']);
      }
    }catch(e:any){ 
      setMessage(e?.response?.data?.message || `Lỗi ${action}`); 
    }
  };

  const userAction = async (id: string, action: UserAction) => {
    setMessage(''); 
    setLastInviteToken('');
    try{
      if (action === 'invite') {
        const res = await api.post(`/users/${id}/send-invite`);
        setLastInviteToken(res.data?.invite_token || '');
        setMessage('Email mời đã được gửi!');
      } else if (action === 'delete') {
        await api.delete(`/users/${id}`);
        setMessage(`Đã ${action} user`);
      } else {
        await api.patch(`/users/${id}/${action}`);
        setMessage(`Đã ${action} user`);
      }
      // Refresh users với URL chính xác
      if (role === 'CustomerAdmin' && currentUser?.tenant_id) {
        mutate([`/users?tenant_id=${currentUser.tenant_id}&page=1&limit=50`]);
      } else {
        mutate(['/users?role=&page=1&limit=50']);
      }
      // Refresh partners (chỉ cho SystemAdmin/BusinessAdmin)
      if (role !== 'CustomerAdmin') {
        mutate(['/customers/partners?page=1&limit=50']);
      }
    }catch(e:any){ 
      setMessage(e?.response?.data?.message || `Lỗi ${action}`); 
    }
  };

  const createEmployee = async () => {
    setMessage('');
    if (!empFullName.trim()) {
      setMessage('Vui lòng nhập họ tên');
      return;
    }
    if (!empEmail.trim() || !empEmail.includes('@')) {
      setMessage('Vui lòng nhập email hợp lệ');
      return;
    }
    try{
      await api.post('/users', { full_name: empFullName.trim(), email: empEmail.trim().toLowerCase(), role: empRole });
      setShowEmpForm(false);
      setEmpFullName(''); 
      setEmpEmail('');
      setMessage('Tạo nhân sự nội bộ thành công. Email mời đã được gửi!');
      mutate(['/users?role=&page=1&limit=50']);
    }catch(e:any){ 
      setMessage(e?.response?.data?.message || 'Lỗi tạo nhân sự'); 
    }
  };

  const createPartner = async () => {
    setMessage('');
    if (!partnerFullName.trim()) {
      setMessage('Vui lòng nhập họ tên');
      return;
    }
    if (!partnerEmail.trim() || !partnerEmail.includes('@')) {
      setMessage('Vui lòng nhập email hợp lệ');
      return;
    }
    if (role !== 'CustomerAdmin' && !partnerTenantId.trim()) {
      setMessage('Vui lòng nhập mã công ty');
      return;
    }
    if (role !== 'CustomerAdmin' && !partnerCompanyName.trim()) {
      setMessage('Vui lòng nhập tên công ty');
      return;
    }
    try{
      const payload: any = { 
        full_name: partnerFullName.trim(), 
        email: partnerEmail.trim().toLowerCase(), 
        role: partnerRole
      };
      
      if (role === 'CustomerAdmin') {
        // CustomerAdmin: Tự động lấy thông tin từ currentUser
        payload.tenant_id = currentUser?.tenant_id;
        payload.company_name = currentUser?.company_name || 'Công ty của bạn';
      } else {
        // SystemAdmin/BusinessAdmin: Sử dụng thông tin nhập vào
        payload.tenant_id = partnerTenantId.trim();
        payload.company_name = partnerCompanyName.trim();
      }
      
      const response = await api.post('/users', payload);
      if (response.data?.id || response.data?._id) {
        const userId = response.data.id || response.data._id;
        setUserCompanyMap(prev => ({
          ...prev,
          [userId]: payload.company_name
        }));
      }
      setShowPartnerForm(false);
      setPartnerFullName(''); 
      setPartnerEmail(''); 
      setPartnerTenantId(''); 
      setPartnerCompanyName('');
      setShowCompanySearch(false);
      setMessage('Tạo đối tác thành công. Email mời đã được gửi!');
      // Refresh users với URL chính xác
      if (role === 'CustomerAdmin' && currentUser?.tenant_id) {
        mutate([`/users?tenant_id=${currentUser.tenant_id}&page=1&limit=50`]);
      } else {
        mutate(['/users?role=&page=1&limit=50']);
      }
      // Refresh partners (chỉ cho SystemAdmin/BusinessAdmin)
      if (role !== 'CustomerAdmin') {
        mutate(['/customers/partners?page=1&limit=50']);
      }
    }catch(e:any){ 
      setMessage(e?.response?.data?.message || 'Lỗi tạo đối tác'); 
    }
  };

  return {
    // State
    showEmpForm,
    setShowEmpForm,
    showPartnerForm,
    setShowPartnerForm,
    showCompanyUsersModal,
    setShowCompanyUsersModal,
    selectedCompany,
    setSelectedCompany,
    companyUsers,
    setCompanyUsers,
    modalInviteToken,
    setModalInviteToken,
    showCompanySearch,
    setShowCompanySearch,
    availableCompanies,
    setAvailableCompanies,
    message,
    setMessage,
    lastInviteToken,
    setLastInviteToken,
    // Form states
    empFullName,
    setEmpFullName,
    empEmail,
    setEmpEmail,
    empRole,
    setEmpRole,
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
    userCompanyMap,
    setUserCompanyMap,
    // Data
    users,
    partners,
    filteredUsers,
    // Functions
    loadAvailableCompanies,
    selectCompany,
    showCompanyUsers,
    modalUserAction,
    userAction,
    createEmployee,
    createPartner
  };
};
