import Header from '@components/Header';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '@services/api';
import Modal from '@components/Modal';
import Button from '@components/Button';
import RequestForm from '@components/RequestForm';
import RequestTable from '@components/RequestTable';
import SearchBar from '@components/SearchBar';
import AppointmentModal from '@components/AppointmentModal';
import UploadModal from '@components/UploadModal';
import SupplementMini from '@components/SupplementMini';
import DeleteModal from '@components/DeleteModal';
import RejectModal from '@components/RejectModal';
import AcceptModal from '@components/AcceptModal';
import ToastNotification from '@components/ToastNotification';
import { useCustomerActions } from './hooks/useCustomerActions';
import { useTranslation } from '../../hooks/useTranslation';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function CustomerRequests() {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showAppointmentModal, setShowAppointmentModal] = useState(false);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [showSupplementPopup, setShowSupplementPopup] = useState(false);
	const [selectedRequestId, setSelectedRequestId] = useState<string>('');
	const [searchQuery, setSearchQuery] = useState('');
	const [filterType, setFilterType] = useState('all');
	const { data, error, isLoading, isValidating } = useSWR('/requests?page=1&limit=20', fetcher, {
		revalidateOnFocus: true, // Tự động cập nhật khi focus vào tab
		revalidateOnReconnect: true, // Tự động cập nhật khi kết nối lại
		refreshInterval: 30000, // Tự động cập nhật mỗi 30 giây
		dedupingInterval: 5000, // Tránh duplicate requests trong 5 giây
	});
	const { t } = useTranslation();
	
	// Use customer actions hook
	const [customerState, customerActions] = useCustomerActions();
	const { msg, loadingId, me, showDeleteModal, deleteRequestId, deleteLoading, showRejectModal, rejectRequestId, rejectLoading, showAcceptModal, acceptRequestId, acceptLoading } = customerState;

	const handleCreateSuccess = () => {
		setShowCreateModal(false);
		mutate('/requests?page=1&limit=20');
	};

	const handleCreateCancel = () => {
		setShowCreateModal(false);
	};

	// Load user info - now handled by useCustomerActions hook

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		// TODO: Implement search functionality
	};

	const handleFilterChange = (filter: string) => {
		setFilterType(filter);
		// TODO: Implement filter functionality
	};

	const softDeleteRequest = async (id: string, scope: 'depot' | 'customer') => {
		customerActions.setMsg(null);
		customerActions.setLoadingId(id + 'DELETE');
		try {
			await api.delete(`/requests/${id}?scope=${scope}`);
			mutate('/requests?page=1&limit=20');
			const key = scope === 'depot'
				? 'pages.requests.messages.removedFromDepotList'
				: 'pages.requests.messages.removedFromCustomerList';
			customerActions.setMsg({ text: t(key), ok: true });
		} catch (e: any) {
			customerActions.setMsg({ text: `${t('common.deleteFailed')}: ${e?.response?.data?.message || t('common.error')}`, ok: false });
		} finally {
			customerActions.setLoadingId('');
		}
	};

	const restoreRequest = async (id: string, scope: 'depot' | 'customer') => {
		customerActions.setMsg(null);
		customerActions.setLoadingId(id + 'RESTORE');
		try {
			await api.post(`/requests/${id}/restore?scope=${scope}`);
			mutate('/requests?page=1&limit=20');
			const key = scope === 'depot'
				? 'pages.requests.messages.restoredInDepotList'
				: 'pages.requests.messages.restoredInCustomerList';
			customerActions.setMsg({ text: t(key), ok: true });
		} catch (e: any) {
			customerActions.setMsg({ text: `${t('common.restoreFailed')}: ${e?.response?.data?.message || t('common.error')}`, ok: false });
		} finally {
			customerActions.setLoadingId('');
		}
	};

	// Filter data based on search and filter
	const filteredData = data?.data?.filter((item: any) => {
		const matchesSearch = searchQuery === '' || 
			item.container_no.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesFilter = filterType === 'all' || item.type === filterType;
		return matchesSearch && matchesFilter;
	});



	const handleOpenUploadModal = (requestId: string) => {
		setSelectedRequestId(requestId);
		setShowUploadModal(true);
	};

	const handleOpenSupplementPopup = (requestId: string) => {
		setSelectedRequestId(requestId);
		setShowSupplementPopup(true);
	};

	const handleSupplementSuccess = () => {
		// Đóng popup bổ sung thông tin
		setShowSupplementPopup(false);
		
		// Refresh danh sách request để cập nhật trạng thái
		// Vì request đã chuyển sang FORWARDED, cần refresh để hiển thị đúng
		mutate('/requests?page=1&limit=20');
		
		// Hiển thị thông báo thành công với thông tin về việc tự động chuyển tiếp
		customerActions.setMsg({
			text: t('pages.requests.messages.supplementUploadSuccessForwarded'),
			ok: true
		});
		
		// Tự động ẩn thông báo sau 5 giây
		setTimeout(() => {
			customerActions.setMsg(null);
		}, 5000);
	};

	const handleUploadSuccess = () => {
		mutate('/requests?page=1&limit=20');
		// Không set message ở đây để tránh duplicate với handleSupplementSuccess
		// customerActions.setMsg({ text: t('pages.requests.messages.uploadDocumentSuccess'), ok: true });
	};

	const requestsWithActions = filteredData?.map((item: any) => ({
		...item,
		actions: {
			softDeleteRequest,
			restoreRequest,
			loadingId,
			handleOpenSupplementPopup,
			handleViewInvoice: customerActions.handleViewInvoice,
			handleAcceptWithModal: customerActions.handleAcceptWithModal,
			handleRejectWithModal: customerActions.handleRejectWithModal,
			onDeleteWithModal: customerActions.handleDeleteWithModal,
			handleAcceptScheduled: customerActions.handleAcceptScheduled
		}
	})) || [];

	return (
		<>
			<Header />
			<main className="container customer-requests">
				{/* Page Header */}
				<div className="page-header modern-header">
					<div className="header-content">
						<div className="header-left">
							<h1 className="page-title gradient gradient-ultimate">{t('pages.requests.customerTitle')}</h1>
							{isValidating && !isLoading && (
								<div className="auto-refresh-indicator" style={{
									display: 'inline-flex',
									alignItems: 'center',
									marginLeft: '12px',
									fontSize: '12px',
									color: '#666',
									background: '#f0f8ff',
									padding: '4px 8px',
									borderRadius: '4px',
									border: '1px solid #e0e0e0'
								}}>
									<div style={{
										width: '8px',
										height: '8px',
										borderRadius: '50%',
										background: '#4CAF50',
										marginRight: '6px',
										animation: 'pulse 1.5s infinite'
									}}></div>
									Đang cập nhật...
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Search and Filter */}
				<div className="search-filter-section modern-search" style={{ paddingTop: '8px' }}>
					<div className="search-row">
						<div className="search-section">
							<div className="search-input-group">
								<span className="search-icon">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<circle cx="11" cy="11" r="8"></circle>
										<path d="m21 21-4.35-4.35"></path>
									</svg>
								</span>
								<input
									type="text"
									className="search-input"
									placeholder={t('pages.requests.searchPlaceholder')}
									aria-label={t('pages.requests.searchPlaceholder')}
									value={searchQuery}
									onChange={(e) => handleSearch(e.target.value)}
								/>
							</div>
						</div>

						<div className="filter-group">
							<select
								aria-label={t('pages.requests.typeLabel')}
								className="filter-select modern-select"
								value={filterType}
								onChange={(e) => handleFilterChange(e.target.value)}
							>
								<option value="all">{t('pages.requests.allTypes')}</option>
								<option value="IMPORT">{t('pages.requests.filterOptions.import')}</option>
								<option value="EXPORT">{t('pages.requests.filterOptions.export')}</option>
							</select>
							
							<Button 
								variant="outline" 
								icon="➕"
								onClick={() => setShowCreateModal(true)}
								className="create-btn"
							>
								{t('pages.requests.createRequest')}
							</Button>
						</div>
					</div>
				</div>

				{/* Request Table */}
				<RequestTable 
					data={requestsWithActions} 
					loading={isLoading}
					userRole={me?.role || me?.roles?.[0]}
				/>

				{/* Toast Notification */}
				{msg && (
					<ToastNotification
						visible={!!msg}
						message={msg.text}
						type={msg.ok ? 'success' : 'error'}
						duration={4000}
						onClose={() => customerActions.setMsg(null)}
					/>
				)}

				{/* Create Request Modal */}
				<Modal
					title={t('pages.requests.createRequestTitle')}
					visible={showCreateModal}
					onCancel={handleCreateCancel}
					width={900}
				>
					<RequestForm 
						onSuccess={handleCreateSuccess}
						onCancel={handleCreateCancel}
					/>
				</Modal>

				{/* Upload Modal */}
				<UploadModal
					requestId={selectedRequestId}
					visible={showUploadModal}
					onClose={() => setShowUploadModal(false)}
					onSuccess={handleUploadSuccess}
				/>

				{/* Supplement Popup */}
				<SupplementMini
					requestId={selectedRequestId}
					visible={showSupplementPopup}
					onClose={() => setShowSupplementPopup(false)}
					onSuccess={handleSupplementSuccess}
				/>

				{/* Accept Modal */}
				<AcceptModal
					visible={showAcceptModal}
					onConfirm={customerActions.confirmAccept}
					onCancel={customerActions.cancelAccept}
					loading={acceptLoading}
					title={t('pages.requests.acceptModal.title')}
					message={t('pages.requests.acceptModal.message')}
					confirmText={t('pages.requests.acceptModal.confirm')}
					cancelText={t('pages.requests.acceptModal.cancel')}
				/>

				{/* Reject Modal */}
				<RejectModal
					visible={showRejectModal}
					onConfirm={customerActions.confirmReject}
					onCancel={customerActions.cancelReject}
					loading={rejectLoading}
					title={t('pages.requests.rejectModal.title')}
					message={t('pages.requests.rejectModal.message')}
					placeholder={t('pages.requests.rejectModal.placeholder')}
					confirmText={t('pages.requests.rejectModal.confirm')}
					cancelText={t('pages.requests.rejectModal.cancel')}
				/>

				{/* Delete Modal */}
				<DeleteModal
					visible={showDeleteModal}
					onConfirm={customerActions.confirmDelete}
					onCancel={customerActions.cancelDelete}
					loading={deleteLoading}
					itemName={filteredData?.find(r => r.id === deleteRequestId)?.container_no}
					itemType="yêu cầu"
				/>
			</main>
		</>
	);
}
