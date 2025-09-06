import { useState, useEffect } from 'react';
import { mutate } from 'swr';
import { api } from '@services/api';

export interface CustomerActionsState {
	msg: { text: string; ok: boolean } | null;
	loadingId: string;
	me: any;
	// Delete modal states
	showDeleteModal: boolean;
	deleteRequestId: string;
	deleteLoading: boolean;
	// Reject modal states
	showRejectModal: boolean;
	rejectRequestId: string;
	rejectLoading: boolean;
	// Accept modal states
	showAcceptModal: boolean;
	acceptRequestId: string;
	acceptLoading: boolean;
}

export interface CustomerActions {
	setMsg: (msg: { text: string; ok: boolean } | null) => void;
	setLoadingId: (id: string) => void;
	handleViewInvoice: (id: string, containerNo?: string) => Promise<void>;
	handleAccept: (id: string) => Promise<void>;
	handleAcceptScheduled: (id: string) => Promise<void>;
	handleRejectByCustomer: (id: string, reason: string) => Promise<void>;
	// Accept modal actions
	handleAcceptWithModal: (requestId: string) => void;
	confirmAccept: () => Promise<void>;
	cancelAccept: () => void;
	// Reject modal actions
	handleRejectWithModal: (requestId: string) => void;
	confirmReject: (reason: string) => Promise<void>;
	cancelReject: () => void;
	// Delete modal actions
	handleDeleteWithModal: (requestId: string) => void;
	confirmDelete: () => Promise<void>;
	cancelDelete: () => void;
}

