import { useState, useEffect } from 'react';
import { mutate } from 'swr';
import { api } from '@services/api';
import { useTranslation } from '../../../hooks/useTranslation';

export interface DepotActionsState {
	searchQuery: string;
	filterType: string;
	filterStatus: string;
	showAppointmentModal: boolean;
	selectedRequestId: string;
	activeAppointmentRequests: Set<string>;
	activeSupplementRequests: Set<string>;
	selectedDocument: any;
	showImageModal: boolean;
	msg: { text: string; ok: boolean } | null;
	loadingId: string;
	me: any;
	requestsData: any[]; // Thêm dữ liệu requests
	activeChatRequests: Set<string>; // Thêm state để quản lý chat đang mở
	showContainerSelectionModal: boolean; // Thêm state cho container selection modal
	selectedRequestForContainer: any; // Thêm thông tin request được chọn để chọn container
	// Reject modal states
	showRejectModal: boolean;
	rejectRequestId: string;
	rejectLoading: boolean;
	// Delete modal states
	showDeleteModal: boolean;
	deleteRequestId: string;
	deleteLoading: boolean;
}

export interface DepotActions {
	// State setters
	setSearchQuery: (query: string) => void;
	setFilterType: (type: string) => void;
	setFilterStatus: (status: string) => void;
	setShowAppointmentModal: (show: boolean) => void;
	setSelectedRequestId: (id: string) => void;
	setSelectedDocument: (doc: any) => void;
	setShowImageModal: (show: boolean) => void;
	setMsg: (msg: { text: string; ok: boolean } | null) => void;
	setLoadingId: (id: string) => void;
	setRequestsData: (data: any[]) => void; // Thêm setter cho requests data
	setShowContainerSelectionModal: (show: boolean) => void;
	setSelectedRequestForContainer: (request: any) => void;
	// Reject modal setters
	setShowRejectModal: (show: boolean) => void;
	setRejectRequestId: (id: string) => void;
	setRejectLoading: (loading: boolean) => void;
	// Delete modal setters
	setShowDeleteModal: (show: boolean) => void;
	setDeleteRequestId: (id: string) => void;
	setDeleteLoading: (loading: boolean) => void;

	// Actions
	changeStatus: (id: string, status: string) => Promise<void>;
	handleAppointmentSuccess: () => void;
	toggleAppointment: (requestId: string) => void;
	handleAppointmentClose: (requestId: string) => void;
	handleAppointmentMiniSuccess: (requestId: string) => Promise<void>;
	toggleSupplement: (requestId: string) => void;
	handleChangeAppointment: (requestId: string) => void;
	handleReject: (requestId: string) => Promise<void>;
	handleRejectWithModal: (requestId: string) => void; // Mở modal từ chối
	confirmReject: (reason: string) => Promise<void>; // Xác nhận từ chối với lý do
	cancelReject: () => void; // Hủy từ chối
	// Delete modal actions
	handleDeleteWithModal: (requestId: string) => void; // Mở modal gỡ bỏ
	confirmDelete: () => Promise<void>; // Xác nhận gỡ bỏ
	cancelDelete: () => void; // Hủy gỡ bỏ
	sendPayment: (id: string) => Promise<void>;
	softDeleteRequest: (id: string, scope: 'depot' | 'customer') => Promise<void>;
	restoreRequest: (id: string, scope: 'depot' | 'customer') => Promise<void>;
	handleDocumentClick: (doc: any) => void;
	closeDocumentModal: () => void;
	handleViewInvoice: (id: string) => Promise<void>;
	handleSendCustomerConfirmation: (id: string) => Promise<void>;
	handleContainerSelection: (containerNo: string) => Promise<void>; // Thêm action xử lý khi chọn container
	handleAddDocument: (requestId: string, containerNo: string) => Promise<void>; // Thêm action xử lý khi thêm chứng từ
	handleUploadDocument: (requestId: string) => Promise<void>; // Thêm action xử lý khi upload chứng từ
	
	// Chat actions
	toggleChat: (requestId: string) => void;
	closeChat: (requestId: string) => void;
}

