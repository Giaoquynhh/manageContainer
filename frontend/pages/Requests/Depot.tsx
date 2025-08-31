import React from 'react';
import Header from '@components/Header';
import useSWR from 'swr';
import { api } from '@services/api';
import Modal from '@components/Modal';
import Button from '@components/Button';
import { DepotRequestTable } from './components';
import SearchBar from '@components/SearchBar';
import AppointmentModal from '@components/AppointmentModal';
import AppointmentMini from '@components/appointment/AppointmentMini';
import SupplementDocuments from '@components/SupplementDocuments';
import DocumentViewerModal from './components/DocumentViewerModal';
import ContainerSelectionModal from '@components/ContainerSelectionModal';
import { useDepotActions } from './hooks/useDepotActions';
import { useTranslation } from '../../hooks/useTranslation';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function DepotRequests() {
	const { data, error, isLoading } = useSWR('/requests?page=1&limit=20', fetcher);
	const [state, actions] = useDepotActions();
	const { t } = useTranslation();

	// Local filter state (áp dụng tức thời khi thay đổi)
	const [localSearch, setLocalSearch] = React.useState('');
	const [localType, setLocalType] = React.useState('all');

	// Đồng bộ giá trị ban đầu từ state -> local
	React.useEffect(() => {
		setLocalSearch(state.searchQuery || '');
		setLocalType(state.filterType || 'all');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// (Đã bỏ nút "Áp dụng bộ lọc" nên không cần hàm applyFilters)

	// Sort & paginate (client-side)
	const [sortKey, setSortKey] = React.useState<'eta' | null>(null);
	const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

	const toggleSort = (key: 'eta') => {
		if (sortKey === key) {
			setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			setSortOrder('asc');
		}
	};

	// Cập nhật dữ liệu requests trong hook khi data thay đổi
	React.useEffect(() => {
		console.log('🔍 Depot: useEffect triggered with data:', data);
		if (data?.data) {
			console.log('🔍 Depot: Setting requestsData with:', data.data.length, 'items');
			console.log('🔍 Depot: Sample container numbers:', data.data.slice(0, 3).map((r: any) => r.container_no));
			actions.setRequestsData(data.data);
		}
	}, [data, actions]);
	
	// Debug logging cho state.requestsData
	React.useEffect(() => {
		console.log('🔍 Depot: state.requestsData updated:', state.requestsData.length, 'items');
		if (state.requestsData.length > 0) {
			console.log('🔍 Depot: state.requestsData container numbers:', state.requestsData.map((r: any) => r.container_no));
		}
	}, [state.requestsData]);

	// Filter data based on search and filter
	const filteredData = data?.data?.filter((item: any) => {
		const matchesSearch = state.searchQuery === '' ||
			item.container_no.toLowerCase().includes(state.searchQuery.toLowerCase());
		const matchesTypeFilter = state.filterType === 'all' || item.type === state.filterType;
		const matchesStatusFilter = state.filterStatus === 'all' || item.status === state.filterStatus;
		return matchesSearch && matchesTypeFilter && matchesStatusFilter;
	});
	
	console.log('🔍 Depot: filteredData created:', filteredData?.length, 'items');
	if (filteredData && filteredData.length > 0) {
		console.log('🔍 Depot: Filtered container numbers:', filteredData.map((r: any) => r.container_no));
		console.log('🔍 Depot: Filtered statuses:', filteredData.map((r: any) => r.status));
	}

	// Sorted data
	const sortedData = React.useMemo(() => {
		if (!filteredData) return [] as any[];
		const arr = [...filteredData];
		if (sortKey === 'eta') {
			arr.sort((a, b) => {
				const av = a.eta ? new Date(a.eta).getTime() : 0;
				const bv = b.eta ? new Date(b.eta).getTime() : 0;
				return sortOrder === 'asc' ? av - bv : bv - av;
			});
		}
		return arr;
	}, [filteredData, sortKey, sortOrder]);

	// Pagination
	const [page, setPage] = React.useState(1);
	const pageSize = 10;
	const totalItems = sortedData?.length || 0;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const pagedData = React.useMemo(() => {
		return sortedData.slice((page - 1) * pageSize, page * pageSize);
	}, [sortedData, page]);

	React.useEffect(() => {
		setPage(1);
	}, [state.searchQuery, state.filterType, state.filterStatus, sortKey, sortOrder]);

	// Modal chi tiết container
	const [detailRequest, setDetailRequest] = React.useState<any>(null);
	const formatETA = (eta?: string) => {
		if (!eta) return '-';
		const d = new Date(eta);
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
	};

	// i18n helpers cho modal chi tiết
	const safeT = (key: string, fallback: string) => {
		const v = t(key) as string;
		return v && v !== key ? v : fallback;
	};

	const getTypeLabel = (type: string) => {
		const map: Record<string, string> = {
			IMPORT: t('pages.requests.filterOptions.import'),
			EXPORT: t('pages.requests.filterOptions.export'),
			CONVERT: t('pages.requests.filterOptions.convert')
		};
		return map[type] || type;
	};

	const getStatusLabel = (status: string) => {
		const statusConfig: Record<string, string> = {
			SCHEDULED: safeT('pages.requests.filterOptions.scheduled', 'Đã lên lịch'),
			PENDING: safeT('pages.requests.filterOptions.pending', 'Đang chờ'),
			RECEIVED: safeT('pages.requests.filterOptions.received', 'Đã tiếp nhận'),
			APPROVED: safeT('pages.requests.filterOptions.approved', 'Đã duyệt'),
			IN_PROGRESS: safeT('pages.requests.filterOptions.inProgress', 'Đang xử lý'),
			COMPLETED: safeT('pages.requests.filterOptions.completed', 'Hoàn tất'),
			EXPORTED: safeT('pages.requests.filterOptions.exported', 'Xuất kho'),
			REJECTED: safeT('pages.requests.filterOptions.rejected', 'Từ chối'),
			IN_YARD: safeT('pages.requests.filterOptions.inYard', 'Trong bãi'),
			LEFT_YARD: safeT('pages.requests.filterOptions.leftYard', 'Rời bãi'),
			PENDING_ACCEPT: safeT('pages.requests.filterOptions.pendingAccept', 'Chờ xác nhận'),
			CHECKING: safeT('pages.requests.filterOptions.checking', 'Đang kiểm tra'),
			CHECKED: safeT('pages.requests.filterOptions.checked', 'Đã kiểm tra'),
			GATE_IN: safeT('pages.requests.filterOptions.gateIn', 'Đã cho phép vào'),
			GATE_OUT: safeT('pages.requests.filterOptions.gateOut', 'Đã cho phép ra'),
			GATE_REJECTED: safeT('pages.requests.filterOptions.gateRejected', 'Đã từ chối')
		};
		return statusConfig[status] || status;
	};

	// Add action buttons to each request
	const requestsWithActions = filteredData?.map((item: any) => ({
		...item,
		actions: {
			changeStatus: actions.changeStatus,
			sendPayment: actions.sendPayment,
			softDeleteRequest: actions.softDeleteRequest,
			restoreRequest: actions.restoreRequest,
			loadingId: state.loadingId,
			actLabel: {
				RECEIVED: 'Tiếp nhận',
				REJECTED: 'Từ chối',
				COMPLETED: 'Hoàn tất',
				EXPORTED: 'Đã xuất kho'
			}
		}
	}));
	
	console.log('🔍 Depot: requestsWithActions created:', requestsWithActions?.length, 'items');
	if (requestsWithActions && requestsWithActions.length > 0) {
		console.log('🔍 Depot: First request container_no:', requestsWithActions[0].container_no);
		console.log('🔍 Depot: First request status:', requestsWithActions[0].status);
	}

	const handleSearch = (query: string) => {
		actions.setSearchQuery(query);
	};

	const handleFilterChange = (filter: string) => {
		actions.setFilterType(filter);
	};


	return (
		<>
			<Header />
			<main className="container depot-requests">
				{/* Page Header */}
				<div className="page-header modern-header">
					<div className="header-content">
						<div className="header-left">
						<h1 className="page-title gradient gradient-ultimate">{t('pages.requests.depotTitle')}</h1>
					</div>

						<div className="header-actions">
							<Button
								variant="primary"
								icon="📊"
								onClick={() => window.print()}
								className="export-btn"
							>
								{t('pages.requests.exportReport')}
							</Button>
						</div>
					</div>
				</div>

				{/* Search and Filter */}
				<div className="search-filter-section modern-search">
					<div className="search-container">
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
								value={localSearch}
								onChange={(e) => {
									const v = e.target.value;
									setLocalSearch(v);
									handleSearch(v);
								}}
							/>
						</div>
					</div>
					
					<div className="filter-container">
						<div className="filter-group">
							<select
								aria-label={t('pages.requests.typeLabel')}
								className="filter-select modern-select"
								value={localType}
								onChange={(e) => {
									const v = e.target.value;
									setLocalType(v);
									handleFilterChange(v);
								}}
							>
								<option value="all">{t('pages.requests.allTypes')}</option>
								<option value="IMPORT">{t('pages.requests.filterOptions.import')}</option>
								<option value="EXPORT">{t('pages.requests.filterOptions.export')}</option>
								<option value="CONVERT">{t('pages.requests.filterOptions.convert')}</option>
							</select>
						</div>
						
						<div className="filter-group">
							<select
								aria-label={t('pages.requests.statusLabel')}
								className="filter-select modern-select"
								value={state.filterStatus || 'all'}
								onChange={(e) => actions.setFilterStatus(e.target.value)}
							>
								<option value="all">{t('pages.requests.allStatuses')}</option>
								<option value="PENDING">{t('pages.requests.filterOptions.pending')}</option>
								<option value="RECEIVED">{t('pages.requests.filterOptions.received')}</option>
								<option value="COMPLETED">{t('pages.requests.filterOptions.completed')}</option>
								<option value="EXPORTED">{t('pages.requests.filterOptions.exported')}</option>
								<option value="REJECTED">{t('pages.requests.filterOptions.rejected')}</option>
							</select>
						</div>
					</div>
				</div>

				{/* Request Table with Actions */}
				<DepotRequestTable
					data={pagedData}
					loading={isLoading}
					onDocumentClick={actions.handleDocumentClick}
					onToggleSupplement={actions.toggleSupplement}
					onChangeAppointment={actions.handleChangeAppointment}
					onReject={actions.handleReject}
					onChangeStatus={actions.changeStatus}
					onSendPayment={actions.sendPayment}
					onSoftDelete={actions.softDeleteRequest}
					onViewInvoice={actions.handleViewInvoice}
					onSendCustomerConfirmation={actions.handleSendCustomerConfirmation}
					onAddDocument={actions.handleAddDocument}
					loadingId={state.loadingId}
					actLabel={{
						RECEIVED: t('pages.requests.actionLabels.received'),
						REJECTED: t('pages.requests.actionLabels.rejected'),
						COMPLETED: t('pages.requests.actionLabels.completed'),
						EXPORTED: t('pages.requests.actionLabels.exported')
					}}
					// Chat props
					activeChatRequests={state.activeChatRequests}
					onToggleChat={actions.toggleChat}
					onCloseChat={actions.closeChat}
					// Sorting & detail
					onRequestSort={() => toggleSort('eta')}
					sortKey={sortKey || undefined}
					sortOrder={sortOrder}
					onContainerClick={(item: any) => setDetailRequest(item)}
				/>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="pagination" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
						<button className="btn btn-sm btn-outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
							‹ {t('common.prev') || 'Trước'}
						</button>
						<span style={{ fontSize: 12 }}>
							{t('common.page') || 'Trang'} {page}/{totalPages}
						</span>
						<button className="btn btn-sm btn-outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
							{t('common.next') || 'Sau'} ›
						</button>
					</div>
				)}

				{/* Status Message */}
				{state.msg && (
					<div className={`status-message ${state.msg.ok ? 'success' : 'error'}`}>
						{state.msg.text}
					</div>
				)}

				{/* Appointment Mini Windows */}
				{Array.from(state.activeAppointmentRequests).map((requestId, index) => {
					console.log('🔍 Depot: Rendering AppointmentMini for requestId:', requestId);
					console.log('🔍 Depot: Current state.requestsData:', state.requestsData.map(r => ({ id: r.id, container_no: r.container_no })));
					console.log('🔍 Depot: Current SWR data:', data?.data?.map(r => ({ id: r.id, container_no: r.container_no })));
					
					// Ưu tiên sử dụng dữ liệu từ state.requestsData (đã được cập nhật)
					let request = state.requestsData.find((r: any) => r.id === requestId);
					console.log('🔍 Depot: Found request in state.requestsData:', request);
					
					// Nếu không tìm thấy trong state, fallback về SWR data
					if (!request) {
						request = data?.data?.find((r: any) => r.id === requestId);
						console.log('🔍 Depot: Found request in SWR data:', request);
					}
					
					if (!request) {
						console.log('❌ Depot: No request found for ID:', requestId);
						return null;
					}
					
					console.log('🔍 Depot: Final request data for AppointmentMini:', request);
					
					// Xác định mode dựa trên trạng thái request
					const isChangeMode = request.status === 'SCHEDULED';
					
					return (
						<AppointmentMini
							key={requestId}
							requestId={requestId}
							requestData={{
								id: request.id,
								container_no: request.container_no,
								type: request.type,
								status: request.status,
								created_by: request.created_by
							}}
							onClose={() => actions.handleAppointmentClose(requestId)}
							onSuccess={() => actions.handleAppointmentMiniSuccess(requestId)}
							mode={isChangeMode ? 'change' : 'create'}
						/>
					);
				})}

				{/* Supplement Documents Windows */}
				{Array.from(state.activeSupplementRequests).map((requestId) => (
					<div key={requestId} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
							<div className="p-4 border-b border-gray-200">
								<div className="flex justify-between items-center">
									<h2 className="text-xl font-bold">{t('pages.requests.supplementDocuments')}</h2>
									<button
										onClick={() => actions.toggleSupplement(requestId)}
										className="text-gray-500 hover:text-gray-700 text-xl"
										title={t('pages.requests.close')}
									>
										✕
									</button>
								</div>
							</div>
							<div className="p-4">
								<SupplementDocuments 
									requestId={requestId}
									onDocumentAction={() => {
										// Refresh data if needed
									}}
								/>
							</div>
						</div>
					</div>
				))}

				{/* Container Selection Modal */}
				<ContainerSelectionModal
					visible={state.showContainerSelectionModal}
					onClose={() => actions.setShowContainerSelectionModal(false)}
					onSelectContainer={actions.handleContainerSelection}
					onContainerSelected={actions.handleContainerSelection}
					requestType={state.selectedRequestForContainer?.type || ''}
					requestId={state.selectedRequestForContainer?.id || ''}
				/>

				{/* Document Viewer Modal */}
				<DocumentViewerModal
					document={state.selectedDocument}
					visible={state.showImageModal}
					onClose={actions.closeDocumentModal}
				/>

				{/* Detail Modal */}
				<Modal
					title={`${safeT('pages.requests.containerDetailTitle', 'Chi tiết container')} ${detailRequest?.container_no || ''}`}
					visible={!!detailRequest}
					onCancel={() => setDetailRequest(null)}
					size="lg"
				>
					{detailRequest && (
						<div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
							<div><strong>{t('pages.requests.tableHeaders.container')}:</strong> {detailRequest.container_no}</div>
							<div><strong>{t('pages.requests.typeLabel')}:</strong> {getTypeLabel(detailRequest.type)}</div>
							<div><strong>{t('pages.requests.tableHeaders.eta')}:</strong> {formatETA(detailRequest.eta)}</div>
							<div><strong>{t('pages.requests.tableHeaders.status')}:</strong> {getStatusLabel(detailRequest.status)}</div>
							<div style={{ gridColumn: '1 / -1' }}>
								<strong>{t('pages.requests.tableHeaders.documents')}:</strong> {Array.isArray(detailRequest.documents) ? detailRequest.documents.length : 0}
							</div>
						</div>
					)}
				</Modal>

				{/* Appointment Modal (Legacy - kept for compatibility) */}
				<AppointmentModal
					requestId={state.selectedRequestId}
					visible={state.showAppointmentModal}
					onClose={() => actions.setShowAppointmentModal(false)}
					onSuccess={actions.handleAppointmentSuccess}
				/>
			</main>
		</>
	);
}