export function useCustomerActions(): [CustomerActionsState, CustomerActions] {
	const [msg, setMsg] = useState<{ text: string; ok: boolean }|null>(null);
	const [loadingId, setLoadingId] = useState<string>('');
	const [me, setMe] = useState<any>(null);
	// Delete modal states
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteRequestId, setDeleteRequestId] = useState<string>('');
	const [deleteLoading, setDeleteLoading] = useState(false);
	
	// Reject modal states
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [rejectRequestId, setRejectRequestId] = useState<string>('');
	const [rejectLoading, setRejectLoading] = useState(false);
	
	// Accept modal states
	const [showAcceptModal, setShowAcceptModal] = useState(false);
	const [acceptRequestId, setAcceptRequestId] = useState<string>('');
	const [acceptLoading, setAcceptLoading] = useState(false);

	// Load user info
	useEffect(() => {
		api.get('/auth/me').then(r => setMe(r.data)).catch(() => {});
	}, []);

	// Xem hóa đơn sửa chữa - copy logic từ depot
	const handleViewInvoice = async (id: string, containerNo?: string) => {
		setMsg(null);
		setLoadingId(id + 'VIEW_INVOICE');
		try {
			// Sử dụng container_no được truyền vào hoặc tìm từ cache
			let containerNumber = containerNo;
			
			if (!containerNumber) {
				// Tìm request trong dữ liệu local từ SWR cache
				const requestsData = await mutate('/requests?page=1&limit=20');
				const request = requestsData?.data?.find((r: any) => r.id === id);
				containerNumber = request?.container_no;
			}
			
			console.log('🔍 Debug handleViewInvoice:', { id, containerNumber, containerNo });
			
			if (!containerNumber) {
				setMsg({ text: 'Không tìm thấy thông tin container của request', ok: false });
				return;
			}

			console.log('🔍 Container number:', containerNumber);
			console.log('🔍 Container number type:', typeof containerNumber);
			console.log('🔍 Container number length:', containerNumber?.length);
			console.log('🔍 Container number trimmed:', containerNumber?.trim());

			// Tìm phiếu sửa chữa tương ứng với container_no
			const apiUrl = `/maintenance/repairs?container_no=${encodeURIComponent(containerNumber)}`;
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
				setMsg({ text: 'Không tìm thấy phiếu sửa chữa cho container này', ok: false });
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
			
			setMsg({ text: 'Đã mở hóa đơn sửa chữa thành công', ok: true });
		} catch (e: any) {
			console.error('❌ Lỗi khi xem hóa đơn:', e);
			console.error('❌ Error response:', e?.response?.data);
			console.error('❌ Error status:', e?.response?.status);
			setMsg({ text: `Không thể xem hóa đơn: ${e?.response?.data?.message || 'Lỗi không xác định'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Chấp nhận request
	const handleAccept = async (id: string) => {
		setMsg(null);
		setLoadingId(id + 'ACCEPT');
		try {
			await api.patch(`/requests/${id}/accept`);
			mutate('/requests?page=1&limit=20');
			setMsg({ text: 'Đã chấp nhận hóa đơn sửa chữa thành công', ok: true });
		} catch (e: any) {
			setMsg({ text: `Không thể chấp nhận: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Chấp nhận request SCHEDULED (chuyển từ SCHEDULED sang FORWARDED)
	const handleAcceptScheduled = async (id: string) => {
		setMsg(null);
		setLoadingId(id + 'ACCEPT_SCHEDULED');
		try {
			await api.patch(`/requests/${id}/accept-scheduled`);
			mutate('/requests?page=1&limit=20');
			setMsg({ text: 'Đã chấp nhận yêu cầu và chuyển sang trạng thái Forwarded thành công', ok: true });
		} catch (e: any) {
			setMsg({ text: `Không thể chấp nhận yêu cầu: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Từ chối request
	const handleRejectByCustomer = async (id: string, reason: string) => {
		setMsg(null);
		setLoadingId(id + 'REJECT');
		try {
			await api.patch(`/requests/${id}/reject-by-customer`, { reason });
			mutate('/requests?page=1&limit=20');
			setMsg({ text: 'Đã từ chối hóa đơn sửa chữa thành công', ok: true });
		} catch (e: any) {
			setMsg({ text: `Không thể từ chối: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Reject modal actions
	const handleRejectWithModal = (requestId: string) => {
		setRejectRequestId(requestId);
		setShowRejectModal(true);
	};

	const confirmReject = async (reason: string) => {
		if (!rejectRequestId) return;
		
		setRejectLoading(true);
		try {
			await api.patch(`/requests/${rejectRequestId}/reject-by-customer`, { reason });
			mutate('/requests?page=1&limit=20');
			setMsg({ text: 'Đã từ chối hóa đơn sửa chữa thành công', ok: true });
			
			// Đóng modal sau 1 giây
			setTimeout(() => {
				setShowRejectModal(false);
				setRejectRequestId('');
			}, 1000);
		} catch (e: any) {
			setMsg({ text: `Không thể từ chối: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setRejectLoading(false);
		}
	};

	const cancelReject = () => {
		setShowRejectModal(false);
		setRejectRequestId('');
	};

	// Accept modal actions
	const handleAcceptWithModal = (requestId: string) => {
		setAcceptRequestId(requestId);
		setShowAcceptModal(true);
	};

	const confirmAccept = async () => {
		if (!acceptRequestId) return;
		
		setAcceptLoading(true);
		try {
			await api.patch(`/requests/${acceptRequestId}/accept`);
			mutate('/requests?page=1&limit=20');
			setMsg({ text: 'Đã chấp nhận hóa đơn sửa chữa thành công', ok: true });
			
			// Đóng modal sau 1 giây
			setTimeout(() => {
				setShowAcceptModal(false);
				setAcceptRequestId('');
			}, 1000);
		} catch (e: any) {
			setMsg({ text: `Không thể chấp nhận: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setAcceptLoading(false);
		}
	};

	const cancelAccept = () => {
		setShowAcceptModal(false);
		setAcceptRequestId('');
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
			await api.delete(`/requests/${deleteRequestId}?scope=customer`);
			mutate('/requests?page=1&limit=20');
			setMsg({
				text: 'Yêu cầu đã được gỡ bỏ khỏi danh sách khách hàng!',
				ok: true
			});
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

	const state: CustomerActionsState = {
		msg,
		loadingId,
		me,
		showDeleteModal,
		deleteRequestId,
		deleteLoading,
		showRejectModal,
		rejectRequestId,
		rejectLoading,
		showAcceptModal,
		acceptRequestId,
		acceptLoading
	};

	const actions: CustomerActions = {
		setMsg,
		setLoadingId,
		handleViewInvoice,
		handleAccept,
		handleRejectByCustomer,
		handleAcceptWithModal,
		confirmAccept,
		cancelAccept,
		handleRejectWithModal,
		confirmReject,
		cancelReject,
		handleDeleteWithModal,
		confirmDelete,
		cancelDelete
	};

	return [state, actions];
}