export function useDepotActions(): [DepotActionsState, DepotActions] {
	const [searchQuery, setSearchQuery] = useState('');
	const [filterType, setFilterType] = useState('all');
	const [filterStatus, setFilterStatus] = useState('all');
	const [showAppointmentModal, setShowAppointmentModal] = useState(false);
	const [selectedRequestId, setSelectedRequestId] = useState<string>('');
	const [activeAppointmentRequests, setActiveAppointmentRequests] = useState<Set<string>>(new Set());
	const [activeSupplementRequests, setActiveSupplementRequests] = useState<Set<string>>(new Set());
	const [selectedDocument, setSelectedDocument] = useState<any>(null);
	const [showImageModal, setShowImageModal] = useState(false);
	const [msg, setMsg] = useState<{ text: string; ok: boolean }|null>(null);
	const [loadingId, setLoadingId] = useState<string>('');
	const [me, setMe] = useState<any>(null);
	const [requestsData, setRequestsData] = useState<any[]>([]);
	const [activeChatRequests, setActiveChatRequests] = useState<Set<string>>(new Set());
	const [showContainerSelectionModal, setShowContainerSelectionModal] = useState(false);
	const [selectedRequestForContainer, setSelectedRequestForContainer] = useState<any>(null);
	// Reject modal states
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [rejectRequestId, setRejectRequestId] = useState<string>('');
	const [rejectLoading, setRejectLoading] = useState(false);
	// Delete modal states
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteRequestId, setDeleteRequestId] = useState<string>('');
	const [deleteLoading, setDeleteLoading] = useState(false);
	
	// i18n
	const { t } = useTranslation();
	const safeT = (key: string, fallback: string) => {
		const v = t(key) as string;
		return v && v !== key ? v : fallback;
	};
	const formatT = (key: string, fallback: string, params?: Record<string, string | number>) => {
		let s = t(key) as string;
		s = s && s !== key ? s : fallback;
		if (params) {
			for (const [k, val] of Object.entries(params)) {
				s = s.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(val));
			}
		}
		return s;
	};

	// Debug logging cho setRequestsData
	const setRequestsDataWithLog = (data: any[]) => {
		console.log('🔍 setRequestsData called with:', { 
			dataLength: data.length, 
			containerNumbers: data.map(r => r.container_no),
			sampleData: data.slice(0, 2) // Chỉ log 2 item đầu để tránh spam
		});
		setRequestsData(data);
	};

	const actLabel: Record<string, string> = {
		RECEIVED: safeT('pages.requests.actions.received', 'Received'),
		REJECTED: safeT('pages.requests.actions.rejected', 'Rejected'),
		COMPLETED: safeT('pages.requests.actions.completed', 'Completed'),
		EXPORTED: safeT('pages.requests.actions.exported', 'Exported')
	};

	// Load user info
	useEffect(() => {
		api.get('/auth/me').then(r => setMe(r.data)).catch(() => {});
	}, []);

	const changeStatus = async (id: string, status: string) => {
		console.log('🔍 changeStatus called:', { id, status, requestsDataLength: requestsData.length });
		setMsg(null);
		setLoadingId(id + status);
		try {
			let payload: any = { status };
			if (status === 'REJECTED') {
				// Sử dụng modal mới thay vì window.prompt
				setRejectRequestId(id);
				setShowRejectModal(true);
				setLoadingId('');
				return;
			} else if (status === 'RECEIVED') {
				// Kiểm tra loại request
				const request = requestsData.find(r => r.id === id);
				console.log('🔍 Found request:', { request, requestType: request?.type });
				
				if (request && request.type === 'EXPORT') {
					console.log('🔍 EXPORT request detected, opening container selection modal');
					// Đối với request EXPORT, mở container selection modal
					setSelectedRequestForContainer(request);
					setShowContainerSelectionModal(true);
					console.log('🔍 Container selection modal should be visible now');
					setLoadingId('');
					return;
				} else {
					console.log('🔍 Non-EXPORT request, opening appointment mini directly');
					// Đối với request khác, mở appointment mini như cũ
					setActiveAppointmentRequests(prev => {
						const newSet = new Set(prev).add(id);
						console.log('Opening AppointmentMini for request:', id, 'Active requests:', Array.from(newSet));
						return newSet;
					});
					setLoadingId('');
					return;
				}
			} else {
				await api.patch(`/requests/${id}/status`, payload);
			}
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `${(actLabel[status] || safeT('common.update', 'Update'))} ${safeT('pages.requests.messages.requestSuccess', 'request successful')}`, ok: true });
		} catch (e: any) {
			setMsg({ text: `${safeT('common.cannot', 'Cannot')} ${(actLabel[status] || safeT('common.update', 'Update')).toLowerCase()}: ${e?.response?.data?.message || safeT('common.error', 'Error')}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const handleAppointmentSuccess = () => {
		mutate('/requests?page=1&limit=20');
		setMsg({ text: safeT('pages.requests.messages.receivedAndAppointmentCreated', 'Request received and appointment created successfully!'), ok: true });
	};

	const toggleAppointment = (requestId: string) => {
		setActiveAppointmentRequests(prev => {
			const newSet = new Set(prev);
			if (newSet.has(requestId)) {
				newSet.delete(requestId);
			} else {
				newSet.add(requestId);
			}
			return newSet;
		});
	};

	const handleAppointmentClose = (requestId: string) => {
		setActiveAppointmentRequests(prev => {
			const newSet = new Set(prev);
			newSet.delete(requestId);
			return newSet;
		});
	};

	const handleAppointmentMiniSuccess = async (requestId: string) => {
		handleAppointmentClose(requestId);
		handleAppointmentSuccess();
	};

	const toggleSupplement = (requestId: string) => {
		setActiveSupplementRequests(prev => {
			const newSet = new Set(prev);
			if (newSet.has(requestId)) {
				newSet.delete(requestId);
			} else {
				newSet.add(requestId);
			}
			return newSet;
		});
	};

	const handleChangeAppointment = async (requestId: string) => {
		// Mở modal tạo lịch hẹn mới thay vì chuyển trạng thái
		setActiveAppointmentRequests(prev => {
			const newSet = new Set(prev).add(requestId);
			console.log('Opening AppointmentMini for appointment change:', requestId, 'Active requests:', Array.from(newSet));
			return newSet;
		});
	};

	const handleReject = async (requestId: string) => {
		const reasonPrompt = safeT('pages.requests.prompts.enterRejectionReason', 'Enter rejection reason');
		const reason = window.prompt(reasonPrompt);
		if (!reason) return;
		
		setMsg(null);
		setLoadingId(requestId + 'REJECTED');
		try {
			await api.patch(`/requests/${requestId}/reject`, { reason });
			mutate('/requests?page=1&limit=20');
			setMsg({ text: safeT('pages.requests.messages.rejectSuccess', 'Request rejected successfully!'), ok: true });
		} catch (e: any) {
			setMsg({ text: `${safeT('common.cannot', 'Cannot')} ${safeT('pages.requests.actions.rejected', 'rejected').toLowerCase()}: ${e?.response?.data?.message || safeT('common.error', 'Error')}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Mở modal từ chối
	const handleRejectWithModal = (requestId: string) => {
		setRejectRequestId(requestId);
		setShowRejectModal(true);
	};

	// Xác nhận từ chối với lý do
	const confirmReject = async (reason: string) => {
		if (!rejectRequestId) return;
		
		setRejectLoading(true);
		setMsg(null);
		
		try {
			await api.patch(`/requests/${rejectRequestId}/status`, { status: 'REJECTED', reason });
			mutate('/requests?page=1&limit=20');
			
			// Hiển thị thông báo thành công
			setMsg({ 
				text: 'Yêu cầu đã được từ chối thành công!', 
				ok: true 
			});
			
			// Đóng modal sau khi hiển thị thông báo
			setTimeout(() => {
				setShowRejectModal(false);
				setRejectRequestId('');
			}, 1000);
			
		} catch (e: any) {
			setMsg({ 
				text: `Không thể từ chối: ${e?.response?.data?.message || 'Lỗi không xác định'}`, 
				ok: false 
			});
		} finally {
			setRejectLoading(false);
		}
	};

	// Hủy từ chối
	const cancelReject = () => {
		setShowRejectModal(false);
		setRejectRequestId('');
		setRejectLoading(false);
	};

	// Mở modal gỡ bỏ
	const handleDeleteWithModal = (requestId: string) => {
		setDeleteRequestId(requestId);
		setShowDeleteModal(true);
	};

	// Xác nhận gỡ bỏ
	const confirmDelete = async () => {
		if (!deleteRequestId) return;
		
		setDeleteLoading(true);
		setMsg(null);
		
		try {
			await api.delete(`/requests/${deleteRequestId}?scope=depot`);
			mutate('/requests?page=1&limit=20');
			
			// Hiển thị thông báo thành công
			setMsg({ 
				text: 'Yêu cầu đã được gỡ bỏ khỏi danh sách Depot!', 
				ok: true 
			});
			
			// Đóng modal sau khi hiển thị thông báo
			setTimeout(() => {
				setShowDeleteModal(false);
				setDeleteRequestId('');
			}, 1000);
			
		} catch (e: any) {
			setMsg({ 
				text: `Không thể gỡ bỏ: ${e?.response?.data?.message || 'Lỗi không xác định'}`, 
				ok: false 
			});
		} finally {
			setDeleteLoading(false);
		}
	};

	// Hủy gỡ bỏ
	const cancelDelete = () => {
		setShowDeleteModal(false);
		setDeleteRequestId('');
		setDeleteLoading(false);
	};

	const sendPayment = async (id: string) => {
		setMsg(null);
		setLoadingId(id + 'PAY');
		try {
			await api.post(`/requests/${id}/payment-request`, {});
			setMsg({ text: safeT('pages.requests.messages.paymentRequestSent', 'Payment request sent'), ok: true });
		} catch (e: any) {
			setMsg({ text: `${safeT('pages.requests.messages.paymentRequestFailed', 'Failed to send payment request')}: ${e?.response?.data?.message || safeT('common.error', 'Error')}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const softDeleteRequest = async (id: string, scope: 'depot' | 'customer') => {
		setMsg(null);
		setLoadingId(id + 'DELETE');
		try {
			await api.delete(`/requests/${id}?scope=${scope}`);
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `${safeT('pages.requests.messages.removedFromList', 'Removed from')} ${(scope === 'depot' ? safeT('common.depot', 'Depot') : safeT('common.customer', 'Customer'))} ${safeT('common.list', 'list')}`, ok: true });
		} catch (e: any) {
			setMsg({ text: `${safeT('common.deleteFailed', 'Delete failed')}: ${e?.response?.data?.message || safeT('common.error', 'Error')}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const restoreRequest = async (id: string, scope: 'depot' | 'customer') => {
		setMsg(null);
		setLoadingId(id + 'RESTORE');
		try {
			await api.post(`/requests/${id}/restore?scope=${scope}`);
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `${safeT('pages.requests.messages.restoredInList', 'Restored in')} ${(scope === 'depot' ? safeT('common.depot', 'Depot') : safeT('common.customer', 'Customer'))} ${safeT('common.list', 'list')}`, ok: true });
		} catch (e: any) {
			setMsg({ text: `${safeT('common.restoreFailed', 'Restore failed')}: ${e?.response?.data?.message || safeT('common.error', 'Error')}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const handleDocumentClick = (doc: any) => {
		setSelectedDocument(doc);
		setShowImageModal(true);
	};

	const closeDocumentModal = () => {
		setShowImageModal(false);
		setSelectedDocument(null);
	};

	// Xem hóa đơn sửa chữa - hoạt động giống như xem chi tiết ở phiếu sửa chữa
	const handleViewInvoice = async (id: string) => {
		setMsg(null);
		setLoadingId(id + 'VIEW_INVOICE');
		try {
			// Tìm request trong dữ liệu local
			const request = requestsData.find((r: any) => r.id === id);
			
			console.log('🔍 Debug handleViewInvoice:', { id, request, requestsDataLength: requestsData.length });
			console.log('🔍 All requestsData:', requestsData.map(r => ({ id: r.id, container_no: r.container_no, status: r.status })));
			
			if (!request || !request.container_no) {
				setMsg({ text: safeT('pages.requests.messages.containerInfoNotFound', 'Container info not found for this request'), ok: false });
				return;
			}

			console.log('🔍 Container number:', request.container_no);
			console.log('🔍 Container number type:', typeof request.container_no);
			console.log('🔍 Container number length:', request.container_no?.length);
			console.log('🔍 Container number trimmed:', request.container_no?.trim());

			// Tìm phiếu sửa chữa tương ứng với container_no
			const apiUrl = `/maintenance/repairs?container_no=${encodeURIComponent(request.container_no)}`;
			console.log('🔍 API URL:', apiUrl);
			const repairResponse = await api.get(apiUrl);
			
			// Debug chi tiết response structure
			console.log('🔍 Full repairResponse:', repairResponse);
			console.log('🔍 repairResponse.data:', repairResponse.data);
			console.log('🔍 repairResponse.data.data:', repairResponse.data?.data);
			
			// Thử nhiều cách extract data
			let repairs = [];
			if (repairResponse.data?.data) {
				repairs = repairResponse.data.data;
			} else if (Array.isArray(repairResponse.data)) {
				repairs = repairResponse.data;
			} else if (repairResponse.data?.repairs) {
				repairs = repairResponse.data.repairs;
			} else if (repairResponse.data?.items) {
				repairs = repairResponse.data.items;
			}
			
			console.log('🔍 Extracted repairs:', repairs);
			
			console.log('🔍 Repair response:', { 
				repairResponse: repairResponse.data, 
				repairs, 
				repairsLength: repairs.length,
				status: repairResponse.status,
				headers: repairResponse.headers,
				fullResponse: repairResponse
			});
			
			// Debug chi tiết hơn cho response data
			console.log('🔍 Response data structure:', {
				hasData: !!repairResponse.data,
				dataType: typeof repairResponse.data,
				dataKeys: repairResponse.data ? Object.keys(repairResponse.data) : 'no data',
				rawData: repairResponse.data
			});
			
			if (repairs.length === 0) {
				setMsg({ text: safeT('pages.requests.messages.noRepairsFound', 'No repair record found for this container'), ok: false });
				return;
			}

			// Lấy phiếu sửa chữa mới nhất
			const latestRepair = repairs[0];
			
			console.log('🔍 Latest repair:', latestRepair);
			
			// Tải PDF hóa đơn sửa chữa
			const pdfResponse = await api.get(`/maintenance/repairs/${latestRepair.id}/invoice/pdf`, {
				responseType: 'blob'
			});

			console.log('🔍 PDF response received, size:', pdfResponse.data?.length || 'unknown');

			// Tạo URL để hiển thị PDF
			const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
			const url = window.URL.createObjectURL(blob);
			
			// Mở PDF trong tab mới
			window.open(url, '_blank');
			
			// Giải phóng URL
			window.URL.revokeObjectURL(url);
			
			setMsg({ text: safeT('pages.requests.messages.openInvoiceSuccess', 'Repair invoice opened successfully'), ok: true });
		} catch (e: any) {
			console.error('❌ Lỗi khi xem hóa đơn:', e);
			console.error('❌ Error response:', e?.response?.data);
			console.error('❌ Error status:', e?.response?.status);
			setMsg({ text: `${safeT('pages.requests.messages.cannotViewInvoice', 'Cannot view invoice')}: ${e?.response?.data?.message || safeT('common.unknownError', 'Unknown error')}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Gửi xác nhận cho khách hàng
	const handleSendCustomerConfirmation = async (id: string) => {
		setMsg(null);
		setLoadingId(id + 'CONFIRM');
		try {
			// TODO: Implement gửi xác nhận cho khách hàng
			// Có thể gửi email, SMS hoặc cập nhật trạng thái
			await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
			setMsg({ text: safeT('pages.requests.messages.customerConfirmationSent', 'Customer confirmation sent successfully'), ok: true });
			
			// Không tự động mở chat với khách hàng sau khi gửi xác nhận
			// setActiveChatRequests(prev => new Set(prev).add(id));
		} catch (e: any) {
			setMsg({ text: `${safeT('pages.requests.messages.sendConfirmationFailed', 'Send confirmation failed')}: ${e?.response?.data?.message || safeT('common.error', 'Error')}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Container selection action
	const handleContainerSelection = async (containerNo: string) => {
		console.log('🔍 handleContainerSelection called with:', { containerNo, selectedRequestForContainer });
		if (!selectedRequestForContainer) {
			console.log('❌ No selectedRequestForContainer found');
			return;
		}
		
		setMsg(null);
		setLoadingId(selectedRequestForContainer.id + 'CONTAINER_SELECT');
		try {
			console.log('🔍 Updating request with container:', containerNo);
			// Sử dụng API endpoint mới để cập nhật container_no và set is_pick = true
			await api.patch(`/requests/${selectedRequestForContainer.id}/container`, {
				container_no: containerNo
			});
			
			console.log('🔍 API call successful, updating local state');
			// Cập nhật state.requestsData ngay lập tức để AppointmentMini có thể sử dụng
			setRequestsData(prev => {
				console.log('🔍 Current requestsData before update:', prev.map(r => ({ id: r.id, container_no: r.container_no, is_pick: r.is_pick })));
				const updated = prev.map(req => 
					req.id === selectedRequestForContainer.id 
						? { ...req, container_no: containerNo, is_pick: true }
						: req
				);
				console.log('🔍 Updated requestsData:', updated.map(r => ({ id: r.id, container_no: r.container_no, is_pick: r.is_pick })));
				return updated;
			});
			
			console.log('🔍 Closing container selection modal');
			// Đóng container selection modal
			setShowContainerSelectionModal(false);
			
			console.log('🔍 Opening appointment mini for request:', selectedRequestForContainer.id);
			// Mở appointment mini để tạo lịch hẹn
			setActiveAppointmentRequests(prev => {
				const newSet = new Set(prev).add(selectedRequestForContainer.id);
				console.log('🔍 Active appointment requests after adding:', Array.from(newSet));
				return newSet;
			});
			
			console.log('🔍 Resetting selectedRequestForContainer');
			// Reset selected request
			setSelectedRequestForContainer(null);
			
			console.log('🔍 Refreshing SWR data');
			// Refresh data
			mutate('/requests?page=1&limit=20');
			setMsg({ text: formatT('pages.requests.messages.containerSelectedForExport', 'Selected container {{containerNo}} for EXPORT request. Please create an appointment.', { containerNo }), ok: true });
			console.log('🔍 handleContainerSelection completed successfully');
		} catch (e: any) {
			console.error('❌ Error in handleContainerSelection:', e);
			console.error('❌ Error response data:', e?.response?.data);
			console.error('❌ Error status:', e?.response?.status);
			console.error('❌ Error message:', e?.message);
			setMsg({ text: `${safeT('pages.requests.messages.cannotUpdateContainer', 'Cannot update container')}: ${e?.response?.data?.message || safeT('common.error', 'Error')}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Handle add document for EXPORT requests with PICK_CONTAINER status
	const handleAddDocument = async (requestId: string, containerNo: string) => {
		console.log('🔍 handleAddDocument called:', { requestId, containerNo });
		setLoadingId(requestId + 'ADD_DOC');
		try {
			// Tạo input file element
			const fileInput = document.createElement('input');
			fileInput.type = 'file';
			fileInput.accept = '.pdf,.jpg,.jpeg,.png';
			fileInput.style.display = 'none';
			
			fileInput.onchange = async (event) => {
				const target = event.target as HTMLInputElement;
				const file = target.files?.[0];
				
				if (!file) {
					setLoadingId('');
					return;
				}
				
				try {
					// Kiểm tra kích thước file (10MB)
					if (file.size > 10 * 1024 * 1024) {
						setMsg({ text: safeT('pages.requests.messages.fileTooLarge', 'File too large. Maximum size is 10MB'), ok: false });
						setLoadingId('');
						return;
					}
					
					// Kiểm tra loại file
					const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
					if (!allowedTypes.includes(file.type)) {
						setMsg({ text: safeT('pages.requests.messages.invalidFileType', 'Only PDF or image files (JPG, PNG) are accepted'), ok: false });
						setLoadingId('');
						return;
					}
					
					// Tạo FormData để upload
					const formData = new FormData();
					formData.append('file', file);
					formData.append('type', 'EXPORT_DOC');
					
					// Gọi API upload chứng từ
					const response = await api.post(`/requests/${requestId}/docs`, formData, {
						headers: {
							'Content-Type': 'multipart/form-data',
						},
					});
					
					console.log('✅ Document upload successful:', response.data);
					
					// Hiển thị thông báo thành công
					setMsg({ 
						text: formatT('pages.requests.messages.documentUploadSuccess', 'Uploaded document successfully for container {{containerNo}}! Status automatically changed from PICK_CONTAINER to SCHEDULED.', { containerNo }), 
						ok: true 
					});
					
					// Refresh data để cập nhật trạng thái
					mutate('/requests?page=1&limit=20');
					
				} catch (error: any) {
					console.error('❌ Error uploading document:', error);
					setMsg({ 
						text: `${safeT('pages.requests.messages.uploadDocumentFailed', 'Cannot upload document')}: ${error?.response?.data?.message || safeT('common.unknownError', 'Unknown error')}`, 
						ok: false 
					});
				} finally {
					setLoadingId('');
					// Xóa file input
					document.body.removeChild(fileInput);
				}
			};
			
			// Thêm file input vào DOM và trigger click
			document.body.appendChild(fileInput);
			fileInput.click();
			
		} catch (e: any) {
			console.error('❌ Error in handleAddDocument:', e);
			setMsg({ text: `${safeT('pages.requests.messages.cannotAddDocument', 'Cannot add document')}: ${e?.response?.data?.message || safeT('common.error', 'Error')}`, ok: false });
			setLoadingId('');
		}
	};

	// Upload document action for PICK_CONTAINER status
	const handleUploadDocument = async (requestId: string) => {
		console.log('🔍 handleUploadDocument called:', { requestId });
		setLoadingId(requestId + 'UPLOAD_DOC');
		try {
			// Tạo input file element với multiple files support
			const fileInput = document.createElement('input');
			fileInput.type = 'file';
			fileInput.accept = '.pdf,.jpg,.jpeg,.png';
			fileInput.multiple = true; // Cho phép chọn nhiều files
			fileInput.style.display = 'none';
			
			fileInput.onchange = async (event) => {
				const target = event.target as HTMLInputElement;
				const files = target.files;
				
				if (!files || files.length === 0) {
					setLoadingId('');
					return;
				}
				
				try {
					// Kiểm tra số lượng files (tối đa 10 files)
					if (files.length > 10) {
						setMsg({ 
							text: safeT('pages.requests.messages.tooManyFiles', 'Chỉ được upload tối đa 10 files cùng lúc'), 
							ok: false 
						});
						setLoadingId('');
						return;
					}
					
					// Kiểm tra kích thước từng file (10MB mỗi file)
					for (let i = 0; i < files.length; i++) {
						const file = files[i];
						if (file.size > 10 * 1024 * 1024) {
							setMsg({ 
								text: safeT('pages.requests.messages.fileTooLarge', `File "${file.name}" quá lớn. Kích thước tối đa là 10MB`), 
								ok: false 
							});
							setLoadingId('');
							return;
						}
					}
					
					// Tạo FormData với multiple files
					const formData = new FormData();
					for (let i = 0; i < files.length; i++) {
						formData.append('files', files[i]);
					}
					formData.append('type', 'EXPORT_DOC');
					
					console.log('📤 Uploading multiple EXPORT_DOCs:', { requestId, fileCount: files.length, fileNames: Array.from(files).map(f => f.name) });
					
					// Upload multiple documents
					const response = await api.post(`/requests/${requestId}/docs/multiple`, formData, {
						headers: {
							'Content-Type': 'multipart/form-data',
						},
					});
					
					console.log('✅ Multiple documents upload successful:', response.data);
					
					// Hiển thị thông báo thành công
					setMsg({ 
						text: formatT('pages.requests.messages.exportDocumentsUploadSuccess', `✅ Đã upload thành công ${files.length} chứng từ xuất! Trạng thái đã tự động chuyển từ PICK_CONTAINER sang SCHEDULED.`), 
						ok: true 
					});
					
					// Refresh data để cập nhật trạng thái
					mutate('/requests?page=1&limit=20');
					
				} catch (error: any) {
					console.error('❌ Error uploading export documents:', error);
					setMsg({ 
						text: `❌ ${safeT('pages.requests.messages.uploadExportDocumentsFailed', 'Cannot upload export documents')}: ${error?.response?.data?.message || safeT('common.unknownError', 'Unknown error')}`, 
						ok: false 
					});
				} finally {
					setLoadingId('');
					// Xóa file input
					document.body.removeChild(fileInput);
				}
			};
			
			// Thêm file input vào DOM và trigger click
			document.body.appendChild(fileInput);
			fileInput.click();
			
		} catch (e: any) {
			console.error('❌ Error in handleUploadDocument:', e);
			setMsg({ text: `${safeT('pages.requests.messages.cannotUploadDocument', 'Cannot upload document')}: ${e?.response?.data?.message || safeT('common.error', 'Error')}`, ok: false });
			setLoadingId('');
		}
	};

	// Chat actions
	const toggleChat = (requestId: string) => {
		setActiveChatRequests(prev => {
			const newSet = new Set(prev);
			if (newSet.has(requestId)) {
				newSet.delete(requestId);
			} else {
				newSet.add(requestId);
			}
			return newSet;
		});
	};

	const closeChat = (requestId: string) => {
		setActiveChatRequests(prev => {
			const newSet = new Set(prev);
			newSet.delete(requestId);
			return newSet;
		});
	};

	const state: DepotActionsState = {
		searchQuery,
		filterType,
		filterStatus,
		showAppointmentModal,
		selectedRequestId,
		activeAppointmentRequests,
		activeSupplementRequests,
		selectedDocument,
		showImageModal,
		msg,
		loadingId,
		me,
		requestsData,
		activeChatRequests,
		showContainerSelectionModal,
		selectedRequestForContainer,
		showRejectModal,
		rejectRequestId,
		rejectLoading,
		showDeleteModal,
		deleteRequestId,
		deleteLoading
	};

	const actions: DepotActions = {
		setSearchQuery,
		setFilterType,
		setFilterStatus,
		setShowAppointmentModal,
		setSelectedRequestId,
		setSelectedDocument,
		setShowImageModal,
		setMsg,
		setLoadingId,
		setRequestsData: setRequestsDataWithLog,
		setShowContainerSelectionModal,
		setSelectedRequestForContainer,
		setShowRejectModal,
		setRejectRequestId,
		setRejectLoading,
		setShowDeleteModal,
		setDeleteRequestId,
		setDeleteLoading,
		changeStatus,
		handleAppointmentSuccess,
		toggleAppointment,
		handleAppointmentClose,
		handleAppointmentMiniSuccess,
		toggleSupplement,
		handleChangeAppointment,
		handleReject,
		handleRejectWithModal,
		confirmReject,
		cancelReject,
		handleDeleteWithModal,
		confirmDelete,
		cancelDelete,
		sendPayment,
		softDeleteRequest,
		restoreRequest,
		handleDocumentClick,
		closeDocumentModal,
		handleViewInvoice,
		handleSendCustomerConfirmation,
		handleContainerSelection,
		handleAddDocument,
		handleUploadDocument,
		toggleChat,
		closeChat
	};

	return [state, actions];
}
