import { useState, useEffect } from 'react';
import { mutate } from 'swr';
import { api } from '@services/api';

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

	// Actions
	changeStatus: (id: string, status: string) => Promise<void>;
	handleAppointmentSuccess: () => void;
	toggleAppointment: (requestId: string) => void;
	handleAppointmentClose: (requestId: string) => void;
	handleAppointmentMiniSuccess: (requestId: string) => void;
	toggleSupplement: (requestId: string) => void;
	handleChangeAppointment: (requestId: string) => void;
	handleReject: (requestId: string) => Promise<void>;
	sendPayment: (id: string) => Promise<void>;
	softDeleteRequest: (id: string, scope: 'depot' | 'customer') => Promise<void>;
	restoreRequest: (id: string, scope: 'depot' | 'customer') => Promise<void>;
	handleDocumentClick: (doc: any) => void;
	closeDocumentModal: () => void;
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

	const actLabel: Record<string, string> = {
		RECEIVED: 'Tiếp nhận',
		REJECTED: 'Từ chối',
		COMPLETED: 'Hoàn tất',
		EXPORTED: 'Đã xuất kho'
	};

	// Load user info
	useEffect(() => {
		api.get('/auth/me').then(r => setMe(r.data)).catch(() => {});
	}, []);

	const changeStatus = async (id: string, status: string) => {
		setMsg(null);
		setLoadingId(id + status);
		try {
			let payload: any = { status };
			if (status === 'REJECTED') {
				const reason = window.prompt('Nhập lý do từ chối');
				if (!reason) {
					setLoadingId('');
					return;
				}
				payload.reason = reason;
				await api.patch(`/requests/${id}/status`, payload);
			} else if (status === 'RECEIVED') {
				// Open appointment mini for RECEIVED status
				setActiveAppointmentRequests(prev => {
					const newSet = new Set(prev).add(id);
					console.log('Opening AppointmentMini for request:', id, 'Active requests:', Array.from(newSet));
					return newSet;
				});
				setLoadingId('');
				return;
			} else {
				await api.patch(`/requests/${id}/status`, payload);
			}
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `${actLabel[status] || 'Cập nhật'} yêu cầu thành công`, ok: true });
		} catch (e: any) {
			setMsg({ text: `Không thể ${actLabel[status]?.toLowerCase() || 'cập nhật'}: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const handleAppointmentSuccess = () => {
		mutate('/requests?page=1&limit=20');
		setMsg({ text: 'Đã tiếp nhận yêu cầu và tạo lịch hẹn thành công!', ok: true });
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

	const handleAppointmentMiniSuccess = (requestId: string) => {
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
		const reason = window.prompt('Nhập lý do từ chối:');
		if (!reason) return;
		
		setMsg(null);
		setLoadingId(requestId + 'REJECTED');
		try {
			await api.patch(`/requests/${requestId}/reject`, { reason });
			mutate('/requests?page=1&limit=20');
			setMsg({ text: 'Đã từ chối yêu cầu thành công!', ok: true });
		} catch (e: any) {
			setMsg({ text: `Không thể từ chối: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const sendPayment = async (id: string) => {
		setMsg(null);
		setLoadingId(id + 'PAY');
		try {
			await api.post(`/requests/${id}/payment-request`, {});
			setMsg({ text: 'Đã gửi yêu cầu thanh toán', ok: true });
		} catch (e: any) {
			setMsg({ text: `Gửi yêu cầu thanh toán thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
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
			setMsg({ text: `Đã xóa khỏi danh sách ${scope === 'depot' ? 'Kho' : 'Khách hàng'}`, ok: true });
		} catch (e: any) {
			setMsg({ text: `Xóa thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
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
			setMsg({ text: `Đã khôi phục trong danh sách ${scope === 'depot' ? 'Kho' : 'Khách hàng'}`, ok: true });
		} catch (e: any) {
			setMsg({ text: `Khôi phục thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
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
		me
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
		changeStatus,
		handleAppointmentSuccess,
		toggleAppointment,
		handleAppointmentClose,
		handleAppointmentMiniSuccess,
		toggleSupplement,
		handleChangeAppointment,
		handleReject,
		sendPayment,
		softDeleteRequest,
		restoreRequest,
		handleDocumentClick,
		closeDocumentModal
	};

	return [state, actions];
}
