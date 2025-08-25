import React from 'react';
import Header from '@components/Header';
import useSWR from 'swr';
import { api } from '@services/api';
import Modal from '@components/Modal';
import Button from '@components/Button';
import SearchBar from '@components/SearchBar';
import AppointmentModal from '@components/AppointmentModal';
import AppointmentMini from '@components/appointment/AppointmentMini';
import SupplementDocuments from '@components/SupplementDocuments';
import DepotRequestTable from './components/DepotRequestTable';
import DocumentViewerModal from './components/DocumentViewerModal';
import { useDepotActions } from './hooks/useDepotActions';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function DepotRequests() {
	const { data, error, isLoading } = useSWR('/requests?page=1&limit=20', fetcher);
	const [state, actions] = useDepotActions();

	// Cập nhật dữ liệu requests trong hook khi data thay đổi
	React.useEffect(() => {
		console.log('🔍 Depot: useEffect triggered with data:', data);
		if (data?.data) {
			console.log('🔍 Depot: Setting requestsData with:', data.data.length, 'items');
			console.log('🔍 Depot: Sample container numbers:', data.data.slice(0, 3).map(r => r.container_no));
			actions.setRequestsData(data.data);
		}
	}, [data, actions]);
	
	// Debug logging cho state.requestsData
	React.useEffect(() => {
		console.log('🔍 Depot: state.requestsData updated:', state.requestsData.length, 'items');
		if (state.requestsData.length > 0) {
			console.log('🔍 Depot: state.requestsData container numbers:', state.requestsData.map(r => r.container_no));
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
		console.log('🔍 Depot: Filtered container numbers:', filteredData.map(r => r.container_no));
		console.log('🔍 Depot: Filtered statuses:', filteredData.map(r => r.status));
	}

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

	const handleStatusFilterChange = (status: string) => {
		actions.setFilterStatus(status);
	};

	return (
		<>
			<Header />
			<main className="container">
				{/* Page Header */}
				<div className="page-header">
					<h1 className="page-title">Quản lý yêu cầu dịch vụ (Depot)</h1>
					<div className="page-actions">
						<Button
							variant="primary"
							icon="📊"
							onClick={() => window.print()}
						>
							Xuất báo cáo
						</Button>
					</div>
				</div>

				{/* Search and Filter */}
				<div className="search-bar">
					<div className="search-input-group">
						<span className="search-icon">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<circle cx="11" cy="11" r="8"></circle>
								<path d="m21 21-4.35-4.35"></path>
							</svg>
						</span>
						<input
							type="text"
							className="search-input"
							placeholder="Tìm kiếm theo mã container..."
							value={state.searchQuery}
							onChange={(e) => handleSearch(e.target.value)}
						/>
					</div>
					<select
						className="filter-select"
						value={state.filterType}
						onChange={(e) => handleFilterChange(e.target.value)}
					>
						<option value="all">Tất cả loại</option>
						<option value="IMPORT">Nhập</option>
						<option value="EXPORT">Xuất</option>
						<option value="CONVERT">Chuyển đổi</option>
					</select>
					<select
						className="filter-select"
						value={state.filterStatus}
						onChange={(e) => handleStatusFilterChange(e.target.value)}
					>
						<option value="all">Tất cả trạng thái</option>
						<option value="PENDING">Chờ xử lý</option>
						<option value="RECEIVED">Đã nhận</option>
						<option value="COMPLETED">Hoàn thành</option>
						<option value="EXPORTED">Đã xuất</option>
						<option value="REJECTED">Từ chối</option>
						<option value="PENDING_ACCEPT">Chờ chấp nhận</option>
						<option value="CHECKING">Đang kiểm tra</option>
						<option value="CHECKED">Đã kiểm tra</option>
					</select>
				</div>

				{/* Request Table with Actions */}
				<DepotRequestTable
					data={requestsWithActions}
					loading={isLoading}
					userRole={state.me?.role || state.me?.roles?.[0]}
					onDocumentClick={actions.handleDocumentClick}
					onToggleSupplement={actions.toggleSupplement}
					onChangeAppointment={actions.handleChangeAppointment}
					onReject={actions.handleReject}
					onChangeStatus={actions.changeStatus}
					onSendPayment={actions.sendPayment}
					onSoftDelete={(id: string, scope: string) => actions.softDeleteRequest(id, scope as 'depot' | 'customer')}
					onViewInvoice={actions.handleViewInvoice}
					onSendCustomerConfirmation={actions.handleSendCustomerConfirmation}
					loadingId={state.loadingId}
					actLabel={{
						RECEIVED: 'Tiếp nhận',
						REJECTED: 'Từ chối',
						COMPLETED: 'Hoàn tất',
						EXPORTED: 'Đã xuất kho'
					}}
					// Chat props
					activeChatRequests={state.activeChatRequests}
					onToggleChat={actions.toggleChat}
					onCloseChat={actions.closeChat}
				/>

				{/* Status Message */}
				{state.msg && (
					<div className={`status-message ${state.msg.ok ? 'success' : 'error'}`}>
						{state.msg.text}
					</div>
				)}

				{/* Appointment Mini Windows */}
				{Array.from(state.activeAppointmentRequests).map((requestId, index) => {
					const request = data?.data?.find((r: any) => r.id === requestId);
					if (!request) return null;
					
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
									<h2 className="text-xl font-bold">Tài liệu bổ sung</h2>
									<button
										onClick={() => actions.toggleSupplement(requestId)}
										className="text-gray-500 hover:text-gray-700 text-xl"
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

				{/* Document Viewer Modal */}
				<DocumentViewerModal
					document={state.selectedDocument}
					visible={state.showImageModal}
					onClose={actions.closeDocumentModal}
				/>

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




